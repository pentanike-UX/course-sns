/**
 * "Jelly" press for functional buttons (close, back, toggles, map controls…).
 * Instead of the global shrink-on-press, they spring UP while held and stay
 * enlarged for as long as the finger is down; the action only fires once the
 * finger lifts and the button bounces back to full size. Built on the Web
 * Animations API so it composites off the main thread.
 */

const HOLD_SCALE = 1.2;

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAnimate = (el: HTMLElement) =>
  !reduceMotion() && typeof el.animate === "function";

/** Grow to the held size and stay there (forwards fill) while pressed. */
export function growHold(el: HTMLElement) {
  if (!canAnimate(el)) return;
  el.getAnimations().forEach((a) => a.cancel());
  el.animate([{ transform: "scale(1)" }, { transform: `scale(${HOLD_SCALE})` }], {
    duration: 150,
    easing: "cubic-bezier(0.34, 1.4, 0.5, 1)",
    fill: "forwards",
  });
}

/** Bounce from the held size back to full size; resolves once it has settled. */
export function releaseSettle(el: HTMLElement): Promise<void> {
  if (!canAnimate(el)) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const anim = el.animate(
      [
        { transform: `scale(${HOLD_SCALE})` },
        { transform: "scale(0.97)", offset: 0.55 },
        { transform: "scale(1.03)", offset: 0.8 },
        { transform: "scale(1)" },
      ],
      { duration: 240, easing: "cubic-bezier(0.34, 1.4, 0.5, 1)" },
    );
    // drop the hold's forwards-fill so it can't snap back to the held size
    el.getAnimations().forEach((a) => {
      if (a !== anim) a.cancel();
    });
    anim.onfinish = done;
    anim.oncancel = done;
    setTimeout(done, 300);
  });
}
