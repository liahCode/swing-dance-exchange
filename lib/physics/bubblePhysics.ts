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

  // Curl-noise flow (incompressible swirl) for more aesthetic motion
  curlStrength: number;       // Strength of curl-based force
  flowMix: number;            // 0..1 mix between gradient (perlin) and curl forces

  // Boundary repulsion parameters
  boundaryStiffness: number;  // K: Repulsion strength (typical: 0.01-0.1)
  boundaryDistance: number;   // d₀: Onset distance in pixels (typical: 50-100)

  // Bubble-bubble interaction
  bubbleRepulsion: number;    // ε: Inter-bubble repulsion (typical: 0.01, 0 = disabled)

  // Spread/anti-clumping pressure (longer-range, low-amplitude)
  spreadRadius: number;       // Gaussian kernel sigma (px)
  spreadPressure: number;     // Strength of density pressure

  // Desynchronization to break long "travel together" pairs
  desyncStrength: number;     // Tangential nudge when aligned and close
  desyncDistance: number;     // Distance threshold for desync check

  // Text repulsion parameters
  textRepulsionDistance: number;  // d₀: Onset distance for text repulsion (typical: 100px)
  textRepulsionStiffness: number; // K: Text repulsion strength (typical: 0.05)

  // Integration safety
  maxStepDistance: number;    // Max displacement (px) allowed per substep to avoid teleports
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
 * Default physics parameters (tuned for calm, aesthetic motion)
 */
export const defaultPhysicsParams: PhysicsParams = {
  // High damping for calm, floating motion
  beta0: 0.992,        // Very high damping (was 0.15)
  dragExponent: 1.0,

  // Gentle ambient drift
  noiseStrength: 0.25,       // Very gentle (was 1200)
  noiseLengthScale: 350,     // Keep smooth patterns
  noiseTimeScale: 5000,      // Slow evolution (was 500)

  // Curl force (reduced but kept for smooth flow)
  curlStrength: 0.3,         // Very gentle (was 1400)
  flowMix: 0.65,             // Blend more curl (swirl) than gradient

  // Soft boundary repulsion
  boundaryStiffness: 2.0,    // Gentle (was 6.0)
  boundaryDistance: 50,      // Early activation (was 15)

  // Bubble-to-bubble avoidance
  bubbleRepulsion: 2.0,      // Smooth repulsion (was 0.015)

  // Spread/anti-clumping (reduced)
  spreadRadius: 220,
  spreadPressure: 0.01,      // Lower (was 0.05)

  // Desync (reduced)
  desyncStrength: 0.005,     // Lower (was 0.015)
  desyncDistance: 140,

  // Text avoidance (smooth and early)
  textRepulsionDistance: 150,    // Early activation (was 20)
  textRepulsionStiffness: 2.0,   // Gentle (was 6.0)

  // Safety limits
  maxStepDistance: 5,        // Smaller steps (was 12)
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
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

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
 * Compute curl-noise (divergence-free) force for more aesthetic, swirly motion.
 * In 2D, use a scalar noise potential N and set u = (∂N/∂y, -∂N/∂x).
 */
export function computeCurlNoiseForce(
  position: Vec2,
  time: number,
  params: PhysicsParams
): Vec2 {
  const noise = getGlobalNoise();
  const nx = position.x / params.noiseLengthScale;
  const ny = position.y / params.noiseLengthScale;
  const nt = time / params.noiseTimeScale;
  const grad = noise.gradient3D(nx, ny, nt, 0.01);
  // Curl of scalar in 2D: rotate gradient 90°
  const curl = { x: grad.dy, y: -grad.dx };
  return {
    x: params.curlStrength * curl.x / params.noiseLengthScale,
    y: params.curlStrength * curl.y / params.noiseLengthScale,
  };
}

/**
 * Compute boundary repulsion force
 *
 * Uses a gentle linear ramp for soft, aesthetic boundary containment.
 * Force activates early (at boundaryDistance) and ramps up smoothly as the
 * bubble approaches the wall. This creates a "staying in the room naturally"
 * effect rather than bouncing off walls.
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

  const buffer = params.boundaryDistance;
  const stiffness = params.boundaryStiffness;
  const force: Vec2 = { x: 0, y: 0 };

  // Left boundary: repel right
  if (x < xMin + buffer) {
    const penetration = (xMin + buffer) - x;
    force.x += (penetration / buffer) * stiffness;
  }

  // Right boundary: repel left
  if (x > xMax - buffer) {
    const penetration = x - (xMax - buffer);
    force.x -= (penetration / buffer) * stiffness;
  }

  // Top boundary: repel down
  if (y < yMin + buffer) {
    const penetration = (yMin + buffer) - y;
    force.y += (penetration / buffer) * stiffness;
  }

  // Bottom boundary: repel up
  if (y > yMax - buffer) {
    const penetration = y - (yMax - buffer);
    force.y -= (penetration / buffer) * stiffness;
  }

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
 * Longer-range, low-amplitude density pressure to discourage clustering and
 * fill empty space. Approximates -∇ρ via pairwise Gaussian kernel contributions.
 */
export function computeDensityPressureForce(
  bubble: BubbleState,
  allBubbles: BubbleState[],
  params: PhysicsParams
): Vec2 {
  const sigma = Math.max(params.spreadRadius, 1);
  const twoSigma2 = 2 * sigma * sigma;
  let fx = 0;
  let fy = 0;
  for (const other of allBubbles) {
    if (other.id === bubble.id) continue;
    const dx = bubble.position.x - other.position.x;
    const dy = bubble.position.y - other.position.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < EPSILON) continue;
    const r = Math.sqrt(r2);
    // Gaussian weight
    const w = Math.exp(-r2 / twoSigma2);
    // Direction away from neighbor; 1/r to approximate gradient of density sum
    const invr = 1 / r;
    fx += w * dx * invr;
    fy += w * dy * invr;
  }
  return { x: fx * params.spreadPressure, y: fy * params.spreadPressure };
}

/**
 * Desynchronization force: when bubbles are close and velocities are aligned,
 * add a small tangential nudge to break long parallel travel.
 */
export function computeDesyncForce(
  bubble: BubbleState,
  allBubbles: BubbleState[],
  params: PhysicsParams
): Vec2 {
  let tx = 0;
  let ty = 0;
  const v = bubble.velocity;
  const vLen = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  const vHat = { x: v.x / vLen, y: v.y / vLen };
  for (const other of allBubbles) {
    if (other.id === bubble.id) continue;
    const dx = bubble.position.x - other.position.x;
    const dy = bubble.position.y - other.position.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < EPSILON) continue;
    const r = Math.sqrt(r2);
    if (r > params.desyncDistance) continue;
    const ov = other.velocity;
    const ovLen = Math.sqrt(ov.x * ov.x + ov.y * ov.y) || 1;
    const ovHat = { x: ov.x / ovLen, y: ov.y / ovLen };
    const align = vHat.x * ovHat.x + vHat.y * ovHat.y; // cos(theta)
    if (align > 0.85) {
      // Tangential unit relative to neighbor direction (rotate radial by 90°)
      const invr = 1 / r;
      const rx = dx * invr;
      const ry = dy * invr;
      const tan = { x: -ry, y: rx };
      // Deterministic sign to avoid symmetry (use id parity)
      const sign = (bubble.id % 2 === 0) ? 1 : -1;
      const weight = params.desyncStrength * (align - 0.85) * (1 - r / params.desyncDistance);
      tx += sign * tan.x * weight;
      ty += sign * tan.y * weight;
    }
  }
  return { x: tx, y: ty };
}

/**
 * Compute text repulsion force
 *
 * Uses gentle linear falloff for smooth, aesthetic text avoidance.
 * Creates a soft buffer zone around text where bubbles are gently pushed away.
 */
export function computeTextRepulsionForce(
  position: Vec2,
  textBounds: TextBounds[],
  params: PhysicsParams
): Vec2 {
  const hull = computeTextConvexHull(textBounds, params.textRepulsionDistance);
  const edges = computeHullEdges(hull);
  if (edges.length < 3) return { x: 0, y: 0 };

  // Find the most constraining edge (minimum signed distance)
  let minSigned = Infinity;
  let minEdge: HullEdge | null = null;
  for (const edge of edges) {
    const sd = vec2.dot(edge.normal, position) - edge.distance;
    if (sd < minSigned) {
      minSigned = sd;
      minEdge = edge;
    }
  }
  if (!minEdge) return { x: 0, y: 0 };

  const threshold = Math.max(params.textRepulsionDistance, 1);
  const k = params.textRepulsionStiffness;

  // Outside the threshold: no force
  if (minSigned >= threshold) {
    return { x: 0, y: 0 };
  }

  // Gentle linear ramp: strength increases as bubble gets closer
  // At threshold distance: force = 0
  // At boundary (distance 0): force = k
  // Inside (negative distance): force increases proportionally
  const normalizedDistance = minSigned / threshold;  // 1 at threshold, 0 at boundary, negative inside
  const strength = k * (1 - normalizedDistance);     // Linear ramp from 0 to k and beyond

  return {
    x: strength * minEdge.normal.x,
    y: strength * minEdge.normal.y
  };
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
  const fCurl = computeCurlNoiseForce(bubble.position, time, params);
  const fBoundary = computeBoundaryForce(bubble.position, boundary, params);
  const fBubble = computeBubbleBubbleForce(bubble, allBubbles, params);
  const fText = computeTextRepulsionForce(bubble.position, textBounds, params);
  const fSpread = computeDensityPressureForce(bubble, allBubbles, params);
  const fDesync = computeDesyncForce(bubble, allBubbles, params);

  // Blend curl/gradient for base flow
  const flow = {
    x: (1 - params.flowMix) * fPerlin.x + params.flowMix * fCurl.x,
    y: (1 - params.flowMix) * fPerlin.y + params.flowMix * fCurl.y,
  };

  return vec2.add(
    vec2.add(
      vec2.add(
        vec2.add(flow, fBoundary),
        vec2.add(fBubble, fSpread)
      ),
      fText
    ),
    fDesync
  );
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

  // Start with current velocity
  let vx = bubble.velocity.x;
  let vy = bubble.velocity.y;

  // Apply forces (with scaling factor for gentle integration)
  const forceScale = 0.008;
  vx += force.x * dt * forceScale;
  vy += force.y * dt * forceScale;

  // Apply damping (high damping = calm, floating motion)
  const damping = params.beta0;  // Reused beta0 as damping coefficient
  vx *= damping;
  vy *= damping;

  // Cap maximum speed for aesthetic slow motion
  const maxSpeed = 0.5;
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > maxSpeed) {
    vx = (vx / speed) * maxSpeed;
    vy = (vy / speed) * maxSpeed;
  }

  // Update position
  let x = bubble.position.x + vx;
  let y = bubble.position.y + vy;

  // Hard clamp to boundary (safety net)
  const effectiveXMin = boundary.xMin + bubble.radius;
  const effectiveXMax = boundary.xMax - bubble.radius;
  const effectiveYMin = boundary.yMin + bubble.radius;
  const effectiveYMax = boundary.yMax - bubble.radius;

  x = effectiveXMin <= effectiveXMax
    ? Math.max(effectiveXMin, Math.min(effectiveXMax, x))
    : (boundary.xMin + boundary.xMax) / 2;

  y = effectiveYMin <= effectiveYMax
    ? Math.max(effectiveYMin, Math.min(effectiveYMax, y))
    : (boundary.yMin + boundary.yMax) / 2;

  // Update rotation
  const newRotation = bubble.rotation + bubble.angularVelocity * dt;

  return {
    ...bubble,
    position: { x, y },
    velocity: { x: vx, y: vy },
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
