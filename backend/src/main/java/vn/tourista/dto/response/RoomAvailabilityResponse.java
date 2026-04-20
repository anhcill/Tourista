package vn.tourista.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAvailabilityResponse {

    private Long roomTypeId;
    private String roomTypeName;
    private Integer totalRooms;
    private Integer availableRooms;
    private Integer bookedRooms;

    public enum UrgencyLevel {
        HIGH,      // 0-2 rooms left
        MEDIUM,    // 3-5 rooms left
        LOW,       // > 5 rooms
        SOLD_OUT   // 0 available
    }

    public UrgencyLevel getUrgencyLevel() {
        if (availableRooms == null || availableRooms <= 0) return UrgencyLevel.SOLD_OUT;
        if (availableRooms <= 2) return UrgencyLevel.HIGH;
        if (availableRooms <= 5) return UrgencyLevel.MEDIUM;
        return UrgencyLevel.LOW;
    }

    public String getUrgencyLabel() {
        if (availableRooms == null || availableRooms <= 0) return "Hết phòng";
        if (availableRooms == 1) return "Chỉ còn 1 phòng!";
        if (availableRooms == 2) return "Chỉ còn 2 phòng";
        if (availableRooms <= 5) return "Còn " + availableRooms + " phòng";
        return null;
    }
}
