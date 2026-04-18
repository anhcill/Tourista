package vn.tourista;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync // Kích hoạt xử lý bất đồng bộ cho BotService
public class TouristaApplication {
    public static void main(String[] args) {
        SpringApplication.run(TouristaApplication.class, args);
    }
}
