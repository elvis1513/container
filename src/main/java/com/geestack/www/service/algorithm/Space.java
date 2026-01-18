package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.PositionDTO;

/**
 * Represents an empty rectangular space within a container for potential item placement.
 * Used in EMS (Empty Maximal Spaces) algorithm.
 */
public class Space implements Comparable<Space> {

    private final String containerId;
    private final double x, y, z; // Origin coordinates
    private final double l, w, h; // Dimensions
    private final double volume; // Available volume
    private final Space parentSpace; // Parent space (from which this space was split)

    public Space(String containerId, double x, double y, double z, double l, double w, double h, Space parent) {
        this.containerId = containerId;
        this.x = x;
        this.y = y;
        this.z = z;
        this.l = l;
        this.w = w;
        this.h = h;
        this.volume = l * w * h;
        this.parentSpace = parent;
    }

    /**
     * Check if an item can fit in this space
     */
    public boolean canFit(double itemL, double itemW, double itemH) {
        return itemL <= l && itemW <= w && itemH <= h;
    }

    /**
     * Get the placement corner (bottom-left-back corner)
     */
    public PositionDTO getCorner() {
        return new PositionDTO(x, y, z);
    }

    /**
     * Compare spaces by volume (smallest first for best-fit strategy)
     */
    @Override
    public int compareTo(Space other) {
        return Double.compare(this.volume, other.volume);
    }

    /**
     * Check if space has meaningful volume (>= 1 mm³)
     */
    public boolean isUsable() {
        return volume >= 1.0 && l >= 1 && w >= 1 && h >= 1;
    }

    public String getContainerId() {
        return containerId;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public double getZ() {
        return z;
    }

    public double getL() {
        return l;
    }

    public double getW() {
        return w;
    }

    public double getH() {
        return h;
    }

    public double getVolume() {
        return volume;
    }

    /**
     * Check if this space is dominated by another space
     * Space A is dominated by Space B if A is completely contained within B
     */
    public boolean isDominatedBy(Space other) {
        return (
            this.x >= other.x &&
            this.y >= other.y &&
            this.z >= other.z &&
            this.x + this.l <= other.x + other.l &&
            this.y + this.w <= other.y + other.w &&
            this.z + this.h <= other.z + other.h
        );
    }
}
