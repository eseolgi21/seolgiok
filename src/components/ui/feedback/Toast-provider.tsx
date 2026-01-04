"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastProps = {
    title?: string;
    description?: string;
    variant?: "default" | "success" | "error" | "warning";
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    duration?: number;
};

type ToastContextType = {
    toast: (props: ToastProps) => void;
};

const ToastContext = createContext<ToastContextType>({
    toast: () => { },
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback(({ title, description, variant = "default", duration = 3000 }: ToastProps) => {
        console.log("Toast:", title, description);
        // Minimal implementation: just log for now, or could implement simple state
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
        </ToastContext.Provider>
    );
}
