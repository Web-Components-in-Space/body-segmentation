import { Color } from './bodysegmentation-video';

export * from './tensorflow/bodysegmentation';
// @ts-ignore
import { bodysegmentation } from './libs/body-segmentation-bundle.js';
export class SegmentationResult  {
    public people: any;

    constructor(people: any) {
        this.people = people;
    }

    async toBinaryMask(foreground?: Color,
                       background?: Color,
                       drawContour?: boolean,
                       foregroundThreshold?: number,
                       foregroundMaskValues?: number[] ) {
        return bodysegmentation.toBinaryMask(this.people, foreground, background, drawContour, foregroundThreshold, foregroundMaskValues);
    }
}