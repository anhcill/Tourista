package vn.tourista.service;

import vn.tourista.dto.request.CreateBookingRequest;
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.response.CreateBookingResponse;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.dto.response.MyBookingResponse;

import java.util.List;

public interface BookingService {

    CreateBookingResponse createBooking(String userEmail, CreateBookingRequest request);

    CreateTourBookingResponse createTourBooking(String userEmail, CreateTourBookingRequest request);

    List<MyBookingResponse> getMyBookings(String userEmail);
}
