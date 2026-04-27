package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReportRequest {

    // ID cua nguoi bi bao cao (user hoac partner)
    @NotNull(message = "Người bị báo cáo không được để trống")
    private Long reportedUserId;

    // ID cuoc tro chuyen lien quan (co the null)
    private Long conversationId;

    // Loai bao cao
    @NotNull(message = "Loại báo cáo không được để trống")
    private String type;

    // Ly do / noi dung bao cao
    @NotBlank(message = "Lý do báo cáo không được để trống")
    private String reason;
}
