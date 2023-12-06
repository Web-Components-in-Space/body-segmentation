export * from './bodysegmentation-video.js';

import { load, processFrame} from './tensorflow/bodysegmentation';

export const BodySegmentation = {
    load, processFrame
}