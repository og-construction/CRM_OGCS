// src/components/LoadingOverlay.jsx
import React from "react";
import { Loader } from "lucide-react";

/**
 * LoadingOverlay component - shows a loading indicator over the content
 * Useful for async operations like form submissions, API calls
 */
const LoadingOverlay = ({ 
  isLoading = false, 
  message = "Loading...", 
  children,
  fullScreen = false,
  blur = true 
}) => {
  if (!isLoading) return children;

  return (
    <div className={fullScreen ? "fixed inset-0" : "relative min-h-screen"}>
      <div
        className={`
          absolute inset-0 bg-black
          ${blur ? "bg-opacity-30 backdrop-blur-sm" : "bg-opacity-10"}
          flex items-center justify-center z-50
        `}
      >
        <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-700 font-medium text-center">{message}</p>
        </div>
      </div>
      {!fullScreen && <div className="invisible">{children}</div>}
    </div>
  );
};

export default LoadingOverlay;

/**
 * Usage Examples:
 * <LoadingOverlay isLoading={isLoading} message="Saving...">
 *   <YourContent />
 * </LoadingOverlay>
 * 
 * <LoadingOverlay isLoading={isSubmitting} message="Creating lead..." fullScreen />
 */
