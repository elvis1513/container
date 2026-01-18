package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.*;
import com.geestack.www.service.dto.PositionDTO;
import com.geestack.www.web.rest.vm.*;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * EMS (Empty Maximal Spaces) algorithm implementation.
 * Reference: docs/specs/packing-algorithm.md
 */
public class EMSAlgorithm {

    private static final Logger log = LoggerFactory.getLogger(EMSAlgorithm.class);

    /**
     * Solve the packing optimization problem using EMS algorithm
     * for multiple containers with timeout support.
     *
     * @param containers List of containers to pack items into
     * @param items List of items to place (should be sorted by volume descending)
     * @param seed Random seed for reproducibility
     * @param maxDurationMs Maximum time to spend solving (0 = no limit)
     * @return List of placements
     */
    public List<PlacementDTO> solveMultiContainer(List<ContainerVM> containers, List<ItemVM> items, long seed, long maxDurationMs) {
        long startTime = System.currentTimeMillis();
        List<PlacementDTO> allPlacements = new ArrayList<>();
        Map<String, ItemVM> itemsMap = items.stream().collect(Collectors.toMap(ItemVM::getId, item -> item));

        // Track remaining quantities for each item type
        Map<String, Integer> remainingQuantities = new HashMap<>();
        for (ItemVM item : items) {
            remainingQuantities.put(item.getId(), item.getQuantity());
        }

        // Try to pack items into each container
        for (ContainerVM container : containers) {
            // Check timeout
            if (maxDurationMs > 0 && System.currentTimeMillis() - startTime > maxDurationMs) {
                log.warn("Timeout reached after placing {} items", allPlacements.size());
                break;
            }

            log.debug("Packing into container: {} ({})", container.getId(), container.getName());

            // Get items that still need to be placed
            List<ItemVM> remainingItems = items
                .stream()
                .filter(item -> remainingQuantities.getOrDefault(item.getId(), 0) > 0)
                .map(item -> {
                    ItemVM adjusted = new ItemVM();
                    adjusted.setId(item.getId());
                    adjusted.setName(item.getName());
                    adjusted.setSize(item.getSize());
                    adjusted.setWeight(item.getWeight());
                    adjusted.setQuantity(remainingQuantities.get(item.getId()));
                    adjusted.setConstraints(item.getConstraints());
                    return adjusted;
                })
                .collect(Collectors.toList());

            if (remainingItems.isEmpty()) {
                log.debug("All items placed, skipping remaining containers");
                break;
            }

            // Solve for this container (with timeout for remaining time)
            long remainingTime = maxDurationMs > 0 ? maxDurationMs - (System.currentTimeMillis() - startTime) : 0;

            List<PlacementDTO> containerPlacements = solve(container, remainingItems, seed, remainingTime);
            allPlacements.addAll(containerPlacements);

            // Update remaining quantities
            for (PlacementDTO placement : containerPlacements) {
                String itemId = placement.getItemId();
                remainingQuantities.put(itemId, remainingQuantities.get(itemId) - 1);
            }

            log.debug(
                "Placed {} items in container {}, total placed so far: {}",
                containerPlacements.size(),
                container.getId(),
                allPlacements.size()
            );
        }

        return allPlacements;
    }

    /**
     * Solve the packing optimization problem using EMS algorithm
     * for multiple containers.
     *
     * @param containers List of containers to pack items into
     * @param items List of items to place (should be sorted by volume descending)
     * @param seed Random seed for reproducibility
     * @return List of placements
     */
    public List<PlacementDTO> solveMultiContainer(List<ContainerVM> containers, List<ItemVM> items, long seed) {
        return solveMultiContainer(containers, items, seed, 0);
    }

    /**
     * Solve the packing optimization problem using EMS algorithm
     * for a single container with timeout support.
     *
     * @param container The container to pack items into
     * @param items List of items to place (should be sorted by volume descending)
     * @param seed Random seed for reproducibility
     * @param maxDurationMs Maximum time to spend solving (0 = no limit)
     * @return List of placements
     */
    public List<PlacementDTO> solve(ContainerVM container, List<ItemVM> items, long seed, long maxDurationMs) {
        long startTime = System.currentTimeMillis();

        // Initialize EMS space for this container
        List<Space> spaces = new ArrayList<>();
        spaces.add(
            new Space(
                container.getId(),
                0.0,
                0.0,
                0.0,
                container.getInnerSize().getL(),
                container.getInnerSize().getW(),
                container.getInnerSize().getH(),
                null // No parent for the initial space
            )
        );

        List<PlacementDTO> placements = new ArrayList<>();

        // Create a map for quick item lookup during collision detection
        Map<String, ItemVM> itemsMap = items.stream().collect(Collectors.toMap(ItemVM::getId, item -> item));

        // Try to place each item
        for (ItemVM item : items) {
            // Check timeout
            if (maxDurationMs > 0 && System.currentTimeMillis() - startTime > maxDurationMs) {
                log.warn("Timeout reached after placing {} items", placements.size());
                break;
            }

            log.debug("Processing item type: {} with quantity {}", item.getId(), item.getQuantity());
            for (int i = 0; i < item.getQuantity(); i++) {
                ItemVM itemInstance = ValidationHelper.createItemInstance(item, i);
                log.debug("  Attempting to place instance {} of item {}", i, item.getId());

                // Try to find placement in this container
                boolean placed = false;

                // Sort spaces by volume (smallest first for best-fit)
                Collections.sort(spaces);
                log.debug("  Available spaces: {}", spaces.size());

                // Try all allowed orientations
                for (String orientation : OrientationHandler.getAllowedOrientations(item)) {
                    // Get rotated dimensions for this orientation
                    double[] rotated = OrientationHandler.getRotatedDimensions(itemInstance.getSize(), orientation);

                    for (Space space : spaces) {
                        // Check if item fits in this space (using rotated dimensions)
                        if (!space.canFit(rotated[0], rotated[1], rotated[2])) {
                            continue;
                        }

                        // Get placement corner and check bounds
                        PositionDTO pos = space.getCorner();

                        // Check constraints
                        if (!ValidationHelper.checkConstraints(itemInstance, container, pos, orientation, placements)) {
                            continue;
                        }

                        // Create placement
                        Placement placement = new Placement(itemInstance, i, container.getId(), pos, orientation);

                        // Check collision with existing placements
                        if (!CollisionDetector.checkCollision(placement, placements, itemsMap)) {
                            placements.add(placement.toDTO());
                            placed = true;

                            log.debug(
                                "Placed item {} at ({}, {}, {}) with orientation {}",
                                item.getId(),
                                pos.getX(),
                                pos.getY(),
                                pos.getZ(),
                                orientation
                            );

                            // Remove the used space from the list
                            spaces.remove(space);

                            // Update space - create sub-spaces from the used space
                            List<Space> newSpaces = subtractSpace(space, itemInstance, placement);
                            log.debug("Created {} new spaces after placement", newSpaces.size());

                            // Add new spaces and remove dominated spaces
                            spaces.addAll(newSpaces);
                            int spaceCountBefore = spaces.size();
                            removeDominatedSpaces(spaces);
                            log.debug(
                                "Removed {} dominated spaces ({} -> {})",
                                spaceCountBefore - spaces.size(),
                                spaceCountBefore,
                                spaces.size()
                            );

                            break;
                        }
                    }
                    if (placed) break;
                }

                if (!placed) {
                    log.debug("  Failed to place instance {} of item {}", i, item.getId());
                }
            }
        }

        return placements;
    }

    /**
     * Subtract space after placing item
     * Uses rotated dimensions based on the placement's orientation
     * @return List of new spaces (up to 3 sub-spaces)
     */
    private static List<Space> subtractSpace(Space space, ItemVM itemInstance, Placement placement) {
        List<Space> subSpaces = new ArrayList<>();

        // Get rotated dimensions based on placement orientation
        double[] rotated = OrientationHandler.getRotatedDimensions(itemInstance.getSize(), placement.getOrientation());
        double itemL = rotated[0];
        double itemW = rotated[1];
        double itemH = rotated[2];

        double x = placement.getPosition().getX();
        double y = placement.getPosition().getY();
        double z = placement.getPosition().getZ();
        String containerId = space.getContainerId();

        log.debug(
            "subtractSpace: original space=({}, {}, {}, {}, {}, {}), item=({}, {}, {}) at ({}, {}, {})",
            space.getX(),
            space.getY(),
            space.getZ(),
            space.getL(),
            space.getW(),
            space.getH(),
            itemL,
            itemW,
            itemH,
            x,
            y,
            z
        );

        // EMS algorithm: create 3 sub-spaces along each axis
        // Based on the original space dimensions, not the item dimensions

        // Space 1: To the right of the item (along X axis)
        // Extends from (x+itemL, y, z) with full remaining width and height
        double space1L = (space.getX() + space.getL()) - (x + itemL);
        if (space1L > 0.001) { // Use small epsilon for floating point comparison
            Space s1 = new Space(
                containerId,
                x + itemL,
                y,
                z,
                space1L,
                space.getW() - (y - space.getY()),
                space.getH() - (z - space.getZ()),
                null
            );
            subSpaces.add(s1);
            log.debug("  Created space1: ({}, {}, {}, {}, {}, {})", s1.getX(), s1.getY(), s1.getZ(), s1.getL(), s1.getW(), s1.getH());
        }

        // Space 2: In front of the item (along Y axis)
        // Extends from (x, y+itemW, z) with item length and full height
        double space2W = (space.getY() + space.getW()) - (y + itemW);
        if (space2W > 0.001) {
            Space s2 = new Space(containerId, x, y + itemW, z, itemL, space2W, space.getH() - (z - space.getZ()), null);
            subSpaces.add(s2);
            log.debug("  Created space2: ({}, {}, {}, {}, {}, {})", s2.getX(), s2.getY(), s2.getZ(), s2.getL(), s2.getW(), s2.getH());
        }

        // Space 3: Above the item (along Z axis)
        // Extends from (x, y, z+itemH) with item length and width
        double space3H = (space.getZ() + space.getH()) - (z + itemH);
        if (space3H > 0.001) {
            Space s3 = new Space(containerId, x, y, z + itemH, itemL, itemW, space3H, null);
            subSpaces.add(s3);
            log.debug("  Created space3: ({}, {}, {}, {}, {}, {})", s3.getX(), s3.getY(), s3.getZ(), s3.getL(), s3.getW(), s3.getH());
        }

        return subSpaces;
    }

    /**
     * Remove dominated spaces
     */
    private static void removeDominatedSpaces(List<Space> spaces) {
        if (spaces.size() <= 1) {
            return;
        }

        // Sort by volume (smallest first)
        Collections.sort(spaces);

        // Remove spaces that are dominated by any smaller space
        List<Space> pruned = new ArrayList<>();
        for (Space s1 : spaces) {
            boolean dominated = false;
            for (Space s2 : spaces) {
                if (s1 != s2 && s1.isDominatedBy(s2)) {
                    dominated = true;
                    break;
                }
            }
            if (!dominated) {
                pruned.add(s1);
            }
        }

        spaces.clear();
        spaces.addAll(pruned);
    }

    /**
     * Solve the packing optimization problem using EMS algorithm
     * for a single container (backward compatible method without timeout).
     *
     * @param container The container to pack items into
     * @param items List of items to place (should be sorted by volume descending)
     * @param seed Random seed for reproducibility
     * @return List of placements
     */
    public List<PlacementDTO> solve(ContainerVM container, List<ItemVM> items, long seed) {
        return solve(container, items, seed, 0);
    }
}
