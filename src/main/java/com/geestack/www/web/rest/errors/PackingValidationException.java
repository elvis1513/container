package com.geestack.www.web.rest.errors;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;
import tech.jhipster.web.rest.errors.ProblemDetailWithCause;
import tech.jhipster.web.rest.errors.ProblemDetailWithCause.ProblemDetailWithCauseBuilder;

/**
 * Exception for packing validation errors with detailed field-level error information.
 */
public class PackingValidationException extends ErrorResponseException {

    private static final long serialVersionUID = 1L;

    private final List<FieldError> fieldErrors;

    public PackingValidationException(String defaultMessage, List<FieldError> fieldErrors) {
        super(
            HttpStatus.BAD_REQUEST,
            ProblemDetailWithCauseBuilder.instance()
                .withStatus(HttpStatus.BAD_REQUEST.value())
                .withType(ErrorConstants.PACKING_VALIDATION_TYPE)
                .withTitle(defaultMessage)
                .withProperty("message", ErrorConstants.ERR_VALIDATION)
                .withProperty("params", "packing")
                .withProperty("fieldErrors", fieldErrors)
                .build(),
            null
        );
        this.fieldErrors = fieldErrors;
    }

    public List<FieldError> getFieldErrors() {
        return fieldErrors;
    }

    public ProblemDetailWithCause getProblemDetailWithCause() {
        return (ProblemDetailWithCause) this.getBody();
    }

    /**
     * Builder for constructing PackingValidationException with fluent API.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private final List<FieldError> fieldErrors = new ArrayList<>();
        private String defaultMessage = "Invalid input parameters";

        public Builder addError(String field, String message) {
            this.fieldErrors.add(new FieldError(field, message));
            return this;
        }

        public Builder defaultMessage(String message) {
            this.defaultMessage = message;
            return this;
        }

        public PackingValidationException build() {
            return new PackingValidationException(defaultMessage, new ArrayList<>(fieldErrors));
        }
    }

    /**
     * Represents a single field-level error.
     */
    public record FieldError(String field, String message) {}
}
