/**
 * PackingPage Component
 * Main container for the Packing Workbench
 * PR#1: Left panel + right canvas, solve state machine, export functionality
 */

import React, { useState, useCallback, useRef } from 'react';
import { Translate, LanguageSwitcher, useTranslation } from 'app/platform/i18n';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { STANDARD_CONTAINERS, solvePacking, exportPacking, ApiErrorException, type ApiError } from '../api';
import type { Container, Item, SolveState, SolveRequest } from '../types';
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
  const [apiError, setApiError] = useState<string | null>(null);

  // Keep track of the request for export
  const lastRequestRef = useRef<SolveRequest | null>(null);

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
    setApiError(null);
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
    setApiError(null);
  }, []);

  // Handle solve (PR#2B: Enhanced error handling)
  const handleSolve = useCallback(async () => {
    // Reset api error
    setApiError(null);

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
    } catch (error) {
      // Map error to user-friendly message (PR#2B)
      const errorMessage = error instanceof Error ? getErrorMessage(error) : 'site.packing.api.unknownError';
      setApiError(errorMessage);
      setSolveState({
        status: 'ERROR',
        solution: null,
        error: t(errorMessage),
        startTime,
        duration: Date.now() - startTime,
      });
    }
  }, [containers, items, t]);

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

      {/* Main Content */}
      <main style={styles.main}>
        <LeftPanel
          containers={containers}
          items={items}
          solveState={solveState}
          onContainerChange={handleContainerChange}
          onItemsChange={handleItemsChange}
          onSolve={handleSolve}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onExportZip={handleExportZip}
        />
        <RightCanvas solveState={solveState} />
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
};

export default PackingPage;
