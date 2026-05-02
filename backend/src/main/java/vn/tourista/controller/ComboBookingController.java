package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.CreateComboBookingRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateComboBookingResponse;
import vn.tourista.service.ComboPackageService;

@RestController
@RequestMapping("/api/combos")
@RequiredArgsConstructor
public class ComboBookingController {

    private final ComboPackageService comboPackageService;

    @PostMapping("/book")
    public ResponseEntity<ApiResponse<CreateComboBookingResponse>> bookCombo(
            @Valid @RequestBody CreateComboBookingRequest request,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : request.getGuestEmail();
        CreateComboBookingResponse result = comboPackageService.bookCombo(request, userEmail);
        return ResponseEntity.ok(ApiResponse.ok("Dat combo thanh cong. Vui long thanh toan de xac nhan.", result));
    }
}
