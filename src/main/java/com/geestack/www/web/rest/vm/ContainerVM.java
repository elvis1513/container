package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 * View Model for container input.
 */
public class ContainerVM implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Container ID cannot be blank")
    @Size(max = 50, message = "Container ID max 50 chars")
    @JsonProperty("id")
    private String id;

    @NotBlank(message = "Container name cannot be blank")
    @Size(max = 100, message = "Container name max 100 chars")
    @JsonProperty("name")
    private String name;

    @Valid
    @NotNull(message = "Inner size cannot be null")
    @JsonProperty("innerSize")
    private SizeVM innerSize;

    @NotNull(message = "Max weight cannot be null")
    @jakarta.validation.constraints.DecimalMin(value = "0.1", message = "Max weight must be at least 0.1 kg")
    @jakarta.validation.constraints.DecimalMax(value = "500000", message = "Max weight must not exceed 500000kg (500 tons)")
    @JsonProperty("maxWeight")
    private Double maxWeight;

    public ContainerVM() {
        // Empty constructor needed for Jackson
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SizeVM getInnerSize() {
        return innerSize;
    }

    public void setInnerSize(SizeVM innerSize) {
        this.innerSize = innerSize;
    }

    public Double getMaxWeight() {
        return maxWeight;
    }

    public void setMaxWeight(Double maxWeight) {
        this.maxWeight = maxWeight;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ContainerVM{" +
            "id='" + id + '\'' +
            ", name='" + name + '\'' +
            ", innerSize=" + innerSize +
            ", maxWeight=" + maxWeight +
            '}';
    }
}
