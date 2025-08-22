import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  text?: string;
  className?: string;
};

// Simpelt genbrugbart tooltip ikon
export const InfoTooltip: React.FC<Props> = ({ text, className }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = btnRef.current;
    const tip = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const maxWidth = Math.min(384, window.innerWidth - 16);
    tip.style.maxWidth = `${maxWidth}px`;
    const left = Math.max(
      8,
      Math.min(window.innerWidth - 8, r.left + r.width / 2)
    );
    tip.style.left = `${left}px`;
    tip.style.top = `${r.bottom + margin}px`;
    tip.style.transform = "translateX(-50%)";
  }, [open]);

  if (!text) return null;

  return (
    <span className={`inline-flex ${className || ""}`}>
      <span
        ref={btnRef}
        tabIndex={0}
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold cursor-help select-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        i
      </span>
      {open
        ? createPortal(
            <div
              ref={tipRef}
              role="tooltip"
              className="fixed z-[1000] text-xs leading-snug bg-gray-900 text-white px-3 py-2 rounded shadow-lg pointer-events-none"
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </span>
  );
};

export default InfoTooltip;
