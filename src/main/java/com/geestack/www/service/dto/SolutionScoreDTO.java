package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO for packing solution score/metrics.
 */
public class SolutionScoreDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("volumeUtilization")
    private Double volumeUtilization;

    @JsonProperty("remainingVolume")
    private Long remainingVolume;

    @JsonProperty("totalWeight")
    private Double totalWeight;

    @JsonProperty("placedItemCount")
    private Integer placedItemCount;

    @JsonProperty("totalItemCount")
    private Integer totalItemCount;

    @JsonProperty("containerCount")
    private Integer containerCount;

    public SolutionScoreDTO() {
        // Empty constructor needed for Jackson
    }

    public Double getVolumeUtilization() {
        return volumeUtilization;
    }

    public void setVolumeUtilization(Double volumeUtilization) {
        this.volumeUtilization = volumeUtilization;
    }

    public Long getRemainingVolume() {
        return remainingVolume;
    }

    public void setRemainingVolume(Long remainingVolume) {
        this.remainingVolume = remainingVolume;
    }

    public Double getTotalWeight() {
        return totalWeight;
    }

    public void setTotalWeight(Double totalWeight) {
        this.totalWeight = totalWeight;
    }

    public Integer getPlacedItemCount() {
        return placedItemCount;
    }

    public void setPlacedItemCount(Integer placedItemCount) {
        this.placedItemCount = placedItemCount;
    }

    public Integer getTotalItemCount() {
        return totalItemCount;
    }

    public void setTotalItemCount(Integer totalItemCount) {
        this.totalItemCount = totalItemCount;
    }

    public Integer getContainerCount() {
        return containerCount;
    }

    public void setContainerCount(Integer containerCount) {
        this.containerCount = containerCount;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "SolutionScoreDTO{" +
            "volumeUtilization=" + volumeUtilization +
            ", remainingVolume=" + remainingVolume +
            ", totalWeight=" + totalWeight +
            ", placedItemCount=" + placedItemCount +
            ", totalItemCount=" + totalItemCount +
            ", containerCount=" + containerCount +
            '}';
    }
}
