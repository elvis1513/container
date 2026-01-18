package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.List;

/**
 * View Model for item constraints (rotations, stackability, fragility, priority).
 */
public class ConstraintsVM implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Allowed rotations: LWH, WLH, LHW, WHL, HLW, HWL
     */
    @JsonProperty("rotations")
    private List<String> rotations;

    @JsonProperty("stackable")
    private Boolean stackable;

    @JsonProperty("fragile")
    private Boolean fragile;

    @JsonProperty("priority")
    private Integer priority;

    public ConstraintsVM() {
        // Empty constructor needed for Jackson
    }

    public List<String> getRotations() {
        return rotations;
    }

    public void setRotations(List<String> rotations) {
        this.rotations = rotations;
    }

    public Boolean getStackable() {
        return stackable;
    }

    public void setStackable(Boolean stackable) {
        this.stackable = stackable;
    }

    public Boolean getFragile() {
        return fragile;
    }

    public void setFragile(Boolean fragile) {
        this.fragile = fragile;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ConstraintsVM{" +
            "rotations=" + rotations +
            ", stackable=" + stackable +
            ", fragile=" + fragile +
            ", priority=" + priority +
            '}';
    }
}
