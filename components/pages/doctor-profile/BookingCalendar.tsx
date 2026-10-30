"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { DoctorAvailabilitySlot } from "@/types/doctor-details";

export type DayState = "available" | "full" | "closed" | "unavailable" | "past";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromKey = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
};

// A slot can be booked when it is not past, not full and the API marks it available.
export const isSlotBookable = (slot: DoctorAvailabilitySlot) =>
    !slot.is_past &&
    !slot.is_booking_closed &&
    !slot.is_full &&
    slot.available !== false &&
    !(typeof slot.capacity === "number" && typeof slot.booked_count === "number" && slot.booked_count >= slot.capacity);

export const dayStateFor = (dateKey: string, slots: DoctorAvailabilitySlot[], todayKey: string): DayState => {
    if (dateKey < todayKey) return "past";
    const daySlots = slots.filter((slot) => slot.date === dateKey);
    if (!daySlots.length) return "unavailable";
    if (daySlots.some(isSlotBookable)) return "available";
    // Every session over: past. A session still running / to come but its booking close time
    // reached: "Booking closed" (not "fully booked").
    if (daySlots.every((slot) => slot.is_past)) return "past";
    return daySlots.some((slot) => !slot.is_past && slot.is_booking_closed) ? "closed" : "full";
};

interface BookingCalendarProps {
    slots: DoctorAvailabilitySlot[];
    selectedDate: string | null;
    onSelectDate: (dateKey: string) => void;
    // Months the patient can move through (this month + next), from the admin setting.
    monthsAhead?: number;
    // Called with the first day of the month now shown (prev / next arrows).
    onMonthChange?: (month: Date) => void;
}

export default function BookingCalendar({ slots, selectedDate, onSelectDate, monthsAhead, onMonthChange }: BookingCalendarProps) {
    const todayKey = toKey(new Date());

    // Months that can be shown: this month up to the last month with a slot.
    const lastKey = useMemo(
        () => slots.reduce((max, slot) => (slot.date > max ? slot.date : max), todayKey),
        [slots, todayKey],
    );
    const firstMonth = useMemo(() => {
        const d = fromKey(selectedDate || todayKey);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const [month, setMonthState] = useState<Date>(firstMonth);
    const setMonth = (next: Date) => {
        setMonthState(next);
        onMonthChange?.(next);
    };

    const minMonth = new Date(fromKey(todayKey).getFullYear(), fromKey(todayKey).getMonth(), 1);
    const maxMonth = monthsAhead && monthsAhead > 0
        ? new Date(minMonth.getFullYear(), minMonth.getMonth() + monthsAhead - 1, 1)
        : new Date(fromKey(lastKey).getFullYear(), fromKey(lastKey).getMonth(), 1);
    const canPrev = month > minMonth;
    const canNext = month < maxMonth;

    const cells = useMemo(() => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1);
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const blanks: (string | null)[] = Array.from({ length: start.getDay() }, () => null);
        const days = Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(month.getFullYear(), month.getMonth(), i + 1)));
        return [...blanks, ...days];
    }, [month]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[#1F1E1E] text-lg font-semibold">Select Date</h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Previous month"
                        disabled={!canPrev}
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        className="rounded-md p-1.5 text-[#1F1E1E] hover:bg-[#F5F6F8] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-28 text-center text-sm font-semibold text-[#1F1E1E]">
                        {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </span>
                    <button
                        type="button"
                        aria-label="Next month"
                        disabled={!canNext}
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        className="rounded-md p-1.5 text-[#1F1E1E] hover:bg-[#F5F6F8] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center items-center">
                {WEEKDAYS.map((day) => (
                    <span key={day} className="py-1 text-[11px] font-semibold uppercase text-[#4D4D4D]">
                        {day}
                    </span>
                ))}

                {cells.map((key, index) => {
                    if (!key) return <span key={`blank-${index}`} className="w-full aspect-square sm:aspect-auto sm:h-12" />;

                    const state = dayStateFor(key, slots, todayKey);
                    const selected = key === selectedDate;
                    const day = Number(key.slice(8));

                    return (
                        <button
                            key={key}
                            type="button"
                            // A "booking closed" day can be opened to see its slots (marked "Booking closed").
                            disabled={state !== "available" && state !== "closed"}
                            onClick={() => onSelectDate(key)}
                            aria-pressed={selected}
                            aria-label={`${key} ${state === "available" ? "available" : state === "full" ? "fully booked" : state === "closed" ? "booking closed" : state === "past" ? "past date" : "not available"}`}
                            title={state === "full" ? "Fully booked" : state === "closed" ? "Booking closed" : state === "unavailable" ? "Not available" : undefined}
                            className={cn(
                                "w-full aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all",
                                selected && "bg-primary text-white shadow-md",
                                !selected && state === "available" && "border border-primary/60 bg-white text-primary hover:bg-primary/10 cursor-pointer",
                                state === "full" && "bg-red-500 text-white cursor-not-allowed",
                                !selected && state === "closed" && "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer",
                                state === "unavailable" &&
                                "cursor-not-allowed text-[#9CA3AF] bg-[repeating-linear-gradient(135deg,#F3F4F6_0,#F3F4F6_4px,#E5E7EB_4px,#E5E7EB_6px)] border border-[#E5E7EB]",
                                state === "past" && "cursor-not-allowed text-[#C4C7CC] line-through",
                            )}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 border-t border-[#E7E8EB] pt-3 text-[11px] sm:text-xs text-[#4D4D4D]">
                <LegendItem className="border border-primary/60 bg-white text-primary" label="Available" />
                <LegendItem className="bg-primary text-white shadow-xs" label="Selected" />
                <LegendItem className="bg-red-500 text-white" label="Fully booked" />
                <LegendItem className="border border-amber-300 bg-amber-50 text-amber-700" label="Booking closed" />
                <LegendItem
                    className="border border-[#E5E7EB] bg-[repeating-linear-gradient(135deg,#F3F4F6_0,#F3F4F6_3px,#D1D5DB_3px,#D1D5DB_5px)]"
                    label="Not available"
                />
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-[#C4C7CC] text-[9px] leading-none text-[#9CA3AF]">
                        –
                    </span>
                    <span className="truncate">Past date</span>
                </span>
            </div>
        </div>
    );
}

const LegendItem = ({ className, label }: { className: string; label: string }) => (
    <span className="inline-flex items-center gap-1.5">
        <span className={cn("h-4 w-4 shrink-0 rounded-md", className)} />
        <span className="truncate">{label}</span>
    </span>
);
