import React from "react";

const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gray-900 dark:focus:bg-white focus:text-white dark:focus:text-gray-900 focus:rounded-full focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
  >
    Skip to main content
  </a>
);

export default SkipLink;
