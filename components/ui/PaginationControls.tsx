"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: PaginationControlsProps) {

    if (totalPages <= 1) return null;

    return (
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 pt-4 sm:pt-6 border-t border-[#E7E8EB]">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
                Showing{" "}
                <span className="font-semibold text-foreground">
                    {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalItems}</span> results
            </p>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2 order-1 sm:order-2 w-full sm:w-auto">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-[#D1D5DB] hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                    title="First page"
                    aria-label="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-[#D1D5DB] hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                    title="Previous page"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="min-w-24 text-center text-xs sm:text-sm font-semibold text-foreground px-2.5 py-1.5 rounded-lg bg-[#F5F6F8] border border-[#E7E8EB] select-none">
                    Page {currentPage} of {totalPages}
                </span>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-[#D1D5DB] hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                    title="Next page"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-[#D1D5DB] hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                    title="Last page"
                    aria-label="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}