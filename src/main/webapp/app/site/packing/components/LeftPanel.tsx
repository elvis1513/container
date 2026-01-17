/**
 * LeftPanel Component
 * Container form, items list, solve button, result summary, export buttons
 * PR#1: Forms with proper labels, no placeholder-only inputs
 */

import React, { useState, useCallback } from 'react';
import { Translate } from 'app/platform/i18n';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW, TRANSITION, Z_INDEX } from '../../theme/tokens';
import { STANDARD_CONTAINERS } from '../api';
import type { Container, Item, ItemFormData, ContainerFormData, SolveState } from '../types';

interface LeftPanelProps {
  containers: Container[];
  items: Item[];
  solveState: SolveState;
  onContainerChange: (container: Container) => void;
  onItemsChange: (items: Item[]) => void;
  onSolve: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  containers,
  items,
  solveState,
  onContainerChange,
  onItemsChange,
  onSolve,
  onExportJson,
  onExportCsv,
}) => {
  // Container form state
  const [selectedContainerId, setSelectedContainerId] = useState<string>(STANDARD_CONTAINERS[0].id);
  const [isCustomContainer, setIsCustomContainer] = useState(false);
  const [customContainer, setCustomContainer] = useState<ContainerFormData>({
    id: `CUSTOM-${Date.now()}`,
    name: '',
    length: '',
    width: '',
    height: '',
    maxWeight: '',
  });

  // Item form state
  const [itemForm, setItemForm] = useState<ItemFormData>({
    id: `ITEM-${Date.now()}`,
    name: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    quantity: '1',
    rotations: ['LWH', 'WLH', 'LHW', 'WHL', 'HLW', 'HWL'],
    stackable: true,
    fragile: false,
    priority: '0',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle container selection
  const handleContainerSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'custom') {
        setIsCustomContainer(true);
      } else {
        setIsCustomContainer(false);
        setSelectedContainerId(value);
        const container = STANDARD_CONTAINERS.find(c => c.id === value);
        if (container) {
          onContainerChange(container);
        }
      }
    },
    [onContainerChange],
  );

  // Handle custom container input
  const updateCustomContainer = useCallback((field: keyof ContainerFormData, value: string) => {
    setCustomContainer(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Apply custom container
  const applyCustomContainer = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate
    if (!customContainer.name) newErrors.name = 'site.packing.validation.required';
    if (!customContainer.length || Number(customContainer.length) <= 0) newErrors.length = 'site.packing.validation.positive';
    if (!customContainer.width || Number(customContainer.width) <= 0) newErrors.width = 'site.packing.validation.positive';
    if (!customContainer.height || Number(customContainer.height) <= 0) newErrors.height = 'site.packing.validation.positive';
    if (!customContainer.maxWeight || Number(customContainer.maxWeight) <= 0) newErrors.maxWeight = 'site.packing.validation.positive';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const container: Container = {
      id: customContainer.id,
      name: customContainer.name,
      innerSize: {
        l: Number(customContainer.length),
        w: Number(customContainer.width),
        h: Number(customContainer.height),
      },
      maxWeight: Number(customContainer.maxWeight),
    };

    onContainerChange(container);
    setErrors({});
  }, [customContainer, onContainerChange]);

  // Handle item form input
  const updateItemForm = useCallback((field: keyof ItemFormData, value: string | boolean | string[]) => {
    setItemForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Add item
  const addItem = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate
    if (!itemForm.name) newErrors.name = 'site.packing.validation.required';
    if (!itemForm.length || Number(itemForm.length) <= 0) newErrors.length = 'site.packing.validation.positive';
    if (!itemForm.width || Number(itemForm.width) <= 0) newErrors.width = 'site.packing.validation.positive';
    if (!itemForm.height || Number(itemForm.height) <= 0) newErrors.height = 'site.packing.validation.positive';
    if (!itemForm.weight || Number(itemForm.weight) <= 0) newErrors.weight = 'site.packing.validation.positive';
    if (!itemForm.quantity || Number(itemForm.quantity) < 1) newErrors.quantity = 'site.packing.validation.invalidQuantity';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const item: Item = {
      id: itemForm.id,
      name: itemForm.name,
      size: {
        l: Number(itemForm.length),
        w: Number(itemForm.width),
        h: Number(itemForm.height),
      },
      weight: Number(itemForm.weight),
      quantity: Number(itemForm.quantity),
      constraints: {
        rotations: itemForm.rotations,
        stackable: itemForm.stackable,
        fragile: itemForm.fragile,
        priority: Number(itemForm.priority),
      },
    };

    onItemsChange([...items, item]);

    // Reset form for next item
    setItemForm({
      id: `ITEM-${Date.now()}`,
      name: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      quantity: '1',
      rotations: ['LWH', 'WLH', 'LHW', 'WHL', 'HLW', 'HWL'],
      stackable: true,
      fragile: false,
      priority: '0',
    });
    setErrors({});
  }, [itemForm, items, onItemsChange]);

  // Remove item
  const removeItem = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index));
    },
    [items, onItemsChange],
  );

  // Clear all items
  const clearItems = useCallback(() => {
    onItemsChange([]);
  }, [onItemsChange]);

  // Toggle rotation
  const toggleRotation = useCallback(
    (rotation: string) => {
      const rotations = itemForm.rotations.includes(rotation)
        ? itemForm.rotations.filter(r => r !== rotation)
        : [...itemForm.rotations, rotation];
      updateItemForm('rotations', rotations);
    },
    [itemForm.rotations, updateItemForm],
  );

  // Format volume for display
  const formatVolume = (mm3: number): string => {
    const m3 = mm3 / 1_000_000_000;
    return m3.toFixed(3);
  };

  const container = containers[0];
  const hasSolution = solveState.status === 'SUCCESS' && solveState.solution;
  const isSolving = solveState.status === 'SOLVING';

  return (
    <div style={styles.panel}>
      {/* Section: Container */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Translate contentKey="site.packing.container.title">Container</Translate>
        </h2>

        <div style={styles.formGroup}>
          <label htmlFor="container-select" style={styles.label}>
            <Translate contentKey="site.packing.container.select">Select Container</Translate>
          </label>
          <select
            id="container-select"
            style={errors.name ? styles.selectError : styles.select}
            value={isCustomContainer ? 'custom' : selectedContainerId}
            onChange={handleContainerSelect}
            disabled={isSolving}
          >
            {STANDARD_CONTAINERS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.innerSize.l}×{c.innerSize.w}×{c.innerSize.h}mm, {c.maxWeight}kg)
              </option>
            ))}
            <option value="custom">
              <Translate contentKey="site.packing.container.custom">Custom Container</Translate>
            </option>
          </select>
        </div>

        {isCustomContainer && (
          <div style={styles.customContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="container-name" style={styles.label}>
                <Translate contentKey="site.packing.container.name">Name</Translate> *
              </label>
              <input
                id="container-name"
                type="text"
                style={errors.name ? styles.inputError : styles.input}
                value={customContainer.name}
                onChange={e => updateCustomContainer('name', e.target.value)}
                placeholder="Name"
                disabled={isSolving}
              />
              {errors.name && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.name} />
                </span>
              )}
            </div>

            <div style={styles.row}>
              <div style={styles.col}>
                <label htmlFor="container-l" style={styles.label}>
                  L (mm) *
                </label>
                <input
                  id="container-l"
                  type="number"
                  inputMode="numeric"
                  style={errors.length ? styles.inputError : styles.input}
                  value={customContainer.length}
                  onChange={e => updateCustomContainer('length', e.target.value)}
                  disabled={isSolving}
                />
                {errors.length && (
                  <span style={styles.errorText}>
                    <Translate contentKey={errors.length} />
                  </span>
                )}
              </div>
              <div style={styles.col}>
                <label htmlFor="container-w" style={styles.label}>
                  W (mm) *
                </label>
                <input
                  id="container-w"
                  type="number"
                  inputMode="numeric"
                  style={errors.width ? styles.inputError : styles.input}
                  value={customContainer.width}
                  onChange={e => updateCustomContainer('width', e.target.value)}
                  disabled={isSolving}
                />
                {errors.width && (
                  <span style={styles.errorText}>
                    <Translate contentKey={errors.width} />
                  </span>
                )}
              </div>
              <div style={styles.col}>
                <label htmlFor="container-h" style={styles.label}>
                  H (mm) *
                </label>
                <input
                  id="container-h"
                  type="number"
                  inputMode="numeric"
                  style={errors.height ? styles.inputError : styles.input}
                  value={customContainer.height}
                  onChange={e => updateCustomContainer('height', e.target.value)}
                  disabled={isSolving}
                />
                {errors.height && (
                  <span style={styles.errorText}>
                    <Translate contentKey={errors.height} />
                  </span>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="container-weight" style={styles.label}>
                <Translate contentKey="site.packing.container.maxWeight">Max Load (kg)</Translate> *
              </label>
              <input
                id="container-weight"
                type="number"
                inputMode="numeric"
                style={errors.maxWeight ? styles.inputError : styles.input}
                value={customContainer.maxWeight}
                onChange={e => updateCustomContainer('maxWeight', e.target.value)}
                disabled={isSolving}
              />
              {errors.maxWeight && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.maxWeight} />
                </span>
              )}
            </div>

            <button type="button" style={styles.secondaryButton} onClick={applyCustomContainer} disabled={isSolving}>
              <Translate contentKey="entity.action.save">Save</Translate>
            </button>
          </div>
        )}

        {container && (
          <div style={styles.containerInfo}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>
                <Translate contentKey="site.packing.container.innerSize">Dimensions</Translate>:
              </span>
              <span style={styles.infoValue}>
                {container.innerSize.l} × {container.innerSize.w} × {container.innerSize.h} mm
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>
                <Translate contentKey="site.packing.container.maxWeight">Max Load</Translate>:
              </span>
              <span style={styles.infoValue}>{container.maxWeight} kg</span>
            </div>
          </div>
        )}
      </section>

      {/* Section: Items */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Translate contentKey="site.packing.items.title">Items</Translate>
        </h2>

        <div style={styles.itemForm}>
          <div style={styles.formGroup}>
            <label htmlFor="item-name" style={styles.label}>
              <Translate contentKey="site.packing.items.name">Item Name</Translate> *
            </label>
            <input
              id="item-name"
              type="text"
              style={errors.name ? styles.inputError : styles.input}
              value={itemForm.name}
              onChange={e => updateItemForm('name', e.target.value)}
              disabled={isSolving}
            />
            {errors.name && (
              <span style={styles.errorText}>
                <Translate contentKey={errors.name} />
              </span>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label htmlFor="item-l" style={styles.label}>
                L (mm) *
              </label>
              <input
                id="item-l"
                type="number"
                inputMode="numeric"
                style={errors.length ? styles.inputError : styles.input}
                value={itemForm.length}
                onChange={e => updateItemForm('length', e.target.value)}
                disabled={isSolving}
              />
              {errors.length && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.length} />
                </span>
              )}
            </div>
            <div style={styles.col}>
              <label htmlFor="item-w" style={styles.label}>
                W (mm) *
              </label>
              <input
                id="item-w"
                type="number"
                inputMode="numeric"
                style={errors.width ? styles.inputError : styles.input}
                value={itemForm.width}
                onChange={e => updateItemForm('width', e.target.value)}
                disabled={isSolving}
              />
              {errors.width && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.width} />
                </span>
              )}
            </div>
            <div style={styles.col}>
              <label htmlFor="item-h" style={styles.label}>
                H (mm) *
              </label>
              <input
                id="item-h"
                type="number"
                inputMode="numeric"
                style={errors.height ? styles.inputError : styles.input}
                value={itemForm.height}
                onChange={e => updateItemForm('height', e.target.value)}
                disabled={isSolving}
              />
              {errors.height && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.height} />
                </span>
              )}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label htmlFor="item-weight" style={styles.label}>
                <Translate contentKey="site.packing.items.weight">Weight</Translate> (kg) *
              </label>
              <input
                id="item-weight"
                type="number"
                inputMode="numeric"
                step="0.1"
                style={errors.weight ? styles.inputError : styles.input}
                value={itemForm.weight}
                onChange={e => updateItemForm('weight', e.target.value)}
                disabled={isSolving}
              />
              {errors.weight && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.weight} />
                </span>
              )}
            </div>
            <div style={styles.col}>
              <label htmlFor="item-quantity" style={styles.label}>
                <Translate contentKey="site.packing.items.quantity">Quantity</Translate> *
              </label>
              <input
                id="item-quantity"
                type="number"
                inputMode="numeric"
                style={errors.quantity ? styles.inputError : styles.input}
                value={itemForm.quantity}
                onChange={e => updateItemForm('quantity', e.target.value)}
                disabled={isSolving}
              />
              {errors.quantity && (
                <span style={styles.errorText}>
                  <Translate contentKey={errors.quantity} />
                </span>
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Translate contentKey="site.packing.items.rotations">Allowed Rotations</Translate>:
            </label>
            <div style={styles.rotations}>
              {(['LWH', 'WLH', 'LHW', 'WHL', 'HLW', 'HWL'] as const).map(rotation => (
                <label key={rotation} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={itemForm.rotations.includes(rotation)}
                    onChange={() => toggleRotation(rotation)}
                    disabled={isSolving}
                  />
                  <Translate contentKey={`site.packing.items.orientation.${rotation}`}>{rotation}</Translate>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={itemForm.stackable}
                onChange={e => updateItemForm('stackable', e.target.checked)}
                disabled={isSolving}
              />
              <Translate contentKey="site.packing.items.stackable">Stackable</Translate>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={itemForm.fragile}
                onChange={e => updateItemForm('fragile', e.target.checked)}
                disabled={isSolving}
              />
              <Translate contentKey="site.packing.items.fragile">Fragile</Translate>
            </label>
          </div>

          <div style={styles.row}>
            <button type="button" style={styles.primaryButton} onClick={addItem} disabled={isSolving}>
              <Translate contentKey="site.packing.items.add">Add Item</Translate>
            </button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div style={styles.itemsList}>
            <div style={styles.itemsHeader}>
              <span style={styles.itemsCount}>{items.length} items</span>
              <button type="button" style={styles.textButton} onClick={clearItems} disabled={isSolving}>
                <Translate contentKey="site.packing.items.clear">Clear All</Translate>
              </button>
            </div>
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} style={styles.itemRow}>
                <span style={styles.itemName}>
                  {item.name} ×{item.quantity}
                  <span style={styles.itemDims}>
                    ({item.size.l}×{item.size.w}×{item.size.h}mm, {item.weight}kg)
                  </span>
                </span>
                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={() => removeItem(index)}
                  disabled={isSolving}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Solve Button */}
      <div style={styles.solveBar}>
        <button
          type="button"
          style={{
            ...styles.solveButton,
            ...(isSolving ? styles.solveButtonDisabled : {}),
          }}
          onClick={onSolve}
          disabled={isSolving || !container || items.length === 0}
        >
          {isSolving ? (
            <Translate contentKey="site.packing.solve.solving">Solving...</Translate>
          ) : (
            <Translate contentKey="site.packing.solve.button">Solve</Translate>
          )}
        </button>
      </div>

      {/* Result Section */}
      {hasSolution && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Translate contentKey="site.packing.result.title">Solution</Translate>
          </h2>

          <div style={styles.resultGrid}>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>
                <Translate contentKey="site.packing.result.volumeUtilization">Volume Utilization</Translate>:
              </span>
              <span style={styles.resultValue}>{(solveState.solution.score.volumeUtilization * 100).toFixed(1)}%</span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>
                <Translate contentKey="site.packing.result.remainingVolume">Remaining Space</Translate>:
              </span>
              <span style={styles.resultValue}>{formatVolume(solveState.solution.score.remainingVolume)} m³</span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>
                <Translate contentKey="site.packing.result.totalWeight">Total Weight</Translate>:
              </span>
              <span style={styles.resultValue}>{solveState.solution.score.totalWeight.toFixed(1)} kg</span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>
                <Translate contentKey="site.packing.result.itemCount">Items Placed</Translate>:
              </span>
              <span style={styles.resultValue}>{solveState.solution.score.itemCount}</span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>
                <Translate contentKey="site.packing.result.duration">Solve Time</Translate>:
              </span>
              <span style={styles.resultValue}>{solveState.solution.meta.durationMs} ms</span>
            </div>
          </div>

          {solveState.solution.unplaced && solveState.solution.unplaced.length > 0 && (
            <div style={styles.warningBox}>
              <strong>
                <Translate contentKey="site.packing.result.unplaced">Unplaced Items</Translate>:
              </strong>{' '}
              {solveState.solution.unplaced.length}
            </div>
          )}

          <div style={styles.exportButtons}>
            <button type="button" style={styles.exportButton} onClick={onExportJson}>
              <Translate contentKey="site.packing.export.json">Export JSON</Translate>
            </button>
            <button type="button" style={styles.exportButton} onClick={onExportCsv}>
              <Translate contentKey="site.packing.export.csv">Export CSV</Translate>
            </button>
          </div>
        </section>
      )}

      {solveState.status === 'ERROR' && (
        <div style={styles.errorBox}>
          <Translate contentKey="site.packing.solve.error">Solving failed</Translate>
          {solveState.error && `: ${solveState.error}`}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 380,
    height: '100%',
    backgroundColor: COLORS.bg.surface,
    borderRight: `1px solid ${COLORS.border.default}`,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  section: {
    padding: SPACING.lg,
    borderBottom: `1px solid ${COLORS.border.default}`,
  },
  sectionTitle: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSize.h3,
    color: COLORS.text.default,
    margin: `0 0 ${SPACING.md}px 0`,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    display: 'block',
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text.default,
    marginBottom: SPACING.xs,
  },
  input: {
    width: '100%',
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontFamily: TYPOGRAPHY.fontFamily,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.default,
    color: COLORS.text.default,
    transition: `border-color ${TRANSITION.fast}`,
  },
  inputError: {
    width: '100%',
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontFamily: TYPOGRAPHY.fontFamily,
    border: `1px solid ${COLORS.border.error}`,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.text.default,
  },
  select: {
    width: '100%',
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontFamily: TYPOGRAPHY.fontFamily,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.default,
    color: COLORS.text.default,
    cursor: 'pointer',
  },
  selectError: {
    width: '100%',
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontFamily: TYPOGRAPHY.fontFamily,
    border: `1px solid ${COLORS.border.error}`,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.text.default,
    cursor: 'pointer',
  },
  errorText: {
    display: 'block',
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.state.error,
    marginTop: SPACING.xs,
  },
  row: {
    display: 'flex',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  customContainer: {
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bg.muted,
    borderRadius: RADIUS.md,
  },
  containerInfo: {
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bg.muted,
    borderRadius: RADIUS.md,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text.default,
  },
  itemForm: {
    padding: SPACING.md,
    backgroundColor: COLORS.bg.muted,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  rotations: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: SPACING.sm,
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.default,
    cursor: 'pointer',
    marginRight: SPACING.md,
  },
  primaryButton: {
    flex: 1,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.text.inverse,
    backgroundColor: COLORS.brand.primary,
    border: 'none',
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    transition: `background-color ${TRANSITION.fast}`,
  },
  secondaryButton: {
    padding: `${SPACING.sm}px ${SPACING.lg}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.text.default,
    backgroundColor: COLORS.bg.default,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    transition: `all ${TRANSITION.fast}`,
  },
  textButton: {
    padding: `${SPACING.xs}px ${SPACING.sm}px`,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.brand.primary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  iconButton: {
    width: 28,
    height: 28,
    fontSize: TYPOGRAPHY.fontSize.h2,
    fontWeight: TYPOGRAPHY.fontWeights.normal,
    color: COLORS.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${TRANSITION.fast}`,
  },
  itemsList: {
    maxHeight: 200,
    overflowY: 'auto' as const,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
  },
  itemsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACING.sm}px ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.border.default}`,
    backgroundColor: COLORS.bg.muted,
  },
  itemsCount: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text.muted,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACING.sm}px ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.border.default}`,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.default,
  },
  itemDims: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
    marginLeft: SPACING.sm,
  },
  solveBar: {
    padding: SPACING.lg,
    borderTop: `1px solid ${COLORS.border.default}`,
    position: 'sticky' as const,
    bottom: 0,
    backgroundColor: COLORS.bg.surface,
    zIndex: Z_INDEX.sticky,
  },
  solveButton: {
    width: '100%',
    padding: `${SPACING.lg}px`,
    fontSize: TYPOGRAPHY.fontSize.h3,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.text.inverse,
    backgroundColor: COLORS.brand.cta,
    border: 'none',
    borderRadius: RADIUS.lg,
    cursor: 'pointer',
    transition: `background-color ${TRANSITION.fast}`,
    boxShadow: SHADOW.md,
  },
  solveButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.xs,
  },
  resultLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  resultValue: {
    fontSize: TYPOGRAPHY.fontSize.h3,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text.default,
  },
  warningBox: {
    padding: SPACING.md,
    backgroundColor: COLORS.state.warningBg,
    border: `1px solid ${COLORS.state.warning}`,
    borderRadius: RADIUS.md,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.default,
    marginBottom: SPACING.md,
  },
  errorBox: {
    padding: SPACING.md,
    backgroundColor: COLORS.state.errorBg,
    border: `1px solid ${COLORS.state.error}`,
    borderRadius: RADIUS.md,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.state.error,
    marginBottom: SPACING.md,
  },
  exportButtons: {
    display: 'flex',
    gap: SPACING.md,
  },
  exportButton: {
    flex: 1,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.text.default,
    backgroundColor: COLORS.bg.default,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    transition: `all ${TRANSITION.fast}`,
  },
};

// Add hover states via data attributes or CSS classes if needed
export default LeftPanel;
