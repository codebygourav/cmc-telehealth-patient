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

const OPTIONS: { value: AppointmentType; label: string; hint: string; Icon: typeof Building2 }[] = [
    { value: 'in_person', label: 'In-Clinic Visit', hint: 'Visit the doctor at the hospital', Icon: Building2 },
    { value: 'video', label: 'Video Consultation', hint: 'Consult online from home', Icon: Video },
];

const AppointmentTypeSelector = ({
    value,
    onChange,
    inPersonAvailable = true,
    videoAvailable = true,
}: AppointmentTypeSelectorProps) => (
    <div className="space-y-3">
        <h3 className="text-[#1F1E1E] text-lg font-semibold">Appointment Type</h3>
        <div role="tablist" aria-label="Appointment type" className="grid grid-cols-2 gap-1 rounded-lg border border-[#E7E8EB] bg-[#F5F6F8] p-1">
            {OPTIONS.map(({ value: type, label, hint, Icon }) => {
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
                            'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md px-3 py-2.5 text-center transition-colors sm:flex-row sm:justify-start sm:gap-2.5 sm:text-left',
                            active
                                ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                                : 'text-[#4D4D4D] hover:bg-white hover:text-[#1F1E1E] hover:shadow-sm',
                        )}
                    >
                        <span
                            className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                                active ? 'bg-white/15' : 'border border-[#E7E8EB] bg-white group-hover:border-primary/40',
                            )}
                        >
                            <Icon size={16} className={active ? 'text-white' : 'text-primary'} />
                        </span>
                        <span className="min-w-0 w-full sm:w-auto">
                            <span className="block text-sm font-semibold leading-tight">{label}</span>
                            <span className={cn('mt-0.5 block truncate text-[11px] leading-tight', active ? 'text-white/75' : 'text-[#8A8A8A]')}>
                                {hasSlots ? hint : 'No schedules yet'}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default AppointmentTypeSelector;
