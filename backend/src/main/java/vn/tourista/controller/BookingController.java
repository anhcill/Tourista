package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.CreateBookingRequest;
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateBookingResponse;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.dto.response.MyBookingResponse;
import vn.tourista.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateBookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {

        CreateBookingResponse data = bookingService.createBooking(authentication.getName(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo booking thành công", data));
    }

    @PostMapping("/tours")
    public ResponseEntity<ApiResponse<CreateTourBookingResponse>> createTourBooking(
            @Valid @RequestBody CreateTourBookingRequest request,
            Authentication authentication) {

        CreateTourBookingResponse data = bookingService.createTourBooking(authentication.getName(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo booking tour thành công", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<MyBookingResponse>>> getMyBookings(Authentication authentication) {
        List<MyBookingResponse> data = bookingService.getMyBookings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử booking thành công", data));
    }
}
