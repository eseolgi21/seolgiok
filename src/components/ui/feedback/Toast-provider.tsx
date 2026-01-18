"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type ToastVariant = "default" | "success" | "error" | "warning";

type ToastProps = {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
};

type ToastOptions = Omit<ToastProps, "id">;

type ToastContextType = {
    toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType>({
    toast: () => { },
});

export const useToast = () => useContext(ToastContext);

// --- Internal Components ---

const ToastIcon = ({ variant }: { variant: ToastVariant }) => {
    switch (variant) {
        case "success": return <CheckCircleIcon className="w-6 h-6" />;
        case "error": return <ExclamationCircleIcon className="w-6 h-6" />;
        case "warning": return <ExclamationTriangleIcon className="w-6 h-6" />;
        default: return <InformationCircleIcon className="w-6 h-6" />;
    }
};

const ToastItem = ({ id, title, description, variant = "default", onClose }: ToastProps & { onClose: (id: string) => void }) => {
    // Determine alert class based on variant
    let alertClass = "alert";
    if (variant === "success") alertClass += " alert-success";
    else if (variant === "error") alertClass += " alert-error";
    else if (variant === "warning") alertClass += " alert-warning";
    else alertClass += " alert-info";

    return (
        <div className={`${alertClass} shadow-lg flex flex-row items-start gap-3 min-w-[320px] animate-in slide-in-from-right-full duration-300`}>
            <div className="flex-shrink-0 pt-1">
                <ToastIcon variant={variant} />
            </div>
            <div className="flex-1">
                {title && <h3 className="font-bold text-sm">{title}</h3>}
                {description && <div className="text-xs opacity-90">{description}</div>}
            </div>
            <button
                onClick={() => onClose(id)}
                className="btn btn-xs btn-ghost btn-circle"
                aria-label="Close"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(({ title, description, variant = "default", duration = 3000 }: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: ToastProps = { id, title, description, variant, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* DaisyUI Toast Container */}
            <div className="toast toast-top toast-end z-[9999] gap-2 p-4">
                {toasts.map((t) => (
                    <ToastItem key={t.id} {...t} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
