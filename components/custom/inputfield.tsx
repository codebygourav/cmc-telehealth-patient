// components/ui/InputField.tsx
"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { RegisterOptions, useFormContext } from "react-hook-form";

type InputFieldProps = {
    name: string;
    label?: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    validation?: RegisterOptions;
    inputClassName?: string;
    maxLength?: number;
    // Password inputs: show an eye button to see what is typed.
    revealable?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({
    name,
    label,
    type = "text",
    required = false,
    placeholder,
    className = "",
    disabled = false,
    validation,
    inputClassName = "",
    maxLength,
    revealable = false,
}) => {
    const [revealed, setRevealed] = useState(false);
    const canReveal = revealable && type === "password";
    const {
        register,
        formState: { errors },
    } = useFormContext();

    const errorMessage = errors[name]?.message as string | undefined;

    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className="font-source-sans text-muted-foreground text-sm font-medium mb-2"
                >
                    {label}
                    {required && (
                        <span className="text-destructive text-base font-semibold ml-0.5">
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="relative">
            <ShadcnInput
                {...register(name, validation)}
                id={name}
                type={canReveal && revealed ? "text" : type}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={!!errorMessage}
                className={`h-10 font-source-sans ${inputClassName || 'bg-accent/30 text-foreground border'} ${errorMessage ? "border-destructive" : inputClassName ? '' : "border-border"
                    } focus:ring-1 focus:ring-primary focus:border-transparent ${type === 'password' ? 'pr-10' : ''} ${type === 'tel' ? 'hide-spin-buttons' : ''}`}
                maxLength={maxLength}
            />
            {canReveal && (
                <button
                    type="button"
                    onClick={() => setRevealed((v) => !v)}
                    disabled={disabled}
                    aria-label={revealed ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                    {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            )}
            </div>

            {errorMessage && (
                <p className="text-destructive text-xs mt-1 font-normal">
                    {errorMessage}
                </p>
            )}
        </div>
    );
};

export default InputField;