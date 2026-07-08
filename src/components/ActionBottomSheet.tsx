"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSheetTransition } from "@/lib/use-sheet-transition";
import SheetCloseButton from "@/components/SheetCloseButton";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  onClose: () => void;
  secondaryLabel?: string;
  primaryTone?: "brand" | "danger";
  pending?: boolean;
  primaryDisabled?: boolean;
  ariaLabel?: string;
};

export default function ActionBottomSheet({
  open,
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  onClose,
  secondaryLabel,
  primaryTone = "brand",
  pending = false,
  primaryDisabled = false,
  ariaLabel,
}: Props) {
  const { render, show } = useSheetTransition(open);

  if (!render || typeof document === "undefined") return null;

  const close = () => {
    if (!pending) onClose();
  };
  const primaryClass =
    primaryTone === "danger"
      ? "bg-[var(--error)] text-white"
      : "bg-sunset text-white";

  // Prefer the phone-frame portal root (#app-shell) so on desktop the sheet lands
  // inside the pushed-right device frame — rebased + clipped by its transform —
  // instead of centering on the whole viewport. Falls back to body off-shell.
  const portalTarget = document.getElementById("app-shell") ?? document.body;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
          className={`relative w-full max-w-[430px] rounded-t-3xl bg-card px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out ${
            show ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <SheetCloseButton onClick={close} />
          <h3 className="pr-9 text-[17px] font-black leading-tight text-ink">{title}</h3>
          {description && (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{description}</p>
          )}
          {children}
          <div className="mt-5 flex gap-2">
            {secondaryLabel && (
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-xl border border-line bg-card px-4 py-3 text-[14px] font-semibold text-ink-soft disabled:opacity-50"
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onPrimary}
              disabled={pending || primaryDisabled}
              className={`min-h-12 flex-1 rounded-xl px-4 py-3 text-[14px] font-semibold disabled:opacity-50 ${primaryClass}`}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
