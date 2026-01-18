package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for packing optimization solution response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PackingSolutionDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Solution status: OK, TIMEOUT_BEST_EFFORT, CANCELLED, ERROR
     */
    private String status;

    private SolutionScoreDTO score;

    private List<PlacementDTO> placements;

    private List<UnplacedItemDTO> unplaced;

    private List<String> warnings;

    private SolutionMetaDTO meta;

    /**
     * Error message when status is ERROR
     */
    private String error;

    public PackingSolutionDTO() {
        // Empty constructor needed for Jackson
        this.placements = new ArrayList<>();
        this.unplaced = new ArrayList<>();
        this.warnings = new ArrayList<>();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public SolutionScoreDTO getScore() {
        return score;
    }

    public void setScore(SolutionScoreDTO score) {
        this.score = score;
    }

    public List<PlacementDTO> getPlacements() {
        return placements;
    }

    public void setPlacements(List<PlacementDTO> placements) {
        this.placements = placements;
    }

    public List<UnplacedItemDTO> getUnplaced() {
        return unplaced;
    }

    public void setUnplaced(List<UnplacedItemDTO> unplaced) {
        this.unplaced = unplaced;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public SolutionMetaDTO getMeta() {
        return meta;
    }

    public void setMeta(SolutionMetaDTO meta) {
        this.meta = meta;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PackingSolutionDTO{" +
            "status='" + status + '\'' +
            ", score=" + score +
            ", placements=" + placements +
            ", unplaced=" + unplaced +
            ", warnings=" + warnings +
            ", meta=" + meta +
            ", error='" + error + '\'' +
            '}';
    }
}
