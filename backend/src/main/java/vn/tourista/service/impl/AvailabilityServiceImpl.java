package vn.tourista.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.RoomAvailabilityResponse;
import vn.tourista.entity.RoomType;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.service.AvailabilityService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityServiceImpl implements AvailabilityService {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    public List<RoomAvailabilityResponse> getRoomAvailability(
            Long hotelId,
            LocalDate checkIn,
            LocalDate checkOut,
            Integer adults,
            Integer rooms) {

        LocalDate safeCheckIn = checkIn != null ? checkIn : LocalDate.now();
        LocalDate safeCheckOut = checkOut != null ? checkOut : safeCheckIn.plusDays(1);
        int safeAdults = adults != null && adults > 0 ? adults : 1;
        int safeRooms = rooms != null && rooms > 0 ? rooms : 1;

        List<RoomType> activeRoomTypes = roomTypeRepository
                .findByHotel_IdAndIsActiveTrueOrderByBasePricePerNightAsc(hotelId);

        return activeRoomTypes.stream()
                .filter(rt -> rt.getMaxAdults() >= safeAdults)
                .map(rt -> {
                    int totalRooms = rt.getTotalRooms() != null ? rt.getTotalRooms() : 0;
                    Integer booked = roomTypeRepository.countBookedRoomsInDateRange(
                            rt.getId(), safeCheckIn, safeCheckOut);
                    int bookedCount = booked != null ? booked : 0;
                    int availableCount = Math.max(0, totalRooms - bookedCount);

                    return RoomAvailabilityResponse.builder()
                            .roomTypeId(rt.getId())
                            .roomTypeName(rt.getName())
                            .totalRooms(totalRooms)
                            .bookedRooms(bookedCount)
                            .availableRooms(availableCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public Map<Long, Integer> getHotelAvailability(
            List<Long> hotelIds,
            LocalDate checkIn,
            LocalDate checkOut,
            Integer adults,
            Integer rooms) {

        if (hotelIds == null || hotelIds.isEmpty()) {
            return Map.of();
        }

        LocalDate safeCheckIn = checkIn != null ? checkIn : LocalDate.now();
        LocalDate safeCheckOut = checkOut != null ? checkOut : safeCheckIn.plusDays(1);
        int safeAdults = adults != null && adults > 0 ? adults : 1;

        return hotelIds.stream()
                .collect(Collectors.toMap(
                        hotelId -> hotelId,
                        hotelId -> {
                            Integer total = roomTypeRepository.countAvailableRoomsByHotelId(
                                    hotelId, safeCheckIn, safeCheckOut, safeAdults);
                            return total != null ? total : 0;
                        }
                ));
    }
}
