/**
 * Packing API Client
 * PR#1: Uses stub/mock implementation
 * PR#2A: Enhanced export functionality with JSON, CSV, and ZIP support
 * PR#2B: Backend error handling with user-friendly error messages
 * Future: Will connect to actual backend endpoint
 */

/* eslint-disable no-bitwise */

import type {
  SolveRequest,
  PackingSolution,
  ValidateRequest,
  ValidateResponse,
  ExportRequest,
  ExportJsonData,
  ExportValidationResult,
  Item,
  Container,
  Placement,
  ValidationErrorType,
  SolveState,
} from '../types';

// Error code mapping
export const ERROR_CODE_MESSAGES = {
  VALIDATION_ERROR: 'site.packing.api.validationError',
  SOLVER_TIMEOUT: 'site.packing.api.solverTimeout',
  SOLVER_ERROR: 'site.packing.api.solverError',
} as const;

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  message: string;
  params?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export class ApiErrorException extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly message: string;
  readonly fieldErrors?: Array<{ field: string; message: string }>;

  constructor(title: string, error: ApiError) {
    super(error.detail || error.message || title);
    this.name = 'ApiErrorException';
    this.status = error.status;
    this.title = error.title;
    this.detail = error.detail;
    this.message = error.message;
    this.fieldErrors = error.fieldErrors;
  }
}

/**
 * Validate solve request before sending to API (PR#2B)
 */
const validateSolveRequest = (request: SolveRequest): ApiError | null => {
  const fieldErrors: Array<{ field: string; message: string }> = [];

  // Check containers
  if (!request.containers || request.containers.length === 0) {
    fieldErrors.push({ field: 'containers', message: 'At least one container is required' });
  } else {
    request.containers.forEach((container, index) => {
      const prefix = `containers[${index}]`;

      // Check ID uniqueness
      const duplicateIndex = request.containers.findIndex((c, i) => i > index && c.id === container.id);
      if (duplicateIndex !== -1) {
        fieldErrors.push({ field: `${prefix}.id`, message: `Duplicate container ID: ${container.id}` });
      }

      // Check dimensions
      if (!container.innerSize) {
        fieldErrors.push({ field: `${prefix}.innerSize`, message: 'Inner size is required' });
      } else {
        if (container.innerSize.l <= 0 || container.innerSize.l > 60000) {
          fieldErrors.push({ field: `${prefix}.innerSize.l`, message: 'Length must be 1-60000mm' });
        }
        if (container.innerSize.w <= 0 || container.innerSize.w > 60000) {
          fieldErrors.push({ field: `${prefix}.innerSize.w`, message: 'Width must be 1-60000mm' });
        }
        if (container.innerSize.h <= 0 || container.innerSize.h > 60000) {
          fieldErrors.push({ field: `${prefix}.innerSize.h`, message: 'Height must be 1-60000mm' });
        }
      }

      // Check max weight
      if (container.maxWeight < 0.1 || container.maxWeight > 500000) {
        fieldErrors.push({ field: `${prefix}.maxWeight`, message: 'Max weight must be 0.1-500000kg' });
      }
    });
  }

  // Check items
  if (!request.items || request.items.length === 0) {
    fieldErrors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    const maxContainerL = Math.max(...(request.containers?.map(c => c.innerSize.l) || [0]));

    request.items.forEach((item, index) => {
      const prefix = `items[${index}]`;

      // Check ID uniqueness
      const duplicateIndex = request.items.findIndex((i, iIndex) => iIndex > index && i.id === item.id);
      if (duplicateIndex !== -1) {
        fieldErrors.push({ field: `${prefix}.id`, message: `Duplicate item ID: ${item.id}` });
      }

      // Check size
      if (!item.size) {
        fieldErrors.push({ field: `${prefix}.size`, message: 'Size is required' });
      } else {
        if (item.size.l <= 0 || item.size.l > 60000) {
          fieldErrors.push({ field: `${prefix}.size.l`, message: 'Length must be 1-60000mm' });
        } else if (item.size.l > maxContainerL) {
          fieldErrors.push({
            field: `${prefix}.size.l`,
            message: `Item length ${item.size.l}mm exceeds container max ${maxContainerL}mm`,
          });
        }
        if (item.size.w <= 0 || item.size.w > 60000) {
          fieldErrors.push({ field: `${prefix}.size.w`, message: 'Width must be 1-60000mm' });
        }
        if (item.size.h <= 0 || item.size.h > 60000) {
          fieldErrors.push({ field: `${prefix}.size.h`, message: 'Height must be 1-60000mm' });
        }
      }

      // Check weight
      if (item.weight < 0.01 || item.weight > 100000) {
        fieldErrors.push({ field: `${prefix}.weight`, message: 'Weight must be 0.01-100000kg' });
      }

      // Check quantity
      if (item.quantity < 1 || item.quantity > 10000) {
        fieldErrors.push({ field: `${prefix}.quantity`, message: 'Quantity must be 1-10000' });
      }

      // Check constraints rotations
      if (item.constraints?.rotations && item.constraints.rotations.length === 0) {
        fieldErrors.push({
          field: `${prefix}.constraints.rotations`,
          message: 'At least one rotation must be allowed',
        });
      }
    });
  }

  // Check options
  if (request.options) {
    if (request.options.objective) {
      if (request.options.objective !== 'MAX_VOLUME_UTILIZATION' && request.options.objective !== 'MAX_ITEM_COUNT') {
        fieldErrors.push({
          field: 'options.objective',
          message: 'Must be MAX_VOLUME_UTILIZATION or MAX_ITEM_COUNT',
        });
      }
    }
    if (request.options.seed !== undefined && request.options.seed < 0) {
      fieldErrors.push({ field: 'options.seed', message: 'Seed must be non-negative' });
    }
    if (request.options.maxDurationMs !== undefined) {
      if (request.options.maxDurationMs < 100) {
        fieldErrors.push({ field: 'options.maxDurationMs', message: 'Minimum duration is 100ms' });
      }
      if (request.options.maxDurationMs > 300000) {
        fieldErrors.push({
          field: 'options.maxDurationMs',
          message: 'Maximum duration is 300000ms (5 minutes)',
        });
      }
    }
  }

  // Return error if any validation failed
  if (fieldErrors.length > 0) {
    return {
      type: 'about:blank',
      title: 'Validation failed',
      status: 400,
      detail: `Invalid input: ${fieldErrors[0].message}`,
      message: 'error.validation',
      params: 'packing',
      fieldErrors,
    };
  }

  return null;
};

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
 * Enhanced solve function with error handling (PR#2B)
 * Generates a simple arrangement that satisfies basic constraints
 *
 * TODO: Replace with actual API call to /api/packing/solve
 */
export const solvePacking = async (request: SolveRequest): Promise<PackingSolution> => {
  // Validate request before solving
  const validationError = validateSolveRequest(request);
  if (validationError) {
    throw new ApiErrorException('Validation Error', validationError);
  }

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
 * Export validation (PR#2A)
 * Validates that solution is ready for export
 */
export const validateExportData = (solveState: SolveState): ExportValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if solution exists
  if (!solveState.solution) {
    errors.push('No solution available');
    return { valid: false, errors };
  }

  // Check solve status
  if (solveState.status === 'ERROR' || solveState.solution.status === 'ERROR') {
    errors.push('Solution contains errors');
  }

  // Check if any items are placed
  if (solveState.solution.placements.length === 0) {
    warnings.push('No items placed');
  }

  // Check for warnings in solution
  if (solveState.solution.warnings && solveState.solution.warnings.length > 0) {
    warnings.push(...solveState.solution.warnings.map(w => w.message));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check if browser supports CompressionStream API (PR#2A)
 */
export const supportsCompressionStream = (): boolean => {
  return typeof CompressionStream !== 'undefined';
};

/**
 * Generate README content for ZIP export (PR#2A)
 */
const generateReadme = (solution: PackingSolution, containerName: string): string => {
  const timestamp = new Date().toISOString();
  const placedCount = solution.placements.length;
  const unplacedCount = solution.unplaced?.length || 0;
  const volumeUtil = (solution.score.volumeUtilization * 100).toFixed(1);
  const totalWeight = solution.score.totalWeight.toFixed(1);

  return `Packing Solution Export
======================

Generated: ${timestamp}
Container: ${containerName}
Algorithm: ${solution.meta.algorithm}

Results
-------
- Volume Utilization: ${volumeUtil}%
- Items Placed: ${placedCount}
- Items Unplaced: ${unplacedCount}
- Total Weight: ${totalWeight} kg
- Solve Time: ${solution.meta.durationMs} ms

Files
-----
- plan.json: Complete packing solution in JSON format
- items.csv: Item placement list in CSV format

${solution.unplaced && solution.unplaced.length > 0 ? `Unplaced Items\n-------------\n${solution.unplaced.map(u => `- ${u.itemId}: ${u.reason}`).join('\n')}\n` : ''}${solution.warnings && solution.warnings.length > 0 ? `Warnings\n--------\n${solution.warnings.map(w => `- ${w.type}: ${w.message}`).join('\n')}\n` : ''}
`;
};

/**
 * Trigger file download (helper function)
 */
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export packing solution (PR#2A - Enhanced)
 * Client-side export with JSON, CSV, and ZIP support
 */
export const exportPacking = {
  /**
   * Export as JSON file with version field and aligned API structure
   */
  json(request: SolveRequest, solution: PackingSolution): void {
    const data: ExportJsonData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      request,
      solution,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `packing-solution-${Date.now()}.json`);
  },

  /**
   * Export as CSV file with status column (placed/unplaced)
   */
  csv(items: Item[], placements: Placement[], container: Container, solution: PackingSolution): void {
    const headers = ['Item ID', 'Item Name', 'Container', 'X', 'Y', 'Z', 'Orientation', 'Length', 'Width', 'Height', 'Weight', 'Status'];

    // Build a Set of placed item IDs for status lookup
    const placedItemIds = new Set(placements.map(p => p.itemId));

    // Rows for placed items
    const placedRows = placements.map(p => {
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
        'placed',
      ].join(',');
    });

    // Rows for unplaced items
    const unplacedRows = (solution.unplaced || []).map(u => {
      const item = items.find(i => i.id === u.itemId);
      return [
        u.itemId,
        item?.name || '',
        '',
        '',
        '',
        '',
        '',
        item?.size.l || 0,
        item?.size.w || 0,
        item?.size.h || 0,
        item?.weight || 0,
        `unplaced: ${u.reason}`,
      ].join(',');
    });

    const csv = [headers.join(','), ...placedRows, ...unplacedRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    triggerDownload(blob, `packing-list-${Date.now()}.csv`);
  },

  /**
   * Export as ZIP file containing JSON, CSV, and README
   * Uses native CompressionStream API (Chrome 80+, Firefox 113+, Safari 16.4+)
   * Falls back to separate downloads if not supported
   */
  zip(request: SolveRequest, solution: PackingSolution, items: Item[], container: Container): void {
    // Note: Proper ZIP files require central directory structure
    // For simplicity, we'll use a reliable implementation approach
    // If CompressionStream is supported, we still need proper ZIP format

    try {
      // Generate JSON content
      const jsonData: ExportJsonData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        request,
        solution,
      };
      const jsonContent = JSON.stringify(jsonData, null, 2);

      // Generate CSV content
      const headers = ['Item ID', 'Item Name', 'Container', 'X', 'Y', 'Z', 'Orientation', 'Length', 'Width', 'Height', 'Weight', 'Status'];
      const placedRows = solution.placements.map(p => {
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
          'placed',
        ].join(',');
      });
      const unplacedRows = (solution.unplaced || []).map(u => {
        const item = items.find(i => i.id === u.itemId);
        return [
          u.itemId,
          item?.name || '',
          '',
          '',
          '',
          '',
          '',
          item?.size.l || 0,
          item?.size.w || 0,
          item?.size.h || 0,
          item?.weight || 0,
          `unplaced: ${u.reason}`,
        ].join(',');
      });
      const csvContent = [headers.join(','), ...placedRows, ...unplacedRows].join('\n');

      // Generate README content
      const readmeContent = generateReadme(solution, container.name);

      // Helper to calculate CRC-32
      const crc32 = (str: string): number => {
        let crc = 0 ^ -1;
        for (let i = 0; i < str.length; i++) {
          crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xff];
        }
        return (crc ^ -1) >>> 0;
      };

      // CRC-32 table
      const crc32Table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let crc = i;
        for (let j = 0; j < 8; j++) {
          crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
        }
        crc32Table[i] = crc;
      }

      // Helper to write a 32-bit value
      const writeUint32 = (view: DataView, offset: number, value: number): void => {
        view.setUint32(offset, value, true);
      };

      // Helper to write a 16-bit value
      const writeUint16 = (view: DataView, offset: number, value: number): void => {
        view.setUint16(offset, value, true);
      };

      // Files to include in ZIP
      const files = [
        { name: 'plan.json', content: jsonContent },
        { name: 'items.csv', content: csvContent },
        { name: 'readme.txt', content: readmeContent },
      ];

      // Calculate total size
      let totalSize = 0;
      const fileEntries: Array<{ header: Uint8Array; data: Uint8Array; centralHeader: Uint8Array }> = [];

      let localDataOffset = 0;
      let centralDirOffset = 0;

      for (const file of files) {
        const nameBytes = new TextEncoder().encode(file.name);
        const contentBytes = new TextEncoder().encode(file.content);
        const crc = crc32(file.content);

        // Local file header (30 bytes + filename length)
        const localHeaderSize = 30 + nameBytes.length;
        const localHeader = new Uint8Array(localHeaderSize);
        const localView = new DataView(localHeader.buffer);

        writeUint32(localView, 0, 0x04034b50); // Local file header signature
        writeUint16(localView, 4, 0x000a); // Version needed
        writeUint16(localView, 6, 0); // Flags
        writeUint16(localView, 8, 0); // Compression method (0 = store)
        writeUint16(localView, 10, 0); // Last mod time
        writeUint16(localView, 12, 0); // Last mod date
        writeUint32(localView, 14, crc); // CRC-32
        writeUint32(localView, 18, contentBytes.length); // Compressed size
        writeUint32(localView, 22, contentBytes.length); // Uncompressed size
        writeUint16(localView, 26, nameBytes.length); // Name length
        writeUint16(localView, 28, 0); // Extra length

        localHeader.set(nameBytes, 30);

        // Central directory file header (46 bytes + filename length)
        const centralHeaderSize = 46 + nameBytes.length;
        const centralHeader = new Uint8Array(centralHeaderSize);
        const centralView = new DataView(centralHeader.buffer);

        writeUint32(centralView, 0, 0x02014b50); // Central file header signature
        writeUint16(centralView, 4, 0x000a); // Version made by
        writeUint16(centralView, 6, 0x000a); // Version needed
        writeUint16(centralView, 8, 0); // Flags
        writeUint16(centralView, 10, 0); // Compression method
        writeUint16(centralView, 12, 0); // Last mod time
        writeUint16(centralView, 14, 0); // Last mod date
        writeUint32(centralView, 16, crc); // CRC-32
        writeUint32(centralView, 20, contentBytes.length); // Compressed size
        writeUint32(centralView, 24, contentBytes.length); // Uncompressed size
        writeUint16(centralView, 28, nameBytes.length); // Name length
        writeUint16(centralView, 30, 0); // Extra length
        writeUint16(centralView, 32, 0); // File comment length
        writeUint16(centralView, 34, 0); // Disk number start
        writeUint16(centralView, 36, 0); // Internal file attributes
        writeUint32(centralView, 38, 0); // External file attributes
        writeUint32(centralView, 42, localDataOffset); // Relative offset of local header

        centralHeader.set(nameBytes, 46);

        fileEntries.push({
          header: localHeader,
          data: contentBytes,
          centralHeader,
        });

        localDataOffset += localHeaderSize + contentBytes.length;
        centralDirOffset += centralHeaderSize;
      }

      // End of central directory record (22 bytes)
      const endOfCentralDirSize = 22;
      const endOfCentralDir = new Uint8Array(endOfCentralDirSize);
      const endView = new DataView(endOfCentralDir.buffer);

      writeUint32(endView, 0, 0x06054b50); // End of central dir signature
      writeUint16(endView, 4, 0); // Disk number
      writeUint16(endView, 6, 0); // Central dir disk number
      writeUint16(endView, 8, files.length); // Disk entries
      writeUint16(endView, 10, files.length); // Total entries
      writeUint32(endView, 12, centralDirOffset); // Central dir size
      writeUint32(endView, 16, localDataOffset); // Central dir offset
      writeUint16(endView, 20, 0); // Comment length

      // Combine all parts
      totalSize = localDataOffset + centralDirOffset + endOfCentralDirSize;
      const zipData = new Uint8Array(totalSize);
      let offset = 0;

      for (const entry of fileEntries) {
        zipData.set(entry.header, offset);
        offset += entry.header.length;
        zipData.set(entry.data, offset);
        offset += entry.data.length;
      }

      for (const entry of fileEntries) {
        zipData.set(entry.centralHeader, offset);
        offset += entry.centralHeader.length;
      }

      zipData.set(endOfCentralDir, offset);

      const blob = new Blob([zipData], { type: 'application/zip' });
      triggerDownload(blob, `packing-export-${Date.now()}.zip`);
    } catch (error) {
      // Fallback to individual downloads on error
      console.error('ZIP export failed, falling back to individual downloads:', error);
      this.json(request, solution);
      this.csv(items, solution.placements, container, solution);
    }
  },
};
