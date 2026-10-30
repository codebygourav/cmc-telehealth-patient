"use client";

import {
    SlidersHorizontal,
    X,
    Hospital,
    Video,
    RotateCcw,
    Check,
    Search,
} from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConsultationType } from "@/types/browse-doctors";

interface DoctorFilterDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    consultationType: ConsultationType;
    onConsultationTypeChange: (value: ConsultationType) => void;
    specialty: string;
    onSpecialtyChange: (value: string) => void;
    specialtyOptions: { value: string; label: string }[];
    onClearFilters: () => void;
    totalCount: number;
}

export function DoctorFilterDrawer({
    open,
    onOpenChange,
    searchTerm,
    onSearchChange,
    consultationType,
    onConsultationTypeChange,
    specialty,
    onSpecialtyChange,
    specialtyOptions,
    onClearFilters,
    totalCount,
}: DoctorFilterDrawerProps) {
    const activeCount =
        (searchTerm.trim() ? 1 : 0) +
        (specialty !== "all" ? 1 : 0) +
        (consultationType !== "all" ? 1 : 0);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="p-0 border-t border-border/80 bg-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 px-5 pt-3 pb-3">
                    <div>
                        <DrawerTitle className="text-lg font-bold text-gray-900">
                            Filters & Search
                        </DrawerTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Showing {totalCount} matching specialist{totalCount === 1 ? "" : "s"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={onClearFilters}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded cursor-pointer"
                            >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset</span>
                            </button>
                        )}
                        <DrawerClose asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DrawerClose>
                    </div>
                </div>

                {/* Scrollable Filters Body */}
                <div className="overflow-y-auto px-5 py-4 space-y-5 max-h-[60dvh] overscroll-contain">
                    {/* 1. Search Doctor */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            Search Doctor
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search by doctor or hospital name..."
                                // text-base to prevent iOS Safari auto-zoom!
                                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-10 pr-9 text-base sm:text-sm font-medium outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => onSearchChange("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Appointment Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            Appointment Type
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {/* All Types */}
                            <button
                                type="button"
                                onClick={() => onConsultationTypeChange("all")}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                                    consultationType === "all"
                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">All Appointment Types</p>
                                    <p className="text-xs text-muted-foreground">Video consult and hospital clinic visits</p>
                                </div>
                                {consultationType === "all" && (
                                    <Check className="h-4 w-4 shrink-0 text-primary font-bold" />
                                )}
                            </button>

                            {/* Video Consultation */}
                            <button
                                type="button"
                                onClick={() => onConsultationTypeChange("video")}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                                    consultationType === "video"
                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                        consultationType === "video" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                    )}>
                                        <Video className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">Video Consultation</p>
                                        <p className="text-xs text-muted-foreground">Online standard consultation from anywhere</p>
                                    </div>
                                </div>
                                {consultationType === "video" && (
                                    <Check className="h-4 w-4 shrink-0 text-primary font-bold" />
                                )}
                            </button>

                            {/* In-Person Consultation */}
                            <button
                                type="button"
                                onClick={() => onConsultationTypeChange("in-person")}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                                    consultationType === "in-person"
                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                        consultationType === "in-person" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                    )}>
                                        <Hospital className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">In-Person Consultation</p>
                                        <p className="text-xs text-muted-foreground">In-person physical hospital clinic visit</p>
                                    </div>
                                </div>
                                {consultationType === "in-person" && (
                                    <Check className="h-4 w-4 shrink-0 text-primary font-bold" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 3. Specialty / Department */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                            Specialty / Department
                        </label>
                        <div className="relative">
                            <select
                                value={specialty}
                                onChange={(e) => onSpecialtyChange(e.target.value)}
                                // text-base to prevent iPhone auto-zoom!
                                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3 text-base sm:text-sm font-medium outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                            >
                                {specialtyOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quick specialty chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {specialtyOptions.slice(0, 6).map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onSpecialtyChange(opt.value)}
                                    className={cn(
                                        "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                                        specialty === opt.value
                                            ? "bg-primary text-white font-semibold"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-border/60 bg-gray-50/80 px-5 pt-3 pb-3">
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full h-11 text-base font-bold rounded-xl bg-primary text-white hover:bg-primary/90 shadow-md cursor-pointer"
                    >
                        Show {totalCount} Specialist{totalCount === 1 ? "" : "s"}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

