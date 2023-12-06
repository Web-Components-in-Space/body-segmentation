// @ts-ignore
import '../libs/tensorflow-bundle.js';
// @ts-ignore
import { bodysegmentation } from '../libs/body-segmentation-bundle.js';
import { VideoElement } from '../video-element.js';
// @ts-ignore
import { BodySegmenter } from '@tensorflow-models/body-segmentation.js';

let segmenter: BodySegmenter;
const model = bodysegmentation.SupportedModels.MediaPipeSelfieSegmentation;

export const load = async function(cfg: any) {
    segmenter = await bodysegmentation.createSegmenter(model, cfg);
}

export const processFrame = async function (source: VideoElement | ImageBitmap | HTMLImageElement | ImageData) {
    const width = ((source as VideoElement).naturalSize?.width || (source as ImageBitmap | HTMLImageElement | ImageData).width );
    const height = ((source as VideoElement).naturalSize?.height || (source as ImageBitmap | HTMLImageElement | ImageData).height );
    const offcanvas = new OffscreenCanvas(width, height);
    const offctx = offcanvas.getContext('2d');
    offctx?.drawImage((source as VideoElement).videoElement || source, 0, 0, width, height);
    if (segmenter?.segmentPeople) {
        return await segmenter.segmentPeople(offcanvas);
    } else {
        return undefined;
    }
}