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
    static override get observedAttributes() {
        return [...super.observedAttributes, 'active'];
    }

    /**
     * is segmentation processing active?
     */
    protected _active: boolean = this.hasAttribute('active');

    public get active() {
        return this._active;
    }

    public set active(val: boolean) {
        if (val) {
            this.setAttribute('active', '');
        } else {
            this.removeAttribute('active');
        }
    }

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
        if (this.active) {
            await this.poseDetectionFrame();
        }
    }

    async poseDetectionFrame() {
        if (this.isPlaying && this.videoEl.readyState > 1 && this.active) {
            const result = await processFrame(this);
            const e = new SegmentationEvent(result);
            this.dispatchEvent(e);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }

    protected override async attributeChangedCallback(name: string, oldval: string, newval: string) {
        await super.attributeChangedCallback(name, oldval, newval);
        switch (name) {
            case 'active':
                this._active = this.hasAttribute('active');
                if (this._active) {
                    this.poseDetectionFrame();
                }
                break;
        }
    }
}

customElements.define('bodysegmentation-video', BodySegmentationVideo);
