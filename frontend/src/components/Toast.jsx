import { useContext } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastContext } from "../context/ToastContext";
import "./Toast.css";

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgClass: "bg-green-50 border-green-200",
    textClass: "text-green-800",
    progressClass: "bg-green-400",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-red-50 border-red-200",
    textClass: "text-red-800",
    progressClass: "bg-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-50 border-amber-200",
    textClass: "text-amber-800",
    progressClass: "bg-amber-400",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50 border-blue-200",
    textClass: "text-blue-800",
    progressClass: "bg-blue-400",
  },
};

function ToastItem({ toast, onClose }) {
  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 ${config.bgClass} border rounded-lg px-4 py-3 shadow-lg animate-toast-slide-in`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.textClass}`} />
      <p className={`flex-1 text-sm font-medium ${config.textClass}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition`}>
        <X className="w-4 h-4" />
      </button>
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${config.progressClass} toast-progress`}
        style={{ animation: "toast-progress 5s linear forwards" }}
      />
    </div>
  );
}

export function Toast() {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
