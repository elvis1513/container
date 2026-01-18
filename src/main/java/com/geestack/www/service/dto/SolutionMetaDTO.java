package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.time.Instant;

/**
 * DTO for packing solution metadata.
 */
public class SolutionMetaDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("algorithm")
    private String algorithm;

    @JsonProperty("seed")
    private Integer seed;

    @JsonProperty("durationMs")
    private Long durationMs;

    @JsonProperty("timeout")
    private Boolean timeout;

    @JsonProperty("timestamp")
    private Instant timestamp;

    public SolutionMetaDTO() {
        // Empty constructor needed for Jackson
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public Integer getSeed() {
        return seed;
    }

    public void setSeed(Integer seed) {
        this.seed = seed;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public Boolean getTimeout() {
        return timeout;
    }

    public void setTimeout(Boolean timeout) {
        this.timeout = timeout;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "SolutionMetaDTO{" +
            "algorithm='" + algorithm + '\'' +
            ", seed=" + seed +
            ", durationMs=" + durationMs +
            ", timeout=" + timeout +
            ", timestamp=" + timestamp +
            '}';
    }
}
