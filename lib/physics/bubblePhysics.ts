/**
 * Physics Engine for Soap Bubble Simulation
 *
 * Model: Overdamped Langevin Dynamics with Perlin Noise Forcing
 *
 * Governing Equation:
 *   β(r) · v = F_perlin(x, t) + F_boundary(x) + F_bubble-bubble(x, {x_j})
 *   dx/dt = v
 *
 * where:
 *   β(r) = β₀ · r^α  (size-dependent drag)
 *   F_perlin = σ · ∇P(x/λ, y/λ, t/τ)  (stochastic driving force)
 *   F_boundary = K(d₀ - d)n̂  (soft-wall repulsion)
 */

import { getGlobalNoise } from './perlinNoise';

/**
 * Physics parameters (all in pixel/frame units)
 */
export interface PhysicsParams {
  // Drag parameters
  beta0: number;          // Drag coefficient base (typical: 0.1-0.5)
  dragExponent: number;   // Size-dependence exponent α (1 = Stokes, 2 = turbulent)

  // Perlin noise parameters
  noiseStrength: number;  // σ: Force amplitude (typical: 10-100)
  noiseLengthScale: number;  // λ: Spatial correlation length in pixels (typical: 200-500)
  noiseTimeScale: number;    // τ: Temporal correlation in frames (typical: 300-1000)

  // Boundary repulsion parameters
  boundaryStiffness: number;  // K: Repulsion strength (typical: 0.01-0.1)
  boundaryDistance: number;   // d₀: Onset distance in pixels (typical: 50-100)

  // Bubble-bubble interaction
  bubbleRepulsion: number;    // ε: Inter-bubble repulsion (typical: 0.01, 0 = disabled)

  // Text repulsion parameters
  textRepulsionDistance: number;  // d₀: Onset distance for text repulsion (typical: 100px)
  textRepulsionStiffness: number; // K: Text repulsion strength (typical: 0.05)
}

/**
 * Text bounding rectangle
 */
export interface TextBounds {
  x: number;       // Left edge
  y: number;       // Top edge
  width: number;
  height: number;
  right: number;   // Computed: x + width
  bottom: number;  // Computed: y + height
}

/**
 * Default physics parameters (tuned for visual appeal)
 */
export const defaultPhysicsParams: PhysicsParams = {
  beta0: 0.15,
  dragExponent: 1.0,
  noiseStrength: 2000,  // Increased for stronger fluid forcing
  noiseLengthScale: 350,
  noiseTimeScale: 500,
  boundaryStiffness: 6.0,  // Matched to text repulsion for consistent edge behavior
  boundaryDistance: 15,
  bubbleRepulsion: 0.015,
  textRepulsionDistance: 20,
  textRepulsionStiffness: 6.0,  // 10x from 0.6 for very strong text avoidance
};

/**
 * 2D Vector type
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Bubble state
 */
export interface BubbleState {
  id: number;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  color: number;  // Bubble color index (1-12)
  rotation: number;  // Current rotation angle in radians
  angularVelocity: number;  // Rotation speed in radians/frame
}

/**
 * Simulation boundary (rectangular domain)
 */
export interface Boundary {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Vector operations
 */
export const vec2 = {
  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s }),
  length: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: Vec2): Vec2 => {
    const len = vec2.length(v);
    return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
  },
  dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,
};

const EPSILON = 1e-6;

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Compute the convex hull of points using Andrew's monotonic chain algorithm.
 */
function computeConvexHull(points: Vec2[]): Vec2[] {
  if (points.length <= 1) {
    return [...points];
  }

  const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  const lower: Vec2[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Vec2[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

interface HullEdge {
  normal: Vec2;   // Outward-facing unit normal
  distance: number; // Plane offset: normal · point_on_edge
}

function computeHullEdges(hull: Vec2[]): HullEdge[] {
  if (hull.length < 3) {
    return [];
  }

  const edges: HullEdge[] = [];

  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const edge = vec2.sub(b, a);
    const length = vec2.length(edge);
    if (length < EPSILON) {
      continue;
    }

    // For CCW hull, outward normal is a 90° rotation (dx, dy) -> (dy, -dx)
    const normal = { x: edge.y / length, y: -edge.x / length };
    const distance = vec2.dot(normal, a);
    edges.push({ normal, distance });
  }

  return edges;
}

function computeTextConvexHull(textBounds: TextBounds[], buffer: number): Vec2[] {
  if (textBounds.length === 0) {
    return [];
  }

  const points: Vec2[] = [];
  for (const rect of textBounds) {
    points.push({ x: rect.x - buffer, y: rect.y - buffer });
    points.push({ x: rect.right + buffer, y: rect.y - buffer });
    points.push({ x: rect.right + buffer, y: rect.bottom + buffer });
    points.push({ x: rect.x - buffer, y: rect.bottom + buffer });
  }

  return computeConvexHull(points);
}

export function getTextHullPoints(textBounds: TextBounds[], buffer: number = 0): Vec2[] {
  return computeTextConvexHull(textBounds, buffer);
}

function circleIntersectsHull(position: Vec2, radius: number, edges: HullEdge[]): boolean {
  if (edges.length < 3) {
    return false;
  }

  for (const edge of edges) {
    const signedDistance = vec2.dot(edge.normal, position) - edge.distance;
    if (signedDistance > radius) {
      // The circle lies completely outside this half-space -> no intersection.
      return false;
    }
  }

  return true;
}

function projectCircleOutsideConvexHull(
  position: Vec2,
  radius: number,
  edges: HullEdge[]
): Vec2 {
  if (edges.length < 3) {
    return position;
  }

  let projected = { ...position };

  // Iterate a few times in case moving along one edge causes another violation.
  for (let iteration = 0; iteration < edges.length; iteration++) {
    let worstPenetration = 0;
    let worstEdge: HullEdge | null = null;

    for (const edge of edges) {
      const signedDistance = vec2.dot(edge.normal, projected) - edge.distance;
      const penetration = radius - signedDistance;
      if (penetration > worstPenetration + EPSILON) {
        worstPenetration = penetration;
        worstEdge = edge;
      }
    }

    if (!worstEdge || worstPenetration <= 0) {
      // Either no penetration detected or we're already outside.
      return projected;
    }

    // Push the circle outward along the edge normal, plus a one-pixel buffer.
    const moveDistance = worstPenetration + 1;
    projected = vec2.add(projected, vec2.scale(worstEdge.normal, moveDistance));
  }

  return projected;
}

/**
 * Compute Perlin noise force at position (x, y) at time t
 *
 * F_perlin(x, y, t) = σ · ∇P(x/λ, y/λ, t/τ)
 *
 * Returns force vector in pixel/frame² units
 */
export function computePerlinForce(
  position: Vec2,
  time: number,
  params: PhysicsParams
): Vec2 {
  const noise = getGlobalNoise();

  // Normalize coordinates to noise space
  const nx = position.x / params.noiseLengthScale;
  const ny = position.y / params.noiseLengthScale;
  const nt = time / params.noiseTimeScale;

  // Compute gradient ∇P using finite differences
  const gradient = noise.gradient3D(nx, ny, nt, 0.01);

  // Scale to force: F = σ · ∇P
  // Note: Gradient already includes scaling by 1/λ from chain rule
  return {
    x: params.noiseStrength * gradient.dx / params.noiseLengthScale,
    y: params.noiseStrength * gradient.dy / params.noiseLengthScale,
  };
}

/**
 * Compute boundary repulsion force
 *
 * For each wall we treat the bubble as a circle interacting with an inverse-square
 * (Coulomb-style) potential that activates within `boundaryDistance` pixels of the wall.
 * The force smoothly goes to zero at that activation distance and ramps up rapidly as the
 * bubble approaches the wall, preventing visible clipping without harsh reflections.
 *
 * Each wall contributes independently; near corners the contributions add vectorially.
 */
export function computeBoundaryForce(
  position: Vec2,
  boundary: Boundary,
  params: PhysicsParams
): Vec2 {
  const { xMin, xMax, yMin, yMax } = boundary;
  const { x, y } = position;

  const threshold = Math.max(params.boundaryDistance, 1);
  const k = params.boundaryStiffness * threshold * threshold;
  const force: Vec2 = { x: 0, y: 0 };

  const applyCoulomb = (distance: number, normal: Vec2) => {
    if (distance >= threshold) {
      return;
    }
    const clamped = Math.max(distance, 1);
    const invSq = 1 / (clamped * clamped);
    const invThresholdSq = 1 / (threshold * threshold);
    const magnitude = k * (invSq - invThresholdSq);
    if (magnitude <= 0) {
      return;
    }
    force.x += magnitude * normal.x;
    force.y += magnitude * normal.y;
  };

  // Left wall: normal points right (+x)
  applyCoulomb(x - xMin, { x: 1, y: 0 });
  // Right wall: normal points left (-x)
  applyCoulomb(xMax - x, { x: -1, y: 0 });
  // Top wall: normal points down (+y)
  applyCoulomb(y - yMin, { x: 0, y: 1 });
  // Bottom wall: normal points up (-y)
  applyCoulomb(yMax - y, { x: 0, y: -1 });

  return force;
}

/**
 * Compute bubble-bubble repulsion force on bubble i from all other bubbles
 *
 * Soft-core repulsion potential:
 *   U_ij = ε · max(0, 1 - r/(r_i + r_j))²
 *
 * Force:
 *   F_ij = 2ε · (1 - r/(r_i + r_j)) · (1/(r_i + r_j)) · (x_i - x_j)/r
 */
export function computeBubbleBubbleForce(
  bubble: BubbleState,
  allBubbles: BubbleState[],
  params: PhysicsParams
): Vec2 {
  if (params.bubbleRepulsion === 0) {
    return { x: 0, y: 0 };
  }

  const force: Vec2 = { x: 0, y: 0 };
  const coulombBuffer = 30;

  for (const other of allBubbles) {
    if (other.id === bubble.id) continue;

    const delta = vec2.sub(bubble.position, other.position);
    const distanceSq = delta.x * delta.x + delta.y * delta.y;
    if (distanceSq === 0) continue;

    const distance = Math.sqrt(distanceSq);
    const contactDist = bubble.radius + other.radius;
    const activationDistance = contactDist + coulombBuffer;

    if (distance >= activationDistance) continue;

    const clampedDistance = Math.max(distance, 1);
    const invSq = 1 / (clampedDistance * clampedDistance);
    const invActivationSq = 1 / (activationDistance * activationDistance);
    const magnitude = params.bubbleRepulsion * (invSq - invActivationSq);
    if (magnitude <= 0) continue;

    const direction = {
      x: delta.x / distance,
      y: delta.y / distance,
    };

    force.x += magnitude * direction.x;
    force.y += magnitude * direction.y;
  }

  return force;
}

/**
 * Compute text repulsion force
 */
export function computeTextRepulsionForce(
  position: Vec2,
  textBounds: TextBounds[],
  params: PhysicsParams
): Vec2 {
  const hull = computeTextConvexHull(textBounds, params.textRepulsionDistance);
  const edges = computeHullEdges(hull);

  if (edges.length < 3) {
    return { x: 0, y: 0 };
  }

  const threshold = Math.max(params.textRepulsionDistance, 1);
  const k = params.textRepulsionStiffness * threshold * threshold;
  const invThresholdSq = 1 / (threshold * threshold);
  const force: Vec2 = { x: 0, y: 0 };

  let deepestPenetration = 0;
  let deepestEdge: HullEdge | null = null;

  for (const edge of edges) {
    const signedDistance = vec2.dot(edge.normal, position) - edge.distance;

    if (signedDistance >= 0) {
      // Outside or on boundary.
      if (signedDistance >= threshold) {
        continue;
      }
      const clamped = Math.max(signedDistance, 1);
      const invSq = 1 / (clamped * clamped);
      const magnitude = k * (invSq - invThresholdSq);
      if (magnitude <= 0) {
        continue;
      }
      force.x += magnitude * edge.normal.x;
      force.y += magnitude * edge.normal.y;
    } else {
      const penetration = -signedDistance;
      if (penetration > deepestPenetration) {
        deepestPenetration = penetration;
        deepestEdge = edge;
      }
    }
  }

  if (deepestEdge) {
    const clamped = Math.max(deepestPenetration, 1);
    const magnitude = k / (clamped * clamped);
    force.x += magnitude * deepestEdge.normal.x;
    force.y += magnitude * deepestEdge.normal.y;
  }

  return force;
}

/**
 * Compute total force on a bubble
 */
export function computeTotalForce(
  bubble: BubbleState,
  allBubbles: BubbleState[],
  boundary: Boundary,
  textBounds: TextBounds[],
  time: number,
  params: PhysicsParams
): Vec2 {
  const fPerlin = computePerlinForce(bubble.position, time, params);
  const fBoundary = computeBoundaryForce(bubble.position, boundary, params);
  const fBubble = computeBubbleBubbleForce(bubble, allBubbles, params);
  const fText = computeTextRepulsionForce(bubble.position, textBounds, params);

  return vec2.add(vec2.add(vec2.add(fPerlin, fBoundary), fBubble), fText);
}

/**
 * Size-dependent drag coefficient
 *
 * β(r) = β₀ · r^α
 */
export function computeDrag(radius: number, params: PhysicsParams): number {
  return params.beta0 * Math.pow(radius, params.dragExponent);
}

/**
 * Update bubble state for one timestep using Euler integration
 *
 * Overdamped dynamics:
 *   v = F_total / β(r)
 *   x_new = x_old + Δt · v
 */
export function updateBubble(
  bubble: BubbleState,
  allBubbles: BubbleState[],
  boundary: Boundary,
  textBounds: TextBounds[],
  time: number,
  dt: number,
  params: PhysicsParams
): BubbleState {
  // Compute total force
  const force = computeTotalForce(bubble, allBubbles, boundary, textBounds, time, params);

  // Compute drag coefficient
  const beta = computeDrag(bubble.radius, params);

  // Overdamped velocity: v = F / β
  let velocity: Vec2 = vec2.scale(force, 1 / beta);

  // Cap maximum velocity to prevent jumps (max 20 pixels/frame at dt=1)
  const maxVelocity = 20;
  const velocityMagnitude = vec2.length(velocity);
  if (velocityMagnitude > maxVelocity) {
    velocity = vec2.scale(velocity, maxVelocity / velocityMagnitude);
  }

  // Update position: x_new = x_old + dt · v
  const newPosition = vec2.add(bubble.position, vec2.scale(velocity, dt));

  // Clamp position to boundary (hard constraint, shouldn't trigger if repulsion works)
  const effectiveXMin = boundary.xMin + bubble.radius;
  const effectiveXMax = boundary.xMax - bubble.radius;
  const effectiveYMin = boundary.yMin + bubble.radius;
  const effectiveYMax = boundary.yMax - bubble.radius;

  const clampedPosition = {
    x:
      effectiveXMin <= effectiveXMax
        ? Math.max(effectiveXMin, Math.min(effectiveXMax, newPosition.x))
        : (boundary.xMin + boundary.xMax) / 2,
    y:
      effectiveYMin <= effectiveYMax
        ? Math.max(effectiveYMin, Math.min(effectiveYMax, newPosition.y))
        : (boundary.yMin + boundary.yMax) / 2,
  };

  // Update rotation: θ_new = θ_old + ω · dt
  const newRotation = bubble.rotation + bubble.angularVelocity * dt;

  return {
    ...bubble,
    position: clampedPosition,
    velocity,
    rotation: newRotation,
  };
}

/**
 * Update all bubbles for one timestep
 */
export function updateAllBubbles(
  bubbles: BubbleState[],
  boundary: Boundary,
  textBounds: TextBounds[],
  time: number,
  dt: number,
  params: PhysicsParams
): BubbleState[] {
  // Update all bubbles simultaneously (parallel update to avoid order effects)
  return bubbles.map(bubble =>
    updateBubble(bubble, bubbles, boundary, textBounds, time, dt, params)
  );
}

function clampToBoundary(position: Vec2, radius: number, boundary: Boundary): Vec2 {
  return {
    x: Math.max(boundary.xMin + radius, Math.min(boundary.xMax - radius, position.x)),
    y: Math.max(boundary.yMin + radius, Math.min(boundary.yMax - radius, position.y)),
  };
}

function ensureOutsideHull(
  candidate: Vec2,
  radius: number,
  boundary: Boundary,
  edges: HullEdge[]
): Vec2 | null {
  if (edges.length < 3) {
    return clampToBoundary(candidate, radius, boundary);
  }

  let corrected = clampToBoundary(candidate, radius, boundary);

  for (let iteration = 0; iteration < edges.length * 2; iteration++) {
    if (!bubbleIntersectsTextHull(corrected, radius, edges)) {
      return corrected;
    }

    const projected = projectCircleOutsideConvexHull(corrected, radius, edges);
    const clamped = clampToBoundary(projected, radius, boundary);
    const shift = vec2.length(vec2.sub(clamped, corrected));
    corrected = clamped;

    if (shift < 0.5) {
      let worstEdge: HullEdge | null = null;
      let maxPenetration = -Infinity;

      for (const edge of edges) {
        const signedDistance = vec2.dot(edge.normal, corrected) - edge.distance;
        const penetration = radius - signedDistance;
        if (penetration > maxPenetration) {
          maxPenetration = penetration;
          worstEdge = edge;
        }
      }

      if (worstEdge) {
        corrected = clampToBoundary(
          vec2.add(corrected, vec2.scale(worstEdge.normal, Math.max(maxPenetration + 1, 1))),
          radius,
          boundary
        );
      } else {
        break;
      }
    }
  }

  if (!bubbleIntersectsTextHull(corrected, radius, edges)) {
    return corrected;
  }

  return null;
}

/**
 * Check if a bubble (circle) overlaps with the text hull.
 */
function bubbleIntersectsTextHull(
  position: Vec2,
  radius: number,
  hullEdges: HullEdge[]
): boolean {
  return circleIntersectsHull(position, radius, hullEdges);
}

/**
 * Initialize bubble states with random positions
 */
export function initializeBubbles(
  count: number,
  boundary: Boundary,
  minRadius: number = 30,
  maxRadius: number = 80,
  textBounds: TextBounds[] = []
): BubbleState[] {
  const bubbles: BubbleState[] = [];
  const spawnBuffer = 0;
  const textHull = computeTextConvexHull(textBounds, spawnBuffer);
  const textHullEdges = computeHullEdges(textHull);
  const hullExists = textHullEdges.length >= 3;
  const spacingBuffer = 20;

  const isTooCloseToExisting = (candidate: Vec2, candidateRadius: number, existing: BubbleState[]) => {
    for (const other of existing) {
      const minDistance = candidateRadius + other.radius + spacingBuffer;
      const delta = vec2.sub(candidate, other.position);
      if (vec2.length(delta) < minDistance) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < count; i++) {
    const margin = 50; // Reduced margin since boundary is already inset by max radius
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    let position: Vec2 = { x: 0, y: 0 };
    let valid = false;
    const maxAttempts = 150;

    for (let attempts = 0; attempts < maxAttempts && !valid; attempts++) {
      let candidate: Vec2 = {
        x: boundary.xMin + margin + Math.random() * (boundary.xMax - boundary.xMin - 2 * margin),
        y: boundary.yMin + margin + Math.random() * (boundary.yMax - boundary.yMin - 2 * margin),
      };

      candidate = clampToBoundary(candidate, radius, boundary);

      if (hullExists) {
        const ensured = ensureOutsideHull(candidate, radius, boundary, textHullEdges);
        if (!ensured) {
          continue;
        }
        candidate = ensured;
      }

      if (hullExists && bubbleIntersectsTextHull(candidate, radius, textHullEdges)) {
        continue;
      }

      if (isTooCloseToExisting(candidate, radius, bubbles)) {
        continue;
      }

      position = candidate;
      valid = true;
    }

    if (!valid) {
      let fallback: Vec2 = {
        x: boundary.xMin + margin + Math.random() * (boundary.xMax - boundary.xMin - 2 * margin),
        y: boundary.yMin + margin + Math.random() * (boundary.yMax - boundary.yMin - 2 * margin),
      };

      fallback = clampToBoundary(fallback, radius, boundary);

      if (hullExists) {
        const ensuredFallback = ensureOutsideHull(fallback, radius, boundary, textHullEdges);
        if (ensuredFallback) {
          fallback = ensuredFallback;
        }
      }

      position = fallback;
    }

    if (hullExists) {
      const ensuredFinal = ensureOutsideHull(position, radius, boundary, textHullEdges);
      if (ensuredFinal) {
        position = ensuredFinal;
      }
    }

    if (hullExists && bubbleIntersectsTextHull(position, radius, textHullEdges)) {
      const fallbackPositions: Vec2[] = [
        { x: boundary.xMin + radius + spacingBuffer, y: boundary.yMin + radius + spacingBuffer },
        { x: boundary.xMax - radius - spacingBuffer, y: boundary.yMin + radius + spacingBuffer },
        { x: boundary.xMax - radius - spacingBuffer, y: boundary.yMax - radius - spacingBuffer },
        { x: boundary.xMin + radius + spacingBuffer, y: boundary.yMax - radius - spacingBuffer },
        {
          x: (boundary.xMin + boundary.xMax) / 2,
          y: boundary.yMin + radius + spacingBuffer,
        },
        {
          x: (boundary.xMin + boundary.xMax) / 2,
          y: boundary.yMax - radius - spacingBuffer,
        },
      ];

      let placed = false;
      for (const fallbackCandidate of fallbackPositions) {
        const candidate = clampToBoundary(fallbackCandidate, radius, boundary);
        if (bubbleIntersectsTextHull(candidate, radius, textHullEdges)) {
          continue;
        }
        if (isTooCloseToExisting(candidate, radius, bubbles)) {
          continue;
        }
        position = candidate;
        placed = true;
        break;
      }

      if (!placed) {
        // Skip this bubble and retry with a new attempt.
        if (i > 0) {
          i--;
        }
        continue;
      }
    }

    // Random angular velocity for slow rotation
    // Range: -0.005 to 0.005 rad/frame (approx ±17°/sec at 60fps)
    const angularVelocity = (Math.random() - 0.5) * 0.01;

    bubbles.push({
      id: i,
      position,
      velocity: { x: 0, y: 0 },
      radius,
      color: (i % 12) + 1, // Cycle through 12 colors
      rotation: Math.random() * 2 * Math.PI, // Random initial rotation
      angularVelocity,
    });
  }

  return bubbles;
}

