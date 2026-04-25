package vn.tourista.service;

import vn.tourista.dto.request.CancelBookingRequest;
import vn.tourista.dto.request.CreateBookingRequest;
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.request.UpdateBookingRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateBookingResponse;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.dto.response.MyBookingResponse;

import java.util.List;

public interface BookingService {

    CreateBookingResponse createBooking(String userEmail, CreateBookingRequest request);

    CreateTourBookingResponse createTourBooking(String userEmail, CreateTourBookingRequest request);

    List<MyBookingResponse> getMyBookings(String userEmail);

    /**
     * User tự hủy booking.
     * Chỉ cho phép hủy booking ở trạng thái PENDING hoặc CONFIRMED.
     * Nếu là tour booking, khôi phục số chỗ trống.
     */
    ApiResponse<?> cancelBooking(String userEmail, Long bookingId, CancelBookingRequest request);

    /**
     * User cập nhật booking (thay đổi ngày, số người, số phòng).
     * Chỉ cho phép cập nhật booking ở trạng thái PENDING.
     */
    ApiResponse<?> updateBooking(String userEmail, Long bookingId, UpdateBookingRequest request);

    /**
     * Đánh dấu booking là COMPLETED và gửi email cảm ơn.
     * Thường gọi tự động qua scheduler khi checkout xong.
     */
    void completeBooking(Long bookingId);
}
