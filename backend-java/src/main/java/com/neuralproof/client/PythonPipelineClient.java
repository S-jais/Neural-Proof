package com.neuralproof.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Component
public class PythonPipelineClient {

    private static final Logger log = LoggerFactory.getLogger(PythonPipelineClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String internalToken;

    public PythonPipelineClient(
            RestTemplateBuilder builder,
            @Value("${neural-proof.python-backend-url:http://localhost:8000}") String baseUrl,
            @Value("${neural-proof.internal-service-token:change-me-to-a-random-secret}") String internalToken
    ) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.internalToken = internalToken;
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(180))
                .build();
    }

    private HttpHeaders createHeaders(String correlationId, String verificationId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Token", this.internalToken);
        if (correlationId != null) {
            headers.set("X-Correlation-Id", correlationId);
        }
        if (verificationId != null) {
            headers.set("X-Verification-Id", verificationId);
        }
        return headers;
    }

    public Map<String, Object> checkHealth() {
        try {
            String url = baseUrl + "/internal/v1/health";
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Failed to check Python pipeline health: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    public Map<String, Object> generateAnswer(String question, String context, String correlationId, String verificationId) {
        String url = baseUrl + "/internal/v1/answers/generate";
        Map<String, Object> body = new HashMap<>();
        body.put("question", question);
        body.put("context", context);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders(correlationId, verificationId));
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, request, Map.class);
        return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
    }

    public Map<String, Object> extractClaims(String text, String context, int maxClaims, String correlationId, String verificationId) {
        String url = baseUrl + "/internal/v1/claims/extract";
        Map<String, Object> body = new HashMap<>();
        body.put("text", text);
        body.put("context", context);
        body.put("max_claims", maxClaims);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders(correlationId, verificationId));
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, request, Map.class);
        return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
    }

    public Map<String, Object> researchClaim(Map<String, Object> claim, String context, String correlationId, String verificationId) {
        String url = baseUrl + "/internal/v1/claims/research";
        Map<String, Object> body = new HashMap<>();
        body.put("claim", claim);
        body.put("context", context);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders(correlationId, verificationId));
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, request, Map.class);
        return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
    }

    public Map<String, Object> evaluateClaim(Map<String, Object> claim, Map<String, Object> evidenceBundle, String correlationId, String verificationId) {
        String url = baseUrl + "/internal/v1/claims/evaluate";
        Map<String, Object> body = new HashMap<>();
        body.put("claim", claim);
        body.put("evidence_bundle", evidenceBundle);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders(correlationId, verificationId));
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, request, Map.class);
        return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
    }

    public Map<String, Object> summarizeReport(Map<String, Object> counts, List<Map<String, Object>> claimSummaries, String correlationId, String verificationId) {
        String url = baseUrl + "/internal/v1/reports/summarize";
        Map<String, Object> body = new HashMap<>();
        body.put("counts", counts);
        body.put("claim_summaries", claimSummaries);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders(correlationId, verificationId));
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, request, Map.class);
        return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
    }
}
