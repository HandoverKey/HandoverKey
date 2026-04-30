import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  variant?: "text" | "circle" | "card";
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ variant = "text", className }) => (
  <div
    className={clsx(
      "animate-pulse bg-gray-200 dark:bg-gray-700",
      {
        "rounded h-4 w-full": variant === "text",
        "rounded-full": variant === "circle",
        "rounded-2xl h-32 w-full": variant === "card",
      },
      className,
    )}
    aria-hidden="true"
  />
);

export default Skeleton;
