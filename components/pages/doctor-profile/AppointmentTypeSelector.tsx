import { Building2, Check, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppointmentType = 'in_person' | 'video';

interface AppointmentTypeSelectorProps {
    value: AppointmentType | null;
    onChange: (type: AppointmentType) => void;
    // Whether the doctor has schedules of each type (a type without any still shows, with no dates open).
    inPersonAvailable?: boolean;
    videoAvailable?: boolean;
}

const OPTIONS: { value: AppointmentType; label: string; hint: string; Icon: typeof Building2 }[] = [
    { value: 'in_person', label: 'In-Clinic Visit', hint: 'Visit the hospital for your appointment', Icon: Building2 },
    { value: 'video', label: 'Video Consultation', hint: 'Consult with the doctor online from home', Icon: Video },
];

/**
 * Stacked option cards (radio style) so patients clearly see they must choose one type.
 */
const AppointmentTypeSelector = ({
    value,
    onChange,
    inPersonAvailable = true,
    videoAvailable = true,
}: AppointmentTypeSelectorProps) => (
    <div className="rounded-2xl border border-[#E7E8EB] bg-[#FAFAFA] p-3 sm:p-4">
        <h3 className="text-[#1F1E1E] text-base sm:text-lg font-semibold">Select Your Appointment Type</h3>
        <p className="mt-1 mb-3 text-xs sm:text-sm text-[#737373]">Choose one option to continue.</p>

        <div role="radiogroup" aria-label="Appointment type" className="space-y-2.5">
            {OPTIONS.map(({ value: type, label, hint, Icon }) => {
                const active = value === type;
                const hasSlots = type === 'in_person' ? inPersonAvailable : videoAvailable;

                return (
                    <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(type)}
                        className={cn(
                            'flex w-full cursor-pointer items-start gap-3 rounded-xl border p-2 text-left transition-all sm:px-4 sm:py-3.5',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                            active
                                ? 'border-primary bg-success/10 shadow-xs'
                                : 'border-[#E7E8EB] bg-white hover:border-primary/50 hover:shadow-xs',
                        )}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                                <Icon size={20} className={active ? 'text-primary' : 'text-[#4D4D4D]'} />
                                <span className="text-sm sm:text-base font-semibold text-[#1F1E1E]">{label}</span>
                            </span>
                            <span className={cn('mt-1.5 block text-xs sm:text-[13px]', active ? 'text-primary' : 'text-[#737373]')}>
                                {hasSlots ? hint : 'No schedules yet'}
                            </span>
                            <span
                                className={cn(
                                    'mt-1.5 block text-[11px] font-semibold uppercase tracking-wide',
                                    active ? 'text-primary' : 'text-[#737373]',
                                )}
                            >
                                {active ? 'Selected' : 'Tap to select'}
                            </span>
                        </span>

                        {/* Radio indicator */}
                        <span
                            aria-hidden
                            className={cn(
                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors',
                                active ? 'bg-primary' : 'bg-[#9CA3AF]/70',
                            )}
                        >
                            {active && <Check size={12} strokeWidth={3} className="text-white" />}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default AppointmentTypeSelector;
