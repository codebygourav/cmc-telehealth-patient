"use client";

/**
 * The portal's dropdown: one look everywhere, with a search box.
 *  - Desktop / tablet: the list opens under the field.
 *  - Phones: the list opens as a bottom drawer (same sheet as the app's other dialogs).
 */

import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface SearchableSelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    value?: string;
    onChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    // Heading of the drawer on phones (defaults to the placeholder).
    title?: string;
    disabled?: boolean;
    invalid?: boolean;
    id?: string;
    name?: string;
    className?: string;
    triggerClassName?: string;
}

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    title,
    disabled = false,
    invalid = false,
    id,
    name,
    className,
    triggerClassName,
}: SearchableSelectProps) {
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [asDrawer, setAsDrawer] = useState(false);
    const [query, setQuery] = useState("");

    const selected = options.find((option) => option.value === value);
    const q = query.trim().toLowerCase();
    const filtered = q === "" ? options : options.filter((option) => option.label.toLowerCase().includes(q));

    const close = () => {
        setOpen(false);
        setQuery("");
    };

    const toggle = () => {
        if (disabled) return;
        if (open) return close();
        // Decided when it opens: a bottom drawer on phones, a list under the field otherwise.
        setAsDrawer(window.matchMedia("(max-width: 639px)").matches);
        setOpen(true);
    };

    const choose = (option: SearchableSelectOption) => {
        if (option.disabled) return;
        onChange(option.value);
        close();
    };

    // Focus the search box when the list opens; close on Escape or a click outside (desktop list).
    useEffect(() => {
        if (!open) return;

        searchRef.current?.focus();

        const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
        const onPointer = (event: MouseEvent) => {
            if (!asDrawer && rootRef.current && !rootRef.current.contains(event.target as Node)) close();
        };

        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onPointer);
        };
    }, [open, asDrawer]);

    const search = (
        <div className="flex items-center gap-2 border-b border-[#EEF0F2] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
            <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        const first = filtered.find((option) => !option.disabled);
                        if (first) choose(first);
                    }
                }}
                placeholder="Search…"
                aria-label="Search options"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8A8A8A]"
            />
        </div>
    );

    const list = (
        <ul id={listId} role="listbox" className={cn("overflow-y-auto overscroll-contain p-1", asDrawer ? "max-h-[55dvh]" : "max-h-64")}>
            {filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                    <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled || undefined}
                        onClick={() => choose(option)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-sm",
                            asDrawer ? "min-h-11 py-2.5" : "py-2",
                            isSelected ? "bg-primary/8 font-semibold text-primary" : "text-[#1F1E1E] hover:bg-[#F3F4F6]",
                            option.disabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <span className="min-w-0 truncate">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </li>
                );
            })}
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-[#6B6B6B]">No matches</li>}
        </ul>
    );

    return (
        <div ref={rootRef} className={cn("relative", className)}>
            <button
                type="button"
                id={id}
                name={name}
                disabled={disabled}
                onClick={toggle}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                className={cn(
                    "flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-white px-4 text-left text-sm font-medium outline-none transition-colors",
                    invalid ? "border-destructive" : "border-[#E2E5E9] hover:border-[#C9CED6]",
                    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15",
                    disabled && "cursor-not-allowed opacity-60",
                    triggerClassName
                )}
            >
                <span className={cn("min-w-0 truncate", selected ? "text-[#1F1E1E]" : "text-[#8A8A8A]")}>{selected ? selected.label : placeholder}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#6B6B6B] transition-transform", open && "rotate-180")} />
            </button>

            {open && !asDrawer && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 min-w-56 overflow-hidden rounded-lg border border-[#E2E5E9] bg-white shadow-[0_12px_28px_rgba(16,24,40,0.14)]">
                    {search}
                    {list}
                </div>
            )}

            {open && asDrawer && (
                <div
                    className="sheet-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={title || placeholder}
                    onClick={(event) => event.target === event.currentTarget && close()}
                >
                    <div className="sheet-panel relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl max-h-[85dvh] flex flex-col">
                        <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b">
                            <h2 className="text-base font-semibold text-[#1F1E1E]">{title || placeholder}</h2>
                            <button type="button" onClick={close} aria-label="Close" className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {search}
                        <div className="overflow-y-auto flex-1 overscroll-contain">
                            {list}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
