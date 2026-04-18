export type BoardTransform = {
    x: number;
    y: number;
    scale: number;
};

export type TransformEvent = 'zoom-in' | 'zoom-out' | 'zoom-in-max' | 'zoom-out-max';
export type TransformEventFunction = () => void;

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

// Extra pixels added to the computed pan extent so that zoom gestures near the
// board edge have room to breathe before hitting the hard boundary.
const BOUNDS_PADDING = 300;

import type { Bounds } from '../config';

export class TransformManager {
    private boardElem: HTMLElement;
    private _boardTransform: BoardTransform;
    private eventListeners: Map<TransformEvent, TransformEventFunction[]>;
    private bounds?: Bounds | null;

    constructor(boardElem: HTMLElement) {
        this.boardElem = boardElem;
        this._boardTransform = {
            x: 0,
            y: 0,
            scale: 1,
        };
        this.eventListeners = new Map<TransformEvent, TransformEventFunction[]>();
        this.bounds = null;
    }

    public setBounds(bounds: Bounds | null) {
        this.bounds = bounds;
        // Ensure current transform respects new bounds
        this.adjustBoardTransform(false);
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

    zoomAtPoint(
        currMidX: number,
        currMidY: number,
        prevMidX: number,
        prevMidY: number,
        distanceRatio: number,
    ) {
        const oldScale = this._boardTransform.scale;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale * distanceRatio));
        const actualRatio = newScale / oldScale;

        // Get the current visible center of this.boardElem in viewport pixels (post-transform).
        // vcx/vcy are at the current scale, so (point - vcx) is a viewport-scaled offset,
        // not an element-local/pre-scale offset. Converting to element-local would divide by
        // oldScale, but that factor cancels with the oldScale inside actualRatio, so the
        // formula is correct as written directly in viewport-scaled coordinates.
        const rect = this.boardElem.getBoundingClientRect();
        const vcx = rect.left + rect.width / 2;
        const vcy = rect.top + rect.height / 2;

        // Translate so that the content under prevMidpoint moves to currMidpoint
        // after the scale change, keeping the pinch point stationary in the viewport.
        this._boardTransform.x += currMidX - vcx - (prevMidX - vcx) * actualRatio;
        this._boardTransform.y += currMidY - vcy - (prevMidY - vcy) * actualRatio;
        this._boardTransform.scale = newScale;

        this.adjustBoardTransform(false);
    }

    addEventListener(event: TransformEvent, listener: TransformEventFunction) {
        if (!this.eventListeners.get(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(listener);
    }

    adjustBoardTransform(useTransition: boolean) {
        if (this.bounds) {
            // Start from the config hard limits; tighten with dynamic extent if possible.
            let minX = this.bounds.minX;
            let maxX = this.bounds.maxX;
            let minY = this.bounds.minY;
            let maxY = this.bounds.maxY;

            try {
                const cellElem = document.querySelector('.box') as HTMLElement | null;
                const rows = document.querySelectorAll('#board .row');
                if (cellElem && rows.length > 0) {
                    // getBoundingClientRect reflects the current CSS scale, so these
                    // dimensions are already in post-transform viewport pixels.
                    const cellRect = cellElem.getBoundingClientRect();
                    const boardW = (rows[0].children.length || 0) * (cellRect.width || 30);
                    const boardH = rows.length * (cellRect.height || 30);

                    // How far the board center may shift before its edge leaves the
                    // viewport. The Math.abs handles both "board smaller than viewport"
                    // and "board larger than viewport" with the same formula.
                    const extentX = Math.abs(boardW - window.innerWidth) / 2 + BOUNDS_PADDING;
                    const extentY = Math.abs(boardH - window.innerHeight) / 2 + BOUNDS_PADDING;

                    // Intersect dynamic extent with config hard limits.
                    minX = Math.max(this.bounds.minX, -extentX);
                    maxX = Math.min(this.bounds.maxX, extentX);
                    minY = Math.max(this.bounds.minY, -extentY);
                    maxY = Math.min(this.bounds.maxY, extentY);
                }
            } catch (_e) {
                // DOM not ready; config limits unchanged.
            }

            this._boardTransform.x = Math.max(minX, Math.min(maxX, this._boardTransform.x));
            this._boardTransform.y = Math.max(minY, Math.min(maxY, this._boardTransform.y));
        }

        const translateRule = `translate(${this._boardTransform.x}px, ${this._boardTransform.y}px)`;
        const scaleRule = `scale(${this._boardTransform.scale})`;
        if (useTransition) this.boardElem.style.transition = 'transform 0.25s';
        this.boardElem.style.transform = `${translateRule}${scaleRule}`;
        if (useTransition) {
            setTimeout(() => {
                this.boardElem.style.transition = '';
            }, 10);
        }

        this.triggerEvent(this._boardTransform.scale > MIN_ZOOM ? 'zoom-in' : 'zoom-out-max');
        this.triggerEvent(this._boardTransform.scale < MAX_ZOOM ? 'zoom-out' : 'zoom-in-max');

        (document.querySelector('#x') as HTMLSpanElement).innerText =
            this._boardTransform.x.toString();
        (document.querySelector('#y') as HTMLSpanElement).innerText =
            this._boardTransform.y.toString();
        (document.querySelector('#zoom') as HTMLSpanElement).innerText =
            this._boardTransform.scale.toString();
    }

    private triggerEvent(event: TransformEvent) {
        const events = this.eventListeners.get(event);
        if (!events || event.length === 0) {
            return;
        }
        for (const event of events) {
            event();
        }
    }
}
