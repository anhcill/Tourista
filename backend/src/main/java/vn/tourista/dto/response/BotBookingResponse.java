package vn.tourista.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO chứa toàn bộ thông tin đặt chỗ để Bot trả về dưới dạng Rich Card.
 * Được serialize thành JSON lưu vào ChatMessage.metadata.
 * Frontend parse ra và render component BookingItineraryCard.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BotBookingResponse {

    // ── Thông tin chung ──────────────────────────────────────
    private String bookingCode;       // "TRS-20260325-934D6D"
    private String bookingType;       // "TOUR" | "HOTEL"
    private String status;            // "CONFIRMED" | "PENDING" | v.v.
    private BigDecimal totalAmount;
    private String currency;
    private String specialRequests;

    // ── Thông tin đối tác (chủ tour / chủ hotel) ─────────────
    private PartnerInfo partner;

    // ── Nhánh TOUR ───────────────────────────────────────────
    private String tourTitle;
    private LocalDate departureDate;
    private Integer durationDays;
    private Integer durationNights;
    private Integer numAdults;
    private Integer numChildren;
    private BigDecimal pricePerAdult;
    private BigDecimal pricePerChild;
    private String includes;          // "Xe đưa đón, Khách sạn 3 sao, Ăn sáng"
    private String excludes;          // "Vé máy bay, Chi phí cá nhân"
    private String highlights;
    private List<ItineraryDay> itinerary;   // Lịch trình từng ngày

    // ── Nhánh HOTEL ──────────────────────────────────────────
    private String hotelName;
    private String hotelAddress;
    private String roomTypeName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer nights;
    private Integer numRooms;
    private Integer adults;
    private Integer children;
    private BigDecimal pricePerNight;
    private String checkInTime;       // "14:00"
    private String checkOutTime;      // "12:00"

    // ── Nested DTOs ───────────────────────────────────────────

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PartnerInfo {
        private Long id;
        private String name;
        private String avatar;
        private String phone;
    }

    @Data
    @Builder
    public static class ItineraryDay {
        private int day;
        private String title;
        private String description;
    }
}
