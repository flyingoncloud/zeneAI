package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            String token = jwtUtil.generateToken(username);
            return Map.of("success", true, "token", token, "username", username);
        }
        
        return Map.of("success", false, "message", "Invalid credentials");
    }
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        if (userRepository.findByUsername(username).isPresent()) {
            return Map.of("success", false, "message", "Username already exists");
        }
        
        User user = new User(username, password);
        userRepository.save(user);
        String token = jwtUtil.generateToken(username);
        
        return Map.of("success", true, "token", token, "username", username);
    }
}
