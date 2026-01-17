/**
 * Type definitions for Packing Optimizer
 * Aligned with docs/specs/api.md
 */

// Item (Cargo) dimensions and constraints
export interface ItemSize {
  l: number; // Length in mm
  w: number; // Width in mm
  h: number; // Height in mm
}

export interface ItemConstraints {
  rotations?: string[]; // Allowed orientations, e.g., ["LWH", "WLH", "LHW"]
  stackable?: boolean; // Can items be stacked on top
  fragile?: boolean; // Fragile item (cannot have items stacked on top)
  priority?: number; // Loading priority (higher = first)
}

export interface Item {
  id: string;
  name: string;
  size: ItemSize;
  weight: number; // kg
  quantity: number;
  constraints?: ItemConstraints;
}

// Container dimensions and limits
export interface ContainerSize {
  l: number; // Length in mm
  w: number; // Width in mm
  h: number; // Height in mm
}

export interface Container {
  id: string;
  name: string;
  innerSize: ContainerSize;
  maxWeight: number; // kg
}

// Position and orientation for placed items
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export type Orientation = 'LWH' | 'WLH' | 'LHW' | 'WHL' | 'HLW' | 'HWL';

export interface Placement {
  itemId: string;
  instanceIndex: number; // Which instance of the item (0..quantity-1)
  containerId: string;
  position: Position3D;
  orientation: Orientation;
}

// Solution score/metrics
export interface SolutionScore {
  volumeUtilization: number; // 0-1, ratio of used volume to total volume
  remainingVolume: number; // mm³
  totalWeight: number; // kg
  itemCount: number; // Number of items placed
}

// Unplaced item information
export interface UnplacedItem {
  itemId: string;
  reason: string;
}

// Warning message
export interface Warning {
  type: string;
  message: string;
  itemId?: string;
}

// Solution metadata
export interface SolutionMeta {
  algorithm: string; // Algorithm identifier, e.g., "heuristic-ep-v1"
  seed?: number; // Random seed for reproducibility
  durationMs: number; // Time taken to solve
  timestamp: string; // ISO timestamp
}

// Solve status
export type SolveStatus = 'OK' | 'TIMEOUT_BEST_EFFORT' | 'CANCELLED' | 'ERROR';

// Complete packing solution
export interface PackingSolution {
  status: SolveStatus;
  score: SolutionScore;
  placements: Placement[];
  unplaced?: UnplacedItem[];
  warnings?: Warning[];
  meta: SolutionMeta;
  error?: string; // Error message when status is ERROR
}

// Solve request
export interface SolveRequest {
  containers: Container[];
  items: Item[];
  options?: {
    objective?: 'MAX_VOLUME_UTILIZATION' | 'MAX_ITEM_COUNT';
    allowSplitAcrossContainers?: boolean;
    seed?: number;
    maxDurationMs?: number;
  };
}

// Validate request (for manual adjustments)
export interface ValidateRequest {
  containers: Container[];
  items: Item[];
  placements: Placement[];
}

// Validate response
export type ValidationErrorType = 'COLLISION' | 'OUT_OF_BOUNDS' | 'OVERWEIGHT';

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  itemId?: string;
  placementIndex?: number;
}

export interface ValidateResponse {
  valid: boolean;
  errors?: ValidationError[];
  metrics?: SolutionScore;
}

// Export request
export interface ExportRequest {
  format: 'JSON' | 'CSV' | 'ZIP';
  payload: {
    containers: Container[];
    items: Item[];
    placements: Placement[];
    score: SolutionScore;
    meta: SolutionMeta;
    viewPngBase64?: string; // Base64-encoded PNG screenshot
  };
}

// Form state for item input
export interface ItemFormData {
  id: string;
  name: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  quantity: string;
  rotations: string[];
  stackable: boolean;
  fragile: boolean;
  priority: string;
}

// Form state for container input
export interface ContainerFormData {
  id: string;
  name: string;
  length: string;
  width: string;
  height: string;
  maxWeight: string;
}

// Solve state machine
export type SolveStateType = 'IDLE' | 'SOLVING' | 'SUCCESS' | 'ERROR';

export interface SolveState {
  status: SolveStateType;
  solution: PackingSolution | null;
  error: string | null;
  startTime: number | null;
  duration: number | null;
}

// Export types (PR#2A)
export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ExportJsonData {
  version: string;
  exportedAt: string;
  request: {
    containers: Container[];
    items: Item[];
    options?: {
      objective?: 'MAX_VOLUME_UTILIZATION' | 'MAX_ITEM_COUNT';
      allowSplitAcrossContainers?: boolean;
      seed?: number;
      maxDurationMs?: number;
    };
  };
  solution: PackingSolution;
}
