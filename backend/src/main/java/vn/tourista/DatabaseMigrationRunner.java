package vn.tourista;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

@Slf4j
@Component
public class DatabaseMigrationRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void runMigrations() {
        try {
            addFlowTypeColumn();
        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage());
        }
    }

    private void addFlowTypeColumn() throws Exception {
        DatabaseMetaData metaData = jdbcTemplate.getDataSource().getConnection().getMetaData();
        String tableName = "session_recommendation_states";

        boolean columnExists = false;
        try (ResultSet rs = metaData.getColumns(null, null, tableName, "flow_type")) {
            columnExists = rs.next();
        }

        if (!columnExists) {
            log.info("Adding flow_type column to session_recommendation_states...");
            jdbcTemplate.execute("ALTER TABLE session_recommendation_states ADD COLUMN flow_type VARCHAR(20) AFTER conversation_id");
            log.info("flow_type column added successfully.");
        } else {
            log.info("flow_type column already exists — skipping.");
        }
    }
}
