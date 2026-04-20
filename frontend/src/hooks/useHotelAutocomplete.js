import { useCallback, useEffect, useRef, useState } from "react";
import autocompleteApi from "@/api/autocompleteApi";

export default function useHotelAutocomplete(query, options = {}) {
  const { maxSuggestions = 8, fallbackSuggestions = [] } = options;
  const [suggestions, setSuggestions] = useState(fallbackSuggestions);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const loadSuggestions = useCallback(
    async (searchQuery) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmed = (searchQuery || "").trim();

      if (!trimmed) {
        setSuggestions(fallbackSuggestions);
        return;
      }

      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);

      try {
        const response = await autocompleteApi.search(trimmed, maxSuggestions);
        const items = Array.isArray(response?.data) ? response.data : [];
        setSuggestions(
          items.length > 0
            ? items.map((item) => ({
                value: item.value || "",
                type: item.type || "",
                id: item.id,
                detail: item.detail,
              }))
            : fallbackSuggestions
        );
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        setSuggestions(fallbackSuggestions);
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [fallbackSuggestions, maxSuggestions]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSuggestions(query);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, loadSuggestions]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { suggestions, loading };
}
