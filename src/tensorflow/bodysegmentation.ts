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

export const processFrame = async function (source: VideoElement) {
    const offcanvas = new OffscreenCanvas(source.naturalSize.width, source.naturalSize.height);
    const offctx = offcanvas.getContext('2d');
    offctx?.drawImage(source.videoElement, 0, 0, source.naturalSize.width, source.naturalSize.height)
    return await segmenter.segmentPeople(offcanvas);
}