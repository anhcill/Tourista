"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { addMessage, setWsConnected } from "../store/slices/chatSlice";
import { API_BASE_URL } from "../utils/constants";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../utils/authStorage";

const AUTH_ERROR_PATTERN =
  /token|authorization|unauthor|forbidden|access denied|het han|khong hop le|missing/i;

const decodeJwtPayload = (token) => {
  try {
    const payloadPart = token?.split(".")?.[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenExpired = (token, skewSeconds = 20) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + skewSeconds;
};

const resolveWsUrl = () => {
  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    return `${apiUrl.origin}/ws`;
  } catch {
    return "http://localhost:8080/ws";
  }
};

/**
 * Hook quản lý kết nối WebSocket STOMP.
 * Chỉ kết nối khi user đã đăng nhập.
 * Trả về hàm `sendMessage` để gửi tin từ bất kỳ component nào.
 */
export const useChatWebSocket = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const stompClientRef = useRef(null);
  const lastSoundRef = useRef(0);

  const refreshAccessToken = useCallback(async () => {
    if (typeof window === "undefined") return null;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const raw = await response.json();
      const payload = raw?.data ?? raw ?? {};
      const nextToken = payload?.accessToken;
      const nextRefreshToken = payload?.refreshToken;

      if (!nextToken) return null;

      setAccessToken(nextToken);
      if (nextRefreshToken) {
        setRefreshToken(nextRefreshToken);
      }

      return nextToken;
    } catch {
      return null;
    }
  }, []);

  const ensureValidAccessToken = useCallback(async () => {
    if (typeof window === "undefined") return null;

    const token = getAccessToken();
    if (!token) return null;

    if (!isTokenExpired(token)) return token;
    return refreshAccessToken();
  }, [refreshAccessToken]);

  const playIncomingSound = useCallback(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    if (now - lastSoundRef.current < 600) return;
    lastSoundRef.current = now;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 880;

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => {
        ctx.close();
      };
    } catch {
      // Ignore audio runtime errors (autoplay policy / unsupported browser)
    }
  }, []);

  const connect = useCallback(async () => {
    if (stompClientRef.current?.active) return;

    if (typeof window === "undefined") return;

    const token = await ensureValidAccessToken();
    if (!token) {
      dispatch(setWsConnected(false));
      return;
    }

    const wsUrl = resolveWsUrl();

    const client = new Client({
      // SockJS fallback cho môi trường không hỗ trợ native WS
      webSocketFactory: () => new SockJS(wsUrl),

      // Truyền JWT qua STOMP Connect header
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        dispatch(setWsConnected(true));
        // Subscribe kênh nhận tin nhắn riêng của user này
        client.subscribe("/user/queue/messages", (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            dispatch(addMessage(msg));

            const senderId = msg?.senderId;
            const currentUserId = user?.id;
            const isOwnMessage =
              senderId != null && currentUserId != null
                ? Number(senderId) === Number(currentUserId)
                : false;

            if (!isOwnMessage) {
              playIncomingSound();
            }
          } catch (e) {
            console.error("[WS] Parse message error:", e);
          }
        });
      },

      onDisconnect: () => {
        dispatch(setWsConnected(false));
      },

      onWebSocketError: (event) => {
        console.error("[WS] WebSocket transport error:", event);
        dispatch(setWsConnected(false));
      },

      onWebSocketClose: () => {
        dispatch(setWsConnected(false));
      },

      onStompError: (frame) => {
        const brokerMessage = frame?.headers?.message || "Unknown STOMP error";
        const brokerDetail = frame?.body || "";

        console.error("[WS] STOMP error:", brokerMessage, brokerDetail);
        dispatch(setWsConnected(false));

        if (AUTH_ERROR_PATTERN.test(`${brokerMessage} ${brokerDetail}`)) {
          void (async () => {
            const refreshedToken = await refreshAccessToken();
            if (!refreshedToken) return;

            if (stompClientRef.current?.active) {
              await stompClientRef.current.deactivate();
              stompClientRef.current = null;
            }

            const retryClient = new Client({
              webSocketFactory: () => new SockJS(wsUrl),
              connectHeaders: {
                Authorization: `Bearer ${refreshedToken}`,
              },
              reconnectDelay: 5000,
              heartbeatIncoming: 10000,
              heartbeatOutgoing: 10000,
              onConnect: () => {
                dispatch(setWsConnected(true));
                retryClient.subscribe("/user/queue/messages", (retryFrame) => {
                  try {
                    const msg = JSON.parse(retryFrame.body);
                    dispatch(addMessage(msg));

                    const senderId = msg?.senderId;
                    const currentUserId = user?.id;
                    const isOwnMessage =
                      senderId != null && currentUserId != null
                        ? Number(senderId) === Number(currentUserId)
                        : false;

                    if (!isOwnMessage) {
                      playIncomingSound();
                    }
                  } catch (e) {
                    console.error("[WS] Parse message error:", e);
                  }
                });
              },
              onDisconnect: () => {
                dispatch(setWsConnected(false));
              },
              onWebSocketError: (event) => {
                console.error("[WS] WebSocket transport error:", event);
                dispatch(setWsConnected(false));
              },
              onWebSocketClose: () => {
                dispatch(setWsConnected(false));
              },
              onStompError: (retryErrFrame) => {
                console.error(
                  "[WS] STOMP error after token refresh:",
                  retryErrFrame?.headers?.message || "Unknown STOMP error",
                  retryErrFrame?.body || "",
                );
                dispatch(setWsConnected(false));
              },
            });

            retryClient.activate();
            stompClientRef.current = retryClient;
          })();
        }
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [
    dispatch,
    ensureValidAccessToken,
    playIncomingSound,
    refreshAccessToken,
    user,
  ]);

  const disconnect = useCallback(() => {
    if (stompClientRef.current?.active) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      dispatch(setWsConnected(false));
    }
  }, [dispatch]);

  // Auto-connect khi user login, disconnect khi logout
  useEffect(() => {
    if (isAuthenticated) {
      void connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  /** Gửi tin nhắn qua WebSocket tới /app/chat.send */
  const sendMessage = useCallback((conversationId, content) => {
    if (!conversationId || !content?.trim()) {
      return false;
    }

    if (!stompClientRef.current?.connected) {
      console.warn("[WS] Chưa kết nối WebSocket");
      return false;
    }

    try {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ conversationId, content: content.trim() }),
      });
      return true;
    } catch (error) {
      console.error("[WS] Send message error:", error);
      return false;
    }
  }, []);

  return { sendMessage };
};
