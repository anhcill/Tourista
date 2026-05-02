package vn.tourista.service;

import vn.tourista.dto.request.CreateComboBookingRequest;
import vn.tourista.dto.response.ComboPackageResponse;
import vn.tourista.dto.response.CreateComboBookingResponse;

import java.util.List;

public interface ComboPackageService {

    List<ComboPackageResponse> getActiveCombos();

    List<ComboPackageResponse> getCombosByType(String comboType);

    List<ComboPackageResponse> getFeaturedCombos();

    ComboPackageResponse getComboById(Long id);

    CreateComboBookingResponse bookCombo(CreateComboBookingRequest request, String userEmail);
}
