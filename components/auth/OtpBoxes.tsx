"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * One box per digit of a one-time code. Typing moves to the next box, Backspace to the previous
 * one, and pasting (or the phone's "copy code" / SMS autofill) fills every box at once.
 */
export default function OtpBoxes({
    value,
    onChange,
    length = 6,
    disabled,
    invalid,
    autoFocus,
    onComplete,
}: {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
    invalid?: boolean;
    autoFocus?: boolean;
    onComplete?: (value: string) => void;
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = Array.from({ length }, (_, i) => value[i] ?? "");

    const setFrom = (index: number, typed: string) => {
        const clean = typed.replace(/\D/g, "");
        if (!clean) return;
        const next = (value.slice(0, index) + clean).slice(0, length);
        onChange(next);
        refs.current[Math.min(next.length, length - 1)]?.focus();
        if (next.length === length) onComplete?.(next);
    };

    return (
        <div className="flex justify-center gap-1.5 sm:gap-2" role="group" aria-label="Verification code">
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    value={digit}
                    disabled={disabled}
                    autoFocus={autoFocus && i === 0}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${i + 1}`}
                    maxLength={length}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFrom(i, e.target.value)}
                    onPaste={(e) => {
                        e.preventDefault();
                        setFrom(0, e.clipboardData.getData("text"));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                            e.preventDefault();
                            const at = digit ? i : Math.max(i - 1, 0);
                            onChange(value.slice(0, at) + value.slice(at + 1));
                            refs.current[at]?.focus();
                        } else if (e.key === "ArrowLeft") {
                            refs.current[Math.max(i - 1, 0)]?.focus();
                        } else if (e.key === "ArrowRight") {
                            refs.current[Math.min(i + 1, length - 1)]?.focus();
                        }
                    }}
                    className={cn(
                        "h-12 w-10 sm:h-12 sm:w-11 rounded-lg border bg-white text-center text-lg font-semibold text-slate-900 outline-none transition",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
                        invalid ? "border-destructive" : "border-slate-300",
                    )}
                />
            ))}
        </div>
    );
}
