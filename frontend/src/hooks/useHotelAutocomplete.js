import { useEffect, useMemo, useState } from "react";
import hotelApi from "@/api/hotelApi";

const toSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const buildSuggestionList = (hotels) => {
  const unique = new Map();

  hotels.forEach((hotel) => {
    const name = normalizeText(hotel?.name);
    const address = normalizeText(hotel?.address || hotel?.location);
    const city = normalizeText(
      hotel?.city || (address.includes(",") ? address.split(",").pop() : ""),
    );

    [
      name ? { value: name, type: "Khach san" } : null,
      city ? { value: city, type: "Diem den" } : null,
      address ? { value: address, type: "Khu vuc" } : null,
    ].forEach((candidate) => {
      if (!candidate) return;
      const key = candidate.value.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, candidate);
      }
    });
  });

  return Array.from(unique.values());
};

const getHotelArray = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

export default function useHotelAutocomplete(query, options = {}) {
  const { maxSuggestions = 8, fallbackSuggestions = [] } = options;
  const [allSuggestions, setAllSuggestions] = useState(fallbackSuggestions);

  useEffect(() => {
    let mounted = true;

    const loadSuggestions = async () => {
      try {
        const response = await hotelApi.getHotels({ page: 1, limit: 500 });
        if (!mounted) return;

        const hotels = getHotelArray(response);
        const generated = buildSuggestionList(hotels);
        setAllSuggestions(
          generated.length > 0 ? generated : fallbackSuggestions,
        );
      } catch {
        if (!mounted) return;
        setAllSuggestions(fallbackSuggestions);
      }
    };

    loadSuggestions();

    return () => {
      mounted = false;
    };
  }, [fallbackSuggestions]);

  const suggestions = useMemo(() => {
    const keyword = toSearchText(normalizeText(query));
    if (!keyword) return [];

    return allSuggestions
      .filter((item) => toSearchText(item.value).includes(keyword))
      .sort((a, b) => {
        const aText = toSearchText(a.value);
        const bText = toSearchText(b.value);
        const aStartsWith = aText.startsWith(keyword);
        const bStartsWith = bText.startsWith(keyword);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.value.localeCompare(b.value);
      })
      .slice(0, maxSuggestions);
  }, [allSuggestions, maxSuggestions, query]);

  return suggestions;
}
