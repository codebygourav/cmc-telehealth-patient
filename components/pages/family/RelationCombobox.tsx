"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationComboboxProps {
    id: string;
    // A relation key ("son") or `customKey` with the typed text in `label`.
    relationship: string;
    label: string;
    options: [string, string][];
    customKey: string;
    onChange: (relationship: string, label: string) => void;
    invalid?: boolean;
    className?: string;
}

/** Pick a relation from the list or type your own (e.g. "Aunt") in the same field. */
export default function RelationCombobox({ id, relationship, label, options, customKey, onChange, invalid, className }: RelationComboboxProps) {
    const listId = useId();
    const wrapper = useRef<HTMLDivElement>(null);
    const selectedText = relationship === customKey ? label : options.find(([key]) => key === relationship)?.[1] ?? "";
    const [text, setText] = useState(selectedText);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    // Keep the text in step when the value changes from outside (edit / reset / restored draft).
    useEffect(() => setText(selectedText), [selectedText]);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const query = text.trim().toLowerCase();
    const exact = options.find(([, optionLabel]) => optionLabel.toLowerCase() === query);
    // Show everything while the field holds a chosen option, otherwise filter by what is typed.
    const filtered = useMemo(
        () => (!query || exact ? options : options.filter(([, optionLabel]) => optionLabel.toLowerCase().includes(query))),
        [options, query, exact],
    );
    const showCustom = Boolean(query) && !exact;
    const items: { key: string; label: string; custom?: boolean }[] = [
        ...filtered.map(([key, optionLabel]) => ({ key, label: optionLabel })),
        ...(showCustom ? [{ key: customKey, label: text.trim(), custom: true }] : []),
    ];

    const type = (next: string) => {
        setText(next);
        setOpen(true);
        setActive(0);
        const match = options.find(([, optionLabel]) => optionLabel.toLowerCase() === next.trim().toLowerCase());
        if (match) onChange(match[0], "");
        else if (next.trim()) onChange(customKey, next.trim());
        else onChange("", "");
    };

    const choose = (item: { key: string; label: string }) => {
        onChange(item.key, item.key === customKey ? item.label : "");
        setText(item.label);
        setOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, items.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && open && items[active]) {
            e.preventDefault();
            choose(items[active]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapper} className="relative">
            <input
                id={id}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                className={cn(className, "pr-9", invalid && "border-destructive")}
                value={text}
                placeholder="Select or type"
                maxLength={50}
                onChange={(e) => type(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
            />
            <button type="button" tabIndex={-1} aria-label="Show relations" onClick={() => setOpen((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]">
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>

            {open && items.length > 0 && (
                <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#E7E8EB] bg-white py-1 shadow-lg">
                    {items.map((item, index) => {
                        const selected = item.custom ? relationship === customKey : item.key === relationship;
                        return (
                            <li key={`${item.key}-${item.label}`} role="option" aria-selected={selected}
                                onMouseDown={(e) => { e.preventDefault(); choose(item); }}
                                onMouseEnter={() => setActive(index)}
                                className={cn(
                                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                                    index === active ? "bg-primary/10 text-primary" : "text-[#1F1E1E]",
                                    item.custom && "border-t border-[#E7E8EB]",
                                )}>
                                <span className="flex min-w-0 items-center gap-2">
                                    {item.custom && <Plus className="h-4 w-4 shrink-0" />}
                                    <span className="truncate">{item.custom ? `Use “${item.label}”` : item.label}</span>
                                </span>
                                {selected && !item.custom && <Check className="h-4 w-4 shrink-0" />}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
