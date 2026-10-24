package com.neuralproof.exception;

import com.neuralproof.dto.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("ResponseStatusException with NOT_FOUND returns 404 with standardized code")
    void testHandleResponseStatus_NotFound() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification run not found");
        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("NOT_FOUND");
        assertThat(response.getBody().getMessage()).contains("Verification run not found");
    }

    @Test
    @DisplayName("ResponseStatusException with CONFLICT returns 409 with CONFLICTING_STATE")
    void testHandleResponseStatus_Conflict() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.CONFLICT, "Run is already verifying");
        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("CONFLICTING_STATE");
    }

    @Test
    @DisplayName("Generic Exception returns 500 without leaking stack trace or internal message")
    void testHandleGenericException_NoLeak() {
        Exception ex = new RuntimeException("Secret DB password was incorrect in connection string");
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().getMessage()).doesNotContain("Secret DB password");
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected server error occurred. Please try again.");
    }
}
