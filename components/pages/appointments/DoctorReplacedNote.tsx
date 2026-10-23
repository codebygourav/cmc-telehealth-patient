import { ArrowRightLeft } from "lucide-react";

/** `doctor_replacement` from the appointment API: set when another doctor took over the appointment. */
export interface DoctorReplacementInfo {
    is_replaced: boolean;
    original_doctor_name: string | null;
    replacement_doctor_name: string | null;
    // The date / time the patient booked, when the replacement also moved the appointment.
    original_date_formatted?: string | null;
    original_time_formatted?: string | null;
    timing_changed?: boolean;
    message?: string;
}

// "Dr. B will see you instead of Dr. A. Your original booking was 27 Oct, 3:55 PM."
const shortDate = (info: DoctorReplacementInfo) =>
    info.timing_changed && info.original_date_formatted
        ? `${info.original_date_formatted.replace(/^\w+, /, "").replace(/ \d{4}$/, "")}${info.original_time_formatted ? `, ${info.original_time_formatted.replace(/^0/, "")}` : ""}`
        : null;

// Cards: one small line ("In place of Dr. A"); appointment pages: the full box.
export default function DoctorReplacedNote({ info, className = "", compact = false }: { info?: DoctorReplacementInfo | null; className?: string; compact?: boolean }) {
    if (!info?.is_replaced) return null;
    const was = shortDate(info);

    if (compact) {
        return (
            <p className={`flex min-w-0 items-center gap-1 text-[11px] leading-snug text-amber-700 ${className}`} title={info.message}>
                <ArrowRightLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">In place of {info.original_doctor_name || "your booked doctor"}</span>
            </p>
        );
    }

    return (
        <div className={`flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 ${className}`} role="note">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 text-xs leading-relaxed text-amber-900">
                <p className="font-semibold">Your doctor has changed</p>
                <p>
                    <span className="font-semibold">{info.replacement_doctor_name}</span> will see you instead of{" "}
                    <span className="font-semibold">{info.original_doctor_name || "your booked doctor"}</span>.
                    {was ? ` Your original booking was ${was}.` : ""}
                </p>
            </div>
        </div>
    );
}
