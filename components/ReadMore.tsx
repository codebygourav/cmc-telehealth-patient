"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Long content is shown up to `collapsedHeight` with a fade and a "Read more" button; short
 * content is shown as is (no button). Re-measured when the content or the window size changes.
 */
export default function ReadMore({
    children,
    collapsedHeight = 180,
    className,
}: {
    children: ReactNode;
    collapsedHeight?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => setOverflows(el.scrollHeight > collapsedHeight + 24);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [collapsedHeight, children]);

    const clamped = overflows && !expanded;

    return (
        <div className={className}>
            <div
                ref={ref}
                className={cn("relative overflow-hidden transition-[max-height] duration-300")}
                style={{ maxHeight: clamped ? collapsedHeight : undefined }}
            >
                {children}
                {clamped && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />}
            </div>
            {overflows && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
                >
                    {expanded ? "Show less" : "Read more"}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
}
