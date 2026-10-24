package com.neuralproof.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class SessionManagerTest {

    private final SessionManager sessionManager = new SessionManager();

    @Test
    @DisplayName("Should extract existing session ID from request cookie")
    void testExistingCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.setCookies(new Cookie(SessionManager.COOKIE_NAME, "existing-session-uuid-123"));

        String sessionId = sessionManager.getOrCreateSessionId(request, response);

        assertThat(sessionId).isEqualTo("existing-session-uuid-123");
        assertThat(response.getCookies()).isEmpty();
    }

    @Test
    @DisplayName("Should generate new session ID and set HttpOnly cookie when missing")
    void testMissingCookieGeneratesNew() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        String sessionId = sessionManager.getOrCreateSessionId(request, response);

        assertThat(sessionId).isNotBlank();
        Cookie[] cookies = response.getCookies();
        assertThat(cookies).hasSize(1);
        Cookie cookie = cookies[0];
        assertThat(cookie.getName()).isEqualTo(SessionManager.COOKIE_NAME);
        assertThat(cookie.getValue()).isEqualTo(sessionId);
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/");
    }
}
