import axiosClient from "./axiosClient";

const autocompleteApi = {
  search: (query, limit = 8) => {
    const params = new URLSearchParams();
    if (query && query.trim()) {
      params.append("q", query.trim());
    }
    params.append("limit", String(limit));
    return axiosClient.get(`/autocomplete?${params.toString()}`);
  },
};

export default autocompleteApi;
