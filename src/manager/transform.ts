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
        // If bounds are set, clamp x/y to the bounds values.
        if (this.bounds) {
            let minXAllowed: number, maxXAllowed: number, minYAllowed: number, maxYAllowed: number;
            // Compute board pixel dimensions based on DOM and use them with viewport to derive allowed translate ranges.
            // If the scaled board is smaller than the viewport, keep it centered and prevent moving out of view.
            // If the scaled board is larger than the viewport, allow panning so edges can be reached.
            try {
                let allowedExtentX = 0; // positive number: maximum absolute translate allowed by viewport
                let allowedExtentY = 0;
                const boardElem = document.querySelector('#board') as HTMLElement | null;
                const cellElem = document.querySelector('.box') as HTMLElement | null;
                if (boardElem && cellElem) {
                    const rows = boardElem.querySelectorAll('.row');
                    const rowCount = rows.length || 0;
                    const colCount = rows[0] ? rows[0].children.length : 0;
                    const cellRect = cellElem.getBoundingClientRect();
                    const cellW = cellRect.width || 30;
                    const cellH = cellRect.height || 30;
                    const boardWidth = colCount * cellW;
                    const boardHeight = rowCount * cellH;
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;
                    const scaledBoardWidth = boardWidth * this._boardTransform.scale;
                    const scaledBoardHeight = boardHeight * this._boardTransform.scale;

                    if (scaledBoardWidth <= viewportW) {
                        // Board fits horizontally - limit translation so it remains visible centered
                        allowedExtentX = (viewportW - scaledBoardWidth) / 2 + BOUNDS_PADDING;
                    } else {
                        // Board larger horizontally - allow panning so edges can be reached
                        allowedExtentX = (scaledBoardWidth - viewportW) / 2 + BOUNDS_PADDING;
                    }

                    if (scaledBoardHeight <= viewportH) {
                        allowedExtentY = (viewportH - scaledBoardHeight) / 2 + BOUNDS_PADDING;
                    } else {
                        allowedExtentY = (scaledBoardHeight - viewportH) / 2 + BOUNDS_PADDING;
                    }
                }
                minXAllowed = Math.max(this.bounds.minX, -allowedExtentX);
                maxXAllowed = Math.min(this.bounds.maxX, allowedExtentX);
                minYAllowed = Math.max(this.bounds.minY, -allowedExtentY);
                maxYAllowed = Math.min(this.bounds.maxY, allowedExtentY);
            } catch (_e) {
                // If measurement fails, fall back to using bounds only
                minXAllowed = this.bounds.minX;
                maxXAllowed = this.bounds.maxX;
                minYAllowed = this.bounds.minY;
                maxYAllowed = this.bounds.maxY;
            }

            this._boardTransform.x = Math.max(
                minXAllowed,
                Math.min(maxXAllowed, this._boardTransform.x),
            );
            this._boardTransform.y = Math.max(
                minYAllowed,
                Math.min(maxYAllowed, this._boardTransform.y),
            );
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
