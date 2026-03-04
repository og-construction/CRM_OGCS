// src/components/SkeletonLoader.jsx
import React from "react";

/**
 * Generic skeleton loader component
 * Use as a placeholder while data is loading
 */
const SkeletonLoader = ({ count = 3, type = "card", fullContainer = false }) => {
  if (type === "card") {
    return (
      <div className={fullContainer ? "w-full space-y-4" : "space-y-4"}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (type === "table-row") {
    return (
      <tbody>
        {Array.from({ length: count }).map((_, i) => (
          <tr key={i} className="border-b">
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  if (type === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        ))}
      </div>
    );
  }

  if (type === "list-item") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  // default
  return <div className="bg-gray-200 rounded-lg h-20 animate-pulse" />;
};

export default SkeletonLoader;

/**
 * Usage Examples:
 * <SkeletonLoader count={5} type="card" />
 * <SkeletonLoader count={10} type="table-row" />
 * <SkeletonLoader count={3} type="text" />
 * <SkeletonLoader count={4} type="list-item" />
 * <SkeletonLoader count={6} type="grid" />
 */
