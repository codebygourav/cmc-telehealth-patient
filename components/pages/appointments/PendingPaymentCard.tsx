'use client';

import { Calendar, Clock, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface PendingPaymentCardProps {
    appointment: {
        id: string;
        doctorName: string;
        doctorImage: string;
        date: string;
        time: string;
    };
    specialty?: string;
    consultationType?: string;
    fee?: string;
    bookedForName?: string | null;
    onComplete: (appointmentId: string) => void;
    onDelete: (appointmentId: string) => void;
}

// Unpaid booking: the patient can finish payment (Review Appointment) or delete it.
const PendingPaymentCard = ({ appointment, specialty, consultationType, fee = '0', bookedForName, onComplete, onDelete }: PendingPaymentCardProps) => (
    <div className="bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.1)] rounded-lg border-light-gray overflow-hidden">
        <div className="p-4 sm:p-5 md:p-6 space-y-4">
            <div className="flex gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-surface-container-low shrink-0">
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
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-black break-words">{appointment.doctorName}</h3>
                    {specialty && <p className="text-sm text-[#4D4D4D] font-medium">{specialty}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            Payment Pending
                        </span>
                        {bookedForName && <span className="text-xs text-[#4D4D4D]">For {bookedForName}</span>}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#4D4D4D] text-xs font-medium">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {appointment.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {appointment.time}</span>
                {consultationType && <span>{consultationType}</span>}
                <span className="ml-auto text-sm font-semibold text-[#1F1E1E]">₹{Number(fee || 0).toFixed(2)}</span>
            </div>

            <p className="text-xs text-[#4D4D4D]">
                This slot is not booked until the payment is completed.
            </p>

            <div className="flex gap-2">
                <Button className="flex-1 btn-primary-cta" onClick={() => onComplete(appointment.id)}>
                    <CreditCard size={16} />
                    Confirm &amp; Book
                </Button>
                <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDelete(appointment.id)}
                >
                    <Trash2 size={16} />
                    Delete
                </Button>
            </div>
        </div>
    </div>
);

export default PendingPaymentCard;
