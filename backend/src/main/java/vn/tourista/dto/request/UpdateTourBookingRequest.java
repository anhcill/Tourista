package vn.tourista.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTourBookingRequest {

    @NotNull(message = "So nguoi lon la bat buoc")
    @Min(value = 1, message = "So nguoi lon phai lon hon hoac bang 1")
    private Integer adults;

    @Min(value = 0, message = "So tre em khong duoc am")
    @Builder.Default
    private Integer children = 0;

    @Min(value = 1, message = "So cho phai lon hon hoac bang 1")
    private Integer numSlots;
}
