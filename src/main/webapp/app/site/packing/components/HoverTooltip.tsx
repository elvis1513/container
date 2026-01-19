/**
 * HoverTooltip Component
 * Floating tooltip for 3D object hover feedback
 *
 * Features:
 * - Follows mouse position with offset
 * - Shows item name and dimensions
 * - Uses CSS transform for smooth positioning
 * - Prevents overflow from viewport
 */

import React, { useRef, useEffect, useState } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export interface HoverTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  itemName: string;
  dimensions: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * HoverTooltip Component
 * Displays tooltip next to hovered item in 3D view
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({ visible, x, y, itemName, dimensions, containerRef }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!visible || !tooltipRef.current || !containerRef.current) return;

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Calculate position with offset
    let left = x + 16;
    let top = y + 16;

    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 150;
    const tooltipHeight = tooltipRect.height || 60;

    // Prevent horizontal overflow
    if (left + tooltipWidth > containerRect.width) {
      left = x - tooltipWidth - 16;
    }

    // Prevent vertical overflow
    if (top + tooltipHeight > containerRect.height) {
      top = y - tooltipHeight - 16;
    }

    // Clamp to container bounds
    left = Math.max(SPACING.sm, Math.min(left, containerRect.width - tooltipWidth - SPACING.sm));
    top = Math.max(SPACING.sm, Math.min(top, containerRect.height - tooltipHeight - SPACING.sm));

    setPosition({ left, top });
  }, [visible, x, y, containerRef]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        ...styles.tooltip,
        left: position.left,
        top: position.top,
      }}
    >
      <div style={styles.itemName}>{itemName}</div>
      <div style={styles.dimensions}>{dimensions}</div>
      {/* Arrow */}
      <div style={styles.arrow} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tooltip: {
    position: 'absolute',
    pointerEvents: 'none',
    backgroundColor: COLORS.bg.surface,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
    minWidth: 120,
    maxWidth: 200,
  },
  itemName: {
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.default,
    marginBottom: SPACING.xs,
  },
  dimensions: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  arrow: {
    position: 'absolute',
    left: -6,
    top: 12,
    width: 0,
    height: 0,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    borderRight: `6px solid ${COLORS.bg.surface}`,
  },
};

export default HoverTooltip;
