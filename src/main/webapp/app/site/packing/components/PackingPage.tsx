/**
 * PackingPage Component
 * Main container for the Packing Workbench
 * PR#1: Left panel + right canvas, solve state machine, export functionality
 */

import React, { useState, useCallback, useRef } from 'react';
import { Translate } from 'app/platform/i18n';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { STANDARD_CONTAINERS, solvePacking, exportPacking } from '../api';
import type { Container, Item, SolveState, SolveRequest } from '../types';
import { LeftPanel } from './LeftPanel';
import { RightCanvas } from './RightCanvas';

export const PackingPage: React.FC = () => {
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

  // Keep track of the request for export
  const lastRequestRef = useRef<SolveRequest | null>(null);

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
  }, []);

  // Handle solve
  const handleSolve = useCallback(async () => {
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
      setSolveState({
        status: 'ERROR',
        solution: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime,
        duration: Date.now() - startTime,
      });
    }
  }, [containers, items]);

  // Handle export JSON
  const handleExportJson = useCallback(() => {
    if (!solveState.solution || !lastRequestRef.current) return;

    exportPacking.json({
      ...lastRequestRef.current,
      solution: solveState.solution,
    });
  }, [solveState]);

  // Handle export CSV
  const handleExportCsv = useCallback(() => {
    if (!solveState.solution || !containers.length) return;

    exportPacking.csv(items, solveState.solution.placements, containers[0]);
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
