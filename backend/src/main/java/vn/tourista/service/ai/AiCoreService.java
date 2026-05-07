package vn.tourista.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Core AI Service - xử lý HTTP calls đến AI provider
 * 
 * Hỗ trợ multi-provider: Beeknoee, OpenAI, Gemini, Claude
 * Chỉ cần cấu hình trong ai-config.yml
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiCoreService {

    private final AiProviderConfig config;
    private final AiPromptTemplates promptTemplates;
    private final ObjectMapper objectMapper;
    
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    
    private final Semaphore semaphore = new Semaphore(1);

    /**
     * Gọi AI với prompt đơn giản
     */
    public String ask(String userMessage) {
        return ask(userMessage, null);
    }

    /**
     * Gọi AI với prompt + context
     */
    public String ask(String userMessage, String conversationContext) {
        if (!config.isAnyEnabled()) {
            log.debug("AiCoreService: No AI provider enabled");
            return null;
        }

        // Acquire semaphore (prevent concurrent requests)
        if (!acquireSemaphore()) {
            log.warn("AiCoreService: Could not acquire semaphore (AI busy)");
            return null;
        }

        try {
            String content = composeContent(userMessage, conversationContext);
            String response = switch (config.getActiveProvider()) {
                case "beeknoee" -> callBeeknoee(content);
                case "openai" -> callOpenAI(content);
                case "gemini" -> callGemini(content);
                case "claude" -> callClaude(content);
                default -> null;
            };
            return response;
        } finally {
            semaphore.release();
        }
    }

    /**
     * Check xem AI có enable không
     */
    public boolean isEnabled() {
        return config.isAnyEnabled();
    }

    // ============================================================
    // PRIVATE: Semaphore
    // ============================================================
    
    private boolean acquireSemaphore() {
        try {
            return semaphore.tryAcquire(config.getSemaphore().getWaitSeconds(), TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    // ============================================================
    // PRIVATE: Content Composition
    // ============================================================
    
    private String composeContent(String userMessage, String conversationContext) {
        if (conversationContext == null || conversationContext.isBlank()) {
            return userMessage;
        }
        return "Ngữ cảnh hội thoại gần đây:\n" + conversationContext + "\n\nCâu hỏi hiện tại:\n" + userMessage;
    }

    // ============================================================
    // PROVIDER: Beeknoee (OpenAI-compatible)
    // ============================================================
    
    private String callBeeknoee(String content) {
        AiProviderConfig.BeeknoeeConfig cfg = config.getBeeknoee();
        String systemPrompt = config.getChatbot().getSystemPrompt();
        
        String body = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                  ],
                  "max_tokens": %d,
                  "temperature": %.1f
                }
                """.formatted(
                cfg.getModel(),
                escapeJson(systemPrompt),
                escapeJson(content),
                cfg.getMaxTokens(),
                cfg.getTemperature()
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cfg.getApiUrl()))
                    .timeout(Duration.ofSeconds(cfg.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + cfg.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseOpenAIResponse(response.body());
        } catch (Exception e) {
            log.warn("AiCoreService[Beeknoee]: API call failed — {}", e.getMessage());
            return promptTemplates.getAiFallback();
        }
    }

    // ============================================================
    // PROVIDER: OpenAI
    // ============================================================
    
    private String callOpenAI(String content) {
        AiProviderConfig.OpenaiConfig cfg = config.getOpenai();
        String systemPrompt = config.getChatbot().getSystemPrompt();
        
        String body = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                  ],
                  "max_tokens": %d,
                  "temperature": %.1f
                }
                """.formatted(
                cfg.getModel(),
                escapeJson(systemPrompt),
                escapeJson(content),
                cfg.getMaxTokens(),
                cfg.getTemperature()
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cfg.getApiUrl()))
                    .timeout(Duration.ofSeconds(cfg.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + cfg.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseOpenAIResponse(response.body());
        } catch (Exception e) {
            log.warn("AiCoreService[OpenAI]: API call failed — {}", e.getMessage());
            return promptTemplates.getAiFallback();
        }
    }

    // ============================================================
    // PROVIDER: Gemini
    // ============================================================
    
    private String callGemini(String content) {
        AiProviderConfig.GeminiConfig cfg = config.getGemini();
        String url = cfg.getApiUrl() + "/" + cfg.getModel() + ":generateContent?key=" + cfg.getApiKey();
        
        String body = """
                {
                  "contents": [{
                    "parts": [{"text": "%s"}]
                  }],
                  "generationConfig": {
                    "maxOutputTokens": %d
                  }
                }
                """.formatted(escapeJson(content), cfg.getMaxTokens());

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(cfg.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseGeminiResponse(response.body());
        } catch (Exception e) {
            log.warn("AiCoreService[Gemini]: API call failed — {}", e.getMessage());
            return promptTemplates.getAiFallback();
        }
    }

    // ============================================================
    // PROVIDER: Claude
    // ============================================================
    
    private String callClaude(String content) {
        AiProviderConfig.ClaudeConfig cfg = config.getClaude();
        
        String body = """
                {
                  "model": "%s",
                  "max_tokens": %d,
                  "messages": [
                    {"role": "user", "content": "%s"}
                  ]
                }
                """.formatted(
                cfg.getModel(),
                cfg.getMaxTokens(),
                escapeJson(content)
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cfg.getApiUrl()))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", cfg.getApiKey())
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseClaudeResponse(response.body());
        } catch (Exception e) {
            log.warn("AiCoreService[Claude]: API call failed — {}", e.getMessage());
            return promptTemplates.getAiFallback();
        }
    }

    // ============================================================
    // PRIVATE: Response Parsers
    // ============================================================
    
    private String parseOpenAIResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String content = choices.get(0).path("message").path("content").asText("").trim();
                if (!content.isBlank()) return content;
                
                content = choices.get(0).path("text").asText("").trim();
                if (!content.isBlank()) return content;
            }
            
            // Try alternatives
            String text = root.path("text").asText("").trim();
            if (!text.isBlank()) return text;
            
            log.warn("AiCoreService: No content in OpenAI response");
            return null;
        } catch (Exception e) {
            log.warn("AiCoreService: Parse OpenAI response failed — {}", e.getMessage());
            return null;
        }
    }
    
    private String parseGeminiResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("").trim();
        } catch (Exception e) {
            log.warn("AiCoreService: Parse Gemini response failed — {}", e.getMessage());
            return null;
        }
    }
    
    private String parseClaudeResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            return root.path("content").get(0).path("text").asText("").trim();
        } catch (Exception e) {
            log.warn("AiCoreService: Parse Claude response failed — {}", e.getMessage());
            return null;
        }
    }

    // ============================================================
    // PRIVATE: Utilities
    // ============================================================
    
    private String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
