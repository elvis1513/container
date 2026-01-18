package com.geestack.www.service;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;

import com.geestack.www.service.dto.PackingSolutionDTO;
import com.geestack.www.web.rest.errors.PackingValidationException;
import com.geestack.www.web.rest.vm.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Unit tests for {@link PackingService}.
 */
@SpringBootTest
class PackingServiceTest {

    @Autowired
    private PackingService packingService;

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

        return request;
    }

    @Test
    void should_solve_with_valid_input() {
        SolveVM request = createValidSolveVM();

        PackingSolutionDTO solution = packingService.solve(request);

        assertThat(solution).isNotNull();
        assertThat(solution.getStatus()).isEqualTo("OK");
        assertThat(solution.getPlacements()).isNotNull();
        assertThat(solution.getScore()).isNotNull();
        assertThat(solution.getMeta()).isNotNull();
        assertThat(solution.getMeta().getAlgorithm()).isEqualTo("ems-v1");
    }

    @Test
    void should_throw_exception_for_null_containers() {
        SolveVM request = new SolveVM();
        request.setItems(java.util.List.of(new ItemVM()));

        assertThatThrownBy(() -> packingService.solve(request)).isInstanceOf(PackingValidationException.class);
    }

    @Test
    void should_throw_exception_for_null_items() {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(5898.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);

        request.setContainers(java.util.List.of(container));

        assertThatThrownBy(() -> packingService.solve(request)).isInstanceOf(PackingValidationException.class);
    }

    @Test
    void should_throw_exception_for_negative_container_dimensions() {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-20GP");
        container.setName("20GP");
        container.setInnerSize(new SizeVM(-1.0, 2352.0, 2393.0));
        container.setMaxWeight(28000.0);

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(8.5);
        item.setQuantity(10);

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item));

        PackingValidationException ex = assertThrows(PackingValidationException.class, () -> {
            packingService.solve(request);
        });

        assertThat(ex.getFieldErrors()).isNotEmpty();
        assertThat(ex.getFieldErrors().stream().anyMatch(e -> e.field().contains("innerSize.l"))).isTrue();
    }

    @Test
    void should_throw_exception_for_duplicate_container_ids() {
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

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Carton A");
        item.setSize(new SizeVM(400.0, 300.0, 200.0));
        item.setWeight(8.5);
        item.setQuantity(10);

        request.setContainers(java.util.List.of(container1, container2));
        request.setItems(java.util.List.of(item));

        PackingValidationException ex = assertThrows(PackingValidationException.class, () -> {
            packingService.solve(request);
        });

        assertThat(ex.getFieldErrors()).isNotEmpty();
        assertThat(
            ex.getFieldErrors().stream().anyMatch(e -> e.field().equals("containers[0].id") || e.field().equals("containers[1].id"))
        ).isTrue();
    }

    @Test
    void should_throw_exception_for_item_exceeding_container() {
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

        PackingValidationException ex = assertThrows(PackingValidationException.class, () -> {
            packingService.solve(request);
        });

        assertThat(ex.getFieldErrors()).isNotEmpty();
        assertThat(ex.getFieldErrors().stream().anyMatch(e -> e.field().contains("size.l") && e.message().contains("exceeds"))).isTrue();
    }

    @Test
    void should_use_provided_seed() {
        SolveVM request = createValidSolveVM();

        OptionsVM options = new OptionsVM();
        options.setObjective("MAX_VOLUME_UTILIZATION");
        options.setSeed(42);
        request.setOptions(options);

        PackingSolutionDTO solution1 = packingService.solve(request);
        PackingSolutionDTO solution2 = packingService.solve(request);

        // With the same seed, results should be deterministic
        assertThat(solution1.getMeta().getSeed()).isEqualTo(42);
        assertThat(solution2.getMeta().getSeed()).isEqualTo(42);
    }

    @Test
    void should_generate_seed_when_not_provided() {
        SolveVM request = createValidSolveVM();

        PackingSolutionDTO solution = packingService.solve(request);

        assertThat(solution.getMeta().getSeed()).isNotNull();
    }

    @Test
    void should_accept_valid_objectives() {
        SolveVM request = createValidSolveVM();

        // Test MAX_VOLUME_UTILIZATION
        OptionsVM options1 = new OptionsVM();
        options1.setObjective("MAX_VOLUME_UTILIZATION");
        request.setOptions(options1);

        PackingSolutionDTO solution1 = packingService.solve(request);
        assertThat(solution1.getStatus()).isEqualTo("OK");

        // Test MAX_ITEM_COUNT
        OptionsVM options2 = new OptionsVM();
        options2.setObjective("MAX_ITEM_COUNT");
        request.setOptions(options2);

        PackingSolutionDTO solution2 = packingService.solve(request);
        assertThat(solution2.getStatus()).isEqualTo("OK");
    }

    @Test
    void should_throw_exception_for_invalid_objective() {
        SolveVM request = createValidSolveVM();

        OptionsVM options = new OptionsVM();
        options.setObjective("INVALID_OBJECTIVE");
        request.setOptions(options);

        PackingValidationException ex = assertThrows(PackingValidationException.class, () -> {
            packingService.solve(request);
        });

        assertThat(ex.getFieldErrors()).isNotEmpty();
        assertThat(ex.getFieldErrors().stream().anyMatch(e -> e.field().equals("options.objective"))).isTrue();
    }

    @Test
    void should_calculate_score_correctly() {
        SolveVM request = createValidSolveVM();

        PackingSolutionDTO solution = packingService.solve(request);

        assertThat(solution.getScore()).isNotNull();
        assertThat(solution.getScore().getVolumeUtilization()).isGreaterThanOrEqualTo(0.0);
        assertThat(solution.getScore().getVolumeUtilization()).isLessThanOrEqualTo(1.0);
        assertThat(solution.getScore().getTotalWeight()).isGreaterThan(0);
        assertThat(solution.getScore().getPlacedItemCount()).isGreaterThan(0);
    }

    @Test
    void should_handle_items_not_fitting() {
        SolveVM request = new SolveVM();

        ContainerVM container = new ContainerVM();
        container.setId("CNTR-SMALL");
        container.setName("Small Container");
        container.setInnerSize(new SizeVM(500.0, 500.0, 500.0));
        container.setMaxWeight(100.0);

        ItemVM item = new ItemVM();
        item.setId("ITEM-001");
        item.setName("Large Carton");
        item.setSize(new SizeVM(400.0, 400.0, 400.0));
        item.setWeight(10.0);
        item.setQuantity(10); // Many items won't fit

        request.setContainers(java.util.List.of(container));
        request.setItems(java.util.List.of(item));

        PackingSolutionDTO solution = packingService.solve(request);

        assertThat(solution.getStatus()).isEqualTo("OK");
        assertThat(solution.getUnplaced()).isNotNull();
        // Some items should not fit
        assertThat(solution.getPlacements().size() + solution.getUnplaced().size()).isGreaterThan(solution.getPlacements().size());
    }
}
