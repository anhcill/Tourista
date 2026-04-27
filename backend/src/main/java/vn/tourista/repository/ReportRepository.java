package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Report;
import vn.tourista.entity.User;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // Danh sach bao cao cua 1 nguoi
    Page<Report> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    // Tat ca bao cao (admin) - moi nhat truoc
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Bao cao theo trang thai
    Page<Report> findByStatusOrderByCreatedAtDesc(Report.ReportStatus status, Pageable pageable);

    // Dem bao cao chua xu ly
    long countByStatus(Report.ReportStatus status);
}
