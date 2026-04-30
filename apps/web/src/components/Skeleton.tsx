import React from "react";
import { twMerge } from "tailwind-merge";

interface SkeletonProps {
  variant?: "text" | "circle" | "card";
  className?: string;
}

const variantClasses: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "rounded h-4 w-full",
  circle: "rounded-full",
  card: "rounded-2xl h-32 w-full",
};

const Skeleton: React.FC<SkeletonProps> = ({ variant = "text", className }) => (
  <div
    className={twMerge(
      "animate-pulse bg-gray-200 dark:bg-gray-700",
      variantClasses[variant],
      className,
    )}
    aria-hidden="true"
  />
);

export default Skeleton;
