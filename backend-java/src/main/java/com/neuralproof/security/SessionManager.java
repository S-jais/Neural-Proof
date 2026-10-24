package com.neuralproof.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.UUID;

@Component
public class SessionManager {

    public static final String COOKIE_NAME = "NEURAL_PROOF_SESSION";

    public String getOrCreateSessionId(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    return c.getValue();
                }
            }
        }

        // Generate new session ID
        String newSessionId = UUID.randomUUID().toString();
        Cookie cookie = new Cookie(COOKIE_NAME, newSessionId);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(60 * 60 * 24 * 30); // 30 days
        // SameSite=Lax handled via response header if needed
        response.addCookie(cookie);
        return newSessionId;
    }
}
