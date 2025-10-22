package com.example;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OpenAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.mock.enabled:false}")
    private boolean mockEnabled;
    
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    
    public String getChatResponse(String message) {
        // Mock mode for testing without using OpenAI credits
        if (mockEnabled) {
            logger.debug("Mock mode enabled - returning simulated response");
            return "This is a mock response to: \"" + message + "\". Set openai.mock.enabled=false to use real OpenAI API.";
        }
        // Validate API key
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_OPENAI_API_KEY_HERE")) {
            logger.error("OpenAI API key is not configured properly");
            return "API key not configured. Please set your OpenAI API key.";
        }
        
        logger.debug("API key format check - starts with 'sk-': {}", apiKey.startsWith("sk-"));
        logger.debug("API key length: {}", apiKey.length());
        logger.debug("API key first 10 chars: {}", apiKey.substring(0, Math.min(10, apiKey.length())));
        
        try {
            String json = String.format(
                "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"%s\"}],\"max_tokens\":150}",
                message.replace("\"", "\\\"")
            );
            
            logger.debug("OpenAI request payload: {}", json);
            
            RequestBody body = RequestBody.create(json, MediaType.get("application/json"));
            Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .post(body)
                .build();
            
            logger.debug("Making OpenAI API call to: {}", request.url());
            
            try (Response response = client.newCall(request).execute()) {
                logger.debug("OpenAI response status: {}", response.code());
                
                if (response.body() != null) {
                    String responseBody = response.body().string();
                    logger.debug("OpenAI response body: {}", responseBody);
                    
                    if (!response.isSuccessful()) {
                        logger.error("OpenAI API error - Status: {}, Body: {}", response.code(), responseBody);
                        
                        if (response.code() == 401) {
                            return "Invalid API key. Please check your OpenAI API key configuration.";
                        } else if (response.code() == 429) {
                            return "Rate limit exceeded. Please try again later.";
                        } else {
                            return "OpenAI API error: " + response.code();
                        }
                    }
                    
                    JsonNode jsonNode = mapper.readTree(responseBody);
                    String aiResponse = jsonNode.path("choices").get(0).path("message").path("content").asText();
                    logger.debug("Extracted AI response: {}", aiResponse);
                    
                    return aiResponse;
                }
            }
        } catch (Exception e) {
            logger.error("Error calling OpenAI API", e);
            return "Error: " + e.getMessage();
        }
        return "No response received";
    }
}
