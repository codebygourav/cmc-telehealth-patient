"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="relative mb-6">
        <span className="text-8xl sm:text-9xl font-extrabold text-primary/10 tracking-widest select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Search className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 font-heading">
        Page Not Found
      </h1>
      
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </Button>
        <Button asChild className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/appointments">
            <Calendar className="w-4 h-4" />
            My Appointments
          </Link>
        </Button>
      </div>
    </div>
  );
}
