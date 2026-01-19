/**
 * RightCanvas Component
 * 3D viewer for packing solutions
 * PR#4A: Integrated ThreeViewer component
 */

import React from 'react';
import { Translate } from 'app/platform/i18n';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../../theme/tokens';
import type { PackingSolution } from '../types';
import type { Item } from '../types';
import { ThreeViewer } from './ThreeViewer';

interface RightCanvasProps {
  solveState: {
    status: 'IDLE' | 'SOLVING' | 'SUCCESS' | 'ERROR';
    solution: PackingSolution | null;
  };
  containers: Array<{ innerSize: { l: number; w: number; h: number } }> | null;
  items: Item[] | null;
  selectedItemId?: string;
  onSelectionChange?: (itemId: string) => void;
}

export const RightCanvas: React.FC<RightCanvasProps> = ({ solveState, containers, items, selectedItemId = '', onSelectionChange }) => {
  const hasSolution = solveState.status === 'SUCCESS' && solveState.solution;
  const container = containers && containers.length > 0 ? containers[0] : null;

  return (
    <div style={styles.canvas}>
      {/* Canvas Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          <Translate contentKey="site.packing.viewer.title">3D View</Translate>
        </h2>
      </div>

      {/* Canvas Area - Fixed dimensions to prevent CLS */}
      <div style={styles.viewport}>
        {solveState.status === 'SOLVING' && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} aria-label="Loading" />
            <p style={styles.loadingText}>
              <Translate contentKey="site.packing.viewer.loading">Loading 3D viewer...</Translate>
            </p>
          </div>
        )}

        {hasSolution && (
          <ThreeViewer
            solution={solveState.solution}
            container={container}
            items={items || []}
            selectedItemId={selectedItemId}
            onSelectionChange={onSelectionChange || (() => {})}
          />
        )}

        {!hasSolution && solveState.status !== 'SOLVING' && (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>📦</div>
            <p style={styles.placeholderText}>
              <Translate contentKey="site.packing.viewer.placeholder">3D viewer</Translate>
            </p>
            <p style={styles.placeholderHint}>
              <Translate contentKey="site.packing.solve.status.idle">Add items and click Solve to see 3D visualization</Translate>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  canvas: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: COLORS.bg.muted,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    backgroundColor: COLORS.bg.surface,
    borderBottom: `1px solid ${COLORS.border.default}`,
    flexShrink: 0,
  },
  title: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSize.h3,
    color: COLORS.text.default,
    margin: 0,
  },
  viewport: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LAYOUT.minHeight.canvas, // Fixed min-height prevents CLS
    position: 'relative' as const,
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.md,
  },
  spinner: {
    width: 48,
    height: 48,
    border: `4px solid ${COLORS.border.default}`,
    borderTopColor: COLORS.brand.primary,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.muted,
    margin: 0,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.md,
    textAlign: 'center' as const,
    padding: SPACING.xl,
  },
  solutionPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.sm,
    textAlign: 'center' as const,
    padding: SPACING.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    lineHeight: 1,
  },
  placeholderText: {
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontSize: TYPOGRAPHY.fontSize.h2,
    color: COLORS.text.default,
    margin: 0,
  },
  placeholderHint: {
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.muted,
    margin: 0,
    maxWidth: 400,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    padding: `${SPACING.sm}px ${SPACING.lg}px`,
    backgroundColor: COLORS.bg.surface,
    borderTop: `1px solid ${COLORS.border.default}`,
    flexShrink: 0,
  },
  controlsPlaceholder: {
    display: 'flex',
    gap: SPACING.md,
    alignItems: 'center',
  },
  controlHint: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
};

// Add keyframe animation for spinner
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-spin-animation]')) {
  styleElement.setAttribute('data-spin-animation', 'true');
  document.head.appendChild(styleElement);
}

export default RightCanvas;
