/**
 * 3D Perlin Noise Implementation
 *
 * Mathematical Background:
 * - Perlin noise is a gradient noise function: P: ℝ³ → ℝ
 * - Uses integer lattice with random gradients at each vertex
 * - Interpolates smoothly between lattice points using quintic fade: f(t) = 6t⁵ - 15t⁴ + 10t³
 * - Produces band-limited noise with no directional artifacts
 *
 * Reference: Ken Perlin (2002), "Improving Noise"
 */

export class PerlinNoise {
  private permutation: number[];
  private gradients3D: number[][];

  constructor(seed?: number) {
    // Initialize permutation table (0-255)
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using seed (simple LCG for determinism)
    const random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.permutation[i], this.permutation[j]] =
        [this.permutation[j], this.permutation[i]];
    }

    // Double the permutation to avoid overflow
    this.permutation = [...this.permutation, ...this.permutation];

    // 3D gradient vectors (12 edge directions of a cube)
    this.gradients3D = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
  }

  /**
   * Seeded random number generator (LCG)
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Fade function: 6t⁵ - 15t⁴ + 10t³
   * This ensures C² continuity (smooth second derivatives)
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Dot product of gradient vector and distance vector
   */
  private grad3(hash: number, x: number, y: number, z: number): number {
    const h = hash % 12;
    const g = this.gradients3D[h];
    return g[0] * x + g[1] * y + g[2] * z;
  }

  /**
   * 3D Perlin noise at point (x, y, z)
   * Returns value in approximately [-1, 1]
   */
  public noise3D(x: number, y: number, z: number): number {
    // Find unit cube containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative position in cube
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    // Compute fade curves
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    // Hash coordinates of 8 cube corners
    const p = this.permutation;
    const aaa = p[p[p[X] + Y] + Z];
    const aba = p[p[p[X] + Y + 1] + Z];
    const aab = p[p[p[X] + Y] + Z + 1];
    const abb = p[p[p[X] + Y + 1] + Z + 1];
    const baa = p[p[p[X + 1] + Y] + Z];
    const bba = p[p[p[X + 1] + Y + 1] + Z];
    const bab = p[p[p[X + 1] + Y] + Z + 1];
    const bbb = p[p[p[X + 1] + Y + 1] + Z + 1];

    // Compute dot products with gradients
    const x1 = this.lerp(
      this.grad3(aaa, xf, yf, zf),
      this.grad3(baa, xf - 1, yf, zf),
      u
    );
    const x2 = this.lerp(
      this.grad3(aba, xf, yf - 1, zf),
      this.grad3(bba, xf - 1, yf - 1, zf),
      u
    );
    const y1 = this.lerp(x1, x2, v);

    const x3 = this.lerp(
      this.grad3(aab, xf, yf, zf - 1),
      this.grad3(bab, xf - 1, yf, zf - 1),
      u
    );
    const x4 = this.lerp(
      this.grad3(abb, xf, yf - 1, zf - 1),
      this.grad3(bbb, xf - 1, yf - 1, zf - 1),
      u
    );
    const y2 = this.lerp(x3, x4, v);

    return this.lerp(y1, y2, w);
  }

  /**
   * Fractional Brownian Motion (multi-octave noise)
   * Combines multiple frequencies for richer detail
   *
   * Mathematical form:
   * fBm(x) = Σ(i=0 to octaves-1) amplitude^i * noise(frequency^i * x)
   */
  public fbm3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 4,
    frequency: number = 1,
    amplitude: number = 1,
    lacunarity: number = 2,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let freq = frequency;
    let amp = amplitude;

    for (let i = 0; i < octaves; i++) {
      value += amp * this.noise3D(x * freq, y * freq, z * freq);
      freq *= lacunarity;
      amp *= persistence;
    }

    return value;
  }

  /**
   * Gradient of noise function (analytical approximation via finite differences)
   * Returns ∇P = (∂P/∂x, ∂P/∂y, ∂P/∂z)
   *
   * For force fields: F = -σ ∇P
   */
  public gradient3D(
    x: number,
    y: number,
    z: number,
    h: number = 0.01
  ): { dx: number; dy: number; dz: number } {
    const dx = (this.noise3D(x + h, y, z) - this.noise3D(x - h, y, z)) / (2 * h);
    const dy = (this.noise3D(x, y + h, z) - this.noise3D(x, y - h, z)) / (2 * h);
    const dz = (this.noise3D(x, y, z + h) - this.noise3D(x, y, z - h)) / (2 * h);

    return { dx, dy, dz };
  }
}

// Singleton instance for consistent noise across application
let globalNoiseInstance: PerlinNoise | null = null;

export function getGlobalNoise(): PerlinNoise {
  if (!globalNoiseInstance) {
    globalNoiseInstance = new PerlinNoise(42); // Fixed seed for reproducibility
  }
  return globalNoiseInstance;
}

