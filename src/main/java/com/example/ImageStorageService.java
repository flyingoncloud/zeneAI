package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageStorageService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public byte[] getImageBytes(String imageUri) throws IOException {
        if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
            return downloadAndStore(imageUri);
        } else if (imageUri.startsWith("/uploads/")) {
            return readLocalFile(imageUri);
        } else if (imageUri.startsWith("s3://")) {
            // Future: implement S3 download
            throw new UnsupportedOperationException("S3 support not implemented yet");
        } else {
            throw new IllegalArgumentException("Unsupported image URI: " + imageUri);
        }
    }
    
    private byte[] downloadAndStore(String url) throws IOException {
        // Download image
        byte[] imageBytes = restTemplate.getForObject(url, byte[].class);
        
        // Store locally for future use
        String filename = UUID.randomUUID().toString() + ".jpg";
        Path localPath = Paths.get("uploads", filename);
        Files.createDirectories(localPath.getParent());
        Files.write(localPath, imageBytes);
        
        System.out.println("Downloaded and stored image: " + url + " -> " + localPath);
        return imageBytes;
    }
    
    private byte[] readLocalFile(String path) throws IOException {
        Path filePath = Paths.get("." + path);
        if (!Files.exists(filePath)) {
            throw new IOException("Local file not found: " + filePath.toAbsolutePath());
        }
        return Files.readAllBytes(filePath);
    }
}
