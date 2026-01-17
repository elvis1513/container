/**
 * Packing API Client
 * PR#1: Uses stub/mock implementation
 * Future: Will connect to actual backend endpoint
 */

import type {
  SolveRequest,
  PackingSolution,
  ValidateRequest,
  ValidateResponse,
  ExportRequest,
  Item,
  Container,
  Placement,
  ValidationErrorType,
} from '../types';

// Standard containers library
export const STANDARD_CONTAINERS: Container[] = [
  {
    id: 'CNTR-20GP',
    name: '20GP',
    innerSize: { l: 5898, w: 2352, h: 2393 },
    maxWeight: 28000,
  },
  {
    id: 'CNTR-40GP',
    name: '40GP',
    innerSize: { l: 12032, w: 2352, h: 2393 },
    maxWeight: 26630,
  },
  {
    id: 'CNTR-40HQ',
    name: '40HQ',
    innerSize: { l: 12032, w: 2352, h: 2700 },
    maxWeight: 26370,
  },
];

/**
 * Stub solve function for PR#1
 * Generates a simple arrangement that satisfies basic constraints
 *
 * TODO: Replace with actual API call in PR#2+
 */
export const solvePacking = async (request: SolveRequest): Promise<PackingSolution> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  const { containers, items, options } = request;

  if (!containers.length) {
    return {
      status: 'ERROR',
      error: 'No container specified',
      score: {
        volumeUtilization: 0,
        remainingVolume: 0,
        totalWeight: 0,
        itemCount: 0,
      },
      placements: [],
      warnings: [],
      meta: {
        algorithm: 'stub-v1',
        durationMs: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (!items.length) {
    return {
      status: 'ERROR',
      error: 'No items specified',
      score: {
        volumeUtilization: 0,
        remainingVolume: containers[0].innerSize.l * containers[0].innerSize.w * containers[0].innerSize.h,
        totalWeight: 0,
        itemCount: 0,
      },
      placements: [],
      warnings: [],
      meta: {
        algorithm: 'stub-v1',
        durationMs: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const container = containers[0];
  const containerVolume = container.innerSize.l * container.innerSize.w * container.innerSize.h;

  // Simple greedy placement: place items side by side
  const placements: Placement[] = [];
  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let totalWeight = 0;
  let usedVolume = 0;
  const unplaced: Array<{ itemId: string; reason: string }> = [];

  for (const item of items) {
    const itemVolume = item.size.l * item.size.w * item.size.h;

    for (let i = 0; i < item.quantity; i++) {
      // Check if item fits
      const itemL = item.size.l;
      const itemW = item.size.w;
      const itemH = item.size.h;

      if (currentX + itemL > container.innerSize.l) {
        currentX = 0;
        currentY += itemW + 10; // Add 10mm gap
      }

      if (currentY + itemW > container.innerSize.w) {
        currentX = 0;
        currentY = 0;
        currentZ += itemH + 10; // Add 10mm gap
      }

      if (currentZ + itemH > container.innerSize.h) {
        // Container full
        unplaced.push({
          itemId: item.id,
          reason: 'Container full',
        });
        break;
      }

      // Check weight limit
      if (totalWeight + item.weight > container.maxWeight) {
        unplaced.push({
          itemId: item.id,
          reason: 'Weight limit exceeded',
        });
        break;
      }

      // Place item
      placements.push({
        itemId: item.id,
        instanceIndex: i,
        containerId: container.id,
        position: { x: currentX, y: currentY, z: currentZ },
        orientation: 'LWH',
      });

      usedVolume += itemVolume;
      totalWeight += item.weight;
      currentX += itemL + 10; // Add 10mm gap
    }
  }

  const volumeUtilization = usedVolume / containerVolume;

  return {
    status: 'OK',
    score: {
      volumeUtilization,
      remainingVolume: containerVolume - usedVolume,
      totalWeight,
      itemCount: placements.length,
    },
    placements,
    unplaced: unplaced.length > 0 ? unplaced : undefined,
    warnings: unplaced.length > 0 ? [{ type: 'WARNING', message: `${unplaced.length} items could not be placed` }] : [],
    meta: {
      algorithm: 'stub-greedy-v1',
      seed: options?.seed,
      durationMs: 800 + Math.floor(Math.random() * 400),
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Validate a packing arrangement
 * Stub implementation for PR#1
 */
export const validatePacking = async (request: ValidateRequest): Promise<ValidateResponse> => {
  await new Promise(resolve => setTimeout(resolve, 100));

  const { containers, items, placements } = request;
  const errors: Array<{ type: ValidationErrorType; message: string; itemId?: string }> = [];

  if (!containers.length || !items.length || !placements.length) {
    return {
      valid: true,
      metrics: {
        volumeUtilization: 0,
        remainingVolume: 0,
        totalWeight: 0,
        itemCount: 0,
      },
    };
  }

  const container = containers[0];
  const containerVolume = container.innerSize.l * container.innerSize.w * container.innerSize.h;
  let usedVolume = 0;
  let totalWeight = 0;

  for (const placement of placements) {
    const item = items.find(i => i.id === placement.itemId);
    if (!item) continue;

    // Check bounds
    const { l, w, h } = item.size;
    if (placement.position.x < 0 || placement.position.x + l > container.innerSize.l) {
      errors.push({
        type: 'OUT_OF_BOUNDS',
        message: `Item ${item.name} exceeds container length`,
        itemId: item.id,
      });
    }
    if (placement.position.y < 0 || placement.position.y + w > container.innerSize.w) {
      errors.push({
        type: 'OUT_OF_BOUNDS',
        message: `Item ${item.name} exceeds container width`,
        itemId: item.id,
      });
    }
    if (placement.position.z < 0 || placement.position.z + h > container.innerSize.h) {
      errors.push({
        type: 'OUT_OF_BOUNDS',
        message: `Item ${item.name} exceeds container height`,
        itemId: item.id,
      });
    }

    usedVolume += l * w * h;
    totalWeight += item.weight;
  }

  // Check weight
  if (totalWeight > container.maxWeight) {
    errors.push({
      type: 'OVERWEIGHT',
      message: `Total weight exceeds container limit`,
    });
  }

  // Simple collision check (same position)
  const positionMap = new Map<string, string>();
  for (const placement of placements) {
    const key = `${placement.position.x},${placement.position.y},${placement.position.z}`;
    if (positionMap.has(key)) {
      errors.push({
        type: 'COLLISION',
        message: `Items overlap at position`,
        itemId: placement.itemId,
      });
    }
    positionMap.set(key, placement.itemId);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    metrics: {
      volumeUtilization: usedVolume / containerVolume,
      remainingVolume: containerVolume - usedVolume,
      totalWeight,
      itemCount: placements.length,
    },
  };
};

/**
 * Export packing solution
 * Client-side export for PR#1 (no backend needed)
 */
export const exportPacking = {
  /**
   * Export as JSON file
   */
  json(payload: SolveRequest & { solution: PackingSolution }): void {
    const { solution, ...request } = payload;
    const data = {
      request,
      solution,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-solution-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export as CSV file (placements only)
   */
  csv(items: Item[], placements: Placement[], container: Container): void {
    const headers = ['Item ID', 'Item Name', 'Container', 'X', 'Y', 'Z', 'Orientation', 'Length', 'Width', 'Height', 'Weight'];
    const rows = placements.map(p => {
      const item = items.find(i => i.id === p.itemId);
      return [
        p.itemId,
        item?.name || '',
        p.containerId,
        p.position.x,
        p.position.y,
        p.position.z,
        p.orientation,
        item?.size.l || 0,
        item?.size.w || 0,
        item?.size.h || 0,
        item?.weight || 0,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-list-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
