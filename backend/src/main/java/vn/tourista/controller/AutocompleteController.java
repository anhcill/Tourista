package vn.tourista.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.AutocompleteResponse;
import vn.tourista.service.AutocompleteService;

import java.util.List;

@RestController
@RequestMapping("/api/autocomplete")
public class AutocompleteController {

    @Autowired
    private AutocompleteService autocompleteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AutocompleteResponse>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "8") Integer limit) {

        int safeLimit = (limit == null || limit < 1) ? 8 : Math.min(limit, 12);
        String query = (q == null) ? "" : q.trim();

        List<AutocompleteResponse> results = autocompleteService.search(query, safeLimit);
        return ResponseEntity.ok(ApiResponse.ok("Autocomplete results", results));
    }
}
