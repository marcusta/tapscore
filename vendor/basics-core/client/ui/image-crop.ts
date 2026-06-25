import { Component, Signal, effect } from '../core';
import { OverlayComponent } from './overlay';
import { s } from './css';

const t = (name: string) => `var(--${name})`;

export type ImageCropProps = {
    open: Signal<boolean>;
    aspectRatio?: number;
    cropShape?: 'rect' | 'round';
    onCrop: (blob: Blob) => void;
    onCancel?: () => void;
};

/**
 * ImageCropComponent — a modal image cropper with pan, zoom, and crop mask.
 *
 * Opens an overlay with the selected image. The user pans/zooms the image behind
 * a fixed crop area (circle or rectangle). On "Crop", a canvas extracts the
 * cropped region as a JPEG blob.
 *
 * Call `setImage(file)` to load a File into the cropper and open it.
 */
export class ImageCropComponent extends Component<ImageCropProps> {
    static styles = `
        .ui-crop {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 200;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            padding: ${s('lg')};
            max-width: 95vw;
            max-height: 95vh;
            gap: ${s('md')};
        }
        .ui-crop.open {
            opacity: 1;
            pointer-events: auto;
        }
        .ui-crop__viewport {
            position: relative;
            width: 340px;
            height: 340px;
            overflow: hidden;
            background: #111;
            border-radius: ${t('radius-sm')};
            cursor: grab;
            touch-action: none;
            user-select: none;
        }
        .ui-crop__viewport:active {
            cursor: grabbing;
        }
        .ui-crop__img {
            position: absolute;
            top: 0;
            left: 0;
            transform-origin: 0 0;
            pointer-events: none;
            max-width: none;
        }
        .ui-crop__mask {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }
        .ui-crop__controls {
            display: flex;
            align-items: center;
            gap: ${s('md')};
            width: 100%;
        }
        .ui-crop__label {
            font-size: 0.8rem;
            color: ${t('text-muted')};
            font-weight: 600;
            flex-shrink: 0;
        }
        .ui-crop__slider {
            flex: 1;
            accent-color: ${t('primary')};
        }
        .ui-crop__actions {
            display: flex;
            gap: ${s('sm')};
            justify-content: flex-end;
            width: 100%;
        }
        .ui-crop__btn {
            padding: ${s('sm')} ${s('lg')};
            font-size: 0.875rem;
            font-family: inherit;
            font-weight: 500;
            border: 1px solid ${t('border')};
            border-radius: ${t('radius')};
            cursor: pointer;
            transition: background 0.15s;
        }
        .ui-crop__btn--cancel {
            background: ${t('btn-bg')};
            color: ${t('text')};
        }
        .ui-crop__btn--cancel:hover {
            background: ${t('btn-hover')};
        }
        .ui-crop__btn--crop {
            background: ${t('primary')};
            color: #fff;
            border-color: ${t('primary')};
        }
        .ui-crop__btn--crop:hover {
            filter: brightness(0.9);
        }
        @media (max-width: 480px) {
            .ui-crop__viewport {
                width: 280px;
                height: 280px;
            }
        }
    `;

    // --- State ---
    private imgEl!: HTMLImageElement;
    private canvasEl!: HTMLCanvasElement;
    private maskCanvas!: HTMLCanvasElement;
    private viewportEl!: HTMLElement;
    private imgSrc = '';
    private imgW = 0;
    private imgH = 0;
    private zoom = 1;
    private minZoom = 1;
    private panX = 0;
    private panY = 0;
    private dragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private panStartX = 0;
    private panStartY = 0;
    private lastPinchDist = 0;
    private sliderEl!: HTMLInputElement;

    /** Load a File into the cropper. Sets the image source and opens the modal. */
    setImage(file: File): void {
        const url = URL.createObjectURL(file);
        this.imgSrc = url;
        this.imgEl.onload = () => {
            this.imgW = this.imgEl.naturalWidth;
            this.imgH = this.imgEl.naturalHeight;
            this.resetTransform();
            this.props.open.set(true);
        };
        this.imgEl.src = url;
    }

    render(): HTMLElement {
        const wrapper = document.createElement('div');

        // Overlay
        this.spawn(OverlayComponent, wrapper, {
            open: this.props.open,
            bg: 'rgba(0,0,0,0.6)',
            zIndex: 199,
            scrollLock: true,
            onclose: () => this.handleCancel(),
        });

        // Dialog container
        const dialog = document.createElement('div');
        dialog.className = 'ui-crop';
        dialog.addEventListener('click', (e) => e.stopPropagation());

        // Viewport
        this.viewportEl = document.createElement('div');
        this.viewportEl.className = 'ui-crop__viewport';

        // Image
        this.imgEl = document.createElement('img');
        this.imgEl.className = 'ui-crop__img';
        this.viewportEl.appendChild(this.imgEl);

        // Mask canvas (overlay that darkens area outside crop)
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.className = 'ui-crop__mask';
        this.viewportEl.appendChild(this.maskCanvas);

        // Hidden canvas for crop extraction
        this.canvasEl = document.createElement('canvas');

        // Interaction handlers
        this.viewportEl.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.viewportEl.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.viewportEl.addEventListener('pointerup', () => this.onPointerUp());
        this.viewportEl.addEventListener('pointercancel', () => this.onPointerUp());
        this.viewportEl.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Touch pinch
        this.viewportEl.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.viewportEl.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.viewportEl.addEventListener('touchend', () => { this.lastPinchDist = 0; });

        dialog.appendChild(this.viewportEl);

        // Zoom slider
        const controls = document.createElement('div');
        controls.className = 'ui-crop__controls';

        const label = document.createElement('span');
        label.className = 'ui-crop__label';
        label.textContent = 'Zoom';
        controls.appendChild(label);

        this.sliderEl = document.createElement('input');
        this.sliderEl.type = 'range';
        this.sliderEl.className = 'ui-crop__slider';
        this.sliderEl.min = '1';
        this.sliderEl.max = '5';
        this.sliderEl.step = '0.01';
        this.sliderEl.value = '1';
        this.sliderEl.addEventListener('input', () => {
            this.zoom = Number(this.sliderEl.value);
            this.clampPan();
            this.updateTransform();
        });
        controls.appendChild(this.sliderEl);

        dialog.appendChild(controls);

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'ui-crop__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ui-crop__btn ui-crop__btn--cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', () => this.handleCancel());
        actions.appendChild(cancelBtn);

        const cropBtn = document.createElement('button');
        cropBtn.className = 'ui-crop__btn ui-crop__btn--crop';
        cropBtn.textContent = 'Crop';
        cropBtn.type = 'button';
        cropBtn.addEventListener('click', () => this.doCrop());
        actions.appendChild(cropBtn);

        dialog.appendChild(actions);
        wrapper.appendChild(dialog);

        // Toggle open class
        this.track(effect(() => {
            const isOpen = this.props.open.get();
            dialog.classList.toggle('open', isOpen);
            if (isOpen) {
                // Redraw mask when opened (viewport may now have layout)
                requestAnimationFrame(() => this.drawMask());
            }
        }));

        return wrapper;
    }

    // --- Transform helpers ---

    private get viewportSize(): number {
        return this.viewportEl.offsetWidth || 340;
    }

    private get cropRadius(): number {
        // Crop area is 80% of viewport size
        return this.viewportSize * 0.4;
    }

    private resetTransform(): void {
        const vp = this.viewportSize;
        // Fit the image so its shorter dimension fills the viewport
        const scaleToFit = Math.max(vp / this.imgW, vp / this.imgH);
        this.minZoom = scaleToFit;
        this.zoom = scaleToFit;
        // Center the image
        this.panX = (vp - this.imgW * this.zoom) / 2;
        this.panY = (vp - this.imgH * this.zoom) / 2;
        this.sliderEl.min = String(this.minZoom);
        this.sliderEl.max = String(this.minZoom * 5);
        this.sliderEl.value = String(this.zoom);
        this.updateTransform();
        this.drawMask();
    }

    private clampPan(): void {
        const vp = this.viewportSize;
        const r = this.cropRadius;
        const cx = vp / 2;
        const cy = vp / 2;
        // Ensure the crop circle stays within the image bounds
        const imgRight = this.panX + this.imgW * this.zoom;
        const imgBottom = this.panY + this.imgH * this.zoom;

        // The crop area extends from (cx - r) to (cx + r)
        if (this.panX > cx - r) this.panX = cx - r;
        if (this.panY > cy - r) this.panY = cy - r;
        if (imgRight < cx + r) this.panX = cx + r - this.imgW * this.zoom;
        if (imgBottom < cy + r) this.panY = cy + r - this.imgH * this.zoom;
    }

    private updateTransform(): void {
        this.imgEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    // --- Mask drawing ---

    private drawMask(): void {
        const vp = this.viewportSize;
        this.maskCanvas.width = vp;
        this.maskCanvas.height = vp;
        this.maskCanvas.style.width = `${vp}px`;
        this.maskCanvas.style.height = `${vp}px`;
        const ctx = this.maskCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, vp, vp);

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, vp, vp);

        // Cut out the crop area
        ctx.globalCompositeOperation = 'destination-out';
        const cx = vp / 2;
        const cy = vp / 2;
        const r = this.cropRadius;
        const shape = this.props.cropShape ?? 'round';

        if (shape === 'round') {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const aspect = this.props.aspectRatio ?? 1;
            const w = aspect >= 1 ? r * 2 : r * 2 * aspect;
            const h = aspect >= 1 ? (r * 2) / aspect : r * 2;
            ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
        }

        ctx.globalCompositeOperation = 'source-over';

        // Draw crop border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        if (shape === 'round') {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const aspect = this.props.aspectRatio ?? 1;
            const w = aspect >= 1 ? r * 2 : r * 2 * aspect;
            const h = aspect >= 1 ? (r * 2) / aspect : r * 2;
            ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        }
    }

    // --- Pointer / touch handlers ---

    private onPointerDown(e: PointerEvent): void {
        if (e.pointerType === 'touch') return; // handled by touch events for pinch
        this.dragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.panStartX = this.panX;
        this.panStartY = this.panY;
        this.viewportEl.setPointerCapture(e.pointerId);
    }

    private onPointerMove(e: PointerEvent): void {
        if (!this.dragging || e.pointerType === 'touch') return;
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.panX = this.panStartX + dx;
        this.panY = this.panStartY + dy;
        this.clampPan();
        this.updateTransform();
    }

    private onPointerUp(): void {
        this.dragging = false;
    }

    private onWheel(e: WheelEvent): void {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        this.zoom = Math.max(this.minZoom, Math.min(this.minZoom * 5, this.zoom + delta));
        this.sliderEl.value = String(this.zoom);
        this.clampPan();
        this.updateTransform();
    }

    private touchPanStartX = 0;
    private touchPanStartY = 0;
    private touchStartPanX = 0;
    private touchStartPanY = 0;

    private onTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            this.touchPanStartX = e.touches[0].clientX;
            this.touchPanStartY = e.touches[0].clientY;
            this.touchStartPanX = this.panX;
            this.touchStartPanY = this.panY;
        } else if (e.touches.length === 2) {
            e.preventDefault();
            this.lastPinchDist = this.pinchDist(e.touches);
        }
    }

    private onTouchMove(e: TouchEvent): void {
        if (e.touches.length === 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - this.touchPanStartX;
            const dy = e.touches[0].clientY - this.touchPanStartY;
            this.panX = this.touchStartPanX + dx;
            this.panY = this.touchStartPanY + dy;
            this.clampPan();
            this.updateTransform();
        } else if (e.touches.length === 2 && this.lastPinchDist > 0) {
            e.preventDefault();
            const dist = this.pinchDist(e.touches);
            const scale = dist / this.lastPinchDist;
            this.zoom = Math.max(this.minZoom, Math.min(this.minZoom * 5, this.zoom * scale));
            this.lastPinchDist = dist;
            this.sliderEl.value = String(this.zoom);
            this.clampPan();
            this.updateTransform();
        }
    }

    private pinchDist(touches: TouchList): number {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // --- Crop extraction ---

    private doCrop(): void {
        const vp = this.viewportSize;
        const r = this.cropRadius;
        const aspect = this.props.aspectRatio ?? 1;
        const shape = this.props.cropShape ?? 'round';

        // Crop area in viewport coordinates
        let cropW: number;
        let cropH: number;
        if (shape === 'round') {
            cropW = r * 2;
            cropH = r * 2;
        } else {
            cropW = aspect >= 1 ? r * 2 : r * 2 * aspect;
            cropH = aspect >= 1 ? (r * 2) / aspect : r * 2;
        }

        const cropLeft = (vp - cropW) / 2;
        const cropTop = (vp - cropH) / 2;

        // Convert viewport crop area to image coordinates
        const srcX = (cropLeft - this.panX) / this.zoom;
        const srcY = (cropTop - this.panY) / this.zoom;
        const srcW = cropW / this.zoom;
        const srcH = cropH / this.zoom;

        // Output size: use a reasonable pixel dimension
        const outputSize = 800;
        const outW = shape === 'round' ? outputSize : (aspect >= 1 ? outputSize : outputSize * aspect);
        const outH = shape === 'round' ? outputSize : (aspect >= 1 ? outputSize / aspect : outputSize);

        this.canvasEl.width = outW;
        this.canvasEl.height = outH;
        const ctx = this.canvasEl.getContext('2d')!;
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(this.imgEl, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

        this.canvasEl.toBlob(
            (blob) => {
                if (blob) {
                    this.props.open.set(false);
                    this.props.onCrop(blob);
                }
                this.cleanup();
            },
            'image/jpeg',
            0.9,
        );
    }

    private handleCancel(): void {
        this.props.open.set(false);
        if (this.props.onCancel) this.props.onCancel();
        this.cleanup();
    }

    private cleanup(): void {
        if (this.imgSrc) {
            URL.revokeObjectURL(this.imgSrc);
            this.imgSrc = '';
        }
    }

    onDestroy(): void {
        this.cleanup();
    }
}
