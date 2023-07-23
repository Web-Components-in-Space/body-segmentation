import { Events } from './events.js';
import { BasePlayer } from './baseplayer.js';

export class VideoElement extends BasePlayer {
    static get observedAttributes() {
        return ['usecamera', 'src', 'islooping', 'playbackrate']
    }
    protected canvasEl?: HTMLCanvasElement;

    protected canvasCtx?: CanvasRenderingContext2D;

    /**
     * video element
     */
    protected videoEl: HTMLVideoElement;

    /**
     * video stream
     */
    protected stream?: MediaStream;

    /**
     * timer for driving playback status
     */
    protected timer?: number;

    /**
     * if component is mounted
     */
    protected isComponentMounted = false;

    /**
     * get access to video element
     */
    public get videoElement() {
        return this.videoEl;
    }

    public get canvasContext() {
        return this.canvasCtx;
    }

    public get canvas() {
        return this.canvasEl;
    }

    /**
     * use camera
     */
    protected _useCamera: boolean = this.hasAttribute('usecamera');

    public get useCamera() {
        return this._useCamera;
    }

    public set useCamera(val: boolean) {
        if (val) {
            this.setAttribute('usecamera', '');
        } else {
            this.removeAttribute('usecamera');
        }
    }

    constructor() {
        super();
        this.attachShadow( { mode: 'open' } );

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    overflow: hidden;
                    position: relative;
                    background-color: black;
                }
                
                :host([hidevideo]) video {
                    display: none;
                }
                
                video, canvas, ::slotted(*) {
                    position: absolute;
                }
            </style>
            <slot></slot>
            <video playsinline></video>
            <canvas></canvas>`;
        }

        this.videoEl = this.shadowRoot?.querySelector('video') as HTMLVideoElement;
        this.canvasEl = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;

        if (this._isLooping) {
            this.videoEl.loop = true;
        }
        this._isPlaying = false;

        this.videoEl.onloadedmetadata = () => this.onMetadata();
        this.videoEl.onloadeddata = () => {
            if (this.hasAttribute('autoplay') || this.hasAttribute('usecamera')) {
                if (this.hasAttribute('mute')) {
                    this.videoEl.muted = true;
                }
                this.play();
            }
        };

        this.videoEl.onpause = () => {
            this._isPlaying = false;
            clearInterval(this.timer as number);
            this.dispatchEvent(new Event(Events.VIDEO_PAUSE, { bubbles: true, composed: true }));
        }

        this.videoEl.onended = () => this.onEnded();

        this.videoEl.onplaying = () => {
            if (this._isPlaying) {
               this.dispatchEvent(new Event(Events.VIDEO_LOOP, { bubbles: true, composed: true }));
            } else {
                this._isPlaying = true;
                this.videoEl.playbackRate = this._playbackRate;
                clearInterval(this.timer as number);
                this.timer = window.setInterval(() => {
                    this.onTimerUpdate();
                }, 100);
                this.dispatchEvent(new Event(Events.VIDEO_PLAY, { bubbles: true, composed: true }));
            }
        }
    }

    protected onTimerUpdate() {
        this._currentTime = this.videoEl.currentTime * 1000;
        this.dispatchEvent(new Event(Events.TIME_UPDATE, { bubbles: true, composed: true }));
    }

    public override pause() {
        this.videoEl.pause();
    }

    public override play() {
        this.videoEl.play();
    }

    public override togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    public override step(frames: number) {
        this.pause();
        // hard coded step value based on 24fps
        this.videoEl.currentTime += .04166 * frames;
    }

    protected override seekTo(val: number) {
        this.videoEl.currentTime = val / 1000;
    }

    protected override changePlaybackRate(rate: number) {
        this.videoEl.playbackRate = rate;
    }

    /**
     * get video element's natural size
     */
    public override get naturalSize() {
        return {
            width: this.videoEl.videoWidth,
            height: this.videoEl.videoHeight
        };
    }

    /**
     * aspect ratio of video
     */
    public override get aspectRatio() {
        return this.naturalSize.width / this.naturalSize.height;
    }

    protected onEnded() {
        clearInterval(this.timer as number);
        this.dispatchEvent(new Event(Events.VIDEO_END, {bubbles: true, composed: true }));
    }

    protected onMetadata() {
        this.resize();
        this.dispatchEvent(new Event(Events.METADATA, { bubbles: true, composed: true }));
        this._duration = this.videoEl.duration * 1000;
    }

    protected override connectedCallback() {
        super.connectedCallback();
        this.isComponentMounted = true;
        // delay loading giving plenty of time to resize and get settled
        // this avoids a resize flash from video sizing itself, and also incorrect size being given to pose detect during launch
        setTimeout( () => this.loadCurrentSource() , 1000 );
    }

    protected async loadCurrentSource() {
        let sourceChange = false;
        if (this.hasAttribute('src')) {
            this.videoEl.srcObject = null;
            this.videoEl.src = this.getAttribute('src') || '';

            if (this.stream) {
                this.stream.getTracks()[0].stop();
                this.stream = undefined;
            }
            sourceChange = true;
        }

        if (this.hasAttribute('usecamera')) {
            this.stream = await navigator.mediaDevices.getUserMedia({
                'audio': true,
                'video': true
            });
            this.videoEl.srcObject = this.stream;
            this.videoEl.muted = true;
            sourceChange = true;
        } else if (!this.hasAttribute('usecamera') && this.videoEl.srcObject) {
            this.videoEl.srcObject = null;
            if (this.stream) {
                this.stream.getTracks()[0].stop();
                this.stream = undefined;
            }
            sourceChange = true;
        }

        if (sourceChange) {
            this.dispatchEvent(new Event(Events.VIDEO_SOURCE_CHANGED, { bubbles: true, composed: true }));
        }
    }

    protected async attributeChangedCallback(name: string, oldval: string, newval: string) {
        switch (name) {
            case 'src':
                this._src = newval;
                if (newval !== oldval && this.isComponentMounted) {
                    this.loadCurrentSource();
                }
                break;
            case 'usecamera':
                this._useCamera = this.hasAttribute('usecamera');
                if (this.isComponentMounted) {
                    this.loadCurrentSource();
                }
                break;

            case 'islooping':
                this._isLooping = this.hasAttribute('islooping');
                this.videoEl.loop = this._isLooping;
                break;

            case 'playbackrate':
                this._playbackRate = Number(this.getAttribute('playbackRate'));
                this.videoEl.playbackRate = this.playbackRate;
                break;

            default:
                break;
        }
    }

    /**
     * update canvas dimensions when resized
     */
    protected resize() {
        const bounds = this.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) {
            return;
        }

        let mediaScaledWidth = bounds.width;
        let mediaScaledHeight = bounds.height;
        const componentAspectRatio = bounds.width/bounds.height;

        // calculate letterbox borders
        let letterBoxLeft: number;
        let letterBoxTop: number;
        if (componentAspectRatio < this.aspectRatio) {
            mediaScaledHeight = bounds.width / this.aspectRatio;
            letterBoxTop = bounds.height/2 - mediaScaledHeight/2;
            letterBoxLeft = 0;
        } else if (componentAspectRatio > this.aspectRatio) {
            mediaScaledWidth = bounds.height * this.aspectRatio;
            letterBoxLeft = bounds.width/2 - mediaScaledWidth/2;
            letterBoxTop = 0;
        } else {
            letterBoxTop = 0;
            letterBoxLeft = 0;
        }

        this.visibleMediaRect.x = letterBoxLeft;
        this.visibleMediaRect.y = letterBoxTop;
        this.visibleMediaRect.width = mediaScaledWidth;
        this.visibleMediaRect.height = mediaScaledHeight;

        // set video to component size
        this.videoEl.setAttribute('width', String(mediaScaledWidth));
        this.videoEl.setAttribute('height', String(mediaScaledHeight));
        this.videoEl.style.left = `${letterBoxLeft}px`;
        this.videoEl.style.top = `${letterBoxTop}px`;

        if (this.canvasEl) {
            this.canvasEl.setAttribute('width', String(mediaScaledWidth));
            this.canvasEl.setAttribute('height', String(mediaScaledHeight));
            this.canvasEl.width = mediaScaledWidth;
            this.canvasEl.height = mediaScaledHeight;
            this.canvasEl.style.left = `${letterBoxLeft}px`;
            this.canvasEl.style.top = `${letterBoxTop}px`;
            this.canvasCtx = this.canvasEl.getContext('2d') as CanvasRenderingContext2D;
        }

        this.shadowRoot?.querySelector('slot')?.assignedElements().forEach( (slotted: any) => {
            slotted.style.width = `${mediaScaledWidth}px`;
            slotted.style.height = `${mediaScaledHeight}px`;
            slotted.style.left = `${letterBoxLeft}px`;
            slotted.style.top = `${letterBoxTop}px`;
        });
    }

    protected disconnectedCallback() {
        clearInterval(this.timer as number);
        this.isComponentMounted = false;
        if (this.stream) {
            const tracks = this.stream.getTracks();
            tracks.forEach( track => {
                track.stop();
            });
        }
    }
}

customElements.define('video-element', VideoElement);
