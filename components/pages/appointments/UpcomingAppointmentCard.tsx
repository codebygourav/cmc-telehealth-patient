'use client';
import { Calendar, Clock, Star, Video, ChevronRight, Phone, Calendar as CalendarIcon, Hospital } from 'lucide-react';
import { Doctor, Appointment } from '@/types/appointment';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { getStatusColor } from '@/src/utils/getStatusColor';

interface UpcomingAppointmentCardProps {
    appointment: Appointment;
    doctor: Doctor | undefined;
    onManageClick: (appointmentId: string) => void;
    consultationType?: string;
    fee?: string;
    joinUrl?: string;
    call_now?: boolean;
    /** The call was used before: "Rejoin" instead of "Join". */
    isRejoin?: boolean;
    status?: string;
    statusLabel?: string;
    bookedForName?: string | null;
    isTestDoctor?: boolean;
}

const UpcomingAppointmentCard = ({
    appointment,
    doctor,
    onManageClick,
    consultationType = "Video",
    fee = "0",
    joinUrl,
    call_now,
    isRejoin = false,
    status,
    statusLabel,
    bookedForName,
    isTestDoctor,
}: UpcomingAppointmentCardProps) => {

    const router = useRouter();

    return (
        <div className="flex h-full flex-col bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.1)] rounded-lg border-light-gray overflow-hidden">
            {/* Column layout: the details block sits at the bottom so cards in a row line up. */}
            <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">

                {/* Header Section - Doctor Info */}
                <div className="flex sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-surface-container-low">
                                <img
                                    src={appointment.doctorImage}
                                    alt={appointment.doctorName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.src = '/default-avatar.png';
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-lg md:text-xl text-black break-words">
                                    {appointment.doctorName}
                                    {isTestDoctor && (
                                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                                    )}
                                </h3>
                                {/* Desktop: status on the right of the name */}
                                {statusLabel && (
                                    <span className={`hidden shrink-0 whitespace-nowrap px-2.5 py-1 rounded text-[11px] font-semibold sm:inline-block ${getStatusColor("appointment", status)}`}>
                                        {statusLabel}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[#4D4D4D] font-medium">
                                {doctor?.specialty} ({doctor?.experience})
                            </p>
                            {(statusLabel || bookedForName) && (
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    {statusLabel && (
                                        <span className={`px-2.5 py-1 rounded text-[11px] font-semibold sm:hidden ${getStatusColor("appointment", status)}`}>
                                            {statusLabel}
                                        </span>
                                    )}
                                    {bookedForName && (
                                        <span className="text-xs text-[#4D4D4D]">For {bookedForName}</span>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mt-1.5 sm:mt-2">
                                <div className="flex items-center gap-1.5 text-[#4D4D4D] text-xs font-medium">
                                    <Calendar size={14} color='#4D4D4D' />
                                    {appointment.date}
                                </div>
                                <div className="flex items-center gap-1.5 text-[#4D4D4D] text-xs font-medium">
                                    <Clock size={14} color='#4D4D4D' />
                                    {appointment.time}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rating Badge */}
                    {doctor?.rating !== 0 && doctor?.rating && (
                        <div className="flex items-center gap-1 bg-primary/8 text-primary px-2 py-1.5 rounded h-fit">
                            <Star size={12} color="var(--primary)" fill="var(--primary)" />
                            <span className="text-xs font-semibold">{doctor?.rating}</span>
                        </div>
                    )}
                </div>

                {/* Consultation Details Section */}
                <div className="p-5 bg-light-gray mt-auto">

                    <div className="flex md:flex-row flex-col gap-6 md:gap-8 mb-5 md:mb-6 relative">

                        <div className="flex-1 md:text-right text-left flex md:flex-col flex-row md:items-start item-center justify-between">
                            <p className="text-sm font-semibold text-black">
                                Consultation Type
                            </p>
                            <div className="flex items-center gap-1.5 md:mt-1.5">
                                {
                                    appointment.type === 'video' ? (
                                        <>
                                            <Video size={18} color='var(--primary)' fill="var(--primary)" />
                                            <p className="text-xs font-bold capitalize break-words hidden md:block">
                                                {consultationType}
                                            </p>
                                            <p className="text-xs font-bold capitalize break-words md:hidden">
                                                {appointment.type === "video" ? "Video" : "In Person"}
                                            </p>
                                        </>
                                    ) : appointment.type === 'in-person' ? (
                                        <>
                                            <Hospital size={18} color='var(--primary)' />
                                            <p className="text-xs font-bold capitalize break-words hidden md:block">
                                                {consultationType}
                                            </p>
                                            <p className="text-xs font-bold capitalize break-words md:hidden">
                                                In Person
                                            </p>
                                        </>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold capitalize break-words">
                                            <div className="flex items-center gap-1">
                                                <Video size={18} color='var(--primary)' fill="var(--primary)" />
                                                Video
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Hospital size={18} color='var(--primary)' />
                                                In-Person
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        </div>

                        <div className='absolute left-1/2 top-0 w-px h-10 mx-auto bg-[#E7E8EB] md:block hidden'></div>

                        <div className="flex-1 md:text-right text-left flex md:flex-col flex-row md:items-end item-center justify-between">
                            <p className="text-sm font-semibold text-black">
                                Consultation Fee
                            </p>
                            <p className="text-xs font-semibold text-black md:mt-1.5">
                                ₹{parseFloat(fee).toFixed(2)}
                            </p>
                        </div>

                    </div>

                    {/* View Details Button */}

                    {/* Video call open: Join, with Manage (reports, notes, details) right under it. */}
                    <div className="grid grid-cols-1 gap-2">
                        {(call_now || (appointment as any).canJoin) && joinUrl && (
                            <Button
                                variant="default"
                                onClick={() => window.open(`/start-consultation?room_url=${encodeURIComponent(joinUrl)}&appointment_id=${appointment.id}`, "_blank")}
                                className="w-full h-10 text-sm font-semibold btn-primary-cta flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Video size={18} className="m-0" />
                                {isRejoin || status === 'completed' ? 'Rejoin Video Call' : 'Join Video Call'}
                            </Button>
                        )}
                        <Button
                            variant={(call_now || (appointment as any).canJoin) && joinUrl ? "outline" : "default"}
                            onClick={() => router.push(`/appointments/manage-appointment/${appointment.id}`)}
                            className={`w-full h-10 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer ${(call_now || (appointment as any).canJoin) && joinUrl ? "border-primary text-primary hover:bg-primary/5" : "btn-primary-cta"}`}
                        >
                            Manage Appointment
                            <ChevronRight size={18} className="m-0" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UpcomingAppointmentCard;