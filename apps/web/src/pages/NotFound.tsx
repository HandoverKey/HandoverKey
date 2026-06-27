import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <p className="text-6xl font-semibold text-amber-600 dark:text-amber-400 mb-4">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            Page not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
