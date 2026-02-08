/**
 * SelectionInspector Component
 * Manual editing controls for selected item placement
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Translate } from 'app/platform/i18n';
import type { Item, Placement, ValidateResponse } from '../types';
import type { Orientation } from '../types';
import { ALL_ORIENTATIONS, rotateOrientation } from '../utils/orientation';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW, TRANSITION } from '../../theme/tokens';

type Axis = 'x' | 'y' | 'z';

interface SelectionInspectorProps {
  selectedItemId: string;
  placements: Placement[];
  items: Item[];
  validationResult: ValidateResponse | null;
  isValidating: boolean;
  onApplyPosition: (itemId: string, position: { x: number; y: number; z: number }) => void;
  onApplyOrientation: (itemId: string, orientation: Orientation) => void;
  onResetSelected: (itemId: string) => void;
  onResetAll: () => void;
  onNotify: (type: 'success' | 'error', contentKey: string, values?: Record<string, string | number>) => void;
}

const formatNumber = (value: number): string => {
  if (Number.isNaN(value)) return '';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

export const SelectionInspector: React.FC<SelectionInspectorProps> = props => {
  const selectedPlacement = useMemo(
    () => props.placements.find(p => p.itemId === props.selectedItemId) || null,
    [props.placements, props.selectedItemId],
  );
  const selectedItem = useMemo(() => props.items.find(i => i.id === props.selectedItemId) || null, [props.items, props.selectedItemId]);

  const [stepSize, setStepSize] = useState<number>(10);
  const [positionInputs, setPositionInputs] = useState<{ x: string; y: string; z: string }>({ x: '', y: '', z: '' });

  const allowedRotations = useMemo(() => {
    if (!selectedItem?.constraints?.rotations || selectedItem.constraints.rotations.length === 0) {
      return ALL_ORIENTATIONS;
    }
    return selectedItem.constraints.rotations as Orientation[];
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedPlacement) {
      setPositionInputs({ x: '', y: '', z: '' });
      return;
    }
    setPositionInputs({
      x: formatNumber(selectedPlacement.position.x),
      y: formatNumber(selectedPlacement.position.y),
      z: formatNumber(selectedPlacement.position.z),
    });
  }, [selectedPlacement?.position.x, selectedPlacement?.position.y, selectedPlacement?.position.z, props.selectedItemId]);

  const applyPosition = useCallback(
    (nextPosition: { x: number; y: number; z: number }) => {
      if (!selectedItem || !selectedPlacement) return;
      props.onApplyPosition(selectedItem.id, nextPosition);
      props.onNotify('success', 'site.packing.manual.toast.positionApplied');
    },
    [props, selectedItem, selectedPlacement],
  );

  const handleAxisDelta = useCallback(
    (axis: Axis, delta: number) => {
      if (!selectedPlacement) return;
      const currentValue = Number(positionInputs[axis] || selectedPlacement.position[axis]);
      const nextValue = Number.isFinite(currentValue) ? currentValue + delta : selectedPlacement.position[axis] + delta;
      const nextPosition = { ...selectedPlacement.position, [axis]: nextValue };
      setPositionInputs(prev => ({ ...prev, [axis]: formatNumber(nextValue) }));
      applyPosition(nextPosition);
    },
    [applyPosition, positionInputs, selectedPlacement],
  );

  const commitAxisValue = useCallback(
    (axis: Axis, rawValue: string) => {
      if (!selectedPlacement) return;
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        setPositionInputs(prev => ({ ...prev, [axis]: formatNumber(selectedPlacement.position[axis]) }));
        props.onNotify('error', 'site.packing.manual.toast.invalidNumber');
        return;
      }

      const nextPosition = { ...selectedPlacement.position, [axis]: parsed };
      setPositionInputs(prev => ({ ...prev, [axis]: formatNumber(parsed) }));
      applyPosition(nextPosition);
    },
    [applyPosition, props, selectedPlacement],
  );

  const handleRotate = useCallback(
    (axis: Axis, degrees: 90 | 180) => {
      if (!selectedPlacement || !selectedItem) return;
      const steps = degrees / 90;
      const nextOrientation = rotateOrientation(selectedPlacement.orientation, axis, steps);

      if (!allowedRotations.includes(nextOrientation)) {
        props.onNotify('error', 'site.packing.manual.toast.rotationNotAllowed');
        return;
      }

      props.onApplyOrientation(selectedItem.id, nextOrientation);
      props.onNotify('success', 'site.packing.manual.toast.rotationApplied');
    },
    [allowedRotations, props, selectedItem, selectedPlacement],
  );

  const handleResetSelected = useCallback(() => {
    if (!selectedItem) return;
    props.onResetSelected(selectedItem.id);
    props.onNotify('success', 'site.packing.manual.toast.resetSelected');
  }, [props, selectedItem]);

  const handleResetAll = useCallback(() => {
    props.onResetAll();
    props.onNotify('success', 'site.packing.manual.toast.resetAll');
  }, [props]);

  const selectedErrors = useMemo(() => {
    if (!props.validationResult?.errors || !selectedItem) return [];
    return props.validationResult.errors.filter(error => error.itemId === selectedItem.id);
  }, [props.validationResult, selectedItem]);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            <Translate contentKey="site.packing.manual.title">Manual Editing</Translate>
          </h3>
          <p style={styles.subtitle}>
            <Translate contentKey="site.packing.manual.subtitle">Adjust position and rotation for selected item</Translate>
          </p>
        </div>
        <button type="button" style={styles.secondaryButton} onClick={handleResetAll} disabled={!props.placements.length}>
          <Translate contentKey="site.packing.manual.resetAll">Reset All</Translate>
        </button>
      </div>

      {!selectedItem || !selectedPlacement ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            <Translate contentKey="site.packing.manual.empty">Select an item to edit</Translate>
          </p>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemLabel}>
                <Translate contentKey="site.packing.manual.selectedItem">Selected Item</Translate>
              </div>
              <div style={styles.itemName}>{selectedItem.name}</div>
              <div style={styles.itemMeta}>
                <Translate contentKey="site.packing.manual.orientation">Orientation</Translate>: {selectedPlacement.orientation}
              </div>
            </div>
            <button type="button" style={styles.ghostButton} onClick={handleResetSelected}>
              <Translate contentKey="site.packing.manual.resetSelected">Reset Selected</Translate>
            </button>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>
                <Translate contentKey="site.packing.manual.position">Position</Translate>
              </span>
              <div style={styles.stepToggle}>
                <span style={styles.stepLabel}>
                  <Translate contentKey="site.packing.manual.step">Step</Translate>
                </span>
                {[1, 10, 50].map(step => (
                  <button
                    key={step}
                    type="button"
                    style={{
                      ...styles.stepButton,
                      ...(stepSize === step ? styles.stepButtonActive : {}),
                    }}
                    onClick={() => setStepSize(step)}
                  >
                    {step}mm
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.axisGrid}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis} style={styles.axisRow}>
                  <label htmlFor={`position-${axis}`} style={styles.axisLabel}>
                    {axis.toUpperCase()} (mm)
                  </label>
                  <div style={styles.axisControls}>
                    <button
                      type="button"
                      style={styles.iconButton}
                      onClick={() => handleAxisDelta(axis, -stepSize)}
                      aria-label={`Decrease ${axis.toUpperCase()} by ${stepSize}mm`}
                    >
                      −
                    </button>
                    <input
                      id={`position-${axis}`}
                      name={`position-${axis}`}
                      type="number"
                      inputMode="numeric"
                      style={styles.axisInput}
                      value={positionInputs[axis]}
                      onChange={event => setPositionInputs(prev => ({ ...prev, [axis]: event.target.value }))}
                      onBlur={event => commitAxisValue(axis, event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          commitAxisValue(axis, (event.target as HTMLInputElement).value);
                        }
                      }}
                    />
                    <button
                      type="button"
                      style={styles.iconButton}
                      onClick={() => handleAxisDelta(axis, stepSize)}
                      aria-label={`Increase ${axis.toUpperCase()} by ${stepSize}mm`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>
                <Translate contentKey="site.packing.manual.rotation">Rotation</Translate>
              </span>
              <span style={styles.sectionHint}>
                <Translate contentKey="site.packing.manual.rotationHint">90° steps</Translate>
              </span>
            </div>

            <div style={styles.rotationGrid}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis} style={styles.rotationRow}>
                  <span style={styles.rotationAxis}>{axis.toUpperCase()}</span>
                  <button type="button" style={styles.primaryButton} onClick={() => handleRotate(axis, 90)}>
                    <Translate contentKey="site.packing.manual.rotate90">Rotate 90°</Translate>
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={() => handleRotate(axis, 180)}>
                    <Translate contentKey="site.packing.manual.rotate180">Rotate 180°</Translate>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>
                <Translate contentKey="site.packing.manual.validation.title">Validation</Translate>
              </span>
              <span style={styles.sectionHint}>
                {props.isValidating ? (
                  <Translate contentKey="site.packing.manual.validation.validating">Validating...</Translate>
                ) : props.validationResult?.valid ? (
                  <Translate contentKey="site.packing.manual.validation.valid">Valid</Translate>
                ) : (
                  <Translate contentKey="site.packing.manual.validation.invalid">Invalid</Translate>
                )}
              </span>
            </div>

            {selectedErrors.length === 0 && !props.isValidating && props.validationResult?.valid && (
              <div style={styles.validationOk}>
                <Translate contentKey="site.packing.manual.validation.ok">No issues detected</Translate>
              </div>
            )}

            {selectedErrors.length > 0 && (
              <div style={styles.validationList} aria-live="polite">
                {selectedErrors.map((error, index) => (
                  <div key={`${error.type}-${index}`} style={styles.validationItem}>
                    <span style={styles.validationDot} />
                    <Translate contentKey={`site.packing.manual.validation.${error.type.toLowerCase()}`}>{error.message}</Translate>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    borderTop: `1px solid ${COLORS.border.default}`,
    backgroundColor: COLORS.bg.surface,
    padding: SPACING.lg,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.lg,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  title: {
    margin: 0,
    fontSize: TYPOGRAPHY.fontSize.h3,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  subtitle: {
    margin: `${SPACING.xs}px 0 0 0`,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  emptyState: {
    padding: `${SPACING.xl}px 0`,
    textAlign: 'center' as const,
  },
  emptyText: {
    margin: 0,
    color: COLORS.text.muted,
    fontSize: TYPOGRAPHY.fontSize.body,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.lg,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.muted,
  },
  itemLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.h2,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text.default,
  },
  itemMeta: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.md,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  sectionTitle: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSize.body,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  stepToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap' as const,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  stepButton: {
    border: `1px solid ${COLORS.border.default}`,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.text.default,
    borderRadius: RADIUS.full,
    padding: '2px 10px',
    fontSize: TYPOGRAPHY.fontSize.small,
    cursor: 'pointer',
    transition: `all ${TRANSITION.fast}`,
  },
  stepButtonActive: {
    borderColor: COLORS.brand.primary,
    backgroundColor: COLORS.brand.primary,
    color: COLORS.text.inverse,
  },
  axisGrid: {
    display: 'grid',
    gap: SPACING.md,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  axisRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.xs,
  },
  axisLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  axisControls: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  axisInput: {
    flex: 1,
    minWidth: 0,
    padding: `${SPACING.xs}px ${SPACING.sm}px`,
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border.default}`,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.default,
  },
  rotationGrid: {
    display: 'grid',
    gap: SPACING.sm,
  },
  rotationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap' as const,
  },
  rotationAxis: {
    minWidth: 20,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  validationOk: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.state.successBg,
    color: COLORS.state.success,
    fontSize: TYPOGRAPHY.fontSize.small,
  },
  validationList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.xs,
  },
  validationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.state.error,
  },
  validationDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: COLORS.state.error,
  },
  iconButton: {
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.text.default,
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontSize: TYPOGRAPHY.fontSize.body,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    border: 'none',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.brand.primary,
    color: COLORS.text.inverse,
    padding: `${SPACING.xs}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.small,
    cursor: 'pointer',
    boxShadow: SHADOW.sm,
    transition: `all ${TRANSITION.fast}`,
  },
  secondaryButton: {
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.text.default,
    padding: `${SPACING.xs}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.small,
    cursor: 'pointer',
    transition: `all ${TRANSITION.fast}`,
  },
  ghostButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: COLORS.text.muted,
    fontSize: TYPOGRAPHY.fontSize.small,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default SelectionInspector;
