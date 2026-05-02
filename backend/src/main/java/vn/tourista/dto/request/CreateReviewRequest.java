package vn.tourista.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotBlank(message = "Target type la bat buoc")
    private String targetType;

    @NotNull(message = "Target id la bat buoc")
    private Long targetId;

    private Long bookingId;

    @NotNull(message = "So sao danh gia la bat buoc")
    @Min(value = 1, message = "So sao phai tu 1 den 5")
    @Max(value = 5, message = "So sao phai tu 1 den 5")
    private Integer overallRating;

    @Size(max = 200, message = "Tieu de danh gia khong qua 200 ky tu")
    private String title;

    @Size(max = 2000, message = "Noi dung danh gia khong qua 2000 ky tu")
    private String comment;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer cleanliness;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer location;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer service;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer valueForMoney;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer guideQuality;

    @Min(value = 1, message = "Diem phu: tu 1 den 5")
    @Max(value = 5, message = "Diem phu: tu 1 den 5")
    private Integer organization;

    @Size(max = 8, message = "Toi da 8 file media cho moi danh gia")
    private List<@Size(max = 500, message = "Media URL khong qua 500 ky tu") String> mediaUrls;
}