package com.geestack.www.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geestack.www.IntegrationTest;
import com.geestack.www.web.rest.vm.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for the {@link PackingResource} REST controller.
 */
@AutoConfigureMockMvc
@WithMockUser
@IntegrationTest
class PackingResourceIT {

    @Autowired
    private ObjectMapper om;

    @Autowired
    private MockMvc restPackingMockMvc;

    /**
     * Helper method to convert object to JSON bytes.
     */
    private static byte[] convertObjectToJsonBytes(Object object) throws Exception {
        return new ObjectMapper().writeValueAsBytes(object);
    }

    /**
     * Create a valid solve request for testing.
     */
    private static SolveVM createValidSolveVM() {
        SolveVM request = new SolveVM();

        // Create container
        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);

        // Create items
        ItemVM item1 = new ItemVM();
        item1.setId("ITEM-001");
        item1.setName("Carton A");
        item1.setSize(new SizeVM(400.0, 300.0, 200.0));
        item1.setWeight(8.5);
        item1.setQuantity(10);

        ItemVM item2 = new ItemVM();
        item2.setId("ITEM-002");
        item2.setName("Carton B");
        item2.setSize(new SizeVM(500.0, 400.0, 300.0));
        item2.setWeight(15.0);
        item2.setQuantity(5);

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item1, item2));

        // Add options
        OptionsVM options = new OptionsVM();
        options.setObjective("MAX_VOLUME_UTILIZATION");
        options.setSeed(12345);
        request.setOptions(options);

        return request;
    }

    @Test
    void should_solve_with_valid_input() throws Exception {
        SolveVM request = createValidSolveVM();

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("OK"))
            .andExpect(jsonPath("$.placements").isArray())
            .andExpect(jsonPath("$.score").exists())
            .andExpect(jsonPath("$.score.volumeUtilization").exists())
            .andExpect(jsonPath("$.meta").exists())
            .andExpect(jsonPath("$.meta.algorithm").value("stub-greedy-v1"))
            .andExpect(jsonPath("$.meta.seed").value(12345));
    }

    @Test
    void should_return_400_for_null_containers() throws Exception {
        SolveVM request = new SolveVM();
        request.setItems(java.util.List.of(new ItemVM()));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_empty_containers() throws Exception {
        SolveVM request = new SolveVM();
        request.setContainers(java.util.List.of());
        request.setItems(java.util.List.of(new ItemVM()));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_null_items() throws Exception {
        SolveVM request = new SolveVM();
        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);
        request.setContainers(java.util.List.of(container));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_empty_items() throws Exception {
        SolveVM request = new SolveVM();
        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);
        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of());

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_negative_container_dimensions() throws Exception {
        SolveVM request = new SolveVM();
        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(-1.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);
        request.setContainers(java.util.List.of(container));

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(8.5);
        item.setQuantity(10);
        request.setItems(java.util.List.of(item));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("error.validation"));
    }

    @Test
    void should_return_400_for_duplicate_container_ids() throws Exception {
        SolveVM request = new SolveVM();

        ContainerVM container1 = new ContainerVM();
        container1.setId("CNTR-DUP");
        container1.setName("Container 1");
        container1.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container1.setMaxWeight(28000.0);

        ContainerVM container2 = new ContainerVM();
        container2.setId("CNTR-DUP"); // Duplicate ID
        container2.setName("Container 2");
        container2.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container2.setMaxWeight(28000.0);

        request.setContainers(java.util.List.of(container1, container2));

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(8.5);
        item.setQuantity(10);
        request.setItems(java.util.List.of(item));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("error.validation"))
            .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void should_return_400_for_item_exceeding_container() throws Exception {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(1000.0, 1000.0, 1000.0));
        container.setMaxWeight(28000.0);

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Large Carton");
        item.setSize(new SizeVM(50000.0, 300.0, 200.0)); // Larger than container
        item.setWeight(8.5);
        item.setQuantity(1);

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("error.validation"));
    }

    @Test
    void should_return_400_for_invalid_item_weight() throws Exception {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(-5.0); // Invalid weight
        item.setQuantity(10);

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_invalid_item_quantity() throws Exception {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(8.5);
        item.setQuantity(0); // Invalid quantity

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item));

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_invalid_objective() throws Exception {
        SolveVM request = createValidSolveVM();

        OptionsVM options = new OptionsVM();
        options.setObjective("INVALID_OBJECTIVE");
        request.setOptions(options);

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("error.validation"));
    }

    @Test
    void should_return_400_for_negative_seed() throws Exception {
        SolveVM request = createValidSolveVM();

        OptionsVM options = new OptionsVM();
        options.setObjective("MAX_VOLUME_UTILIZATION");
        options.setSeed(-1);
        request.setOptions(options);

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_return_400_for_invalid_max_duration() throws Exception {
        SolveVM request = createValidSolveVM();

        OptionsVM options = new OptionsVM();
        options.setObjective("MAX_VOLUME_UTILIZATION");
        options.setMaxDurationMs(50); // Less than minimum 100ms
        request.setOptions(options);

        restPackingMockMvc
            .perform(post("/api/packing/solve").contentType(MediaType.APPLICATION_JSON).content(convertObjectToJsonBytes(request)))
            .andExpect(status().isBadRequest());
    }
}
