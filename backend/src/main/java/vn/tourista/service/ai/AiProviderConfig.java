package vn.tourista.service.ai;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Config cho AI Provider - chỉ cần sửa file ai-config.yml
 * 
 * Supported providers:
 * - beeknoee (default - OpenAI compatible)
 * - openai
 * - gemini
 * - claude
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProviderConfig {

    private String provider = "beeknoee";
    
    private BeeknoeeConfig beeknoee = new BeeknoeeConfig();
    private OpenaiConfig openai = new OpenaiConfig();
    private GeminiConfig gemini = new GeminiConfig();
    private ClaudeConfig claude = new ClaudeConfig();
    
    private ChatbotConfig chatbot = new ChatbotConfig();
    private TravelPlannerConfig travelPlanner = new TravelPlannerConfig();
    private SemaphoreConfig semaphore = new SemaphoreConfig();
    
    // ----- Beeknoee Config -----
    @Data
    public static class BeeknoeeConfig {
        private boolean enabled = true;
        private String apiKey;
        private String apiUrl = "https://platform.beeknoee.com/api/v1/chat/completions";
        private String model = "deepseek/deepseek-v4-pro";
        private String reasoning = "off";
        private int timeoutSeconds = 60;
        private int maxTokens = 2000;
        private double temperature = 0.7;
    }
    
    // ----- OpenAI Config -----
    @Data
    public static class OpenaiConfig {
        private boolean enabled = false;
        private String apiKey;
        private String apiUrl = "https://api.openai.com/v1/chat/completions";
        private String model = "gpt-4o-mini";
        private int timeoutSeconds = 60;
        private int maxTokens = 2000;
        private double temperature = 0.7;
    }
    
    // ----- Gemini Config -----
    @Data
    public static class GeminiConfig {
        private boolean enabled = false;
        private String apiKey;
        private String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models";
        private String model = "gemini-2.0-flash";
        private int timeoutSeconds = 60;
        private int maxTokens = 2000;
    }
    
    // ----- Claude Config -----
    @Data
    public static class ClaudeConfig {
        private boolean enabled = false;
        private String apiKey;
        private String apiUrl = "https://api.anthropic.com/v1/messages";
        private String model = "claude-3-5-haiku-20241022";
        private int maxTokens = 1024;
        private double temperature = 0.7;
    }
    
    // ----- Chatbot Config -----
    @Data
    public static class ChatbotConfig {
        private String systemPrompt = "Ban la tro ly du lich AI cua nen tang Tourista Studio. Tra loi ngan gon, than thien, dung emoji phu hop. Chi tra loi ve du lich, tour, khach san, diem den Viet Nam.";
        private int maxContextMessages = 8;
        private boolean suggestHotelsWithTour = true;
        private boolean suggestToursWithHotel = true;
    }
    
    // ----- Travel Planner Config -----
    @Data
    public static class TravelPlannerConfig {
        private double rewriteTemperature = 0.8;
        private int followUpCount = 4;
        private boolean seasonalEnabled = true;
    }
    
    // ----- Semaphore Config -----
    @Data
    public static class SemaphoreConfig {
        private int permits = 1;
        private int waitSeconds = 5;
    }
    
    /**
     * Check xem provider nào đang enabled
     */
    public String getActiveProvider() {
        if (beeknoee.isEnabled() && beeknoee.getApiKey() != null && !beeknoee.getApiKey().isBlank()) {
            return "beeknoee";
        }
        if (openai.isEnabled() && openai.getApiKey() != null && !openai.getApiKey().isBlank()) {
            return "openai";
        }
        if (gemini.isEnabled() && gemini.getApiKey() != null && !gemini.getApiKey().isBlank()) {
            return "gemini";
        }
        if (claude.isEnabled() && claude.getApiKey() != null && !claude.getApiKey().isBlank()) {
            return "claude";
        }
        return "none";
    }
    
    /**
     * Check xem có provider nào enable không
     */
    public boolean isAnyEnabled() {
        return !getActiveProvider().equals("none");
    }
}
