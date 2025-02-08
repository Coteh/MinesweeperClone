export type BoardTransform = {
    x: number;
    y: number;
    scale: number;
};

export type TransformEvent = 'zoom-in' | 'zoom-out' | 'zoom-in-max' | 'zoom-out-max';
export type TransformEventFunction = () => void;

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

export class TransformManager {
    private boardElem: HTMLElement;
    private _boardTransform: BoardTransform;
    private eventListeners: Map<TransformEvent, TransformEventFunction[]>;

    constructor(boardElem: HTMLElement) {
        this.boardElem = boardElem;
        this._boardTransform = {
            x: 0,
            y: 0,
            scale: 1,
        };
        this.eventListeners = new Map<TransformEvent, TransformEventFunction[]>();
    }

    public get boardTransform(): BoardTransform {
        return this._boardTransform;
    }

    public set boardTransform(boardTransform: BoardTransform) {
        this._boardTransform = boardTransform;
    }

    zoomIn() {
        console.log('zoom in clicked', this._boardTransform.scale);

        const zoomFactor = 0.5;
        const currentDistance = this._boardTransform.scale + zoomFactor;

        // Apply the scale transform to the element
        this._boardTransform.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentDistance)); // Limit scale between min and max
        this.adjustBoardTransform(true);
    }

    zoomOut() {
        console.log('zoom out clicked', this._boardTransform.scale);

        const zoomFactor = -0.5;
        const currentDistance = this._boardTransform.scale + zoomFactor;

        // Apply the scale transform to the element
        this._boardTransform.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentDistance)); // Limit scale between min and max
        this.adjustBoardTransform(true);
    }

    resetZoom(clampZoomOut: boolean) {
        console.log('zoom reset clicked', this._boardTransform.scale);

        this._boardTransform.scale = clampZoomOut ? Math.min(1, this._boardTransform.scale) : 1;
        this._boardTransform.x = 0;
        this._boardTransform.y = 0;
        this.adjustBoardTransform(true);
    }

    addEventListener(event: TransformEvent, listener: TransformEventFunction) {
        if (!this.eventListeners.get(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(listener);
    }

    adjustBoardTransform(useTransition: boolean) {
        const translateRule = `translate(${this._boardTransform.x}px, ${this._boardTransform.y}px)`;
        const scaleRule = `scale(${this._boardTransform.scale})`;
        if (useTransition) this.boardElem.style.transition = 'transform 0.25s';
        this.boardElem.style.transform = `${translateRule}${scaleRule}`;
        if (useTransition) {
            setTimeout(() => {
                this.boardElem.style.transition = '';
            }, 10);
        }

        if (this._boardTransform.scale > MIN_ZOOM) {
            this.triggerEvent('zoom-in');
        } else {
            this.triggerEvent('zoom-out-max');
        }
        if (this._boardTransform.scale < MAX_ZOOM) {
            this.triggerEvent('zoom-out');
        } else {
            this.triggerEvent('zoom-in-max');
        }

        (document.querySelector(
            '#x'
        ) as HTMLSpanElement).innerText = this._boardTransform.x.toString();
        (document.querySelector(
            '#y'
        ) as HTMLSpanElement).innerText = this._boardTransform.y.toString();
        (document.querySelector(
            '#zoom'
        ) as HTMLSpanElement).innerText = this._boardTransform.scale.toString();
    }

    private triggerEvent(event: TransformEvent) {
        const events = this.eventListeners.get(event);
        if (!events || event.length === 0) {
            return;
        }
        for (let event of events) {
            event();
        }
    }
}
