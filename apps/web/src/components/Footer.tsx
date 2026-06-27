import React from "react";
import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

/**
 * Site-wide footer. Used on every page (landing, auth, dashboard, standalone).
 * The dashboard's `Layout` renders this below `<Outlet />` so authenticated
 * pages get it for free; standalone pages and the landing render it directly.
 */
const Footer: React.FC = () => (
  <footer className="border-t border-stone-200/70 dark:border-gray-800 py-10 mt-auto">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-2">
        <BrandMark className="h-5 w-5" />
        <span>Handoverkey &middot; {new Date().getFullYear()}</span>
      </div>
      <div className="flex items-center gap-6">
        <Link
          to="/privacy"
          className="hover:text-gray-900 dark:hover:text-white transition"
        >
          Privacy
        </Link>
        <Link
          to="/terms"
          className="hover:text-gray-900 dark:hover:text-white transition"
        >
          Terms
        </Link>
        <Link
          to="/contact"
          className="hover:text-gray-900 dark:hover:text-white transition"
        >
          Contact
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
