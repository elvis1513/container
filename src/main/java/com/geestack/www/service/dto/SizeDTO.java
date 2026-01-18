package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO for size dimensions.
 */
public class SizeDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("l")
    private Double l;

    @JsonProperty("w")
    private Double w;

    @JsonProperty("h")
    private Double h;

    public SizeDTO() {
        // Empty constructor needed for Jackson
    }

    public SizeDTO(Double l, Double w, Double h) {
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
        return "SizeDTO{" +
            "l=" + l +
            ", w=" + w +
            ", h=" + h +
            '}';
    }
}
