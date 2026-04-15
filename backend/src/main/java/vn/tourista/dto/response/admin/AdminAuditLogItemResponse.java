package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AdminAuditLogItemResponse {
    Long id;
    Long actorId;
    String actorEmail;
    String action;
    String resource;
    Long resourceId;
    String beforeData;
    String afterData;
    String reason;
    LocalDateTime timestamp;
}