# Bubble Physics Implementation Plan

## Goal
Port the simplified, aesthetic-focused physics behavior from `bubble-physics.jsx` reference implementation into the existing codebase while preserving ALL visual styling and hero section structure.

---

## ✅ MUST PRESERVE (DO NOT TOUCH)

### Visual Elements
- **Canvas rendering**: PNG bubble images rendered on canvas
- **Blur filter**: `filter: 'blur(4px)'` applied to bubbles
- **Rotation**: Bubble rotation animation
- **Z-sorting**: Largest bubbles rendered first (smaller on top)
- **Bubble images**: `/bubbles/*.png` files with `getBubbleImage()` color system
- **Image loading**: Preload system with 12 bubble images

### Hero Section Structure
- **Text elements**: Title, dates, tagline, newsletter form
- **Text measurement**: `titleRef`, `datesRef`, `taglineRef`, `newsletterRef` system
- **Text bounds**: Multi-element bounds array with convex hull computation
- **Layout**: All Hero.module.css styles
- **Responsive**: Mobile breakpoints and scaling

### Component Architecture
- **PhysicsHero component**: Overall structure and JSX
- **Canvas management**: Container ref, resize handling, DPR scaling
- **Text refs**: Measurement system for text avoidance

---

## ❌ MUST CHANGE (Physics Only)

### 1. Force System in bubblePhysics.ts
**Current**: Complex Overdamped Langevin dynamics with 7+ competing forces
- Perlin noise (magnitude 1200)
- Curl force (magnitude 1400)
- Boundary force (stiffness 6.0)
- Text repulsion (stiffness 6.0)
- Bubble repulsion
- Spread force
- Desync force

**Target**: Simple 4-force system
- **Ambient drift** (Perlin noise, magnitude ~0.25)
- **Text avoidance** (elliptical smooth repulsion, magnitude ~2.0)
- **Bubble-to-bubble avoidance** (smooth repulsion, magnitude ~2.0)
- **Boundary repulsion** (soft, early activation, magnitude ~2.0)

### 2. Motion Parameters
**Current**:
- Too fast, chaotic motion
- Low damping (allows runaway acceleration)
- High force magnitudes create jittery behavior

**Target**:
- Very slow, calm drift (MAX_SPEED: 0.5 px/frame)
- High damping (0.992) for "floating in thick air" feel
- Low force magnitudes for gentle motion

### 3. React State Management in PhysicsHero.tsx
**Current Issue**: State sync bugs at lines 219-256
- `bubblesRef` captures initial state
- Physics updates never persist to React state
- Causes bubbles to reset/stutter

**Target**: Proper functional setState
- Use `setBubbles(prev => prev.map(...))` pattern
- Physics calculations inside state updater
- No stale closures

---

## 📋 Implementation Steps

### Phase 1: Simplify bubblePhysics.ts

#### Step 1.1: Reduce Force System
**File**: `lib/physics/bubblePhysics.ts`

**Actions**:
1. Keep only 4 force calculations:
   - `calculateAmbientDrift()` - from Perlin noise
   - `calculateTextAvoidance()` - elliptical repulsion
   - `calculateBubbleAvoidance()` - mutual repulsion
   - `calculateBoundaryRepulsion()` - soft edge containment

2. Remove or comment out:
   - Curl force calculation
   - Spread force
   - Desync force
   - Any other secondary forces

3. Simplify `updateBubble()` function to only apply these 4 forces

**Location**: Lines 600-700 (force calculation section)

#### Step 1.2: Update Physics Parameters
**File**: `lib/physics/bubblePhysics.ts`

**Update `defaultPhysicsParams`** (around line 73-91):

```typescript
export const defaultPhysicsParams: PhysicsParams = {
  // Ambient drift (was noiseStrength: 1200)
  noiseStrength: 0.25,          // Very gentle
  noiseScale: 0.0015,           // Smooth, large-scale patterns
  noiseTimeScale: 0.0002,       // Slow evolution

  // Text avoidance (was textRepulsionStiffness: 6.0)
  textRepulsionStiffness: 2.0,  // Moderate, smooth
  textRepulsionDistance: 150,    // Early activation

  // Bubble avoidance
  bubbleRepulsion: 2.0,          // Smooth mutual repulsion
  bubbleAvoidanceRange: 120,     // 3x bubble radius (assuming 40px radius)

  // Boundary repulsion (was boundaryStiffness: 6.0)
  boundaryStiffness: 2.0,        // Gentle
  boundaryDistance: 50,          // Early buffer

  // Motion constraints
  maxSpeed: 0.5,                 // Very slow drift
  damping: 0.992,                // High damping (was ~0.98 or lower)
  maxStepDistance: 5,            // Small max step (was 12)

  // Remove/ignore these if present:
  // curlStrength, flowMix, spreadStrength, desyncStrength
};
```

#### Step 1.3: Implement Elliptical Text Avoidance
**File**: `lib/physics/bubblePhysics.ts`

**Replace text repulsion logic** (around line 400-450):

Current approach uses convex hull point-to-segment distance.
New approach should use elliptical distance for smoother avoidance:

```typescript
function calculateTextAvoidance(bubble, textBounds, params) {
  let fx = 0, fy = 0;

  textBounds.forEach(bound => {
    const centerX = bound.x + bound.width / 2;
    const centerY = bound.y + bound.height / 2;
    const radiusX = bound.width / 2 + params.textRepulsionDistance;
    const radiusY = bound.height / 2 + params.textRepulsionDistance;

    const dx = bubble.position.x - centerX;
    const dy = bubble.position.y - centerY;

    // Normalized elliptical distance
    const normalizedDist = Math.sqrt(
      (dx * dx) / (radiusX * radiusX) +
      (dy * dy) / (radiusY * radiusY)
    );

    if (normalizedDist < 1) {
      // Smooth falloff: closer = stronger
      const strength = (1 - normalizedDist) * params.textRepulsionStiffness;
      const angle = Math.atan2(dy, dx);
      fx += Math.cos(angle) * strength;
      fy += Math.sin(angle) * strength;
    }
  });

  return { fx, fy };
}
```

#### Step 1.4: Implement Smooth Boundary Repulsion
**File**: `lib/physics/bubblePhysics.ts`

**Replace boundary force** (around line 360-380):

Current uses inverse-square (Coulomb) which can be explosive.
New approach uses linear ramp:

```typescript
function calculateBoundaryRepulsion(bubble, boundary, params) {
  let fx = 0, fy = 0;
  const buffer = params.boundaryDistance;
  const radius = bubble.radius;

  // Left boundary
  if (bubble.position.x < buffer + radius) {
    const penetration = (buffer + radius) - bubble.position.x;
    fx += (penetration / buffer) * params.boundaryStiffness;
  }

  // Right boundary
  if (bubble.position.x > boundary.xMax - buffer - radius) {
    const penetration = bubble.position.x - (boundary.xMax - buffer - radius);
    fx -= (penetration / buffer) * params.boundaryStiffness;
  }

  // Top boundary
  if (bubble.position.y < buffer + radius) {
    const penetration = (buffer + radius) - bubble.position.y;
    fy += (penetration / buffer) * params.boundaryStiffness;
  }

  // Bottom boundary
  if (bubble.position.y > boundary.yMax - buffer - radius) {
    const penetration = bubble.position.y - (boundary.yMax - buffer - radius);
    fy -= (penetration / buffer) * params.boundaryStiffness;
  }

  return { fx, fy };
}
```

#### Step 1.5: Simplify Integration
**File**: `lib/physics/bubblePhysics.ts`

**In `updateBubble()` function** (around line 600-650):

1. Calculate all 4 forces
2. Sum forces: `totalFx = ambientFx + textFx + bubbleFx + boundaryFx`
3. Update velocity with force and damping:
   ```typescript
   vx = (vx + totalFx * dt * 0.008) * damping;
   vy = (vy + totalFy * dt * 0.008) * damping;
   ```
4. Clamp to max speed
5. Update position
6. Hard clamp position to boundaries (safety net)

---

### Phase 2: Fix PhysicsHero.tsx State Management

#### Step 2.1: Fix Animation Loop State Bug
**File**: `components/PhysicsHero.tsx`

**Problem location**: Lines 219-256

**Current (BROKEN)**:
```typescript
const bubblesRef = { current: bubbles };  // Captures stale state

const animate = (currentTime) => {
  // ...
  let updatedBubbles = bubblesRef.current;  // Always stale!

  updatedBubbles = updateAllBubbles(...);
  bubblesRef.current = updatedBubbles;  // Only updates ref, not React state

  // Render uses updatedBubbles this frame, but next frame resets
};
```

**Target (FIXED)**:
```typescript
// Remove bubblesRef from animate function entirely

const animate = (currentTime) => {
  // ...

  // Update React state properly with functional setState
  setBubbles(prevBubbles => {
    // Substep integration
    let updatedBubbles = prevBubbles;
    let remaining = deltaTime;
    let safety = 0;

    while (remaining > 0 && safety < 8) {
      const step = Math.min(1, remaining);
      updatedBubbles = updateAllBubbles(
        updatedBubbles,
        boundary,
        textBoundsRef.current,
        timeRef.current,
        step,
        params
      );
      timeRef.current += step;
      remaining -= step;
      safety++;
    }

    return updatedBubbles;
  });

  animationRef.current = requestAnimationFrame(animate);
};
```

**Key changes**:
- Remove `bubblesRef` variable from animate function
- Use `setBubbles(prev => ...)` functional updates
- Physics calculations happen inside the setState callback
- State persists properly between frames

#### Step 2.2: Fix Dependency Array
**File**: `components/PhysicsHero.tsx`

**Problem location**: Line 348

**Current**:
```typescript
}, [boundary, params, imagesLoaded, bubbles, textBounds]);
```

**Issue**: Including `bubbles` in deps causes animation restart whenever state updates

**Target**:
```typescript
}, [boundary, params, imagesLoaded, bubbles.length]);
```

**Rationale**: Only restart if bubble count changes, not on every position update

#### Step 2.3: Adjust Frame Timing for 30fps Target
**File**: `components/PhysicsHero.tsx`

**Location**: Lines 234-236

**Current**:
```typescript
const deltaTime = lastFrameTimeRef.current
  ? Math.min((currentTime - lastFrameTimeRef.current) / 16.67, 3)
  : 1;
```

**Target**:
```typescript
const deltaTime = Math.min(currentTime - lastFrameTimeRef.current, 33.3);  // Cap at 30fps worth
```

**Rationale**: Reference implementation targets 30fps (33.3ms), not 60fps

---

### Phase 3: Rendering - NO CHANGES NEEDED

**DO NOT MODIFY**:
- Canvas drawing code (lines 260-288)
- Image rendering
- Blur filter application
- Rotation transforms
- Sorting logic
- Debug drawing code

All rendering is visual-only and should remain exactly as-is.

---

### Phase 4: Parameter Tuning

After implementation, tune these values while observing behavior:

#### Priority 1 (Core Motion)
- `noiseStrength`: Adjust if drift is too fast/slow (start: 0.25)
- `damping`: Adjust if bubbles won't stop moving (start: 0.992)
- `maxSpeed`: Adjust if bubbles move too fast (start: 0.5)

#### Priority 2 (Avoidance)
- `textRepulsionStiffness`: Adjust if bubbles overlap text (start: 2.0)
- `textRepulsionDistance`: Adjust activation range (start: 150)
- `boundaryStiffness`: Adjust if bubbles escape boundaries (start: 2.0)

#### Priority 3 (Aesthetics)
- `noiseScale`: Adjust smoothness of paths (start: 0.0015)
- `noiseTimeScale`: Adjust how fast patterns evolve (start: 0.0002)
- `bubbleAvoidanceRange`: Adjust spacing (start: 120)

---

## 🧪 Testing Checklist

After implementation, verify:

### Functional Requirements
- [ ] Bubbles never overlap text elements
- [ ] Bubbles never overlap each other
- [ ] Bubbles stay fully within viewport boundaries
- [ ] Motion is smooth and continuous (no stuttering)
- [ ] No visible "teleporting" or discrete jumps

### Aesthetic Requirements (from spec)
- [ ] Movement feels calm and meditative
- [ ] Paths are curved and flowing (not linear)
- [ ] Avoidance looks natural (not like bouncing)
- [ ] Boundary containment is soft (not hitting walls)
- [ ] You can watch for 1 minute and feel relaxed

### Visual Preservation
- [ ] Bubbles still render as PNG images
- [ ] Blur filter (4px) still applied
- [ ] Rotation still animates
- [ ] Hero text unchanged (title, dates, tagline, newsletter)
- [ ] All styling identical to before

### Performance
- [ ] Consistent 30fps (no frame drops)
- [ ] Works on lower-end devices
- [ ] No console errors

---

## 📁 Files to Modify

1. **`lib/physics/bubblePhysics.ts`** (Major changes)
   - Lines 73-91: Update `defaultPhysicsParams`
   - Lines 360-380: Rewrite boundary repulsion
   - Lines 400-450: Rewrite text avoidance
   - Lines 600-700: Simplify force summation
   - Remove curl, spread, desync force functions

2. **`components/PhysicsHero.tsx`** (Minor but critical changes)
   - Lines 219-256: Fix animation loop state management
   - Line 234: Adjust deltaTime calculation for 30fps
   - Line 348: Fix dependency array

---

## 🚫 Files NOT to Modify

- `components/Hero.module.css` - ALL styling preserved
- `components/Bubble.module.css` - ALL styling preserved
- `constants/colors.ts` - Bubble image selection
- Any hero text content
- Any layout/responsive code

---

## 🎯 Success Criteria

**Before**: Bubbles are chaotic, jittery, possibly overlapping text, too fast, broken physics
**After**: Bubbles drift slowly and calmly, smoothly avoid text/boundaries, feel meditative to watch

**Test**: Watch the hero section for 1 minute. If you feel calm rather than agitated → SUCCESS ✅

---

## 🔄 Rollback Plan

If implementation goes wrong:
1. Git stash changes
2. Review this document
3. Re-attempt with smaller steps
4. Test each phase independently before proceeding

---

## Notes

- The reference `bubble-physics.jsx` is standalone demo code (not production)
- We're porting the **concepts and approach**, not copying code directly
- TypeScript types and existing architecture must be maintained
- The existing convex hull calculation can stay (for multiple text elements), but avoidance logic should be simplified
- Perlin noise generator already exists in `lib/physics/perlinNoise.ts` - reuse it
