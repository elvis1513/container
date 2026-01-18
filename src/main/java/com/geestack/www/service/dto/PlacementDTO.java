package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO for item placement in container.
 */
public class PlacementDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("itemId")
    private String itemId;

    @JsonProperty("instanceIndex")
    private Integer instanceIndex;

    @JsonProperty("containerId")
    private String containerId;

    @JsonProperty("position")
    private PositionDTO position;

    @JsonProperty("orientation")
    private String orientation; // LWH, WLH, LHW, WHL, HLW, HWL

    public PlacementDTO() {
        // Empty constructor needed for Jackson
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public Integer getInstanceIndex() {
        return instanceIndex;
    }

    public void setInstanceIndex(Integer instanceIndex) {
        this.instanceIndex = instanceIndex;
    }

    public String getContainerId() {
        return containerId;
    }

    public void setContainerId(String containerId) {
        this.containerId = containerId;
    }

    public PositionDTO getPosition() {
        return position;
    }

    public void setPosition(PositionDTO position) {
        this.position = position;
    }

    public String getOrientation() {
        return orientation;
    }

    public void setOrientation(String orientation) {
        this.orientation = orientation;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PlacementDTO{" +
            "itemId='" + itemId + '\'' +
            ", instanceIndex=" + instanceIndex +
            ", containerId='" + containerId + '\'' +
            ", position=" + position +
            ", orientation='" + orientation + '\'' +
            '}';
    }
}
