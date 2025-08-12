import React from "react";

type Props = {
  text?: string;
  className?: string;
};

// Simpelt genbrugbart tooltip ikon
export const InfoTooltip: React.FC<Props> = ({ text, className }) => {
  if (!text) return null;
  return (
    <span className={`relative inline-flex ${className || ""}`}>
      <span
        tabIndex={0}
        aria-label={text}
        className="peer w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold cursor-help select-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible opacity-0 peer-hover:visible peer-hover:opacity-100 peer-focus:visible peer-focus:opacity-100 transition-opacity duration-150 absolute z-20 top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[80vw] sm:w-56 max-w-[90vw] text-xs leading-snug bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded shadow-lg"
      >
        {text}
        <span className="absolute -top-1 left-4 sm:left-1/2 sm:-translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </span>
    </span>
  );
};

export default InfoTooltip;
