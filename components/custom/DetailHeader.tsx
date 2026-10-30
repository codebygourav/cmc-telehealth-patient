"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { goBackInPortal } from "@/lib/goBack";

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
}

export const DetailHeader = ({
  title,
  subtitle,
  onBack,
  className
}: DetailHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBackInPortal(router);
    }
  };

  // Phones: a "‹ Back" link above the title. From md: the round icon button beside it.
  return (
    <header className={cn("flex flex-col items-start md:flex-row md:items-center md:gap-4 gap-1 mb-8", className)}>
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 md:hidden"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="hidden md:block p-3 hover:bg-surface-container rounded-2xl transition-all text-primary"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div>
        <h1 className="md:text-3xl text-1xl font-extrabold tracking-tight text-primary font-headline">
          {title}
        </h1>
        {subtitle && (
          <p className="text-on-surface-variant text-sm md:text-base font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
};
