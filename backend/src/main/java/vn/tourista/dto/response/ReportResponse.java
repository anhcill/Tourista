package vn.tourista.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import vn.tourista.entity.Report;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReportResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private Long reportedUserId;
    private String reportedUserName;
    private String reportedUserEmail;
    private Long conversationId;
    private String type;
    private String status;
    private String reason;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReportResponse from(Report report) {
        ReportResponseBuilder b = ReportResponse.builder()
                .id(report.getId())
                .type(report.getType().name())
                .status(report.getStatus().name())
                .reason(report.getReason())
                .adminNotes(report.getAdminNotes())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt());

        if (report.getReporter() != null) {
            b.reporterId(report.getReporter().getId())
             .reporterName(report.getReporter().getFullName())
             .reporterEmail(report.getReporter().getEmail());
        }

        if (report.getReportedUser() != null) {
            b.reportedUserId(report.getReportedUser().getId())
             .reportedUserName(report.getReportedUser().getFullName())
             .reportedUserEmail(report.getReportedUser().getEmail());
        }

        if (report.getConversation() != null) {
            b.conversationId(report.getConversation().getId());
        }

        return b.build();
    }
}
