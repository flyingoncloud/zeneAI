package com.example;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
public class RequestLoggingFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        logger.info("=== Incoming Request ===");
        logger.info("Method: {}", httpRequest.getMethod());
        logger.info("URL: {}", httpRequest.getRequestURL());
        logger.info("Query: {}", httpRequest.getQueryString());
        logger.info("Authorization Header: {}", httpRequest.getHeader("Authorization"));
        logger.info("Content-Type: {}", httpRequest.getHeader("Content-Type"));
        logger.info("========================");
        
        chain.doFilter(request, response);
    }
}
