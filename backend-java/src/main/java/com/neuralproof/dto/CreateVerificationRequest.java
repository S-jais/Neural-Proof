package com.neuralproof.dto;

import com.neuralproof.domain.InputType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateVerificationRequest {

    @NotNull(message = "inputType is required")
    private InputType inputType;

    @NotBlank(message = "text cannot be empty")
    @Size(min = 10, max = 12000, message = "Text length must be between 10 and 12,000 characters")
    private String text;

    @Size(max = 600, message = "Context cannot exceed 600 characters")
    private String context;

    private Boolean reviewClaimsBeforeVerifying = true;

    public CreateVerificationRequest() {}

    public InputType getInputType() { return inputType; }
    public void setInputType(InputType inputType) { this.inputType = inputType; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public Boolean getReviewClaimsBeforeVerifying() { return reviewClaimsBeforeVerifying; }
    public void setReviewClaimsBeforeVerifying(Boolean reviewClaimsBeforeVerifying) { this.reviewClaimsBeforeVerifying = reviewClaimsBeforeVerifying; }
}
