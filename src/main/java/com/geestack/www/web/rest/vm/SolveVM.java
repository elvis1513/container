package com.geestack.www.web.rest.vm;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.List;

/**
 * View Model for packing solve request.
 */
public class SolveVM implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Containers cannot be null")
    @Size(min = 1, max = 10, message = "Must provide 1-10 containers")
    @JsonProperty("containers")
    private List<@Valid ContainerVM> containers;

    @NotNull(message = "Items cannot be null")
    @Size(min = 1, max = 1000, message = "Must provide 1-1000 items")
    @JsonProperty("items")
    private List<@Valid ItemVM> items;

    @JsonProperty("options")
    private OptionsVM options;

    public SolveVM() {
        // Empty constructor needed for Jackson
    }

    public List<ContainerVM> getContainers() {
        return containers;
    }

    public void setContainers(List<ContainerVM> containers) {
        this.containers = containers;
    }

    public List<ItemVM> getItems() {
        return items;
    }

    public void setItems(List<ItemVM> items) {
        this.items = items;
    }

    public OptionsVM getOptions() {
        return options;
    }

    public void setOptions(OptionsVM options) {
        this.options = options;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "SolveVM{" +
            "containers=" + containers +
            ", items=" + items +
            ", options=" + options +
            '}';
    }
}
