import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    success: (message, duration) =>
      context.addToast(message, "success", duration),
    error: (message, duration) =>
      context.addToast(message, "error", duration ?? 6000),
    info: (message, duration) => context.addToast(message, "info", duration),
    warning: (message, duration) =>
      context.addToast(message, "warning", duration),
    dismiss: (id) => context.removeToast(id),
  };
}
