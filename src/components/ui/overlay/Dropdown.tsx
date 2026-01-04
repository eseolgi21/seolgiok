"use client";
import React, { useRef, useEffect } from "react";

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    trigger: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerClassName?: string;
    widthClassName?: string;
    maxHeightClassName?: string;
    contentClassName?: string;
    end?: boolean;
}

export function Dropdown({
    trigger,
    open,
    onOpenChange,
    children,
    className,
    triggerClassName,
    widthClassName,
    maxHeightClassName,
    contentClassName,
    end,
    ...props
}: DropdownProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, onOpenChange]);

    return (
        <div
            ref={ref}
            className={`dropdown ${end ? "dropdown-end" : ""} ${open ? "dropdown-open" : ""} ${className || ""}`}
            {...props}
        >
            <div
                role="button"
                tabIndex={0}
                className={triggerClassName}
                onClick={() => onOpenChange(!open)}
            >
                {trigger}
            </div>
            {open && (
                <div
                    tabIndex={0}
                    className={`dropdown-content z-[999] menu p-2 shadow bg-base-100 rounded-box ${widthClassName || ""} ${maxHeightClassName || ""} ${contentClassName || ""}`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
