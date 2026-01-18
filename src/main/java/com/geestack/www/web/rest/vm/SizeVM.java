package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.io.Serializable;

/**
 * View Model for size dimensions (length, width, height).
 */
public class SizeVM implements Serializable {

    private static final long serialVersionUID = 1L;

    @DecimalMin(value = "1", message = "Length must be at least 1mm")
    @DecimalMax(value = "60000", message = "Length must not exceed 60000mm (60m)")
    @JsonProperty("l")
    private Double l;

    @DecimalMin(value = "1", message = "Width must be at least 1mm")
    @DecimalMax(value = "60000", message = "Width must not exceed 60000mm (60m)")
    @JsonProperty("w")
    private Double w;

    @DecimalMin(value = "1", message = "Height must be at least 1mm")
    @DecimalMax(value = "60000", message = "Height must not exceed 60000mm (60m)")
    @JsonProperty("h")
    private Double h;

    public SizeVM() {
        // Empty constructor needed for Jackson
    }

    public SizeVM(Double l, Double w, Double h) {
        this.l = l;
        this.w = w;
        this.h = h;
    }

    public Double getL() {
        return l;
    }

    public void setL(Double l) {
        this.l = l;
    }

    public Double getW() {
        return w;
    }

    public void setW(Double w) {
        this.w = w;
    }

    public Double getH() {
        return h;
    }

    public void setH(Double h) {
        this.h = h;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "SizeVM{" +
            "l=" + l +
            ", w=" + w +
            ", h=" + h +
            '}';
    }
}
