package vn.tourista.service;

import vn.tourista.dto.response.AutocompleteResponse;

import java.util.List;

public interface AutocompleteService {

    List<AutocompleteResponse> search(String query, int limit);
}
