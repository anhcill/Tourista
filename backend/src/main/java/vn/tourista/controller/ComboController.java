package vn.tourista.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ComboPackageResponse;
import vn.tourista.service.ComboPackageService;

import java.util.List;

@RestController
@RequestMapping("/api/combos")
public class ComboController {

    private final ComboPackageService comboService;

    public ComboController(ComboPackageService comboService) {
        this.comboService = comboService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ComboPackageResponse>>> getActiveCombos() {
        List<ComboPackageResponse> data = comboService.getActiveCombos();
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach combo thanh cong", data));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ComboPackageResponse>>> getFeaturedCombos() {
        List<ComboPackageResponse> data = comboService.getFeaturedCombos();
        return ResponseEntity.ok(ApiResponse.ok("Lay combo noi bat thanh cong", data));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<ComboPackageResponse>>> getCombosByType(@PathVariable String type) {
        List<ComboPackageResponse> data = comboService.getCombosByType(type);
        return ResponseEntity.ok(ApiResponse.ok("Lay combo theo loai thanh cong", data));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ApiResponse<ComboPackageResponse>> getComboById(@PathVariable Long id) {
        ComboPackageResponse data = comboService.getComboById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet combo thanh cong", data));
    }
}
