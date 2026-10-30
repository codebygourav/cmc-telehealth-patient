import { Building2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppointmentType = 'in_person' | 'video';

interface AppointmentTypeSelectorProps {
    value: AppointmentType | null;
    onChange: (type: AppointmentType) => void;
    // Whether the doctor has schedules of each type (a type without any still shows, with no dates open).
    inPersonAvailable?: boolean;
    videoAvailable?: boolean;
}

const OPTIONS: { value: AppointmentType; label: string; hint: string; mobileHint: string; Icon: typeof Building2 }[] = [
    { value: 'in_person', label: 'In-Clinic Visit', hint: 'Visit at hospital', mobileHint: 'At hospital', Icon: Building2 },
    { value: 'video', label: 'Video Consultation', hint: 'Consult online from home', mobileHint: 'Consult online', Icon: Video },
];

const AppointmentTypeSelector = ({
    value,
    onChange,
    inPersonAvailable = true,
    videoAvailable = true,
}: AppointmentTypeSelectorProps) => (
    <div className="space-y-2.5">
        <h3 className="text-[#1F1E1E] text-base sm:text-lg font-semibold">Appointment Type</h3>
        <div role="tablist" aria-label="Appointment type" className="grid grid-cols-2 sm:gap-1.5 rounded-xl border border-[#E7E8EB] bg-[#F5F6F8] p-1 sm:p-1.5">
            {OPTIONS.map(({ value: type, label, hint, mobileHint, Icon }) => {
                const active = value === type;
                const hasSlots = type === 'in_person' ? inPersonAvailable : videoAvailable;

                return (
                    <button
                        key={type}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(type)}
                        className={cn(
                            'group flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-left transition-all sm:gap-2.5 sm:px-3 sm:py-2.5',
                            active
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-[#4D4D4D] hover:bg-white hover:text-[#1F1E1E] hover:shadow-xs',
                        )}
                    >
                        <span
                            className={cn(
                                'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                active ? 'bg-white/20' : 'border border-[#E7E8EB] bg-white group-hover:border-primary/40',
                            )}
                        >
                            <Icon size={15} className={active ? 'text-white' : 'text-primary'} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs sm:text-sm font-semibold leading-tight break-words">{label}</span>
                            {/* Same small size for every hint, active or not (set on each span: nested spans picked up a larger size). */}
                            <span className={cn('mt-0.5 block text-[10px] sm:text-[11px] font-normal leading-tight', active ? 'text-white/80' : 'text-[#737373]')}>
                                {hasSlots ? (
                                    <>
                                        <span className="text-[10px] font-normal leading-tight sm:hidden">{mobileHint}</span>
                                        <span className="hidden text-[11px] font-normal leading-tight sm:inline">{hint}</span>
                                    </>
                                ) : (
                                    <span className="text-[10px] sm:text-[11px] font-normal leading-tight">No schedules yet</span>
                                )}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default AppointmentTypeSelector;
