package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.PlacementDTO;
import com.geestack.www.web.rest.vm.ItemVM;
import java.util.List;
import java.util.Map;

/**
 * Utility class for AABB collision detection in 3D space.
 */
public class CollisionDetector {

    private CollisionDetector() {
        // Utility class
    }

    /**
     * Check if placement collides with existing placements
     * @param placement The new placement to check
     * @param existingPlacements List of already placed items
     * @param itemsMap Map of item ID to ItemVM for looking up existing item dimensions
     * @return true if collision detected, false otherwise
     */
    public static boolean checkCollision(Placement placement, List<PlacementDTO> existingPlacements, Map<String, ItemVM> itemsMap) {
        for (PlacementDTO existing : existingPlacements) {
            // Check if same container - items in different containers can't collide
            if (!placement.getContainerId().equals(existing.getContainerId())) {
                continue;
            }

            ItemVM existingItem = itemsMap.get(existing.getItemId());
            if (existingItem == null) {
                continue; // Should not happen, but skip if item not found
            }

            if (checkCollisionWithExisting(placement, existing, existingItem)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check collision with an existing placement using orientation-aware AABB
     */
    private static boolean checkCollisionWithExisting(Placement newPlacement, PlacementDTO existing, ItemVM existingItem) {
        // Get rotated dimensions for the new placement
        double[] newDim = OrientationHandler.getRotatedDimensions(newPlacement.getItem().getSize(), newPlacement.getOrientation());

        // Get rotated dimensions for the existing placement
        double[] existingDim = OrientationHandler.getRotatedDimensions(existingItem.getSize(), existing.getOrientation());

        // AABB collision detection
        return overlaps3D(
            newPlacement.getPosition().getX(),
            newPlacement.getPosition().getY(),
            newPlacement.getPosition().getZ(),
            newDim[0],
            newDim[1],
            newDim[2],
            existing.getPosition().getX(),
            existing.getPosition().getY(),
            existing.getPosition().getZ(),
            existingDim[0],
            existingDim[1],
            existingDim[2]
        );
    }

    /**
     * 3D AABB collision detection
     */
    private static boolean overlaps3D(
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
}
