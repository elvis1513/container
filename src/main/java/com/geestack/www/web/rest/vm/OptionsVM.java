package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.io.Serializable;

/**
 * View Model for solve options.
 */
public class OptionsVM implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Optimization objective: MAX_VOLUME_UTILIZATION or MAX_ITEM_COUNT
     */
    @JsonProperty("objective")
    private String objective;

    /**
     * Whether to allow splitting items across containers
     */
    @JsonProperty("allowSplitAcrossContainers")
    private Boolean allowSplitAcrossContainers;

    /**
     * Random seed for reproducible results
     */
    @Min(value = 0, message = "Seed must be non-negative")
    @JsonProperty("seed")
    private Integer seed;

    /**
     * Maximum solve duration in milliseconds (100-300000ms)
     */
    @Min(value = 100, message = "Minimum duration is 100ms")
    @Max(value = 300000, message = "Maximum duration is 300000ms (5 minutes)")
    @JsonProperty("maxDurationMs")
    private Integer maxDurationMs;

    public OptionsVM() {
        // Empty constructor needed for Jackson
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public Boolean getAllowSplitAcrossContainers() {
        return allowSplitAcrossContainers;
    }

    public void setAllowSplitAcrossContainers(Boolean allowSplitAcrossContainers) {
        this.allowSplitAcrossContainers = allowSplitAcrossContainers;
    }

    public Integer getSeed() {
        return seed;
    }

    public void setSeed(Integer seed) {
        this.seed = seed;
    }

    public Integer getMaxDurationMs() {
        return maxDurationMs;
    }

    public void setMaxDurationMs(Integer maxDurationMs) {
        this.maxDurationMs = maxDurationMs;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "OptionsVM{" +
            "objective='" + objective + '\'' +
            ", allowSplitAcrossContainers=" + allowSplitAcrossContainers +
            ", seed=" + seed +
            ", maxDurationMs=" + maxDurationMs +
            '}';
    }
}
