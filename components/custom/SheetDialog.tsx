"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SheetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    /** Buttons kept visible at the bottom (above the phone's home bar). */
    footer?: ReactNode;
    /** Desktop width, e.g. "sm:max-w-lg" (default) or "sm:max-w-5xl". */
    className?: string;
    bodyClassName?: string;
}

/**
 * Dialog on desktop, bottom sheet on phones: fixed header, scrolling body and a footer
 * whose buttons always stay visible.
 */
export default function SheetDialog({ open, onOpenChange, title, description, children, footer, className, bodyClassName }: SheetDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg",
                    "max-sm:max-h-[92dvh] max-sm:overflow-hidden max-sm:p-0 max-sm:pt-3",
                    className,
                )}
            >
                <div className="shrink-0 border-b border-[#E7E8EB] px-4 pt-3 pb-3 pr-12 sm:px-6 sm:pt-5 sm:pb-4">
                    <DialogTitle className="text-lg font-semibold text-[#1F1E1E]">{title}</DialogTitle>
                    {description && <DialogDescription className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</DialogDescription>}
                </div>
                <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6", bodyClassName)}>{children}</div>
                {footer && (
                    <div className="shrink-0 border-t border-[#E7E8EB] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
