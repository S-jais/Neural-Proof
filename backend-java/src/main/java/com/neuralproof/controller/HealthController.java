package com.neuralproof.controller;

import com.neuralproof.client.PythonPipelineClient;
import com.neuralproof.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Service health and configuration check")
public class HealthController {

    private final DataSource dataSource;
    private final PythonPipelineClient pythonClient;

    public HealthController(DataSource dataSource, PythonPipelineClient pythonClient) {
        this.dataSource = dataSource;
        this.pythonClient = pythonClient;
    }

    @GetMapping("/health")
    @Operation(summary = "Liveness and readiness health check")
    public ResponseEntity<HealthResponse> getHealth() {
        String dbStatus = "DOWN";
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                dbStatus = "UP";
            }
        } catch (Exception e) {
            dbStatus = "DOWN: " + e.getMessage();
        }

        Map<String, Object> pythonHealth = pythonClient.checkHealth();
        String pythonStatus = pythonHealth.containsKey("status") ? "UP" : "DOWN";

        Map<String, Object> tfInfo = (Map<String, Object>) pythonHealth.get("tinyfish");
        String tfStatus = (tfInfo != null && Boolean.TRUE.equals(tfInfo.get("configured"))) ? "CONFIGURED" : "NOT_CONFIGURED";

        Map<String, Object> llmInfo = (Map<String, Object>) pythonHealth.get("llm");
        String llmStatus = (llmInfo != null && Boolean.TRUE.equals(llmInfo.get("configured"))) ? "CONFIGURED" : "NOT_CONFIGURED";

        String overallStatus = ("UP".equals(dbStatus) && "UP".equals(pythonStatus)) ? "UP" : "DEGRADED";

        HealthResponse resp = new HealthResponse(overallStatus, dbStatus, pythonStatus, tfStatus, llmStatus);
        return ResponseEntity.ok(resp);
    }
}
