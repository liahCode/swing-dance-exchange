'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BubbleState,
  Boundary,
  PhysicsParams,
  TextBounds,
  Vec2,
  defaultPhysicsParams,
  getTextHullPoints,
  initializeBubbles,
  updateAllBubbles,
} from '@/lib/physics/bubblePhysics';
import { getBubbleImage } from '@/constants/colors';
import styles from './Hero.module.css';

interface PhysicsHeroProps {
  bubbleCount?: number;
  physicsParams?: Partial<PhysicsParams>;
}

const DEBUG_DRAW_TEXT_HULL = false;
const DEBUG_DRAW_BOUNDARY = false;
const DEBUG_DRAW_CONTAINER = false;

export default function PhysicsHero({
  bubbleCount = 15,
  physicsParams = {},
}: PhysicsHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [boundary, setBoundary] = useState<Boundary>({
    xMin: 0,
    xMax: 1000,
    yMin: 0,
    yMax: 600,
  });

  // Text element refs for measuring bounds
  const titleRef = useRef<HTMLSpanElement>(null);
  const datesRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLSpanElement>(null);

  // Text bounds state
  const [textBounds, setTextBounds] = useState<TextBounds[]>([]);
  const [textBoundsReady, setTextBoundsReady] = useState(false);

  // Merge custom params with defaults
  const params: PhysicsParams = { ...defaultPhysicsParams, ...physicsParams };

  // Animation state
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Preload bubble images
  const bubbleImagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Ref for textBounds to use in animation without restarting
  const textBoundsRef = useRef<TextBounds[]>([]);
  const textHullRef = useRef<Vec2[]>([]);
  const boundaryRef = useRef<Boundary | null>(null);
  const containerBoundaryRef = useRef<Boundary | null>(null);

  // Load bubble images
  useEffect(() => {
    const imagePromises = Array.from({ length: 12 }, (_, i) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const bubbleFile = getBubbleImage(i + 1);
        img.src = `/bubbles/${bubbleFile}`;
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error(`Failed to load bubble image ${bubbleFile}:`, e);
          reject(e);
        };
      });
    });

    Promise.all(imagePromises)
      .then((images) => {
        bubbleImagesRef.current = images;
        setImagesLoaded(true);
      })
      .catch((err) => console.error('Failed to load bubble images:', err));
  }, []);

  // Initialize bubbles when container size is known AND text bounds are measured
  useEffect(() => {
    if (!containerRef.current || !textBoundsReady) return;

    const updateBoundary = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const newBoundary: Boundary = {
        xMin: 0,
        xMax: rect.width,
        yMin: 0,
        yMax: rect.height,
      };

      setBoundary(newBoundary);
      boundaryRef.current = newBoundary;
      containerBoundaryRef.current = {
        xMin: 0,
        xMax: rect.width,
        yMin: 0,
        yMax: rect.height,
      };
      // Use textBoundsRef to ensure we get the latest measured bounds
      setBubbles(initializeBubbles(bubbleCount, newBoundary, 40, 100, textBoundsRef.current));
    };

    updateBoundary();

    // Handle window resize
    window.addEventListener('resize', updateBoundary);
    return () => window.removeEventListener('resize', updateBoundary);
  }, [bubbleCount, textBoundsReady]);

  // Measure text bounds for repulsion
  useEffect(() => {
    const measureTextBounds = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const bounds: TextBounds[] = [];

      // Measure each text element
      [titleRef, datesRef, taglineRef].forEach((ref) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          // Convert to canvas coordinates (relative to container)
          bounds.push({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
            right: rect.left - containerRect.left + rect.width,
            bottom: rect.top - containerRect.top + rect.height,
          });
        }
      });

      if (bounds.length === 0) {
        console.warn('[PhysicsHero] No text bounds found for measurement');
      }

      const hull = getTextHullPoints(bounds);
      textHullRef.current = hull;

      setTextBounds(bounds);
      textBoundsRef.current = bounds;
      setTextBoundsReady(true);
    };

    // Initial measurement
    measureTextBounds();

    // Re-measure on resize
    window.addEventListener('resize', measureTextBounds);
    return () => window.removeEventListener('resize', measureTextBounds);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || bubbles.length === 0 || !imagesLoaded || textBounds.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Use ref to track current bubbles
    const bubblesRef = { current: bubbles };

    const animate = (currentTime: number) => {
      if (!ctx) return;

      // Reset time tracking on first frame to prevent large deltas
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time (cap at 50ms to prevent large jumps)
      const deltaTime = lastFrameTimeRef.current
        ? Math.min((currentTime - lastFrameTimeRef.current) / 16.67, 3) // Normalize to ~60fps
        : 1;
      lastFrameTimeRef.current = currentTime;

      // Update physics (dt = 1 frame unit)
      const updatedBubbles = updateAllBubbles(
        bubblesRef.current,
        boundary,
        textBoundsRef.current,
        timeRef.current,
        deltaTime,
        params
      );

      bubblesRef.current = updatedBubbles;
      timeRef.current += deltaTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bubbles (largest first so smaller ones render on top)
      const sortedBubbles = [...updatedBubbles].sort((a, b) => b.radius - a.radius);
      for (const bubble of sortedBubbles) {
        const img = bubbleImagesRef.current[bubble.color - 1];
        if (!img) continue;

        ctx.save();

        // Apply blur for depth effect
        ctx.filter = 'blur(4px)';

        // Apply rotation transform
        ctx.translate(bubble.position.x, bubble.position.y);
        ctx.rotate(bubble.rotation);

        // Draw bubble centered at origin (after translation)
        ctx.drawImage(
          img,
          -bubble.radius,
          -bubble.radius,
          bubble.radius * 2,
          bubble.radius * 2
        );

        ctx.restore();
      }

      if (DEBUG_DRAW_TEXT_HULL && textHullRef.current.length >= 2) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        const hull = textHullRef.current;
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
          ctx.lineTo(hull[i].x, hull[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      if (DEBUG_DRAW_CONTAINER && containerBoundaryRef.current) {
        const c = containerBoundaryRef.current;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(
          c.xMin,
          c.yMin,
          c.xMax - c.xMin,
          c.yMax - c.yMin
        );
        ctx.restore();
      }

      if (DEBUG_DRAW_BOUNDARY && boundaryRef.current) {
        const b = boundaryRef.current;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 200, 120, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
          b.xMin,
          b.yMin,
          b.xMax - b.xMin,
          b.yMax - b.yMin
        );
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [boundary, params, imagesLoaded, bubbles, textBounds]);

  return (
    <section className={styles.hero} ref={containerRef}>
      <canvas ref={canvasRef} className={styles.physicsCanvas} />
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.textInner} ref={titleRef}>
            Queer Swing Dance
            <br />
            Exchange Zürich
          </span>
        </h1>
        <p className={styles.dates}>
          <span className={styles.textInner} ref={datesRef}>
            19th - 21st June 2026
          </span>
        </p>
        <p className={styles.tagline}>
          <span className={styles.textInner} ref={taglineRef}>
            Stay tuned for more information!
          </span>
        </p>
      </div>
    </section>
  );
}

