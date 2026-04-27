package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CreateReportRequest;
import vn.tourista.dto.response.ReportResponse;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.Report;
import vn.tourista.entity.User;
import vn.tourista.repository.ConversationRepository;
import vn.tourista.repository.ReportRepository;
import vn.tourista.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Tao bao cao/khieu nai moi.
     */
    @Transactional
    public ReportResponse createReport(String reporterEmail, CreateReportRequest req) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        User reportedUser = userRepository.findById(req.getReportedUserId())
                .orElseThrow(() -> new RuntimeException("Người bị báo cáo không tồn tại"));

        // Khong tu bao cao chinh minh
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new RuntimeException("Không thể tự báo cáo chính mình");
        }

        Report.ReportType type;
        try {
            type = Report.ReportType.valueOf(req.getType());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Loại báo cáo không hợp lệ: " + req.getType());
        }

        Conversation conversation = null;
        if (req.getConversationId() != null) {
            conversation = conversationRepository.findById(req.getConversationId()).orElse(null);
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .conversation(conversation)
                .type(type)
                .status(Report.ReportStatus.PENDING)
                .reason(req.getReason())
                .build();

        Report saved = reportRepository.save(report);
        log.info("Report created: id={}, type={}, reporter={}, reported={}",
                saved.getId(), type, reporterEmail, req.getReportedUserId());

        return ReportResponse.from(saved);
    }

    /**
     * Lay danh sach bao cao (admin).
     */
    @Transactional(readOnly = true)
    public Page<ReportResponse> getAllReports(int page, int size) {
        Page<Report> reports = reportRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return reports.map(ReportResponse::from);
    }

    /**
     * Lay danh sach bao cao theo trang thai (admin).
     */
    @Transactional(readOnly = true)
    public Page<ReportResponse> getReportsByStatus(String status, int page, int size) {
        Report.ReportStatus s;
        try {
            s = Report.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
        Page<Report> reports = reportRepository.findByStatusOrderByCreatedAtDesc(s, PageRequest.of(page, size));
        return reports.map(ReportResponse::from);
    }

    /**
     * Lay chi tiet 1 bao cao (admin).
     */
    @Transactional(readOnly = true)
    public ReportResponse getReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Báo cáo không tồn tại"));
        return ReportResponse.from(report);
    }

    /**
     * Cap nhat trang thai bao cao (admin).
     */
    @Transactional
    public ReportResponse updateReportStatus(Long id, String status, String adminNotes, String adminEmail) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Báo cáo không tồn tại"));

        Report.ReportStatus s;
        try {
            s = Report.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }

        report.setStatus(s);
        if (adminNotes != null && !adminNotes.isBlank()) {
            report.setAdminNotes(adminNotes);
        }

        Report saved = reportRepository.save(report);
        log.info("Report {} updated to {} by admin {}", id, status, adminEmail);

        return ReportResponse.from(saved);
    }
}
