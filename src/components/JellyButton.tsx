"use client";

import {
  forwardRef,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { growHold, releaseSettle } from "@/lib/jelly-tap";

/**
 * A functional button whose press feels like jelly: it springs up and stays
 * enlarged while held (no action yet), then bounces back to full size on
 * release — and only then runs its onClick. Pointer drives touch/mouse;
 * keyboard activation plays a quick bounce before acting. Drop-in for <button>.
 */
const JellyButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function JellyButton(
    { className = "", onClick, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, ...rest },
    ref,
  ) {
    const pressed = useRef(false);
    const viaPointer = useRef(false);

    const down = (e: PointerEvent<HTMLButtonElement>) => {
      pressed.current = true;
      growHold(e.currentTarget);
      onPointerDown?.(e);
    };
    const up = (e: PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(e);
      if (!pressed.current) return;
      pressed.current = false;
      viaPointer.current = true;
      const el = e.currentTarget;
      const evt = e;
      void releaseSettle(el).then(() => onClick?.(evt as unknown as MouseEvent<HTMLButtonElement>));
      // clear the pointer guard if no follow-up click ever arrives
      window.setTimeout(() => {
        viaPointer.current = false;
      }, 700);
    };
    const abort = (e: PointerEvent<HTMLButtonElement>) => {
      if (!pressed.current) return;
      pressed.current = false;
      void releaseSettle(e.currentTarget); // cancelled — settle without acting
    };
    const leave = (e: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      abort(e);
    };
    const cancel = (e: PointerEvent<HTMLButtonElement>) => {
      onPointerCancel?.(e);
      abort(e);
    };
    const click = (e: MouseEvent<HTMLButtonElement>) => {
      if (viaPointer.current) {
        // the pointer path already handled (or will handle) this activation
        viaPointer.current = false;
        return;
      }
      // keyboard / programmatic activation: quick bounce, then act
      const el = e.currentTarget;
      growHold(el);
      void releaseSettle(el).then(() => onClick?.(e));
    };

    return (
      <button
        ref={ref}
        className={`jelly ${className}`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={leave}
        onPointerCancel={cancel}
        onClick={click}
        {...rest}
      />
    );
  },
);

export default JellyButton;
