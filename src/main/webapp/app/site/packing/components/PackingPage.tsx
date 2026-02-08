/**
 * PackingPage Component
 * Main container for the Packing Workbench
 * PR#1: Left panel + right canvas, solve state machine, export functionality
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Translate, LanguageSwitcher, useTranslation } from 'app/platform/i18n';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW, TRANSITION, Z_INDEX } from '../../theme/tokens';
import { STANDARD_CONTAINERS, solvePacking, exportPacking, validatePacking, ApiErrorException } from '../api';
import type { Container, Item, SolveState, SolveRequest, PackingSolution, Placement, Orientation, ValidateResponse } from '../types';
import { LeftPanel } from './LeftPanel';
import { RightCanvas } from './RightCanvas';

export const PackingPage: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [containers, setContainers] = useState<Container[]>([STANDARD_CONTAINERS[0]]);
  const [items, setItems] = useState<Item[]>([]);
  const [solveState, setSolveState] = useState<SolveState>({
    status: 'IDLE',
    solution: null,
    error: null,
    startTime: null,
    duration: null,
  });
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    contentKey: string;
    values?: Record<string, string | number>;
  } | null>(null);

  // Keep track of the request for export
  const lastRequestRef = useRef<SolveRequest | null>(null);
  const originalSolutionRef = useRef<PackingSolution | null>(null);
  const validationRequestRef = useRef(0);
  const toastTimeoutRef = useRef<number | null>(null);

  /**
   * Map API error to user-friendly i18n key (PR#2B)
   */
  const getErrorMessage = (error: Error): string => {
    if (error instanceof ApiErrorException) {
      // For validation errors, prefer field-level errors
      if (error.message === 'error.validation' && error.fieldErrors && error.fieldErrors.length > 0) {
        const firstError = error.fieldErrors[0];
        // Map specific field errors to i18n keys
        if (firstError.field.includes('containers')) {
          if (firstError.field.includes('innerSize')) {
            return 'site.packing.api.validation.containerDimensions';
          }
          if (firstError.field.includes('maxWeight')) {
            return 'site.packing.api.validation.containerWeight';
          }
          if (firstError.field.includes('.id')) {
            return 'site.packing.api.validation.duplicateContainerId';
          }
        }
        if (firstError.field.includes('items')) {
          if (firstError.field.includes('size')) {
            return 'site.packing.api.validation.itemDimensions';
          }
          if (firstError.field.includes('weight')) {
            return 'site.packing.api.validation.itemWeight';
          }
          if (firstError.field.includes('quantity')) {
            return 'site.packing.api.validation.itemQuantity';
          }
          if (firstError.field.includes('.id')) {
            return 'site.packing.api.validation.duplicateItemId';
          }
        }
        if (firstError.field.includes('options')) {
          return 'site.packing.api.validation.invalidOptions';
        }
        return 'site.packing.api.validationError';
      }

      // For other error messages
      if (error.message === 'error.validation') {
        return 'site.packing.api.validationError';
      }
    }

    // Default error message
    return 'site.packing.api.unknownError';
  };

  const showToast = useCallback((type: 'success' | 'error', contentKey: string, values?: Record<string, string | number>) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, contentKey, values });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const runValidation = useCallback(
    async (placements: Placement[]) => {
      if (!containers.length || !items.length) return;
      const requestId = (validationRequestRef.current += 1);
      setIsValidating(true);

      try {
        const result = await validatePacking({ containers, items, placements });
        if (requestId === validationRequestRef.current) {
          setValidationResult(result);
        }
      } finally {
        if (requestId === validationRequestRef.current) {
          setIsValidating(false);
        }
      }
    },
    [containers, items],
  );

  // Handle container change
  const handleContainerChange = useCallback((container: Container) => {
    setContainers([container]);
    // Reset solution when container changes
    setSolveState({
      status: 'IDLE',
      solution: null,
      error: null,
      startTime: null,
      duration: null,
    });
    setValidationResult(null);
    originalSolutionRef.current = null;
  }, []);

  // Handle items change
  const handleItemsChange = useCallback((newItems: Item[]) => {
    setItems(newItems);
    // Reset solution when items change
    setSolveState({
      status: 'IDLE',
      solution: null,
      error: null,
      startTime: null,
      duration: null,
    });
    setValidationResult(null);
    originalSolutionRef.current = null;
  }, []);

  // Handle solve (PR#2B: Enhanced error handling)
  const handleSolve = useCallback(async () => {
    setValidationResult(null);
    originalSolutionRef.current = null;

    if (!containers.length || items.length === 0) {
      setSolveState({
        status: 'ERROR',
        solution: null,
        error: 'No container or items specified',
        startTime: null,
        duration: null,
      });
      return;
    }

    const startTime = Date.now();
    setSolveState({
      status: 'SOLVING',
      solution: null,
      error: null,
      startTime,
      duration: null,
    });

    const request: SolveRequest = {
      containers,
      items,
      options: {
        objective: 'MAX_VOLUME_UTILIZATION',
        allowSplitAcrossContainers: false,
        seed: Date.now(),
        maxDurationMs: 5000,
      },
    };

    lastRequestRef.current = request;

    try {
      const solution = await solvePacking(request);

      setSolveState({
        status: solution.status === 'ERROR' ? 'ERROR' : 'SUCCESS',
        solution,
        error: solution.error || null,
        startTime,
        duration: Date.now() - startTime,
      });

      if (solution.status !== 'ERROR') {
        originalSolutionRef.current = solution;
        runValidation(solution.placements);
      }
    } catch (error) {
      // Map error to user-friendly message (PR#2B)
      const errorMessage = error instanceof Error ? getErrorMessage(error) : 'site.packing.api.unknownError';
      setSolveState({
        status: 'ERROR',
        solution: null,
        error: t(errorMessage),
        startTime,
        duration: Date.now() - startTime,
      });
    }
  }, [containers, items, t, getErrorMessage, runValidation]);

  // Handle export JSON
  const handleExportJson = useCallback(() => {
    if (!solveState.solution || !lastRequestRef.current) return;

    exportPacking.json(lastRequestRef.current, solveState.solution);
  }, [solveState]);

  // Handle export CSV
  const handleExportCsv = useCallback(() => {
    if (!solveState.solution || !containers.length) return;

    exportPacking.csv(items, solveState.solution.placements, containers[0], solveState.solution);
  }, [solveState, items, containers]);

  // Handle export ZIP (PR#2A)
  const handleExportZip = useCallback(() => {
    if (!solveState.solution || !lastRequestRef.current || !containers.length) return;

    exportPacking.zip(lastRequestRef.current, solveState.solution, items, containers[0]);
  }, [solveState, items, containers]);

  // Handle item selection change (for 3D viewer sync)
  const handleSelectionChange = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const updatePlacement = useCallback(
    (itemId: string, updater: (placement: Placement) => Placement) => {
      let nextPlacements: Placement[] | null = null;
      let didUpdate = false;

      setSolveState(prev => {
        if (!prev.solution) return prev;

        nextPlacements = prev.solution.placements.map(placement => {
          if (!didUpdate && placement.itemId === itemId) {
            didUpdate = true;
            return updater(placement);
          }
          return placement;
        });

        return {
          ...prev,
          solution: {
            ...prev.solution,
            placements: nextPlacements,
          },
        };
      });

      if (nextPlacements && didUpdate) {
        runValidation(nextPlacements);
      }
    },
    [runValidation],
  );

  const handleApplyPosition = useCallback(
    (itemId: string, position: { x: number; y: number; z: number }) => {
      updatePlacement(itemId, placement => ({
        ...placement,
        position,
      }));
    },
    [updatePlacement],
  );

  const handleApplyOrientation = useCallback(
    (itemId: string, orientation: Orientation) => {
      updatePlacement(itemId, placement => ({
        ...placement,
        orientation,
      }));
    },
    [updatePlacement],
  );

  const handleResetSelected = useCallback(
    (itemId: string) => {
      if (!originalSolutionRef.current) return;
      const originalPlacement = originalSolutionRef.current.placements.find(p => p.itemId === itemId);
      if (!originalPlacement) return;

      updatePlacement(itemId, () => ({
        ...originalPlacement,
        position: { ...originalPlacement.position },
      }));
    },
    [updatePlacement],
  );

  const handleResetAll = useCallback(() => {
    if (!originalSolutionRef.current || !solveState.solution) return;
    const resetPlacements = originalSolutionRef.current.placements.map(placement => ({
      ...placement,
      position: { ...placement.position },
    }));

    setSolveState(prev => {
      if (!prev.solution) return prev;
      return {
        ...prev,
        solution: {
          ...prev.solution,
          placements: resetPlacements,
        },
      };
    });

    runValidation(resetPlacements);
  }, [runValidation, solveState.solution]);

  return (
    <div style={styles.page}>
      {/* Page Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Translate contentKey="site.packing.title">Packing Workbench</Translate>
          </h1>
          <p style={styles.subtitle}>
            <Translate contentKey="site.packing.description">Container loading optimization tool</Translate>
          </p>
        </div>
        <LanguageSwitcher />
      </header>

      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError),
          }}
          role="status"
          aria-live="polite"
        >
          <Translate contentKey={toast.contentKey} values={toast.values} />
        </div>
      )}

      {/* Main Content */}
      <main style={styles.main}>
        <LeftPanel
          containers={containers}
          items={items}
          solveState={solveState}
          selectedItemId={selectedItemId}
          onContainerChange={handleContainerChange}
          onItemsChange={handleItemsChange}
          onSolve={handleSolve}
          onSelectionChange={handleSelectionChange}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onExportZip={handleExportZip}
          validationResult={validationResult}
          isValidating={isValidating}
        />
        <RightCanvas
          solveState={solveState}
          containers={containers}
          items={items}
          selectedItemId={selectedItemId}
          onSelectionChange={handleSelectionChange}
          validationResult={validationResult}
          isValidating={isValidating}
          onApplyPosition={handleApplyPosition}
          onApplyOrientation={handleApplyOrientation}
          onResetSelected={handleResetSelected}
          onResetAll={handleResetAll}
          onNotify={showToast}
        />
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: COLORS.bg.default,
    color: COLORS.text.default,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    overflow: 'hidden', // Prevent page scroll, let panels scroll internally
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${SPACING.lg}px ${SPACING.xl}`,
    backgroundColor: COLORS.bg.surface,
    borderBottom: `1px solid ${COLORS.border.default}`,
    flexShrink: 0,
  },
  title: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSize.h1,
    color: COLORS.text.default,
    margin: 0,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.muted,
    margin: `${SPACING.xs}px 0 0 0`,
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  toast: {
    position: 'fixed' as const,
    top: SPACING.lg,
    right: SPACING.lg,
    padding: `${SPACING.sm}px ${SPACING.lg}px`,
    borderRadius: RADIUS.md,
    boxShadow: SHADOW.md,
    fontSize: TYPOGRAPHY.fontSize.body,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    zIndex: Z_INDEX.toast,
    transition: `opacity ${TRANSITION.fast}`,
  },
  toastSuccess: {
    backgroundColor: COLORS.state.successBg,
    color: COLORS.state.success,
    border: `1px solid ${COLORS.state.success}`,
  },
  toastError: {
    backgroundColor: COLORS.state.errorBg,
    color: COLORS.state.error,
    border: `1px solid ${COLORS.state.error}`,
  },
};

export default PackingPage;
