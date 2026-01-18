package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 * View Model for item input.
 */
public class ItemVM implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Item ID cannot be blank")
    @Size(max = 50, message = "Item ID max 50 chars")
    @JsonProperty("id")
    private String id;

    @NotBlank(message = "Item name cannot be blank")
    @Size(max = 100, message = "Item name max 100 chars")
    @JsonProperty("name")
    private String name;

    @Valid
    @NotNull(message = "Size cannot be null")
    @JsonProperty("size")
    private SizeVM size;

    @NotNull(message = "Weight cannot be null")
    @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Weight must be at least 0.01kg")
    @jakarta.validation.constraints.DecimalMax(value = "100000", message = "Weight must not exceed 100000kg (100 tons)")
    @JsonProperty("weight")
    private Double weight;

    @NotNull(message = "Quantity cannot be null")
    @jakarta.validation.constraints.Min(value = 1, message = "Quantity must be at least 1")
    @jakarta.validation.constraints.Max(value = 10000, message = "Quantity must not exceed 10000")
    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("constraints")
    private ConstraintsVM constraints;

    public ItemVM() {
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

    public SizeVM getSize() {
        return size;
    }

    public void setSize(SizeVM size) {
        this.size = size;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public ConstraintsVM getConstraints() {
        return constraints;
    }

    public void setConstraints(ConstraintsVM constraints) {
        this.constraints = constraints;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ItemVM{" +
            "id='" + id + '\'' +
            ", name='" + name + '\'' +
            ", size=" + size +
            ", weight=" + weight +
            ", quantity=" + quantity +
            ", constraints=" + constraints +
            '}';
    }
}
