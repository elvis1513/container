package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.PlacementDTO;
import com.geestack.www.service.dto.PositionDTO;
import com.geestack.www.web.rest.vm.ContainerVM;
import com.geestack.www.web.rest.vm.ItemVM;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility class for validation checks.
 */
public class ValidationHelper {

    private ValidationHelper() {
        // Utility class
    }

    /**
     * Create an item instance with unique ID for quantity tracking
     */
    public static ItemVM createItemInstance(ItemVM item, int instanceIndex) {
        // For MVP, we use the same item instance
        // In a more complex implementation, we might create a copy with unique instance ID
        return item;
    }

    /**
     * Check if placement meets all constraints (simplified version without itemsMap)
     */
    public static boolean checkConstraints(
        ItemVM item,
        ContainerVM container,
        PositionDTO pos,
        String orientation,
        List<PlacementDTO> existingPlacements
    ) {
        // 1. Boundary check
        if (!checkBounds(item, container, pos, orientation)) {
            return false;
        }

        // 2. Weight check (simplified - we need the itemsMap for proper implementation)
        // For now, skip weight validation here and rely on the outer loop to track weight

        // 3. Stackable constraint (simplified for MVP)
        if (item.getConstraints() != null && Boolean.FALSE.equals(item.getConstraints().getStackable())) {
            // For MVP, non-stackable items must be placed on the ground
            if (pos.getZ() > 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if placement meets all constraints (full version with itemsMap)
     */
    public static boolean checkConstraints(
        ItemVM item,
        ContainerVM container,
        PositionDTO pos,
        String orientation,
        List<PlacementDTO> existingPlacements,
        Map<String, ItemVM> itemsMap
    ) {
        // 1. Boundary check
        if (!checkBounds(item, container, pos, orientation)) {
            return false;
        }

        // 2. Weight check
        double totalWeight =
            existingPlacements
                .stream()
                .filter(p -> p.getContainerId().equals(container.getId()))
                .mapToDouble(p -> itemsMap.get(p.getItemId()).getWeight())
                .sum() +
            itemsMap.get(item.getId()).getWeight();

        if (totalWeight > container.getMaxWeight()) {
            return false;
        }

        // 3. Stackable constraint (simplified for MVP)
        if (
            item.getConstraints() != null &&
            Boolean.FALSE.equals(item.getConstraints().getStackable()) &&
            !checkSupportAreaBelow(item, pos, container, existingPlacements)
        ) {
            return false;
        }

        return true;
    }

    /**
     * Check if item is within container bounds with specified orientation
     */
    public static boolean checkBounds(ItemVM item, ContainerVM container, PositionDTO pos, String orientation) {
        double[] rotated = OrientationHandler.getRotatedDimensions(item.getSize(), orientation);

        return (
            pos.getX() >= 0 &&
            pos.getY() >= 0 &&
            pos.getZ() >= 0 &&
            pos.getX() + rotated[0] <= container.getInnerSize().getL() &&
            pos.getY() + rotated[1] <= container.getInnerSize().getW() &&
            pos.getZ() + rotated[2] <= container.getInnerSize().getH()
        );
    }

    /**
     * Check if fragile item is supported by ground or lower containers
     * MVP: Simplified check - for now fragile items don't require full support validation
     */
    private static boolean checkSupportAreaBelow(
        ItemVM item,
        PositionDTO pos,
        ContainerVM container,
        List<PlacementDTO> existingPlacements
    ) {
        // For MVP, return true - full support validation requires complex 3D geometric calculations
        return true;
    }

    /**
     * Check if fragile item is supported by ground or lower containers
     */
    private static boolean checkFragile(ItemVM item, PositionDTO pos, ContainerVM container, List<PlacementDTO> existingPlacements) {
        // For MVP, fragile items are treated as "stackable" without full support validation
        return true;
    }
}
