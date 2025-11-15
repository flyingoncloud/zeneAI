package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/zene")
@CrossOrigin(origins = "*")
public class ZeneController {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private ZeneSessionRepository sessionRepository;
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private ImageStorageService imageStorageService;
    
    @Value("${ai.chat.api.url:http://localhost:8000}")
    private String aiChatApiUrl;
    
    private static final Map<Pattern, String> SELF_PATTERNS = Map.of(
        Pattern.compile("(平静|calm)", Pattern.CASE_INSENSITIVE), "平静",
        Pattern.compile("(清晰|clarity|clear)", Pattern.CASE_INSENSITIVE), "清晰",
        Pattern.compile("(慈悲|怜悯|compassion)", Pattern.CASE_INSENSITIVE), "慈悲",
        Pattern.compile("(好奇|curious|curiosity)", Pattern.CASE_INSENSITIVE), "好奇",
        Pattern.compile("(自信|confidence)", Pattern.CASE_INSENSITIVE), "自信",
        Pattern.compile("(勇气|勇敢|courage)", Pattern.CASE_INSENSITIVE), "勇气"
    );
    
    private static final Map<Pattern, String> PART_PATTERNS = Map.of(
        Pattern.compile("(焦虑|焦慮|anxiety|anxious)", Pattern.CASE_INSENSITIVE), "焦虑",
        Pattern.compile("(担忧|担心|worry)", Pattern.CASE_INSENSITIVE), "担忧",
        Pattern.compile("(害怕|恐惧|fear)", Pattern.CASE_INSENSITIVE), "害怕",
        Pattern.compile("(愤怒|生气|anger)", Pattern.CASE_INSENSITIVE), "愤怒",
        Pattern.compile("(悲伤|難過|难过|sad)", Pattern.CASE_INSENSITIVE), "悲伤",
        Pattern.compile("(羞愧|羞耻|shame)", Pattern.CASE_INSENSITIVE), "羞愧"
    );
    
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        String message = (String) request.getOrDefault("message", "");
        List<String> images = (List<String>) request.getOrDefault("images", new ArrayList<>());
        String sessionId = getOrCreateSessionId(httpRequest, httpResponse);
        
        // Detect Parts and Self
        List<Map<String, String>> detected = detectPartsAndSelf(message);
        
        // Get or create session
        ZeneSession session = sessionRepository.findBySessionId(sessionId)
            .orElse(new ZeneSession());
        session.setSessionId(sessionId);
        session.setUpdatedAt(LocalDateTime.now());
        
        // Generate AI response using existing OpenAI service
        String aiReply = generateIFSResponse(message, images, detected);
        
        // Update session transcript
        String currentTranscript = session.getTranscript() != null ? session.getTranscript() : "";
        session.setTranscript(currentTranscript + "\nUser: " + message + "\nAI: " + aiReply);
        
        sessionRepository.save(session);
        
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("sessionId", sessionId);
        response.put("reply", aiReply);
        response.put("partsDetected", detected);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, Object>> transcribe(@RequestParam("audio") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        if (file.isEmpty()) {
            response.put("error", "No audio file provided");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            // For now, return placeholder - integrate with OpenAI Whisper or similar
            long sizeKB = file.getSize() / 1024;
            String transcribedText = String.format("（占位转写）音频已收到，大小约 %d KB。请接入后端 STT 后返回真实文本。", sizeKB);
            
            response.put("text", transcribedText);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Transcription failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        if (file.isEmpty()) {
            response.put("ok", false);
            response.put("error", "no file");
            return ResponseEntity.badRequest().body(response);
        }
        
        String contentType = file.getContentType();
        if (!Arrays.asList("image/png", "image/jpeg", "image/webp").contains(contentType)) {
            response.put("ok", false);
            response.put("error", "unsupported mime");
            return ResponseEntity.status(415).body(response);
        }
        
        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            response.put("ok", false);
            response.put("error", "file too large");
            return ResponseEntity.status(413).body(response);
        }
        
        try {
            String ext = contentType.equals("image/png") ? "png" : 
                        contentType.equals("image/webp") ? "webp" : "jpg";
            String filename = System.currentTimeMillis() + "-" + 
                            UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            
            Path uploadDir = Paths.get("uploads");
            Files.createDirectories(uploadDir);
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            response.put("ok", true);
            response.put("url", "/uploads/" + filename);
            response.put("mime", contentType);
            response.put("size", file.getSize());
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("ok", false);
            response.put("error", "upload failed");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/suggest")
    public ResponseEntity<Map<String, Object>> suggest(@RequestBody Map<String, Object> request) {
        List<String> transcript = (List<String>) request.getOrDefault("transcript", new ArrayList<>());
        List<String> self = (List<String>) request.getOrDefault("self", new ArrayList<>());
        List<String> parts = (List<String>) request.getOrDefault("parts", new ArrayList<>());
        
        List<String> suggestions = generateSuggestions(self, parts);
        
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("suggestions", suggestions);
        
        return ResponseEntity.ok(response);
    }
    
    private String getOrCreateSessionId(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("zene_session_id".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        String sessionId = UUID.randomUUID().toString();
        Cookie cookie = new Cookie("zene_session_id", sessionId);
        cookie.setPath("/");
        cookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
        response.addCookie(cookie);
        
        return sessionId;
    }
    
    private List<Map<String, String>> detectPartsAndSelf(String message) {
        List<Map<String, String>> detected = new ArrayList<>();
        
        // Check for Self patterns
        for (Map.Entry<Pattern, String> entry : SELF_PATTERNS.entrySet()) {
            if (entry.getKey().matcher(message).find()) {
                Map<String, String> item = new HashMap<>();
                item.put("type", "self");
                item.put("label", entry.getValue());
                detected.add(item);
                break;
            }
        }
        
        // Check for Part patterns
        for (Map.Entry<Pattern, String> entry : PART_PATTERNS.entrySet()) {
            if (entry.getKey().matcher(message).find()) {
                Map<String, String> item = new HashMap<>();
                item.put("type", "part");
                item.put("label", entry.getValue());
                detected.add(item);
                break;
            }
        }
        
        return detected;
    }
    
    private String generateIFSResponse(String message, List<String> images, List<Map<String, String>> detected) {
        String context = "You are an IFS (Internal Family Systems) therapy assistant. " +
                        "Help the user explore their Parts and Self with compassion and curiosity. " +
                        "Detected emotions: " + detected.toString();
        
        String fullMessage = context + "\n\nUser: " + message;
        
        try {
            // If there are images, use image analysis endpoint
            if (images != null && !images.isEmpty()) {
                String imageUri = images.get(0);
                System.out.println("Processing image URI: " + imageUri);
                
                try {
                    // Send URI to ai-chat-api for processing
                    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                    body.add("image_uri", imageUri);
                    body.add("prompt", fullMessage);
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
                    
                    ResponseEntity<Map> response = restTemplate.exchange(
                        aiChatApiUrl + "/analyze-image-uri/", 
                        HttpMethod.POST, 
                        entity, 
                        Map.class
                    );
                    
                    Map<String, Object> apiResponse = response.getBody();
                    return (String) apiResponse.get("analysis");
                } catch (Exception imageEx) {
                    System.out.println("Error processing image: " + imageEx.getMessage());
                    // Fall back to text-only processing
                }
            }
            
            // Regular chat request
            Map<String, String> chatRequest = Map.of("message", fullMessage);
            System.out.println("Sending request to ai-chat-api: " + chatRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(chatRequest, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                aiChatApiUrl + "/chat/", 
                HttpMethod.POST, 
                entity, 
                Map.class
            );
            
            Map<String, Object> apiResponse = response.getBody();
            Map<String, Object> assistantMessage = (Map<String, Object>) apiResponse.get("assistant_message");
            return (String) assistantMessage.get("content");
            
        } catch (Exception e) {
            System.out.println("Error calling ai-chat-api: " + e.getMessage());
            e.printStackTrace();
            return "我理解你的感受。让我们一起探索这些情绪背后的需要。你能告诉我更多关于这种感觉的吗？";
        }
    }
    
    @GetMapping("/gallery")
    public ResponseEntity<Map<String, Object>> getGallery() {
        List<Map<String, String>> items = Arrays.asList(
            Map.of("id", "g1", "url", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g2", "url", "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g3", "url", "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g4", "url", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g5", "url", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g6", "url", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g7", "url", "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g8", "url", "https://images.unsplash.com/photo-1418065460487-3956c3043904?auto=format&fit=crop&w=900&q=60"),
            Map.of("id", "g9", "url", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=60")
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("items", items);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/risk")
    public ResponseEntity<Map<String, Object>> checkRisk(@RequestBody Map<String, Object> request) {
        String text = (String) request.getOrDefault("text", "");
        String imageSummary = (String) request.getOrDefault("imageSummary", "");
        String sample = text + " " + imageSummary;
        
        Map<String, Object> response = new HashMap<>();
        
        // Risk patterns
        Map<String, Pattern> patterns = Map.of(
            "body", Pattern.compile("(心跳|胸闷|呼吸|发抖|眩晕|恶心|出汗)", Pattern.CASE_INSENSITIVE),
            "emotion", Pattern.compile("(害怕|恐惧|愤怒|悲伤|焦虑|崩溃|沮丧|绝望)", Pattern.CASE_INSENSITIVE),
            "cognition", Pattern.compile("(失控|反复想|停不下来|脑子乱|无法思考|空白)", Pattern.CASE_INSENSITIVE),
            "behavior", Pattern.compile("(冲动|打|摔|自残|伤害别人|逃|躲|砸)", Pattern.CASE_INSENSITIVE),
            "language", Pattern.compile("(不想活|自杀|我撑不住|我受不了|骂|攻击|suicide|kill myself)", Pattern.CASE_INSENSITIVE)
        );
        
        List<String> signals = new ArrayList<>();
        for (Map.Entry<String, Pattern> entry : patterns.entrySet()) {
            if (entry.getValue().matcher(sample).find()) {
                signals.add(entry.getKey());
            }
        }
        
        Pattern strongPattern = Pattern.compile("(自杀|不想活|伤害自己|kill myself|suicide)", Pattern.CASE_INSENSITIVE);
        Pattern weakPattern = Pattern.compile("(崩溃|撑不住|恐慌|panic|绝望)", Pattern.CASE_INSENSITIVE);
        
        boolean strong = strongPattern.matcher(sample).find();
        boolean weak = weakPattern.matcher(sample).find();
        boolean triggered = !signals.isEmpty() || strong || weak;
        
        response.put("triggered", triggered);
        
        if (triggered) {
            response.put("level", strong ? "strong" : "weak");
            response.put("signals", signals.isEmpty() ? 
                Arrays.asList(strong ? "language" : "emotion") : 
                signals.subList(0, Math.min(3, signals.size())));
            response.put("cooldownSec", strong ? 30 : 15);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/analyze-image")
    public ResponseEntity<Map<String, Object>> analyzeImage(@RequestBody Map<String, Object> request) {
        String imageUrl = (String) request.get("imageUrl");
        
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("error", "Image URL is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            String prompt = "Analyze this image and describe what you see. Focus on the mood, emotions, and therapeutic insights it might evoke for someone in IFS therapy.";
            String analysis = openAIService.getChatResponseWithImage(prompt, imageUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("ok", true);
            response.put("analysis", analysis);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("ok", false);
            response.put("error", "Analysis failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/greeting")
    public ResponseEntity<Map<String, Object>> getGreeting() {
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("message", "欢迎来到内心探索之旅。我是你的情感陪伴者，让我们一起倾听内心的声音，探索你的感受和情绪。");
        
        return ResponseEntity.ok(response);
    }
    
    private List<String> generateSuggestions(List<String> self, List<String> parts) {
        List<String> suggestions = new ArrayList<>();
        
        if (self.contains("平静")) {
            suggestions.add("在感到「平静」时，回看聊天记录中的关键节点，标注是什么帮助你回到平静。");
        }
        if (self.contains("好奇")) {
            suggestions.add("保持好奇：每遇到一个情绪片段，先问\"它在保护什么？\"再做下一步。");
        }
        if (parts.contains("焦虑")) {
            suggestions.add("给焦虑一个名字，并写下一句它想传达的话，接纳它的存在再继续。");
        }
        if (parts.contains("愤怒")) {
            suggestions.add("当愤怒出现时，尝试先识别触发的需求（被尊重/被理解），再表达观点。");
        }
        
        if (suggestions.isEmpty()) {
            suggestions.add("继续以开放与好奇的态度观察情绪的来去。");
            suggestions.add("给每个 Part 一点空间：它试图保护什么？担心失去什么？");
        }
        
        return suggestions.subList(0, Math.min(5, suggestions.size()));
    }
}
