/**
 * ViewerToolbar Component
 * Toolbar controls for the 3D viewer
 *
 * Features:
 * - Screenshot export
 * - Camera reset (legacy)
 * - Fit to Container (PR#4B)
 * - Fit to Selected (PR#4B)
 */

import React, { useRef } from 'react';
import { Translate } from 'app/platform/i18n';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme/tokens';

/**
 * Props interface for ViewerToolbar
 */
export interface ViewerToolbarProps {
  onExportScreenshot?: () => void;
  onResetView?: () => void;
  onFitToContainer?: () => void;
  onFitToSelected?: () => void;
  hasSelection?: boolean;
  disabled?: boolean;
}

/**
 * ViewerToolbar Component
 * Provides toolbar controls for the 3D viewer
 */
export const ViewerToolbar: React.FC<ViewerToolbarProps> = props => {
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  /**
   * Handle screenshot export
   */
  const handleExportScreenshot = () => {
    if (props.onExportScreenshot) {
      props.onExportScreenshot();
    }
  };

  /**
   * Handle reset view
   */
  const handleResetView = () => {
    if (props.onResetView) {
      props.onResetView();
    }
  };

  /**
   * Handle fit to container
   */
  const handleFitToContainer = () => {
    if (props.onFitToContainer) {
      props.onFitToContainer();
    }
  };

  /**
   * Handle fit to selected
   */
  const handleFitToSelected = () => {
    if (props.onFitToSelected) {
      props.onFitToSelected();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        display: 'flex',
        gap: SPACING.sm,
        zIndex: 10,
      }}
    >
      {/* Fit to Container Button */}
      <button
        type="button"
        onClick={handleFitToContainer}
        disabled={props.disabled}
        style={{
          ...buttonStyle,
          opacity: props.disabled ? 0.5 : 1,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
        title="Fit camera to container bounds"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
        <Translate contentKey="site.packing.viewer.fitToContainer">Fit Container</Translate>
      </button>

      {/* Fit to Selected Button */}
      <button
        type="button"
        onClick={handleFitToSelected}
        disabled={props.disabled || !props.hasSelection}
        style={{
          ...buttonStyle,
          opacity: props.disabled || !props.hasSelection ? 0.5 : 1,
          cursor: props.disabled || !props.hasSelection ? 'not-allowed' : 'pointer',
        }}
        title="Fit camera to selected item"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 9v6M9 12h6" />
        </svg>
        <Translate contentKey="site.packing.viewer.fitToSelected">Fit Selected</Translate>
      </button>

      {/* Reset View Button (Legacy) */}
      <button
        type="button"
        onClick={handleResetView}
        disabled={props.disabled}
        style={{
          ...buttonStyle,
          opacity: props.disabled ? 0.5 : 1,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
        title="Reset camera to default view"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <Translate contentKey="site.packing.viewer.resetView">Reset</Translate>
      </button>

      {/* Export Screenshot Button */}
      <button
        type="button"
        onClick={handleExportScreenshot}
        disabled={props.disabled}
        style={{
          ...buttonStyle,
          opacity: props.disabled ? 0.5 : 1,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
        title="Export screenshot as PNG"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <Translate contentKey="site.packing.viewer.exportScreenshot">Screenshot</Translate>
      </button>

      {/* Hidden link for download */}
      <a ref={linkRef} style={{ display: 'none' }} />
    </div>
  );
};

/**
 * Shared button style
 */
const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: SPACING.xs,
  padding: `${SPACING.sm}px ${SPACING.md}px`,
  backgroundColor: COLORS.bg.surface,
  border: `1px solid ${COLORS.border.default}`,
  borderRadius: RADIUS.md,
  color: COLORS.text.default,
  fontSize: TYPOGRAPHY.fontSize.small,
  fontWeight: TYPOGRAPHY.fontWeights.medium,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const iconStyle: React.CSSProperties = {
  flexShrink: 0,
};

export default ViewerToolbar;
