package com.geestack.www.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO for unplaced items with reason.
 */
public class UnplacedItemDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("itemId")
    private String itemId;

    @JsonProperty("reason")
    private String reason; // OVERWEIGHT_OR_NO_SPACE, NO_SUITABLE_CONTAINER, etc.

    public UnplacedItemDTO() {
        // Empty constructor needed for Jackson
    }

    public UnplacedItemDTO(String itemId, String reason) {
        this.itemId = itemId;
        this.reason = reason;
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UnplacedItemDTO{" +
            "itemId='" + itemId + '\'' +
            ", reason='" + reason + '\'' +
            '}';
    }
}
