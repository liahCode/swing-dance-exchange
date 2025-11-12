# Bubble Physics Specification

## Design Philosophy

**Primary Goal: AESTHETIC FIRST**

The bubbles exist to create a calming, visually pleasing ambient background that reflects the relaxed and slightly playful vibe of the swing dance exchange event. Every technical decision should serve the aesthetic goal.

## Core Principles

1. **Beauty Over Physics**: Physical accuracy is secondary to visual appeal
2. **Calm Over Chaos**: Smooth, gentle, organic motion
3. **Subtle Over Bold**: Background element, not main attraction
4. **Organic Over Mechanical**: No linear paths, no hard bounces, no sudden changes

---

## Behavioral Requirements

### Movement Character
- **Speed**: Slow to moderate drift
- **Style**: Organic, flowing curves (like objects floating in calm water)
- **Smoothness**: Continuous, no jerky direction changes
- **Variation**: Each bubble should feel slightly unique in its movement pattern
- **Predictability**: Gentle enough to be calming, varied enough to stay interesting

**Anti-patterns to AVOID**:
- ❌ Linear motion
- ❌ Hard bounces off boundaries
- ❌ Sudden direction changes
- ❌ Jittery/vibrating motion
- ❌ Chaotic/frenetic energy
- ❌ Visible "teleporting" or discrete jumps

### Text Interaction
- **Rule**: Bubbles must NEVER overlap the main text
- **Behavior**: Gentle, anticipatory avoidance (like water flowing around rocks)
- **Buffer**: Maintain comfortable clearance around text
- **Aesthetic**: The avoidance itself should look natural and flowing, not like "bouncing off" text

### Bubble-to-Bubble Interaction
- **Rule**: Bubbles must NEVER overlap each other
- **Behavior**: Gentle mutual repulsion
- **Aesthetic**: Should look like bubbles naturally maintaining personal space, not like colliding billiard balls
- **Smoothness**: Repulsion force should ramp up smoothly as bubbles approach

### Boundary Behavior
- **Rule**: Bubbles must always remain fully visible within viewport
- **Behavior**: Very soft, gentle repulsion from edges
- **Effect**: Should feel like bubbles are "staying in the room" naturally, not hitting walls
- **Buffer**: Small comfortable distance from edge before repulsion begins
- **Strength**: Just enough to keep them in bounds, no violent bouncing

---

## Technical Parameters

### Quantity
- **Count**: 5 bubbles total
- **Rationale**: Enough to create ambient motion without cluttering

### Performance
- **Target**: 30 FPS (33.3ms per frame)
- **Priority**: Smooth consistent frame rate > higher frame rate with stutters
- **Optimization**: Prefer simpler calculations that hit 30fps reliably over complex physics that struggles

### Visual Presence
- **Role**: Subtle background decoration
- **Attention**: Should enhance without distracting
- **Visibility**: Clearly visible but not dominating the hero section

---

## Physics Implementation Guidelines

### Force System (if using physics engine)

**Recommended Force Types**:
1. **Ambient Drift**: Primary driving force
   - Slow, continuous motion
   - Based on smooth noise (Perlin/Simplex)
   - Very low magnitude for gentle movement

2. **Avoidance Forces**: Repel from obstacles (text, other bubbles, boundaries)
   - Smooth falloff (no sharp transitions)
   - Activate early with gentle strength
   - Ramp up smoothly as distance decreases

3. **Damping**: High damping for calm motion
   - Prevent runaway acceleration
   - Create "floating in thick air" feeling

**Force Magnitude Hierarchy**:
- Avoidance forces should dominate when needed (prevent overlap)
- Ambient drift should dominate when space is clear (natural motion)
- Transition between them should be seamless

### Motion Characteristics

**Velocity**:
- Max speed: SLOW (prefer aesthetic slowness over realism)
- Acceleration: Gradual
- Deceleration: Smooth

**Trajectory**:
- Curved, flowing paths
- Gentle direction changes over time
- No sharp corners or reversals

**Timing**:
- Each bubble could have slight timing offset (desync) for variation
- But movements should remain coherent and calm

---

## Quality Criteria (How to Judge Success)

### ✅ Good Bubble Behavior Looks Like:
- You could watch them for 30 seconds and find it pleasant/meditative
- Movement feels "natural" even if not physically accurate
- Text remains perfectly readable at all times
- Bubbles maintain comfortable spacing from each other
- No visual "glitches" or jarring moments
- Feels cohesive with the overall site aesthetic (relaxed, welcoming)

### ❌ Bad Bubble Behavior Looks Like:
- Annoying or distracting
- Jittery, jerky, or stuttering motion
- Bubbles overlapping text (even momentarily)
- Bubbles overlapping each other
- Violent bouncing or sudden direction changes
- Feels "broken" or "buggy"
- Too fast or too chaotic

---

## Implementation Approach

### Phase 1: Simplify (If reworking existing system)
1. Strip away complexity that doesn't serve the aesthetic goal
2. Reduce force magnitudes dramatically
3. Increase damping significantly
4. Fix any technical bugs (state management, timing)

### Phase 2: Tune for Aesthetic
1. Iterate on force magnitudes until movement feels calm
2. Adjust avoidance ranges to feel natural
3. Test with actual text content in hero section
4. Verify smooth 30fps performance

### Phase 3: Polish
1. Add subtle variation between bubbles (if needed)
2. Ensure consistent behavior across different screen sizes
3. Test on lower-end devices
4. Fine-tune timing and speeds

---

## Open Questions / Future Considerations

- Should bubbles respond to mouse/touch interaction?
- Should bubble sizes vary or remain uniform?
- Should there be any fade-in animation on page load?
- Should physics pause when hero is not visible (performance)?
- Should bubble count adapt to screen size?

---

## Success Metric

**The ultimate test**: Can you watch the bubbles for 1 minute and feel more relaxed rather than more agitated?

If yes → ✅ Spec achieved
If no → ⚠️ Keep tuning
