/**
 * ThreeViewer Component
 * 3D visualization for packing solutions using Three.js
 *
 * PR#4A: Replace right canvas placeholder with functional 3D viewer
 * PR#4B: Performance & interaction enhancements
 *   - InstancedMesh for >200 boxes
 *   - Hover tooltip with throttled raycasting
 *   - Improved click selection with visual feedback
 *   - Fit to Container / Fit to Selected camera controls
 *
 * Performance & Accessibility Constraints:
 * - React.lazy for route-level lazy load (avoid loading Three.js on app startup)
 * - Camera state maintained internally (no global state updates per frame)
 * - Fixed min-height prevents CLS during scene loading
 * - Keyboard accessible list selection (click list → 3D highlight)
 * - Click 3D box → highlight in left panel
 */

/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* Three.js types trigger this rule due to library type resolution - https://github.com/mrdoob/three.js/issues/24546 */

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { Scene } from 'three';
import type { PerspectiveCamera } from 'three';
import type { WebGLRenderer } from 'three';
import type { Mesh } from 'three';
import type { InstancedMesh } from 'three';
import type { Vector2 } from 'three';
import type { Raycaster } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Translate } from 'app/platform/i18n';
import type { PackingSolution, Placement } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/tokens';
import { ViewerToolbar } from './ViewerToolbar';
import { HoverTooltip } from './HoverTooltip';
import { getOrientedDimensions } from '../utils/orientation';

/**
 * Instancing threshold: enable InstancedMesh when boxes > 200
 */
const INSTANCING_THRESHOLD = 200;

/**
 * Hover throttle delay in ms
 */
const HOVER_THROTTLE_MS = 100;

/**
 * Props interface for ThreeViewer
 */
export interface ThreeViewerProps {
  solution: PackingSolution | null;
  container: { innerSize: { l: number; w: number; h: number } } | null;
  items: Array<{ id: string; name: string; size: { l: number; w: number; h: number } }>;
  selectedItemId: string;
  onSelectionChange: (itemId: string) => void;
}

/**
 * ThreeViewer Component
 * Renders 3D visualization of the packing solution with performance optimizations
 */
export const ThreeViewer: React.FC<ThreeViewerProps> = props => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<Raycaster | null>(null);
  const mouseRef = useRef<Vector2 | null>(null);
  const meshesRef = useRef<Mesh[]>([]);
  const instancedMeshRef = useRef<InstancedMesh | null>(null);
  const frameIdRef = useRef<number>(0);
  const containerDimensionsRef = useRef<{ l: number; h: number; w: number } | null>(null);

  // Geometry and material caches for instancing
  const geometryCacheRef = useRef<Map<string, THREE.BoxGeometry>>(new Map());
  const materialCacheRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  // Instance data for instanced mesh
  const instanceDataRef = useRef<
    Array<{ placement: Placement; item: { id: string; name: string; size: { l: number; w: number; h: number } } }>
  >([]);

  // Hover state
  const [hoverState, setHoverState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    itemName: string;
    dimensions: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    itemName: '',
    dimensions: '',
  });

  // Hover throttle ref
  const hoverThrottleRef = useRef<number | null>(null);

  /**
   * Export screenshot as PNG
   */
  const handleExportScreenshot = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Render one frame to ensure the buffer is up to date
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Get the data URL
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');

    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `packing-solution-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }, []);

  /**
   * Reset camera to default view
   */
  const handleResetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !containerDimensionsRef.current) return;

    const { l, h, w } = containerDimensionsRef.current;
    const maxDim = Math.max(l, h, w);

    cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
    cameraRef.current.lookAt(l / 2, h / 2, w / 2);
    controlsRef.current.target.set(l / 2, h / 2, w / 2);
    controlsRef.current.update();
  }, []);

  /**
   * Fit camera to container bounds
   */
  const handleFitToContainer = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !containerDimensionsRef.current) return;

    const { l, h, w } = containerDimensionsRef.current;
    const maxDim = Math.max(l, h, w);

    // Position camera for optimal view (isometric-like)
    cameraRef.current.position.set(maxDim * 1.2, maxDim * 1.5, maxDim * 1.2);
    cameraRef.current.lookAt(l / 2, h / 2, w / 2);
    controlsRef.current.target.set(l / 2, h / 2, w / 2);
    controlsRef.current.update();
  }, []);

  /**
   * Fit camera to selected item
   */
  const handleFitToSelected = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !props.selectedItemId || !props.solution) return;

    const placement = props.solution.placements.find(p => p.itemId === props.selectedItemId);
    const item = props.items.find(i => i.id === props.selectedItemId);
    if (!placement || !item) return;

    const dims = getOrientedDimensions(item.size, placement.orientation);

    // Item center position
    const centerX = placement.position.x + dims.x / 2;
    const centerY = placement.position.y + dims.y / 2;
    const centerZ = placement.position.z + dims.z / 2;

    // Calculate distance based on item size
    const maxItemDim = Math.max(dims.x, dims.y, dims.z);
    const distance = maxItemDim * 3;

    // Position camera
    cameraRef.current.position.set(centerX + distance, centerY + distance * 0.8, centerZ + distance);
    cameraRef.current.lookAt(centerX, centerY, centerZ);
    controlsRef.current.target.set(centerX, centerY, centerZ);
    controlsRef.current.update();
  }, [props.selectedItemId, props.solution, props.items]);

  /**
   * Initialize Three.js scene
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg.muted);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(500, 500, 500);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    container.appendChild(renderer.domElement);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Ground grid - scale it appropriately for containers
    const gridHelper = new THREE.GridHelper(15000, 30, 0x888888, 0x444444);
    gridHelper.position.set(0, 0, 0);
    scene.add(gridHelper);

    // Add axes helper for orientation
    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);

    // Raycaster for click and hover
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.1 };
    const mouse = new THREE.Vector2();

    // Scene reference
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    raycasterRef.current = raycaster;
    mouseRef.current = mouse;

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);

      // Clear hover throttle
      if (hoverThrottleRef.current) {
        cancelAnimationFrame(hoverThrottleRef.current);
      }

      // Dispose geometries
      geometryCacheRef.current.forEach(geometry => geometry.dispose());
      geometryCacheRef.current.clear();

      // Dispose materials
      materialCacheRef.current.forEach(material => material.dispose());
      materialCacheRef.current.clear();

      // Dispose instanced mesh
      if (instancedMeshRef.current) {
        instancedMeshRef.current.dispose();
      }

      // Dispose regular meshes
      meshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      meshesRef.current = [];

      if (container && rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  /**
   * Create scene elements when solution changes
   * Uses InstancedMesh for >200 boxes, regular Meshes for fewer
   */
  useEffect(() => {
    if (!sceneRef.current || !props.solution || !props.container || !props.items) return;

    const scene = sceneRef.current;
    const useInstancing = props.solution.placements.length > INSTANCING_THRESHOLD;

    // Clear previous meshes
    meshesRef.current.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    meshesRef.current = [];

    // Clear previous instanced mesh
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.dispose();
      instancedMeshRef.current = null;
    }

    // Clear instance data
    instanceDataRef.current = [];

    // Container dimensions
    const container = props.container;
    const containerGeometry = new THREE.BoxGeometry(container.innerSize.l, container.innerSize.h, container.innerSize.w);
    const containerMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
    containerMesh.position.set(container.innerSize.l / 2, container.innerSize.h / 2, container.innerSize.w / 2);
    containerMesh.userData = { type: 'container' };
    scene.add(containerMesh);
    meshesRef.current.push(containerMesh);

    if (useInstancing) {
      // Use InstancedMesh for better performance with many boxes
      createInstancedMeshes(scene);
    } else {
      // Use regular Meshes for fewer boxes (simpler code path)
      createRegularMeshes(scene);
    }

    // Store container dimensions for camera controls
    containerDimensionsRef.current = {
      l: container.innerSize.l,
      h: container.innerSize.h,
      w: container.innerSize.w,
    };

    // Initial camera positioning
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(container.innerSize.l, container.innerSize.h, container.innerSize.w);
      cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
      cameraRef.current.lookAt(container.innerSize.l / 2, container.innerSize.h / 2, container.innerSize.w / 2);
      controlsRef.current.target.set(container.innerSize.l / 2, container.innerSize.h / 2, container.innerSize.w / 2);
      controlsRef.current.update();
    }
  }, [props.solution, props.selectedItemId, props.container, props.items]);

  /**
   * Create regular meshes (for <=200 boxes)
   */
  const createRegularMeshes = (scene: Scene) => {
    props.solution.placements.forEach(placement => {
      const item = props.items.find(i => i.id === placement.itemId);
      if (!item) return;

      const dims = getOrientedDimensions(item.size, placement.orientation);

      // Geometry and material
      const geometry = new THREE.BoxGeometry(dims.x, dims.y, dims.z);
      const isSelected = placement.itemId === props.selectedItemId;
      const material = createItemMaterial(placement.itemId, isSelected);
      const mesh = new THREE.Mesh(geometry, material);

      // Position (center the box on its position)
      mesh.position.set(placement.position.x + dims.x / 2, placement.position.y + dims.y / 2, placement.position.z + dims.z / 2);

      // Metadata for selection and hover
      mesh.userData = {
        type: 'item',
        id: placement.itemId,
        name: item.name,
        size: item.size,
        instanceIndex: placement.instanceIndex,
      };

      scene.add(mesh);
      meshesRef.current.push(mesh);

      // Add edges for selection highlight
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: isSelected ? 0xff6b6b : 0x94a3b8,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.3,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.name = 'edges';
      mesh.add(edges);
    });
  };

  /**
   * Create instanced meshes (for >200 boxes)
   */
  const createInstancedMeshes = (scene: Scene) => {
    const placements = props.solution.placements;
    const maxCount = placements.length;

    // Create a shared box geometry (will be scaled per instance)
    const baseGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Create instanced mesh with instance colors
    const instancedMesh = new THREE.InstancedMesh(
      baseGeometry,
      new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.8 }),
      maxCount,
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Add instance color attribute
    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    instanceDataRef.current = [];

    placements.forEach((placement, index) => {
      const item = props.items.find(i => i.id === placement.itemId);
      if (!item) return;

      const dims = getOrientedDimensions(item.size, placement.orientation);

      // Scale and position
      matrix.makeTranslation(placement.position.x + dims.x / 2, placement.position.y + dims.y / 2, placement.position.z + dims.z / 2);
      matrix.scale(new THREE.Vector3(dims.x, dims.y, dims.z));
      instancedMesh.setMatrixAt(index, matrix);

      // Set color based on selection
      const isSelected = placement.itemId === props.selectedItemId;
      color.setHSL((getItemColorHash(placement.itemId) % 360) / 360, 0.7, isSelected ? 0.7 : 0.55);
      instancedMesh.setColorAt(index, color);

      // Store instance data for picking
      instanceDataRef.current.push({
        placement,
        item,
      });
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;

    // Metadata for raycasting
    instancedMesh.userData = { type: 'instancedMesh' };

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
  };

  /**
   * Get item color hash
   */
  const getItemColorHash = useCallback((itemId: string): number => {
    return itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, []);

  /**
   * Create item material with unique color based on itemId
   */
  const createItemMaterial = useCallback(
    (itemId: string, isSelected: boolean): THREE.Material => {
      const hash = getItemColorHash(itemId);
      const hue = hash % 360;
      const lightness = isSelected ? 70 : 55;

      return new THREE.MeshStandardMaterial({
        color: `hsl(${hue}, 70%, ${lightness}%)`,
        metalness: 0.2,
        roughness: 0.8,
      });
    },
    [getItemColorHash],
  );

  /**
   * Animation loop
   */
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  /**
   * Handle resize events
   */
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  /**
   * Handle hover on 3D objects (throttled)
   */
  const handleHover = useCallback(
    (event: React.MouseEvent) => {
      if (!containerRef.current || !raycasterRef.current || !mouseRef.current || !cameraRef.current) {
        return;
      }

      // Throttle hover to avoid excessive raycasting
      if (hoverThrottleRef.current !== null) {
        return;
      }

      const throttledCheck = () => {
        // Calculate mouse position in normalized device coordinates
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        let hit = false;
        let itemName = '';
        let dimensions = '';

        if (instancedMeshRef.current) {
          // Check instanced mesh
          const intersection = raycasterRef.current.intersectObject(instancedMeshRef.current);
          if (intersection.length > 0) {
            const instanceId = intersection[0].instanceId;
            if (instanceId !== undefined && instanceId >= 0 && instanceDataRef.current[instanceId]) {
              const data = instanceDataRef.current[instanceId];
              hit = true;
              itemName = data.item.name;
              dimensions = `${data.item.size.l}×${data.item.size.w}×${data.item.size.h}mm`;
            }
          }
        } else {
          // Check regular meshes
          const intersects = raycasterRef.current.intersectObjects(meshesRef.current);
          if (intersects.length > 0) {
            const mesh = intersects[0].object as Mesh;
            if (mesh.userData.type === 'item') {
              hit = true;
              itemName = mesh.userData.name || mesh.userData.id;
              const size = mesh.userData.size;
              if (size) {
                dimensions = `${size.l}×${size.w}×${size.h}mm`;
              }
            }
          }
        }

        setHoverState({
          visible: hit,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          itemName,
          dimensions,
        });

        // Reset throttle
        hoverThrottleRef.current = null;
      };

      // Schedule throttled check
      hoverThrottleRef.current = requestAnimationFrame(throttledCheck);
    },
    [props.solution, props.items],
  );

  /**
   * Handle click on 3D objects for selection
   */
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!containerRef.current || !raycasterRef.current || !mouseRef.current || !cameraRef.current) {
        return;
      }

      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      if (instancedMeshRef.current) {
        // Check instanced mesh
        const intersection = raycasterRef.current.intersectObject(instancedMeshRef.current);
        if (intersection.length > 0) {
          const instanceId = intersection[0].instanceId;
          if (instanceId !== undefined && instanceId >= 0 && instanceDataRef.current[instanceId]) {
            const itemId = instanceDataRef.current[instanceId].item.id;
            props.onSelectionChange(itemId);
            return;
          }
        }
      } else {
        // Check regular meshes
        const intersects = raycasterRef.current.intersectObjects(meshesRef.current);
        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object as Mesh;
          if (clickedMesh.userData.type === 'item') {
            props.onSelectionChange(clickedMesh.userData.id);
          }
        }
      }

      // Clear hover state on click
      setHoverState(prev => ({ ...prev, visible: false }));
    },
    [props],
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleHover}
      onMouseLeave={() => setHoverState(prev => ({ ...prev, visible: false }))}
      onClick={handleClick}
      style={{
        position: 'relative',
        height: '100%',
        backgroundColor: 'transparent',
        minHeight: LAYOUT.minHeight.canvas,
        overflow: 'hidden',
        cursor: 'grab',
      }}
    >
      {/* Viewer Toolbar */}
      <ViewerToolbar
        onExportScreenshot={handleExportScreenshot}
        onResetView={handleResetView}
        onFitToContainer={handleFitToContainer}
        onFitToSelected={handleFitToSelected}
        hasSelection={!!props.selectedItemId}
        disabled={!props.solution}
      />

      {/* Hover Tooltip */}
      <HoverTooltip
        visible={hoverState.visible}
        x={hoverState.x}
        y={hoverState.y}
        itemName={hoverState.itemName}
        dimensions={hoverState.dimensions}
        containerRef={containerRef}
      />

      {/* Empty/Idle state */}
      {!props.solution && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              fontWeight: TYPOGRAPHY.fontWeights.medium,
              fontSize: TYPOGRAPHY.fontSize.h2,
              color: COLORS.text.muted,
            }}
          >
            <Translate contentKey="site.packing.viewer.placeholder">Add items and click Solve to see 3D visualization</Translate>
          </p>
        </div>
      )}
    </div>
  );
};

export default ThreeViewer;
