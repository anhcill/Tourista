// Test WebSocket với origin headers đầy đủ
// Railway proxy có thể chặn nếu origin không match allowed origins

const WS_URL = "wss://tourista-production.up.railway.app/ws";
const FRONTEND_ORIGIN = "https://tourista-nine.vercel.app";

async function testWsWithHeaders() {
  return new Promise((resolve) => {
    console.log("🔌 WebSocket test với origin:", FRONTEND_ORIGIN);
    console.log("   Target:", WS_URL);

    const ws = new WebSocket(WS_URL, "v12.stomp", {
      headers: {
        "Origin": FRONTEND_ORIGIN
      }
    });

    const timeout = setTimeout(() => {
      console.log("❌ Timeout 10s");
      ws.close();
      resolve(false);
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      console.log("✅ WebSocket OPENED");

      // STOMP CONNECT frame
      const frame = [
        "CONNECT",
        `accept-version:1.2`,
        `host:tourista`,
        `origin:${FRONTEND_ORIGIN}`,
        "",
        "",
        "\x00"
      ].join("\n");

      ws.send(frame);
      console.log("📤 Sent STOMP CONNECT");
    };

    ws.onmessage = (e) => {
      console.log("📥 Received:", e.data.substring(0, 300));
      if (e.data.startsWith("CONNECTED")) {
        console.log("✅ STOMP CONNECTED!");
        setTimeout(() => { ws.close(); resolve(true); }, 500);
      } else if (e.data.startsWith("ERROR")) {
        console.log("❌ STOMP ERROR");
        ws.close();
        resolve(false);
      }
    };

    ws.onerror = (e) => {
      clearTimeout(timeout);
      console.log("❌ WS Error type:", e.type);
      console.log("   Lỗi này có thể do Railway proxy không cho phép WebSocket từ origin này");
      resolve(false);
    };

    ws.onclose = (e) => {
      clearTimeout(timeout);
      console.log("🔚 Closed:", e.code, e.reason || "none");
      resolve(false);
    };
  });
}

// Test xem Railway app có nhận WebSocket upgrade không
async function testRailwayWsHeaders() {
  console.log("\n🌐 Kiểm tra Railway WS headers...");
  try {
    // Test via HTTP OPTIONS preflight
    const res = await fetch("https://tourista-production.up.railway.app/ws/info", {
      method: "OPTIONS",
      headers: {
        "Origin": FRONTEND_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "upgrade"
      }
    });
    console.log("   OPTIONS status:", res.status);
    console.log("   CORS headers:", res.headers.get("access-control-allow-origin"));
  } catch (e) {
    console.log("   Failed:", e.message);
  }
}

// Check backend WS config
async function testBackendWsConfig() {
  console.log("\n⚙️ Backend WS Config check...");
  try {
    // Railway load balancer có thể không forward WebSocket upgrade
    // Kiểm tra xem có header upgrade không
    const res = await fetch("https://tourista-production.up.railway.app/ws/info", {
      headers: { "Origin": FRONTEND_ORIGIN }
    });
    const text = await res.text();
    console.log("   /ws/info response:", text);
    console.log("   Status:", res.status);
    if (res.headers.get("upgrade")) {
      console.log("   Upgrade header:", res.headers.get("upgrade"));
    }
  } catch (e) {
    console.log("   Failed:", e.message);
  }
}

(async () => {
  console.log("=== Railway WebSocket Diagnostic ===\n");
  await testRailwayWsHeaders();
  await testBackendWsConfig();
  await testWsWithHeaders();
  console.log("\n=== Done ===");
})();
