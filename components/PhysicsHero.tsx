'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import NewsletterForm from './NewsletterForm';
import styles from './Hero.module.css';

interface PhysicsHeroProps {
  bubbleCount?: number;
  physicsParams?: Partial<PhysicsParams>;
}

const DEBUG_DRAW_TEXT_HULL = false;
const DEBUG_DRAW_BOUNDARY = false;
const DEBUG_DRAW_CONTAINER = false;

export default function PhysicsHero({
  bubbleCount = 5,
  physicsParams = {},
}: PhysicsHeroProps) {
  const t = useTranslations('hero');
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
  const newsletterRef = useRef<HTMLDivElement>(null);

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

  // Initialize and keep boundary in sync with container size
  useEffect(() => {
    if (!containerRef.current) return;

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
      // Use textBoundsRef to ensure we get the latest measured bounds (may be empty at first)
      setBubbles(
        initializeBubbles(bubbleCount, newBoundary, 40, 100, textBoundsRef.current)
      );
    };

    updateBoundary();

    // Handle window resize
    window.addEventListener('resize', updateBoundary);

    // Also observe container size changes directly (locale/layout changes, font loads)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        updateBoundary();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateBoundary);
      if (ro) ro.disconnect();
    };
  }, [bubbleCount]);

  // Measure text bounds for repulsion
  useEffect(() => {
    const measureTextBounds = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const bounds: TextBounds[] = [];

      // Measure each text element
      [titleRef, datesRef, taglineRef, newsletterRef].forEach((ref) => {
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
    if (!canvasRef.current || bubbles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      // Reset transform to avoid accumulating scales across resizes
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Observe container size changes (not only window resizes)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      ro.observe(containerRef.current);
    }

    const animate = (currentTime: number) => {
      if (!ctx) return;

      // Reset time tracking on first frame to prevent large deltas
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time (cap at 33.3ms for 30fps target)
      const deltaTime = Math.min(currentTime - lastFrameTimeRef.current, 33.3);
      lastFrameTimeRef.current = currentTime;

      // Calculate updated bubble positions
      let updatedBubbles = bubbles;
      let remaining = deltaTime / 16.67; // Normalize to frame units
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

      // Update React state for next frame
      setBubbles(updatedBubbles);

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
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary, params, imagesLoaded, bubbles.length]);

  return (
    <section className={styles.hero} ref={containerRef}>
      {/* Background bubble animation disabled - only navigation bubbles remain active */}
      {/* <canvas ref={canvasRef} className={styles.physicsCanvas} /> */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.textInner} ref={titleRef}>
            {t('title')}
          </span>
        </h1>
        <p className={styles.dates}>
          <span className={styles.textInner} ref={datesRef}>
            {t('dates')}
          </span>
        </p>
        <p className={styles.tagline}>
          <span className={styles.textInner} ref={taglineRef}>
            {t('tagline')}
          </span>
        </p>
        <div className={styles.newsletterWrapper} ref={newsletterRef}>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
