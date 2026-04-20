package vn.tourista.service;

import vn.tourista.dto.response.RoomAvailabilityResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AvailabilityService {

    List<RoomAvailabilityResponse> getRoomAvailability(Long hotelId, LocalDate checkIn, LocalDate checkOut, Integer adults, Integer rooms);

    Map<Long, Integer> getHotelAvailability(List<Long> hotelIds, LocalDate checkIn, LocalDate checkOut, Integer adults, Integer rooms);
}
