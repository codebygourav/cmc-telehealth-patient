"use client";

import { cn } from "@/lib/utils";
import { Baby, Moon, Sun, Sunrise } from "lucide-react";
import type { DoctorAvailabilitySlot } from "@/types/doctor-details";
import { isSlotBookable } from "./BookingCalendar";

type Period = "Morning" | "Afternoon" | "Evening";

const PERIOD_ICONS: Record<Period, React.ReactNode> = {
    Morning: <Sunrise className="h-4 w-4 text-amber-500" />,
    Afternoon: <Sun className="h-4 w-4 text-amber-500" />,
    Evening: <Moon className="h-4 w-4 text-indigo-500" />,
};

const periodOf = (slot: DoctorAvailabilitySlot): Period => {
    const hour = Number((slot.booking_start_time || "").slice(0, 2));
    if (Number.isNaN(hour) || hour < 12) return "Morning";
    return hour < 17 ? "Afternoon" : "Evening";
};

// "3:00 PM" when online booking for this slot closes later today (from the admin close-time rule).
const closesToday = (slot: DoctorAvailabilitySlot): string | null => {
    if (!slot.booking_closes_at) return null;
    const closes = new Date(slot.booking_closes_at.replace(" ", "T"));
    if (Number.isNaN(closes.getTime()) || closes.toDateString() !== new Date().toDateString()) return null;
    return closes.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
};

interface SlotPickerProps {
    slots: DoctorAvailabilitySlot[];
    selectedSlot: DoctorAvailabilitySlot | null;
    onSelectSlot: (slot: DoctorAvailabilitySlot) => void;
}

export default function SlotPicker({ slots, selectedSlot, onSelectSlot }: SlotPickerProps) {
    const periods = (["Morning", "Afternoon", "Evening"] as Period[])
        .map((period) => ({ period, slots: slots.filter((slot) => periodOf(slot) === period) }))
        .filter((group) => group.slots.length);

    const childAge = slots.find((slot) => slot.is_child_only)?.child_age;

    if (!slots.length) {
        return (
            <div className="rounded-lg border border-dashed border-[#E7E8EB] bg-[#F5F6F8] p-5 text-center">
                <p className="text-sm font-medium text-[#4D4D4D]">No time slots on this date.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {periods.map(({ period, slots: periodSlots }) => (
                <div key={period} className="space-y-2">
                    <h4 className="flex items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                        {PERIOD_ICONS[period]}
                        {period}
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {periodSlots.map((slot) => {
                            const bookable = isSlotBookable(slot);
                            const selected = selectedSlot?.id === slot.id && selectedSlot?.date === slot.date;
                            const left = typeof slot.available_slots === "number" ? slot.available_slots : null;
                            const typeLabel = slot.consultation_type === "video"
                                ? "Video"
                                : slot.opd_type
                                    ? slot.opd_type.charAt(0).toUpperCase() + slot.opd_type.slice(1)
                                    : "Clinic";

                            return (
                                <button
                                    key={`${slot.id}-${slot.date}`}
                                    type="button"
                                    disabled={!bookable}
                                    onClick={() => onSelectSlot(slot)}
                                    aria-pressed={selected}
                                    className={cn(
                                        "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-3 text-center transition-all",
                                        selected && "border-primary bg-primary text-white shadow-md",
                                        !selected && bookable && "border-[#D1D5DB] bg-white text-[#1F1E1E] hover:border-primary hover:bg-primary/5 cursor-pointer",
                                        !bookable && "cursor-not-allowed border-[#E7E8EB] bg-[#F5F6F8] text-[#9CA3AF]",
                                    )}
                                >
                                    <span className="flex items-center gap-1.5 text-sm font-bold">
                                        {slot.start_time} - {slot.end_time}
                                        {slot.is_child_only && (
                                            <Baby className={cn("h-3.5 w-3.5", selected ? "text-white" : "text-primary")} aria-label="Children only" />
                                        )}
                                    </span>
                                    <span className={cn("text-xs", selected ? "text-white/85" : "text-[#4D4D4D]")}>
                                        {slot.currency_symbol || "₹"}
                                        {slot.consultation_fee ?? 0} ({typeLabel})
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-0.5 text-[11px] font-semibold",
                                            selected ? "text-white" : !bookable ? "text-red-500" : left !== null && left <= 3 ? "text-amber-600" : "text-emerald-700",
                                        )}
                                    >
                                        {slot.is_past
                                            ? "Time passed"
                                            : slot.is_booking_closed
                                                ? "Booking closed"
                                                : !bookable
                                                    ? "Fully booked"
                                                    : left !== null
                                                        ? `${left} ${left === 1 ? "place" : "places"} left`
                                                        : "Available"}
                                    </span>
                                    {bookable && closesToday(slot) && (
                                        <span className={cn("text-[10px]", selected ? "text-white/80" : "text-[#8A8A8A]")}>
                                            Book by {closesToday(slot)}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {childAge != null && (
                <p className="flex items-center justify-center gap-1.5 border-t border-[#E7E8EB] pt-3 text-xs font-medium text-[#4D4D4D]">
                    Slots marked with <Baby className="h-3.5 w-3.5 text-primary" /> are only for children up to {childAge} years.
                </p>
            )}
        </div>
    );
}
