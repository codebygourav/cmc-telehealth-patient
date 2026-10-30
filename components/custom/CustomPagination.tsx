"use client";

import { cn } from "@/lib/utils";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function CustomPagination({
    currentPage,
    totalPages,
    onPageChange,
}: CustomPaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const showMax = 5;

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Logic for ellipses
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "ellipsis", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
            }
        }
        return pages;
    };

    return (
        <Pagination className="mt-6 sm:mt-8">
            <PaginationContent className="flex-wrap justify-center gap-1 sm:gap-1.5">
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) onPageChange(currentPage - 1);
                        }}
                        className={cn(
                            "h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg",
                            currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        )}
                    />
                </PaginationItem>

                {getPageNumbers().map((page, index) => {
                    const isDistant = typeof page === "number" && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages;

                    return (
                        <PaginationItem key={index} className={cn(isDistant && "hidden sm:inline-flex")}>
                            {page === "ellipsis" ? (
                                <PaginationEllipsis className="h-8 w-6 sm:w-8" />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    isActive={currentPage === page}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onPageChange(page as number);
                                    }}
                                    className={cn(
                                        "h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm font-semibold rounded-lg p-0 flex items-center justify-center transition-all",
                                        currentPage === page
                                            ? "bg-primary hover:bg-primary/90 text-white shadow-xs"
                                            : "cursor-pointer hover:bg-primary/10 hover:text-primary"
                                    )}
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) onPageChange(currentPage + 1);
                        }}
                        className={cn(
                            "h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg",
                            currentPage === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        )}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
