"use client";

import { useState } from "react";
import { useSheetTransition } from "@/lib/use-sheet-transition";
import SheetCloseButton from "@/components/SheetCloseButton";

type Props = {
  open: boolean;
  title: string;
  options: string[];
  value: string[];
  onApply: (selected: string[]) => void;
  onClose: () => void;
};

/** Bottom sheet of toggleable chips. Multi-select; "적용하기" returns the picks. */
export default function ChipSheet({ open, title, options, value, onApply, onClose }: Props) {
  const { render, show } = useSheetTransition(open);
  if (!render) return null;
  return (
    <ChipSheetPanel
      show={show}
      title={title}
      options={options}
      value={value}
      onApply={onApply}
      onClose={onClose}
    />
  );
}

function ChipSheetPanel({
  show,
  title,
  options,
  value,
  onApply,
  onClose,
}: Omit<Props, "open"> & { show: boolean }) {
  const [sel, setSel] = useState<string[]>(value);

  const toggle = (o: string) =>
    setSel((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]));

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`relative w-full max-w-[430px] rounded-t-3xl bg-card p-4 pb-7 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out ${
            show ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <SheetCloseButton onClick={onClose} />
          <h3 className="mb-3 pr-9 text-[15px] font-bold text-ink">{title}</h3>
        <div className="no-scrollbar flex max-h-[42vh] flex-wrap gap-2 overflow-y-auto">
          {options.map((o) => {
            const active = sel.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  active ? "bg-sunset text-white" : "bg-muted text-ink-soft"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onApply(sel)}
          className="mt-4 w-full rounded-xl bg-sunset py-3 text-[15px] font-semibold text-white"
        >
          적용하기
        </button>
        </div>
      </div>
    </div>
  );
}
