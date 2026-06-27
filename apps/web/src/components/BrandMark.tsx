import React from "react";

/**
 * The Handoverkey brand mark — a small warm vault SVG used wherever a logo
 * needs to appear: nav bars, auth-page heroes, footers, standalone pages.
 *
 * Matches the visual on the landing page so the product reads as one brand
 * end-to-end. Use this instead of `ShieldCheckIcon` for branding purposes.
 *
 * For functional shield indicators (e.g. "encrypted" status in the UI),
 * keep using `ShieldCheckIcon` from heroicons — that's not the logo.
 */
const BrandMark: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
    <path
      d="M12 2 4 5v7c0 4.5 3 8.5 8 10 5-1.5 8-5.5 8-10V5l-8-3Z"
      className="fill-amber-100 dark:fill-amber-900/40 stroke-amber-700 dark:stroke-amber-400"
      strokeWidth="1.4"
    />
    <circle cx="12" cy="11" r="2.4" className="fill-amber-500" />
    <rect x="11.2" y="11" width="1.6" height="3.2" className="fill-amber-500" />
  </svg>
);

export default BrandMark;
