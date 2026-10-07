import { Buffer } from 'node:buffer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface PixelComparisonOptions {
    /** Per-pixel color tolerance, from 0 (strict) to 1 (lenient). */
    threshold?: number;
    /** Count anti-aliased pixels as differences. Defaults to false. */
    includeAA?: boolean;
}

export interface PixelComparisonResult {
    score: number;
    differentPixels: number;
    totalPixels: number;
    width: number;
    height: number;
    diffImage: Uint8Array;
}

export class PixelImageComparator {
    private readonly threshold: number;
    private readonly includeAA: boolean;

    constructor(options: PixelComparisonOptions = {}) {
        this.threshold = options.threshold ?? 0.1;
        this.includeAA = options.includeAA ?? false;

        if (!Number.isFinite(this.threshold) || this.threshold < 0 || this.threshold > 1) {
            throw new RangeError('threshold must be between 0 and 1.');
        }
    }

    /** Accepts encoded PNG bytes, such as Filesystem.read() results. */
    public compare(first: Uint8Array, second: Uint8Array): PixelComparisonResult {
        const imageA = PNG.sync.read(Buffer.from(first));
        const imageB = PNG.sync.read(Buffer.from(second));

        if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
            throw new Error(
                `Image dimensions must match: ${imageA.width}x${imageA.height} versus ${imageB.width}x${imageB.height}.`,
            );
        }

        const { width, height } = imageA;
        const totalPixels = width * height;
        if (totalPixels === 0) {
            throw new Error('Images must have nonzero dimensions.');
        }
        const diff = new PNG({ width, height });
        const differentPixels = pixelmatch(
            imageA.data, imageB.data, diff.data, width, height,
            { threshold: this.threshold, includeAA: this.includeAA },
        );

        return {
            score: (differentPixels / totalPixels) * 100,
            differentPixels,
            totalPixels,
            width,
            height,
            diffImage: PNG.sync.write(diff),
        };
    }
}