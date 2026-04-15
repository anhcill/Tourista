package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.FavoriteUpsertRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.FavoriteItemResponse;
import vn.tourista.service.FavoriteService;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteItemResponse>>> getMyFavorites(Authentication authentication) {
        List<FavoriteItemResponse> data = favoriteService.getMyFavorites(resolveEmail(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach favorite thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FavoriteItemResponse>> addFavorite(
            @Valid @RequestBody FavoriteUpsertRequest request,
            Authentication authentication) {

        FavoriteItemResponse data = favoriteService.addFavorite(resolveEmail(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Them favorite thanh cong", data));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @RequestParam String targetType,
            @RequestParam Long targetId,
            Authentication authentication) {

        favoriteService.removeFavorite(resolveEmail(authentication), targetType, targetId);
        return ResponseEntity.ok(ApiResponse.ok("Xoa favorite thanh cong"));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }
        return authentication.getName().trim();
    }
}
