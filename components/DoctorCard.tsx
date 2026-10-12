"use client";

import { Star, Clock, Languages, ArrowRight, Video, Hospital, AlertCircle, PhoneCall } from 'lucide-react';
import type { Doctor } from '@/types/browse-doctors';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
    doctor: Doctor;
    isLoading?: boolean;
    onBook?: () => void;
}

type Mode = 'in-person' | 'video';

// `single` / `badge` are used when the doctor offers that mode only.
const MODE_META: Record<Mode, { label: string; icon: typeof Video; single: string; badge: string }> = {
    'in-person': { label: 'In-Person', icon: Hospital, single: 'Hospital OPD Consultation', badge: 'OPD Only' },
    video: { label: 'Video', icon: Video, single: 'Video Consultation', badge: 'Video Only' },
};

const money = (amount: number, symbol: string) => `${symbol}${amount.toLocaleString('en-IN')}`;

// Everything on the card comes from the API; a part is left out when its value is missing.
const DoctorCard = ({ doctor, isLoading = false, onBook }: DoctorCardProps) => {
    const router = useRouter();

    const fees = doctor.fees_breakdown ?? {};
    const symbol = doctor.currency_symbol || '₹';

    // Modes this doctor offers, from the API's consultation type and the fees it sent.
    const type = doctor.consultation_type;
    const offers = (mode: Mode) =>
        type === 'both' || type === mode || (Array.isArray(type) && type.includes(mode));
    const modes: Mode[] = (['in-person', 'video'] as Mode[]).filter(offers);

    const [selected, setSelected] = useState<Mode | null>(null);
    const activeMode: Mode | null = selected && modes.includes(selected) ? selected : modes[0] ?? null;

    const speciality = Array.isArray(doctor.speciality) ? doctor.speciality[0] : doctor.speciality;
    const department = typeof speciality === 'string' ? speciality : speciality?.name;
    const role = typeof speciality === 'object' && speciality ? (speciality as { role?: string }).role : undefined;
    const languages = Array.isArray(doctor.languages_known) ? doctor.languages_known.filter(Boolean) : [];
    const years = Number(doctor.years_experience) || 0;
    const totalReviews = Number(doctor.total_reviews) || 0;

    // The doctor's profile opens on the mode chosen here ("Appointment Type"): the tab the patient
    // picked, or the doctor's only mode. Without a choice the profile decides.
    const openProfile = () => {
        if (onBook) onBook();
        const type = selected && modes.includes(selected) ? selected : modes.length === 1 ? modes[0] : null;
        router.push(`/find-doctors/${doctor.id}${type ? `?type=${type}` : ''}`);
    };

    // Fee of a mode, e.g. "₹500 (GNL) ₹800 (Pvt)" or "₹600 / $30 (VD)".
    const feeFor = (mode: Mode): string => {
        const parts: string[] = [];

        if (mode === 'in-person') {
            const { general, private: privateFee } = fees.clinic_visit ?? {};
            if (typeof general === 'number') parts.push(`${money(general, symbol)} (GNL)`);
            if (typeof privateFee === 'number') parts.push(`${money(privateFee, symbol)} (Pvt)`);
        }

        if (mode === 'video' && typeof fees.video_consultation === 'number') {
            // The international (USD) fee is sent only before login, for doctors who take international payment.
            const overseas = fees.international?.video_consultation;
            parts.push(
                money(fees.video_consultation, symbol) +
                (typeof overseas === 'number' ? ` / ${money(overseas, fees.international?.currency_symbol || '$')}` : '') +
                ' (VD)'
            );
        }

        return parts.join(' ');
    };

    const feeLabel = activeMode ? feeFor(activeMode) : '';
    const ActiveIcon = activeMode ? MODE_META[activeMode].icon : null;
    const labelClass = 'text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]';
    const panelClass = 'rounded-xl border border-[#E7E8EB] bg-[#F7F8F9] p-3';
    const feeClass = 'font-mono text-sm font-bold tabular-nums text-black';

    return (
        <article className="flex h-full flex-col rounded-2xl border border-[#E7E8EB] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] transition-shadow hover:shadow-[0_6px_16px_rgba(16,24,40,0.10)]">
            <div className="flex h-full flex-col gap-4 p-4 sm:p-5">

                {/* Department and rating */}
                {(department || doctor.rating) && (
                    <div className="flex items-center justify-between gap-3 border-b border-[#EEF0F2] pb-3">
                        {department && (
                            <span
                                title={department}
                                className="min-w-0 max-w-[70%] truncate rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-bold uppercase leading-none tracking-wide text-primary"
                            >
                                {department}
                            </span>
                        )}
                        {doctor.rating ? (
                            <span className="ml-auto flex shrink-0 items-center gap-1 text-sm leading-none">
                                <Star size={14} color="#F5A623" fill="#F5A623" />
                                <span className="font-bold text-black">{doctor.rating}</span>
                                {totalReviews > 0 && <span className="text-xs text-[#8A8A8A]">({totalReviews})</span>}
                            </span>
                        ) : null}
                    </div>
                )}

                {/* Doctor */}
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={doctor.avatar}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[#E7E8EB] sm:h-[52px] sm:w-[52px]"
                        referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                        <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-snug text-black break-words">
                            {doctor.name}
                            {doctor.is_test_doctor && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                            )}
                        </h3>

                        {role && <p className="truncate text-sm text-[#4D4D4D]" title={role}>{role}</p>}

                        {(years > 0 || languages.length > 0) && (
                            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-[#6B6B6B]">
                                {years > 0 && (
                                    <span className="flex shrink-0 items-center gap-1">
                                        <Clock size={13} />
                                        Exp: {years} yrs
                                    </span>
                                )}
                                {years > 0 && languages.length > 0 && <span aria-hidden className="text-[#C4C4C4]">•</span>}
                                {languages.length > 0 && (
                                    <span className="flex min-w-0 items-center gap-1">
                                        <Languages size={13} className="shrink-0" />
                                        <span className="truncate" title={languages.join(', ')}>{languages.join(', ')}</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Both modes. Phones: one row per mode. Larger screens: tabs to switch. */}
                {modes.length > 1 && activeMode && (
                    <div className={panelClass}>
                        <ul className="divide-y divide-[#E7E8EB] sm:hidden">
                            {modes.map((mode) => {
                                const { label, icon: Icon } = MODE_META[mode];
                                const fee = feeFor(mode);
                                return (
                                    <li key={mode} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                        <span className="flex items-center gap-2 text-sm font-semibold text-black">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-[#E7E8EB]">
                                                <Icon size={14} color="var(--primary)" />
                                            </span>
                                            {label}
                                        </span>
                                        {fee && <span className={cn(feeClass, 'text-right')}>{fee}</span>}
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="hidden sm:block">
                            <div role="tablist" aria-label="Consultation type" className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-[#E7E8EB] bg-white p-1">
                                {modes.map((mode) => {
                                    const { label, icon: Icon } = MODE_META[mode];
                                    const active = mode === activeMode;
                                    return (
                                        <button
                                            key={mode}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setSelected(mode)}
                                            className={cn(
                                                'flex min-h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors',
                                                active ? 'bg-primary text-white shadow-sm' : 'text-[#4D4D4D] hover:bg-primary/8'
                                            )}
                                        >
                                            <Icon size={14} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-end justify-between gap-4 px-0.5">
                                <div className="min-w-0">
                                    <p className={labelClass}>Consultation Type</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-black">
                                        {ActiveIcon && <ActiveIcon size={15} color="var(--primary)" />}
                                        {MODE_META[activeMode].label}
                                    </p>
                                </div>
                                {feeLabel && (
                                    <div className="min-w-0 text-right">
                                        <p className={labelClass}>Consultation Fee</p>
                                        <p className={cn(feeClass, 'mt-1 break-words')}>{feeLabel}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* One mode only: no tabs, just what the doctor offers. */}
                {modes.length === 1 && activeMode && (
                    <div className={panelClass}>
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E7E8EB] bg-white px-3 py-2.5">
                            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-black">
                                {ActiveIcon && <ActiveIcon size={15} color="var(--primary)" className="shrink-0" />}
                                <span className="truncate">{MODE_META[activeMode].single}</span>
                            </span>
                            <span className="shrink-0 rounded border border-primary/20 bg-primary/5 px-1.5 py-1 text-[10px] font-semibold leading-none text-primary">
                                {MODE_META[activeMode].badge}
                            </span>
                        </div>
                        {feeLabel && (
                            <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
                                <span className="text-xs text-[#4D4D4D]">Consultation Fee</span>
                                <span className={feeClass}>{feeLabel}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* No OPD open for booking: say so and point to the hospital desk. */}
                {modes.length === 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                            <AlertCircle size={15} className="shrink-0" />
                            No OPD schedule right now
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            This doctor has no in-person or video OPD open for online booking at the moment. Please contact support for an appointment.
                        </p>
                    </div>
                )}

                {modes.length > 0 ? (
                    <Button
                        onClick={openProfile}
                        disabled={isLoading}
                        variant="default"
                        className="mt-auto w-full text-sm font-semibold btn-primary-cta"
                    >
                        Book Your Appointment
                        <ArrowRight size={18} strokeWidth={2.5} className="m-0" />
                    </Button>
                ) : (
                    // Opens the doctor's profile at the hospital contact details.
                    <Button
                        onClick={() => router.push(`/find-doctors/${doctor.id}#contact`)}
                        disabled={isLoading}
                        variant="outline"
                        className="mt-auto w-full text-sm font-semibold btn-primary-cta-outline"
                    >
                        <PhoneCall size={16} className="m-0" />
                        Contact Support
                        <ArrowRight size={18} strokeWidth={2.5} className="m-0" />
                    </Button>
                )}
            </div>
        </article>
    );
};

export default DoctorCard;
