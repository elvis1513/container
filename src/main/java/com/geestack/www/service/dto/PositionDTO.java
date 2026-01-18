package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO for 3D position coordinates.
 */
public class PositionDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("x")
    private Double x;

    @JsonProperty("y")
    private Double y;

    @JsonProperty("z")
    private Double z;

    public PositionDTO() {
        // Empty constructor needed for Jackson
    }

    public PositionDTO(Double x, Double y, Double z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Double getX() {
        return x;
    }

    public void setX(Double x) {
        this.x = x;
    }

    public Double getY() {
        return y;
    }

    public void setY(Double y) {
        this.y = y;
    }

    public Double getZ() {
        return z;
    }

    public void setZ(Double z) {
        this.z = z;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PositionDTO{" +
            "x=" + x +
            ", y=" + y +
            ", z=" + z +
            '}';
    }
}
