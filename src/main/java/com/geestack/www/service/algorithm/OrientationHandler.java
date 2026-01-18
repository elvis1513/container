package com.geestack.www.service.algorithm;

import com.geestack.www.service.dto.PositionDTO;
import com.geestack.www.web.rest.vm.ContainerVM;
import com.geestack.www.web.rest.vm.ItemVM;
import com.geestack.www.web.rest.vm.SizeVM;
import java.util.List;

/**
 * Utility class for handling item rotations.
 */
public class OrientationHandler {

    /**
     * Get all allowed orientations for an item
     */
    public static List<String> getAllowedOrientations(ItemVM item) {
        // If constraints specify rotations, use those
        if (item.getConstraints() != null && item.getConstraints().getRotations() != null) {
            return item.getConstraints().getRotations();
        }

        // Default rotations (6 axis-aligned orientations)
        return List.of("LWH", "WLH", "LHW", "WHL", "HLW", "HWL");
    }

    /**
     * Rotate dimensions according to orientation
     */
    public static double[] getRotatedDimensions(SizeVM size, String orientation) {
        switch (orientation) {
            case "LWH":
                return new double[] { size.getL(), size.getW(), size.getH() }; // No rotation
            case "WLH":
                return new double[] { size.getW(), size.getL(), size.getH() }; // 90° Z-axis rotation
            case "LHW":
                return new double[] { size.getL(), size.getH(), size.getW() }; // 90° Y-axis rotation
            case "WHL":
                return new double[] { size.getW(), size.getH(), size.getL() }; // 90° X-axis rotation
            case "HLW":
                return new double[] { size.getH(), size.getL(), size.getW() }; // 90° Z + 90° X rotation
            case "HWL":
                return new double[] { size.getH(), size.getW(), size.getL() }; // 90° Z + 180° X rotation
            default:
                throw new IllegalArgumentException("Invalid orientation: " + orientation);
        }
    }

    /**
     * Check if rotation is valid
     */
    public static boolean isValidOrientation(String orientation) {
        return List.of("LWH", "WLH", "LHW", "WHL", "HLW", "HWL").contains(orientation);
    }

    /**
     * Check if item can fit in container with specified orientation
     */
    public static boolean canFitWithRotation(SizeVM size, String orientation, double x, double y, double z, ContainerVM container) {
        double[] rotated = getRotatedDimensions(size, orientation);

        return (
            x >= 0 &&
            y >= 0 &&
            z >= 0 &&
            x + rotated[0] <= container.getInnerSize().getL() &&
            y + rotated[1] <= container.getInnerSize().getW() &&
            z + rotated[2] <= container.getInnerSize().getH()
        );
    }

    /**
     * Get rotated dimensions for item with primitive double values
     */
    public static double[] getRotatedDimensions(double l, double w, double h, String orientation) {
        switch (orientation) {
            case "LWH":
                return new double[] { l, w, h };
            case "WLH":
                return new double[] { w, l, h };
            case "LHW":
                return new double[] { l, h, w };
            case "WHL":
                return new double[] { w, h, l };
            case "HLW":
                return new double[] { h, l, w };
            case "HWL":
                return new double[] { h, w, l };
            default:
                throw new IllegalArgumentException("Invalid orientation: " + orientation);
        }
    }

    /**
     * Apply rotation to position
     */
    public static PositionDTO applyRotation(PositionDTO pos, SizeVM size, String orientation) {
        double[] rotated = getRotatedDimensions(size, orientation);

        // Note: PositionDTO is immutable, so we return a new instance
        return new PositionDTO(pos.getX(), pos.getY(), pos.getZ());
    }
}
