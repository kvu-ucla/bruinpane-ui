import { useState, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type ZoomDirection = "tele" | "wide";

type TeleControllerProps = {
    onZoomStart: (dir: ZoomDirection) => void;
    onZoomStop: () => void;
};

export const TeleController = ({ onZoomStart, onZoomStop }: TeleControllerProps) => {
    const [zoomLevel, setZoomLevel] = useState(50); // 0-100, 50 is middle
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const currentZoomRef = useRef<ZoomDirection | null>(null);

    const handleSliderInteraction = (clientY: number) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const percentage = Math.max(0, Math.min(100, ((rect.height - relativeY) / rect.height) * 100));

        setZoomLevel(percentage);

        // Determine zoom direction based on position relative to center
        const center = 50;
        const deadZone = 10; // 10% dead zone around center

        let newZoom: ZoomDirection | null = null;

        if (percentage > center + deadZone) {
            newZoom = "tele"; // Zoom in (top half)
        } else if (percentage < center - deadZone) {
            newZoom = "wide"; // Zoom out (bottom half)
        }

        // Only send commands when zoom direction changes
        if (newZoom !== currentZoomRef.current) {
            if (currentZoomRef.current !== null) {
                onZoomStop(); // Stop previous zoom
            }

            currentZoomRef.current = newZoom;

            if (newZoom) {
                onZoomStart(newZoom);
            }
        }
    };

    const handlePointerDown = (e: ReactPointerEvent) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        handleSliderInteraction(e.clientY);
    };

    const handlePointerMove = (e: ReactPointerEvent) => {
        if (isDragging) {
            handleSliderInteraction(e.clientY);
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        // Return to center and stop zoom
        setZoomLevel(50);
        if (currentZoomRef.current) {
            currentZoomRef.current = null;
            onZoomStop();
        }
    };

    const thumbPosition = `${100 - zoomLevel}%`; // Invert for top-to-bottom

    return (
        <div className="flex flex-col items-center h-96">
            {/* Tele label */}
            <div className="text-lg font-mono text-gray-600 mb-3 select-none">T</div>

            {/* Slider */}
            <div
                ref={sliderRef}
                className="relative h-72 w-12 bg-gray-300 rounded-full cursor-pointer select-none border-2 border-gray-400"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: "none" }}
            >
                {/* Track */}
                <div className="absolute inset-1.5 bg-gray-100 rounded-full"></div>

                {/* Center mark */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-500 transform -translate-y-1/2"></div>

                {/* Zoom indicators */}
                <div className="absolute -left-8 top-3 text-base text-gray-500">+</div>
                <div className="absolute -left-8 bottom-3 text-base text-gray-500">-</div>

                {/* Slider thumb */}
                <div
                    className={`absolute left-1/2 w-9 h-9 rounded-full shadow-md border-2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-75 ${
                        isDragging
                            ? 'bg-gray-600 border-gray-700'
                            : 'bg-gray-500 border-gray-600'
                    }`}
                    style={{ top: thumbPosition }}
                ></div>
            </div>

            {/* Wide label */}
            <div className="text-lg font-mono text-gray-600 mt-3 select-none">W</div>
        </div>
    );
};

