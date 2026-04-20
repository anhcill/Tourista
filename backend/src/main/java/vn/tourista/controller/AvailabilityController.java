package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.RoomAvailabilityResponse;
import vn.tourista.service.AvailabilityService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/hotels/{hotelId}")
    public ResponseEntity<ApiResponse<List<RoomAvailabilityResponse>>> getHotelAvailability(
            @PathVariable Long hotelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "2") Integer adults,
            @RequestParam(defaultValue = "1") Integer rooms) {

        List<RoomAvailabilityResponse> availability = availabilityService.getRoomAvailability(
                hotelId, checkIn, checkOut, adults, rooms);

        return ResponseEntity.ok(ApiResponse.ok("Lay thong tin phong trong thanh cong", availability));
    }
}
