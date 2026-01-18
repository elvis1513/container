package com.geestack.www.service;

import com.geestack.www.service.algorithm.EMSAlgorithm;
import com.geestack.www.service.dto.*;
import com.geestack.www.web.rest.errors.PackingValidationException;
import com.geestack.www.web.rest.vm.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for handling packing optimization requests.
 */
@Service
public class PackingService {

    private static final Logger LOG = LoggerFactory.getLogger(PackingService.class);

    private static final Random RANDOM = new Random();

    /**
     * Solve the packing optimization problem.
     *
     * @param request the solve request
     * @return the packing solution
     */
    public PackingSolutionDTO solve(SolveVM request) {
        // Validate request
        validateRequest(request);

        // Get options
        Integer seed = request.getOptions() != null ? request.getOptions().getSeed() : null;
        Integer maxDuration = request.getOptions() != null ? request.getOptions().getMaxDurationMs() : null;

        // Use provided seed or generate one
        int actualSeed = seed != null ? seed : RANDOM.nextInt(100000);
        if (seed != null) {
            RANDOM.setSeed(seed);
        }

        // Solve with timeout check
        long startTime = System.currentTimeMillis();
        PackingSolutionDTO solution = doSolve(request, actualSeed);
        long duration = System.currentTimeMillis() - startTime;

        // Check for timeout
        boolean timedOut = maxDuration != null && duration >= maxDuration;
        if (timedOut && solution.getStatus().equals("OK")) {
            solution.setStatus("TIMEOUT_BEST_EFFORT");
            solution.getWarnings().add("Timeout: returning best effort solution");
        }

        // Update metadata
        solution.getMeta().setDurationMs(duration);
        solution.getMeta().setTimeout(timedOut);

        LOG.info("Packing solve completed in {}ms with status {}", duration, solution.getStatus());
        return solution;
    }

    /**
     * Validate the solve request.
     */
    private void validateRequest(SolveVM request) {
        PackingValidationException.Builder builder = PackingValidationException.builder();

        // Validate containers
        validateContainers(request.getContainers(), builder);

        // Validate items
        validateItems(request.getItems(), request.getContainers(), builder);

        // Validate options
        validateOptions(request.getOptions(), builder);

        // Throw if any validation errors
        if (!builder.build().getFieldErrors().isEmpty()) {
            throw builder.build();
        }
    }

    /**
     * Validate containers.
     */
    private void validateContainers(List<ContainerVM> containers, PackingValidationException.Builder builder) {
        for (int i = 0; i < containers.size(); i++) {
            ContainerVM c = containers.get(i);
            String prefix = "containers[" + i + "]";

            // Check ID uniqueness
            for (int j = i + 1; j < containers.size(); j++) {
                if (c.getId().equals(containers.get(j).getId())) {
                    builder.addError(prefix + ".id", "Duplicate container ID: " + c.getId());
                }
            }

            // Validate inner size
            if (c.getInnerSize() != null) {
                if (c.getInnerSize().getL() == null || c.getInnerSize().getL() <= 0 || c.getInnerSize().getL() > 60000) {
                    builder.addError(prefix + ".innerSize.l", "Length must be 1-60000mm");
                }
                if (c.getInnerSize().getW() == null || c.getInnerSize().getW() <= 0 || c.getInnerSize().getW() > 60000) {
                    builder.addError(prefix + ".innerSize.w", "Width must be 1-60000mm");
                }
                if (c.getInnerSize().getH() == null || c.getInnerSize().getH() <= 0 || c.getInnerSize().getH() > 60000) {
                    builder.addError(prefix + ".innerSize.h", "Height must be 1-60000mm");
                }
            }

            // Validate max weight
            if (c.getMaxWeight() == null || c.getMaxWeight() < 0.1 || c.getMaxWeight() > 500000) {
                builder.addError(prefix + ".maxWeight", "Max weight must be 0.1-500000kg");
            }
        }
    }

    /**
     * Validate items.
     */
    private void validateItems(List<ItemVM> items, List<ContainerVM> containers, PackingValidationException.Builder builder) {
        // Get max container dimensions
        double maxContainerL = containers
            .stream()
            .filter(c -> c.getInnerSize() != null)
            .mapToDouble(c -> c.getInnerSize().getL())
            .max()
            .orElse(0.0);

        for (int i = 0; i < items.size(); i++) {
            ItemVM item = items.get(i);
            String prefix = "items[" + i + "]";

            // Check ID uniqueness
            for (int j = i + 1; j < items.size(); j++) {
                if (item.getId().equals(items.get(j).getId())) {
                    builder.addError(prefix + ".id", "Duplicate item ID: " + item.getId());
                }
            }

            // Validate size
            if (item.getSize() != null) {
                if (item.getSize().getL() == null || item.getSize().getL() <= 0 || item.getSize().getL() > 60000) {
                    builder.addError(prefix + ".size.l", "Length must be 1-60000mm");
                } else if (item.getSize().getL() > maxContainerL) {
                    builder.addError(
                        prefix + ".size.l",
                        "Item length " + item.getSize().getL() + "mm exceeds container max " + maxContainerL + "mm"
                    );
                }
                if (item.getSize().getW() == null || item.getSize().getW() <= 0 || item.getSize().getW() > 60000) {
                    builder.addError(prefix + ".size.w", "Width must be 1-60000mm");
                }
                if (item.getSize().getH() == null || item.getSize().getH() <= 0 || item.getSize().getH() > 60000) {
                    builder.addError(prefix + ".size.h", "Height must be 1-60000mm");
                }
            }

            // Validate weight
            if (item.getWeight() == null || item.getWeight() < 0.01 || item.getWeight() > 100000) {
                builder.addError(prefix + ".weight", "Weight must be 0.01-100000kg");
            }

            // Validate quantity
            if (item.getQuantity() == null || item.getQuantity() < 1 || item.getQuantity() > 10000) {
                builder.addError(prefix + ".quantity", "Quantity must be 1-10000");
            }

            // Validate rotations if constraints present
            if (item.getConstraints() != null && item.getConstraints().getRotations() != null) {
                if (item.getConstraints().getRotations().isEmpty()) {
                    builder.addError(prefix + ".constraints.rotations", "At least one rotation must be allowed");
                }
            }
        }
    }

    /**
     * Validate options.
     */
    private void validateOptions(OptionsVM options, PackingValidationException.Builder builder) {
        if (options == null) {
            return;
        }

        // Validate objective
        if (options.getObjective() != null) {
            String obj = options.getObjective();
            if (!obj.equals("MAX_VOLUME_UTILIZATION") && !obj.equals("MAX_ITEM_COUNT")) {
                builder.addError("options.objective", "Must be MAX_VOLUME_UTILIZATION or MAX_ITEM_COUNT");
            }
        }
        // Validate seed (negative check handled by @Min annotation)
        // Additional validation if needed

        // Validate maxDurationMs (range handled by @Min/@Max annotations)
        // Additional validation if needed
    }

    /**
     * Perform the actual packing solve using EMS algorithm.
     * Supports multiple containers.
     */
    private PackingSolutionDTO doSolve(SolveVM request, int seed) {
        PackingSolutionDTO solution = new PackingSolutionDTO();
        List<String> warnings = new ArrayList<>();

        // Calculate total container volume
        long totalContainerVolume = request
            .getContainers()
            .stream()
            .mapToLong(c -> (long) (c.getInnerSize().getL() * c.getInnerSize().getW() * c.getInnerSize().getH()))
            .sum();

        // Sort items by volume descending for better packing efficiency
        List<ItemVM> sortedItems = request
            .getItems()
            .stream()
            .sorted((a, b) ->
                Double.compare(
                    b.getSize().getL() * b.getSize().getW() * b.getSize().getH(),
                    a.getSize().getL() * a.getSize().getW() * a.getSize().getH()
                )
            )
            .collect(Collectors.toList());

        // Sort items by priority first, then by volume descending for better packing efficiency
        // Higher priority value = higher priority (should be packed first)
        sortedItems.sort((a, b) -> {
            int priorityA = a.getConstraints() != null && a.getConstraints().getPriority() != null ? a.getConstraints().getPriority() : 0;
            int priorityB = b.getConstraints() != null && b.getConstraints().getPriority() != null ? b.getConstraints().getPriority() : 0;

            if (priorityA != priorityB) {
                return priorityB - priorityA; // Higher priority first
            }

            // Same priority: sort by volume descending
            double volumeA = a.getSize().getL() * a.getSize().getW() * a.getSize().getH();
            double volumeB = b.getSize().getL() * b.getSize().getW() * b.getSize().getH();
            return Double.compare(volumeB, volumeA);
        });

        // Get timeout from options
        long maxDurationMs = 0; // Default: no timeout
        if (request.getOptions() != null && request.getOptions().getMaxDurationMs() != null) {
            maxDurationMs = request.getOptions().getMaxDurationMs();
        }

        // Run EMS algorithm with multi-container support
        EMSAlgorithm algorithm = new EMSAlgorithm();
        List<PlacementDTO> placements;

        if (request.getContainers().size() == 1) {
            // Single container - use optimized single container method with timeout
            placements = algorithm.solve(request.getContainers().get(0), sortedItems, seed, maxDurationMs);
        } else {
            // Multiple containers - use multi-container method with timeout
            placements = algorithm.solveMultiContainer(request.getContainers(), sortedItems, seed, maxDurationMs);
        }

        // Calculate total weight and used volume
        double totalWeight = 0;
        long usedVolume = 0;

        // Create a map for quick item lookup
        Map<String, ItemVM> itemsMap = request.getItems().stream().collect(Collectors.toMap(ItemVM::getId, item -> item));

        for (PlacementDTO placement : placements) {
            ItemVM item = itemsMap.get(placement.getItemId());
            if (item != null) {
                totalWeight += item.getWeight();
                // Get rotated dimensions for volume calculation
                double[] rotated = com.geestack.www.service.algorithm.OrientationHandler.getRotatedDimensions(
                    item.getSize(),
                    placement.getOrientation()
                );
                usedVolume += (long) (rotated[0] * rotated[1] * rotated[2]);
            }
        }

        // Find unplaced items
        List<UnplacedItemDTO> unplaced = new ArrayList<>();
        Map<String, Integer> placedCount = new HashMap<>();
        for (PlacementDTO placement : placements) {
            placedCount.merge(placement.getItemId(), 1, Integer::sum);
        }

        // Check each container's weight limit
        Map<String, Double> containerWeights = new HashMap<>();
        for (PlacementDTO placement : placements) {
            String containerId = placement.getContainerId();
            ItemVM item = itemsMap.get(placement.getItemId());
            if (item != null) {
                containerWeights.merge(containerId, item.getWeight(), Double::sum);
            }
        }

        for (ItemVM item : request.getItems()) {
            int placed = placedCount.getOrDefault(item.getId(), 0);
            for (int i = placed; i < item.getQuantity(); i++) {
                // Check if any container has remaining capacity
                boolean canFitAnyContainer = request
                    .getContainers()
                    .stream()
                    .anyMatch(c -> {
                        double currentWeight = containerWeights.getOrDefault(c.getId(), 0.0);
                        return currentWeight + item.getWeight() <= c.getMaxWeight();
                    });

                String reason = canFitAnyContainer ? "OVERWEIGHT_OR_NO_SPACE" : "OVERWEIGHT_OR_NO_SPACE";
                unplaced.add(new UnplacedItemDTO(item.getId(), reason));
            }
        }

        // Calculate score
        SolutionScoreDTO score = new SolutionScoreDTO();
        score.setVolumeUtilization(totalContainerVolume > 0 ? (double) usedVolume / totalContainerVolume : 0);
        score.setRemainingVolume(totalContainerVolume - usedVolume);
        score.setTotalWeight(totalWeight);
        score.setPlacedItemCount(placements.size());
        score.setTotalItemCount(request.getItems().stream().mapToInt(ItemVM::getQuantity).sum());
        score.setContainerCount(request.getContainers().size());

        // Set metadata
        SolutionMetaDTO meta = new SolutionMetaDTO();
        meta.setAlgorithm("ems-v1");
        meta.setSeed(seed);
        meta.setTimestamp(Instant.now());

        // Build solution
        solution.setStatus("OK");
        solution.setScore(score);
        solution.setPlacements(placements);
        if (!unplaced.isEmpty()) {
            solution.setUnplaced(unplaced);
            warnings.add(unplaced.size() + " items could not be placed");
        }
        solution.setWarnings(warnings);
        solution.setMeta(meta);

        return solution;
    }
}
