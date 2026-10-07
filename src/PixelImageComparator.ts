import { Buffer } from 'node:buffer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface PixelComparisonOptions {
    threshold?: number;
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

        if (imageA.width === 0 || imageA.height === 0 || imageB.width === 0 || imageB.height === 0) {
            throw new Error('Images must have nonzero dimensions.');
        }

        if (imageA.width === imageB.width && imageA.height === imageB.height) {
            return this.compareAligned(imageA, imageB);
        }

        return this.compareUnaligned(imageA, imageB);
    }

    private compareAligned(imageA: PNG, imageB: PNG): PixelComparisonResult {
        const { width, height } = imageA;
        const diff = new PNG({ width, height });
        const differentPixels = pixelmatch(
            imageA.data, imageB.data, diff.data, width, height,
            { threshold: this.threshold, includeAA: this.includeAA },
        );

        return this.result(width, height, width * height, differentPixels, diff);
    }

    /**
     * Full-page screenshots often differ in height. Compare the shared rectangle,
     * and count every pixel that exists in only one image as a change.
     */
    private compareUnaligned(imageA: PNG, imageB: PNG): PixelComparisonResult {
        const width = Math.max(imageA.width, imageB.width);
        const height = Math.max(imageA.height, imageB.height);
        const overlapWidth = Math.min(imageA.width, imageB.width);
        const overlapHeight = Math.min(imageA.height, imageB.height);
        const overlapA = this.crop(imageA, overlapWidth, overlapHeight);
        const overlapB = this.crop(imageB, overlapWidth, overlapHeight);
        const overlapDiff = new PNG({ width: overlapWidth, height: overlapHeight });
        let differentPixels = pixelmatch(
            overlapA.data, overlapB.data, overlapDiff.data, overlapWidth, overlapHeight,
            { threshold: this.threshold, includeAA: this.includeAA },
        );

        const diff = new PNG({ width, height });
        this.fill(diff, 255, 255, 255);
        this.blit(overlapDiff, diff);
        differentPixels += this.paintExclusive(diff, imageA, imageB);

        const totalPixels = imageA.width * imageA.height
            + imageB.width * imageB.height
            - overlapWidth * overlapHeight;

        return this.result(width, height, totalPixels, differentPixels, diff);
    }

    private result(
        width: number,
        height: number,
        totalPixels: number,
        differentPixels: number,
        diff: PNG,
    ): PixelComparisonResult {
        return {
            score: (differentPixels / totalPixels) * 100,
            differentPixels,
            totalPixels,
            width,
            height,
            diffImage: PNG.sync.write(diff),
        };
    }

    private crop(source: PNG, width: number, height: number): PNG {
        if (source.width === width && source.height === height) {
            return source;
        }

        const cropped = new PNG({ width, height });
        this.blit(source, cropped);
        return cropped;
    }

    private blit(source: PNG, target: PNG): void {
        const rowBytes = source.width * 4;

        for (let y = 0; y < source.height; y++) {
            const start = y * source.width * 4;
            source.data.copy(target.data, y * target.width * 4, start, start + rowBytes);
        }
    }

    private fill(image: PNG, red: number, green: number, blue: number): void {
        for (let offset = 0; offset < image.data.length; offset += 4) {
            image.data[offset] = red;
            image.data[offset + 1] = green;
            image.data[offset + 2] = blue;
            image.data[offset + 3] = 255;
        }
    }

    /** Paints pixels present in only one image and returns how many were painted. */
    private paintExclusive(diff: PNG, imageA: PNG, imageB: PNG): number {
        let extra = 0;

        for (let y = 0; y < diff.height; y++) {
            for (let x = 0; x < diff.width; x++) {
                const inA = x < imageA.width && y < imageA.height;
                const inB = x < imageB.width && y < imageB.height;

                if (inA === inB) {
                    continue;
                }

                const offset = (y * diff.width + x) * 4;
                diff.data[offset] = 255;
                diff.data[offset + 1] = 0;
                diff.data[offset + 2] = 0;
                diff.data[offset + 3] = 255;
                extra++;
            }
        }

        return extra;
    }
}