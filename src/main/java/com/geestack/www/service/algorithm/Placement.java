package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.PlacementDTO;
import com.geestack.www.service.dto.PositionDTO;
import com.geestack.www.web.rest.vm.ItemVM;

/**
 * Represents a potential item placement with orientation.
 */
public class Placement {

    private final ItemVM item;
    private final int instanceIndex;
    private final String containerId;
    private final PositionDTO position;
    private final String orientation; // LWH, WLH, LHW, WHL, HLW, HWL

    public Placement(ItemVM item, int instanceIndex, String containerId, PositionDTO position, String orientation) {
        this.item = item;
        this.instanceIndex = instanceIndex;
        this.containerId = containerId;
        this.position = position;
        this.orientation = orientation;
    }

    /**
     * Get the rotated dimensions of this placement
     */
    private double[] getRotatedDimensions() {
        return OrientationHandler.getRotatedDimensions(item.getSize(), orientation);
    }

    /**
     * AABB collision detection with another placement
     * Takes into account the orientation of both placements
     */
    public boolean overlaps(Placement other) {
        double[] dim1 = this.getRotatedDimensions();
        double[] dim2 = other.getRotatedDimensions();

        return overlaps3D(
            this.position.getX(),
            this.position.getY(),
            this.position.getZ(),
            dim1[0],
            dim1[1],
            dim1[2],
            other.position.getX(),
            other.position.getY(),
            other.position.getZ(),
            dim2[0],
            dim2[1],
            dim2[2]
        );
    }

    /**
     * 3D AABB collision detection
     */
    private boolean overlaps3D(
        double x1,
        double y1,
        double z1,
        double l1,
        double w1,
        double h1,
        double x2,
        double y2,
        double z2,
        double l2,
        double w2,
        double h2
    ) {
        return x1 < x2 + l2 && x1 + l1 > x2 && y1 < y2 + w2 && y1 + w1 > y2 && z1 < z2 + h2 && z1 + h1 > z2;
    }

    /**
     * Convert to PlacementDTO
     */
    public PlacementDTO toDTO() {
        PlacementDTO dto = new PlacementDTO();
        dto.setItemId(this.item.getId());
        dto.setInstanceIndex(this.instanceIndex);
        dto.setContainerId(this.containerId);
        dto.setPosition(this.position);
        dto.setOrientation(this.orientation);
        return dto;
    }

    public ItemVM getItem() {
        return item;
    }

    public int getInstanceIndex() {
        return instanceIndex;
    }

    public String getContainerId() {
        return containerId;
    }

    public PositionDTO getPosition() {
        return position;
    }

    public String getOrientation() {
        return orientation;
    }
}
