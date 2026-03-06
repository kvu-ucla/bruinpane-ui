import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export const JoystickDirection = {
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  UpLeft: "upleft",
  UpRight: "upright",
  DownLeft: "downleft",
  DownRight: "downright",
  Stop: "stop",
} as const;

export type JoystickDirection =
    (typeof JoystickDirection)[keyof typeof JoystickDirection];

type JoystickProps = {
    onMove?: (x: number, y: number) => void;
};

const normalizeAxis = (delta: number, radius: number, threshold: number): number => {
    if (Math.abs(delta) < threshold) return 0;
    return Math.max(-100, Math.min(100, Math.round((delta / radius) * 100)));
};

export const Joystick = ({ onMove }: JoystickProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);

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

    // Derive direction for visual thumb positioning
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    let newDirection: JoystickDirection = JoystickDirection.Stop;

    if (absDx > threshold || absDy > threshold) {
      const horizontal = absDx > threshold ? (dx < 0 ? "left" : "right") : "";
      const vertical = absDy > threshold ? (dy < 0 ? "up" : "down") : "";

      if (vertical && horizontal) {
        const combined = vertical + horizontal;
        switch (combined) {
          case "upleft":    newDirection = JoystickDirection.UpLeft;    break;
          case "upright":   newDirection = JoystickDirection.UpRight;   break;
          case "downleft":  newDirection = JoystickDirection.DownLeft;  break;
          case "downright": newDirection = JoystickDirection.DownRight; break;
        }
      } else if (vertical) {
        newDirection = vertical === "up" ? JoystickDirection.Up : JoystickDirection.Down;
      } else if (horizontal) {
        newDirection = horizontal === "left" ? JoystickDirection.Left : JoystickDirection.Right;
      }
    }

    if (newDirection !== direction) setDirection(newDirection);
    onMove?.(x, y);
  };

  const stopInput = () => {
    setDirection(JoystickDirection.Stop);
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

  const thumbTransform = () => {
    const map: Record<JoystickDirection, string> = {
      [JoystickDirection.Stop]: "translate(-50%, -50%)",
      [JoystickDirection.Up]: "translate(-50%, -90%)",
      [JoystickDirection.Down]: "translate(-50%, -10%)",
      [JoystickDirection.Left]: "translate(-90%, -50%)",
      [JoystickDirection.Right]: "translate(-10%, -50%)",
      [JoystickDirection.UpLeft]: "translate(-90%, -90%)",
      [JoystickDirection.UpRight]: "translate(-10%, -90%)",
      [JoystickDirection.DownLeft]: "translate(-90%, -10%)",
      [JoystickDirection.DownRight]: "translate(-10%, -10%)",
    };
    return map[direction];
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
                  style={{ transform: thumbTransform() }}
              />
            </div>
          </div>
        </div>
      </div>
  );
}