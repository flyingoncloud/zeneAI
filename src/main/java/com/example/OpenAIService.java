package com.example;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class OpenAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.mock.enabled:false}")
    private boolean mockEnabled;
    
    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();
    
    public String getChatResponse(String message) {
        return getChatResponseWithImage(message, null);
    }
    
    public String getChatResponseWithImage(String message, String imageUrl) {
        // Mock mode for testing without using OpenAI credits
        if (mockEnabled) {
            logger.debug("Mock mode enabled - returning simulated response");
            String mockResponse = "This is a mock response to: \"" + message + "\".";
            if (imageUrl != null) {
                mockResponse += " I can see you've shared an image, but I'm in mock mode so I can't analyze it.";
            }
            return mockResponse + " Set openai.mock.enabled=false to use real OpenAI API.";
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
            // Create proper JSON using ObjectMapper
            Map<String, Object> requestBody = new HashMap<>();
            
            // Use GPT-4 Vision if image is provided, otherwise use GPT-3.5-turbo
            if (imageUrl != null) {
                requestBody.put("model", "gpt-4o");
                requestBody.put("max_tokens", 300);
                
                // Create message with image content
                Map<String, Object> messageObj = new HashMap<>();
                messageObj.put("role", "user");
                
                List<Map<String, Object>> content = new ArrayList<>();
                
                // Add text content
                Map<String, Object> textContent = new HashMap<>();
                textContent.put("type", "text");
                textContent.put("text", message);
                content.add(textContent);
                
                // Add image content as base64
                Map<String, Object> imageContent = new HashMap<>();
                imageContent.put("type", "image_url");
                Map<String, String> imageUrlObj = new HashMap<>();
                
                // Convert image to base64 if it's a local URL
                if (imageUrl.startsWith("http://localhost:8080/uploads/")) {
                    try {
                        String base64Image = convertImageToBase64(imageUrl);
                        imageUrlObj.put("url", "data:image/jpeg;base64," + base64Image);
                    } catch (Exception e) {
                        logger.error("Failed to convert image to base64: {}", e.getMessage());
                        imageUrlObj.put("url", imageUrl); // Fallback to original URL
                    }
                } else {
                    imageUrlObj.put("url", imageUrl);
                }
                
                imageContent.put("image_url", imageUrlObj);
                content.add(imageContent);
                
                messageObj.put("content", content);
                requestBody.put("messages", Arrays.asList(messageObj));
            } else {
                requestBody.put("model", "gpt-3.5-turbo");
                requestBody.put("max_tokens", 150);
                
                Map<String, String> messageObj = new HashMap<>();
                messageObj.put("role", "user");
                messageObj.put("content", message);
                
                requestBody.put("messages", Arrays.asList(messageObj));
            }
            
            String json = mapper.writeValueAsString(requestBody);
            
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
        } catch (java.net.SocketTimeoutException e) {
            logger.error("OpenAI API timeout", e);
            return "OpenAI服务响应超时，请稍后再试。如果是图片分析，可能图片较大导致处理时间较长。";
        } catch (Exception e) {
            logger.error("Error calling OpenAI API", e);
            return "Error: " + e.getMessage();
        }
        return "No response received";
    }
    
    private String convertImageToBase64(String imageUrl) throws Exception {
        // Extract filename from URL
        String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
        String filePath = "uploads/" + filename;
        
        try {
            byte[] imageBytes = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(filePath));
            return java.util.Base64.getEncoder().encodeToString(imageBytes);
        } catch (Exception e) {
            logger.error("Failed to read image file: {}", filePath, e);
            throw e;
        }
    }
}
