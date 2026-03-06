import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type JoystickProps = {
    onMove?: (x: number, y: number) => void;
};

// Maximum pixel displacement of the thumb from center
const THUMB_MAX_OFFSET = 40;

const normalizeAxis = (delta: number, radius: number, threshold: number): number => {
    if (Math.abs(delta) < threshold) return 0;
    return Math.max(-100, Math.min(100, Math.round((delta / radius) * 100)));
};

export const Joystick = ({ onMove }: JoystickProps) => {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });

    const handleInput = (event: ReactPointerEvent | PointerEvent) => {
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        const box = joystickRef.current?.getBoundingClientRect();
        if (!box) return;

        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;
        const radius = box.width / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const threshold = 30;

        const x = normalizeAxis(dx, radius, threshold);
        const y = normalizeAxis(-dy, radius, threshold);

        setThumbPos({
            x: (x / 100) * THUMB_MAX_OFFSET,
            y: (-y / 100) * THUMB_MAX_OFFSET,
        });

        onMove?.(x, y);
    };

    const stopInput = () => {
        setThumbPos({ x: 0, y: 0 });
        onMove?.(0, 0);
    };

    const startInput = (event: ReactPointerEvent<HTMLDivElement>) => {
        // Key line to retain pointer tracking even outside bounds
        event.currentTarget.setPointerCapture(event.pointerId);

        handleInput(event);

        const moveListener = (e: PointerEvent) => handleInput(e);
        const endListener = () => {
            window.removeEventListener("pointermove", moveListener);
            window.removeEventListener("pointerup", endListener);
            stopInput();
        };

        window.addEventListener("pointermove", moveListener);
        window.addEventListener("pointerup", endListener);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div
                ref={joystickRef}
                onPointerDown={startInput}
                onContextMenu={(e) => e.preventDefault()}
                className="relative h-96 w-96 rounded-full bg-gray-300 text-white select-none cursor-pointer"
                style={{ touchAction: "none", userSelect: "none" }}
            >
                <div className="absolute inset-0 flex items-center text-8xl text-gray-600">
                    <span style={{ transform: "translateX(-0.75rem)" }}>◀</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-end text-8xl text-gray-600">
                    <span style={{ transform: "translateX(0.75rem)" }}>▶</span>
                </div>
                <div className="absolute inset-0 flex justify-center text-8xl text-gray-600">
                    <span style={{ transform: "translateY(-0.75rem)" }}>▲</span>
                </div>
                <div className="absolute inset-0 flex items-end justify-center text-8xl text-gray-600">
                    <span style={{ transform: "translateY(0.75rem)" }}>▼</span>
                </div>

                <div className="absolute top-16 left-16 text-3xl text-gray-400">
                    <span>◢</span>
                </div>
                <div className="absolute top-16 right-16 text-3xl text-gray-400">
                    <span>◣</span>
                </div>
                <div className="absolute bottom-16 left-16 text-3xl text-gray-400">
                    <span>◥</span>
                </div>
                <div className="absolute bottom-16 right-16 text-3xl text-gray-400">
                    <span>◤</span>
                </div>

                <div className="absolute inset-24 flex items-center justify-center rounded-full bg-gray-100">
                    <div className="relative w-full h-full">
                        <div
                            className="absolute left-1/2 top-1/2 h-24 w-24 rounded-full bg-gray-500 transition-transform duration-75"
                            style={{ transform: `translate(calc(-50% + ${thumbPos.x}px), calc(-50% + ${thumbPos.y}px))` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
