/**
 * LeftPanel Component
 * Container form, items list, solve button, result summary, export buttons
 * PR#1: Forms with proper labels, no placeholder-only inputs
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Translate, useTranslation } from 'app/platform/i18n';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW, TRANSITION, Z_INDEX } from '../../theme/tokens';
import { STANDARD_CONTAINERS, validateExportData, supportsCompressionStream } from '../api';
import { RotationCubeIcon } from './RotationCubeIcon';
import type { Container, Item, ItemFormData, ContainerFormData, SolveState, PackingSolution, ValidateResponse } from '../types';

interface LeftPanelProps {
  containers: Container[];
  items: Item[];
  solveState: SolveState;
  selectedItemId?: string;
  onContainerChange: (container: Container) => void;
  onItemsChange: (items: Item[]) => void;
  onSolve: () => void;
  onSelectionChange?: (itemId: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportZip: () => void;
  validationResult: ValidateResponse | null;
  isValidating: boolean;
}

// Helper: Get descriptive rotation label
const getRotationLabel = (rotation: string): string => {
  const labels: Record<string, string> = {
    LWH: '正放',
    WLH: '立放',
    LHW: '侧放',
    WHL: '正放旋转',
    HLW: '立放旋转',
    HWL: '侧放旋转',
  };
  return labels[rotation] || rotation;
};

// Helper: Generate aria-label for disabled export buttons
const getExportButtonLabelHelper = (
  solveState: SolveState,
  format: string,
  validationResult: ValidateResponse | null,
  isValidating: boolean,
): string => {
  if (solveState.status === 'IDLE' || !solveState.solution) {
    return `Export disabled: No solution available`;
  }
  if (isValidating) {
    return `Export disabled: Validation in progress`;
  }
  if (validationResult && !validationResult.valid) {
    return `Export disabled: Validation failed`;
  }
  if (solveState.status === 'ERROR' || solveState.solution.status === 'ERROR') {
    return `Export disabled: Solution contains errors`;
  }
  if (solveState.solution.placements.length === 0) {
    return `Export disabled: No items placed`;
  }
  return `Export as ${format}`;
};

// Helper: Format volume for display
const formatVolume = (mm3: number): string => {
  const m3 = mm3 / 1_000_000_000;
  return m3.toFixed(3);
};

// Helper: Validate custom container form
const validateCustomContainer = (data: ContainerFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.name) errors.name = 'site.packing.validation.required';
  if (!data.length || Number(data.length) <= 0) errors.length = 'site.packing.validation.positive';
  if (!data.width || Number(data.width) <= 0) errors.width = 'site.packing.validation.positive';
  if (!data.height || Number(data.height) <= 0) errors.height = 'site.packing.validation.positive';
  if (!data.maxWeight || Number(data.maxWeight) <= 0) errors.maxWeight = 'site.packing.validation.positive';
  return errors;
};

// Helper: Validate item form
const validateItemForm = (data: ItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.name) errors.name = 'site.packing.validation.required';
  if (!data.length || Number(data.length) <= 0) errors.length = 'site.packing.validation.positive';
  if (!data.width || Number(data.width) <= 0) errors.width = 'site.packing.validation.positive';
  if (!data.height || Number(data.height) <= 0) errors.height = 'site.packing.validation.positive';
  if (!data.weight || Number(data.weight) <= 0) errors.weight = 'site.packing.validation.positive';
  if (!data.quantity || Number(data.quantity) < 1) errors.quantity = 'site.packing.validation.invalidQuantity';
  return errors;
};

// Helper: Create default item form data
const createDefaultItemForm = (): ItemFormData => ({
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

// Component: Solution Result Display
interface SolutionResultProps {
  solution: PackingSolution;
  warnings?: string[];
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportZip: () => void;
  canExport: boolean;
  supportsZip: boolean;
  getExportButtonLabel: (format: string) => string;
}

const SolutionResult: React.FC<SolutionResultProps> = ({
  solution,
  warnings,
  onExportJson,
  onExportCsv,
  onExportZip,
  canExport,
  supportsZip,
  getExportButtonLabel,
}) => {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>
        <Translate contentKey="site.packing.result.title">Solution</Translate>
      </h2>

      <div style={styles.resultGrid}>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>
            <Translate contentKey="site.packing.result.volumeUtilization">Volume Utilization</Translate>:
          </span>
          <span style={styles.resultValue}>{(solution.score.volumeUtilization * 100).toFixed(1)}%</span>
        </div>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>
            <Translate contentKey="site.packing.result.remainingVolume">Remaining Space</Translate>:
          </span>
          <span style={styles.resultValue}>{formatVolume(solution.score.remainingVolume)} m³</span>
        </div>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>
            <Translate contentKey="site.packing.result.totalWeight">Total Weight</Translate>:
          </span>
          <span style={styles.resultValue}>{solution.score.totalWeight.toFixed(1)} kg</span>
        </div>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>
            <Translate contentKey="site.packing.result.itemCount">Items Placed</Translate>:
          </span>
          <span style={styles.resultValue}>{solution.score.itemCount}</span>
        </div>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>
            <Translate contentKey="site.packing.result.duration">Solve Time</Translate>:
          </span>
          <span style={styles.resultValue}>{solution.meta.durationMs} ms</span>
        </div>
      </div>

      {solution.unplaced && solution.unplaced.length > 0 && (
        <div style={styles.warningBox}>
          <strong>
            <Translate contentKey="site.packing.result.unplaced">Unplaced Items</Translate>:
          </strong>{' '}
          {solution.unplaced.length}
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div style={styles.warningBox}>
          <strong>Warnings:</strong> {warnings.join(', ')}
        </div>
      )}

      <div style={styles.exportButtons}>
        <button
          type="button"
          style={{ ...styles.exportButton, ...(!canExport ? styles.exportButtonDisabled : {}) }}
          onClick={onExportJson}
          disabled={!canExport}
          aria-label={getExportButtonLabel('JSON')}
        >
          <Translate contentKey="site.packing.export.json">Export JSON</Translate>
        </button>
        <button
          type="button"
          style={{ ...styles.exportButton, ...(!canExport ? styles.exportButtonDisabled : {}) }}
          onClick={onExportCsv}
          disabled={!canExport}
          aria-label={getExportButtonLabel('CSV')}
        >
          <Translate contentKey="site.packing.export.csv">Export CSV</Translate>
        </button>
        {supportsZip && (
          <button
            type="button"
            style={{ ...styles.exportButton, ...(!canExport ? styles.exportButtonDisabled : {}) }}
            onClick={onExportZip}
            disabled={!canExport}
            aria-label={getExportButtonLabel('ZIP')}
          >
            <Translate contentKey="site.packing.export.zip">Export All (ZIP)</Translate>
          </button>
        )}
      </div>
    </section>
  );
};

export const LeftPanel: React.FC<LeftPanelProps> = ({
  containers,
  items,
  solveState,
  selectedItemId,
  onContainerChange,
  onItemsChange,
  onSolve,
  onSelectionChange,
  onExportJson,
  onExportCsv,
  onExportZip,
  validationResult,
  isValidating,
}) => {
  const { t } = useTranslation();

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
  const [itemForm, setItemForm] = useState<ItemFormData>(createDefaultItemForm);

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
    const newErrors = validateCustomContainer(customContainer);

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
    const newErrors = validateItemForm(itemForm);

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
    setItemForm(createDefaultItemForm());
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

  // Export validation (PR#2A) - using useMemo to avoid recalculation
  const exportValidation = useMemo(() => validateExportData(solveState), [solveState]);
  const hasValidationErrors = !!validationResult && !validationResult.valid;
  const canExport = exportValidation.valid && !hasValidationErrors && !isValidating;
  const supportsZip = supportsCompressionStream();

  const container = containers[0];
  const hasSolution = solveState.status === 'SUCCESS' && solveState.solution;
  const isSolving = solveState.status === 'SOLVING';

  const getValidationMessageKey = (type: string): string => {
    switch (type) {
      case 'OUT_OF_BOUNDS':
        return 'site.packing.manual.validation.out_of_bounds';
      case 'COLLISION':
        return 'site.packing.manual.validation.collision';
      case 'OVERWEIGHT':
        return 'site.packing.manual.validation.overweight';
      default:
        return 'site.packing.manual.validation.unknown';
    }
  };

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
                name="container-name"
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
                  name="container-l"
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
                  name="container-w"
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
                  name="container-h"
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
              name="item-name"
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
                name="item-l"
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
                name="item-w"
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
                name="item-h"
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
                name="item-weight"
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
                name="item-quantity"
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
            <div style={styles.rotationsGrid}>
              {(['LWH', 'WLH', 'LHW', 'WHL', 'HLW', 'HWL'] as const).map(rotation => (
                <label
                  key={rotation}
                  style={{
                    ...styles.rotationItem,
                    ...(itemForm.rotations.includes(rotation) ? styles.rotationItemSelected : {}),
                  }}
                >
                  <RotationCubeIcon orientation={rotation} size={60} />
                  <input
                    id={`rotation-${rotation}`}
                    name={`rotation-${rotation}`}
                    type="checkbox"
                    checked={itemForm.rotations.includes(rotation)}
                    onChange={() => toggleRotation(rotation)}
                    disabled={isSolving}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.rotationLabel}>{getRotationLabel(rotation)}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                id="item-stackable"
                name="item-stackable"
                type="checkbox"
                checked={itemForm.stackable}
                onChange={e => updateItemForm('stackable', e.target.checked)}
                disabled={isSolving}
              />
              <Translate contentKey="site.packing.items.stackable">Stackable</Translate>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                id="item-fragile"
                name="item-fragile"
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
              <div
                key={`${item.id}-${index}`}
                style={{
                  ...styles.itemRow,
                  ...(selectedItemId === item.id ? styles.itemRowSelected : {}),
                  ...(onSelectionChange ? styles.itemRowClickable : {}),
                }}
                onClick={() => onSelectionChange?.(item.id)}
              >
                <span style={styles.itemName}>
                  {item.name} ×{item.quantity}
                  <span style={styles.itemDims}>
                    ({item.size.l}×{item.size.w}×{item.size.h}mm, {item.weight}kg)
                  </span>
                </span>
                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={e => {
                    e.stopPropagation();
                    removeItem(index);
                  }}
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
        <SolutionResult
          solution={solveState.solution}
          warnings={exportValidation.warnings}
          onExportJson={onExportJson}
          onExportCsv={onExportCsv}
          onExportZip={onExportZip}
          canExport={canExport}
          supportsZip={supportsZip}
          getExportButtonLabel={format => getExportButtonLabelHelper(solveState, format, validationResult, isValidating)}
        />
      )}

      {hasSolution && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Translate contentKey="site.packing.manual.validation.title">Validation</Translate>
          </h2>

          {isValidating && (
            <div style={styles.validationInfo} role="status">
              <Translate contentKey="site.packing.manual.validation.validating">Validating...</Translate>
            </div>
          )}

          {!isValidating && validationResult?.valid && (
            <div style={styles.validationSuccess}>
              <Translate contentKey="site.packing.manual.validation.valid">Valid</Translate>
            </div>
          )}

          {!isValidating && validationResult && !validationResult.valid && validationResult.errors && (
            <div style={styles.validationList} role="alert">
              {validationResult.errors.map((error, index) => {
                const itemName = items.find(item => item.id === error.itemId)?.name;
                const errorKey = getValidationMessageKey(error.type);
                const content = t(errorKey, { item: itemName || error.itemId || '' });
                return (
                  <button
                    type="button"
                    key={`${error.type}-${index}`}
                    style={styles.validationItem}
                    onClick={() => error.itemId && onSelectionChange?.(error.itemId)}
                    disabled={!error.itemId}
                  >
                    <span style={styles.validationDot} />
                    <span>{content}</span>
                  </button>
                );
              })}
            </div>
          )}
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
    overflowY: 'auto',
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
  rotationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: SPACING.lg,
  },
  rotationItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.sm,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    transition: `all ${TRANSITION.fast}`,
  },
  rotationItemSelected: {
    borderColor: COLORS.brand.primary,
    backgroundColor: COLORS.selection.hover,
    boxShadow: `0 0 0 2px ${COLORS.brand.primaryLight}`,
  },
  rotationLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text.default,
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
  itemRowClickable: {
    cursor: 'pointer',
    transition: `background-color ${TRANSITION.fast}`,
  },
  itemRowSelected: {
    backgroundColor: COLORS.selection.hover,
    borderLeft: `3px solid ${COLORS.selection.default}`,
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
  validationInfo: {
    padding: SPACING.sm,
    backgroundColor: COLORS.bg.muted,
    borderRadius: RADIUS.md,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text.muted,
  },
  validationSuccess: {
    padding: SPACING.sm,
    backgroundColor: COLORS.state.successBg,
    borderRadius: RADIUS.md,
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.state.success,
  },
  validationList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.sm,
  },
  validationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: `${SPACING.xs}px ${SPACING.sm}px`,
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border.default}`,
    backgroundColor: COLORS.bg.surface,
    color: COLORS.state.error,
    fontSize: TYPOGRAPHY.fontSize.small,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  validationDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: COLORS.state.error,
    flexShrink: 0,
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
  exportButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

// Add hover states via data attributes or CSS classes if needed
export default LeftPanel;
