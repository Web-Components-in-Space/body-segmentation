import {load, processFrame} from './tensorflow/bodysegmentation.js';
import { VideoElement } from './video-element.js';
// @ts-ignore
import { bodysegmentation } from './libs/body-segmentation-bundle.js';

export type Color = { r: Number; g: Number; b: Number; a: Number };

export class SegmentationEvent extends Event {
    public people: any;

    constructor(people: any, props?: EventInit) {
        super('onSegment', props);
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
export class BodySegmentationVideo extends VideoElement {
    override async onMetadata() {
        super.onMetadata();

        const segmenterConfig = {
            runtime: 'tfjs', //'mediapipe', // or 'tfjs'
            solutionPath: this.hasAttribute('solutionPath') ?
                this.getAttribute('solutionPath') :
                'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
            modelType: 'general'
        }
        await load(segmenterConfig);
        await this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if (this.isPlaying && this.videoEl.readyState > 1) {
            const result = await processFrame(this);
            const e = new SegmentationEvent(result);
            this.dispatchEvent(e);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('bodysegmentation-video', BodySegmentationVideo);
