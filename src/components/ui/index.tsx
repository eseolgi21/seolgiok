import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }
export function Button({ className, ...props }: ButtonProps) {
    return <button className={`btn ${className || ""}`} {...props} />;
}

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    errorText?: string;
}
export function InputField({ className, errorText, ...props }: InputFieldProps) {
    return (
        <div className="w-full">
            <input className={`input input-bordered w-full focus:border-[#d4b886] focus:outline-none focus:ring-1 focus:ring-[#d4b886] ${className || ""}`} {...props} />
            {errorText && <p className="text-error text-xs mt-1">{errorText}</p>}
        </div>
    );
}

export interface PasswordFieldProps extends Omit<InputFieldProps, 'type' | 'onChange'> {
    value: string;
    onChange: (value: string) => void;
}

export function PasswordField({ className, errorText, onChange, ...props }: PasswordFieldProps) {
    return (
        <div className="w-full">
            <input
                type="password"
                className={`input input-bordered w-full focus:border-[#d4b886] focus:outline-none focus:ring-1 focus:ring-[#d4b886] ${className || ""}`}
                onChange={(e) => onChange(e.target.value)}
                {...props}
            />
            {errorText && <p className="text-error text-xs mt-1">{errorText}</p>}
        </div>
    );
}

export function Form(props: React.FormHTMLAttributes<HTMLFormElement>) {
    return <form {...props} />;
}

export interface LabeledFieldProps {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
export function LabeledField({ label, icon, children, className }: LabeledFieldProps) {
    return (
        <label className={`form-control w-full ${className || ""}`}>
            <div className="label">
                <span className="label-text flex gap-2 items-center">
                    {icon}
                    {label}
                </span>
            </div>
            {children}
        </label>
    );
}

export { ToastProvider, useToast } from "./feedback/Toast-provider";
