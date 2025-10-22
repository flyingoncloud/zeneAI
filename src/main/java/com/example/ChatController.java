package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @GetMapping("/debug")
    public Map<String, String> debug() {
        logger.info("Debug endpoint called");
        return Map.of("status", "Backend is working", "timestamp", new Date().toString());
    }
    
    @GetMapping("/test-key")
    public Map<String, Object> testApiKey() {
        logger.debug("Testing API key configuration");
        
        boolean isConfigured = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("YOUR_OPENAI_API_KEY_HERE");
        boolean hasCorrectFormat = apiKey != null && apiKey.startsWith("sk-");
        int keyLength = apiKey != null ? apiKey.length() : 0;
        
        return Map.of(
            "configured", isConfigured,
            "correctFormat", hasCorrectFormat,
            "length", keyLength,
            "preview", apiKey != null ? apiKey.substring(0, Math.min(10, apiKey.length())) + "..." : "null"
        );
    }
    
    @GetMapping("/messages")
    public List<Map<String, String>> getMessages(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> user = userRepository.findByUsername(username);
        
        if (user.isPresent()) {
            return messageRepository.findByUserOrderByTimestampAsc(user.get())
                .stream()
                .map(msg -> Map.of(
                    "role", msg.getRole(),
                    "content", msg.getContent(),
                    "timestamp", msg.getTimestamp().toString()
                ))
                .collect(Collectors.toList());
        }
        
        return List.of();
    }
    
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request, 
                                   @RequestHeader("Authorization") String token) {
        String message = request.get("message");
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> user = userRepository.findByUsername(username);
        
        if (user.isEmpty()) {
            return Map.of("response", "User not found");
        }
        
        logger.debug("Received chat request from {}: {}", username, message);
        
        // Save user message
        messageRepository.save(new Message(user.get(), "user", message));
        
        String response = openAIService.getChatResponse(message);
        logger.debug("Sending response: {}", response);
        
        // Save assistant message
        messageRepository.save(new Message(user.get(), "assistant", response));
        
        return Map.of("response", response);
    }
    
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestParam String message, 
                                @RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> user = userRepository.findByUsername(username);
        
        SseEmitter emitter = new SseEmitter(30000L); // 30 second timeout
        
        if (user.isEmpty()) {
            try {
                emitter.send("User not found");
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }
        
        // Save user message
        messageRepository.save(new Message(user.get(), "user", message));
        
        new Thread(() -> {
            try {
                String response = openAIService.getChatResponse(message);
                
                // Stream response word by word
                String[] words = response.split(" ");
                for (String word : words) {
                    emitter.send(word + " ");
                    Thread.sleep(100); // Simulate streaming delay
                }
                
                // Save complete assistant message
                messageRepository.save(new Message(user.get(), "assistant", response));
                
                emitter.complete();
            } catch (Exception e) {
                logger.error("Streaming error", e);
                try {
                    emitter.send("Error: " + e.getMessage());
                } catch (Exception sendError) {
                    logger.error("Error sending error message", sendError);
                }
                emitter.completeWithError(e);
            }
        }).start();
        
        return emitter;
    }
}
