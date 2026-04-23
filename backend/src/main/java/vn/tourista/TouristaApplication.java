package vn.tourista;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync // Kích hoạt xử lý bất đồng bộ cho BotService
public class TouristaApplication {
    public static void main(String[] args) {
        // Load .env file before Spring Boot starts
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(e ->
                    System.setProperty(e.getKey(), e.getValue())
            );
            System.out.println("[TouristaApplication] Loaded .env file successfully");
        } catch (Exception e) {
            System.out.println("[TouristaApplication] No .env file found, using system env vars");
        }

        SpringApplication.run(TouristaApplication.class, args);
    }
}
