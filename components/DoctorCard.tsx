"use client";

import { ArrowRight, Hospital, Phone, TriangleAlert, Video } from 'lucide-react';
import type { Doctor } from '@/types/browse-doctors';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
    doctor: Doctor;
    isLoading?: boolean;
    onBook?: () => void;
}

type Mode = 'in-person' | 'video';
type Price = { label: string; amount: string };

const money = (amount: number, symbol: string) => `${symbol}${amount.toLocaleString('en-IN')}`;

// "English, Hindi, Punjabi" → "Eng, Hin, Pun"
const shortLanguages = (languages: string[]) => languages.map((language) => language.trim().slice(0, 3)).filter(Boolean).join(', ');

/** Label / price pairs, laid out two to a row. */
const PriceRow = ({ prices }: { prices: Price[] }) => (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-1.5 px-1">
        {prices.map((price, index) => (
            <div key={price.label} className="flex items-baseline justify-between gap-2">
                <dt className={cn('text-xs', index === 0 ? 'font-semibold text-primary' : 'text-[#6B7280]')}>{price.label}</dt>
                <dd className={cn('text-sm tabular-nums text-[#111827]', index === 0 ? 'font-bold' : 'font-medium')}>{price.amount}</dd>
            </div>
        ))}
    </dl>
);

/** One price only: an icon tile, what it is, and the fee on the right. */
const SingleFee = ({ icon: Icon, title, subtitle, feeLabel, amount, extra }: { icon: typeof Video; title: string; subtitle: string; feeLabel: string; amount?: string; extra?: ReactNode }) => (
    <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#111827]">{title}</p>
            <p className="truncate text-xs text-[#6B7280]">{subtitle}</p>
            {extra && <div className="mt-1.5">{extra}</div>}
        </div>
        {amount && (
            <div className="shrink-0 text-right">
                <p className="text-[11px] text-[#6B7280]">{feeLabel}</p>
                <p className="text-lg font-bold leading-tight tabular-nums text-[#111827]">{amount}</p>
            </div>
        )}
    </div>
);

type Currency = 'inr' | 'usd';

/** The small ₹ INR / $ USD switch. */
const CurrencyToggle = ({ currency, onCurrency }: { currency: Currency; onCurrency: (currency: Currency) => void }) => (
    <div role="group" aria-label="Show the fee in" className="inline-flex shrink-0 rounded-lg bg-[#E9EDF1] p-0.5">
        {([['inr', '₹ INR'], ['usd', '$ USD']] as const).map(([key, label]) => (
            <button
                key={key}
                type="button"
                aria-pressed={currency === key}
                onClick={() => onCurrency(key)}
                className={cn(
                    'min-h-7 cursor-pointer rounded-md px-2 text-[11px] font-bold transition-colors',
                    currency === key ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                )}
            >
                {label}
            </button>
        ))}
    </div>
);

/**
 * Video consultation fee. When the doctor has both an Indian and an international price (shown
 * to visitors who are not logged in), a small ₹ INR / $ USD switch chooses which one is displayed.
 * A logged-in patient gets only their own price from the API, so there is no switch.
 */
const VideoFee = ({ inr, usd, currency, onCurrency }: { inr?: string; usd?: string; currency: Currency; onCurrency: (currency: Currency) => void }) => {
    const both = !!inr && !!usd;
    const shown = both ? (currency === 'usd' ? usd : inr) : inr ?? usd;

    if (!shown) return null;

    return (
        <div className="flex items-end justify-between gap-3 px-1">
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-primary">Consultation Fee</p>
                <p className="text-lg font-bold leading-tight tabular-nums text-[#111827]">{shown}</p>
            </div>
            {both && <CurrencyToggle currency={currency} onCurrency={onCurrency} />}
        </div>
    );
};

/**
 * Phone tile: icon, what it is, and a fee on the right. `below` is a full-width row under it
 * (the hospital visit's Private OPD and General OPD prices). Smaller than the desktop blocks.
 */
const CompactTile = ({ icon: Icon, title, subtitle, extra, below, children }: { icon: typeof Video; title: string; subtitle: string; extra?: ReactNode; below?: ReactNode; children?: ReactNode }) => (
    <div className="rounded-xl bg-[#F6F8FA] px-2.5 py-2">
        <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight text-[#111827]">{title}</p>
                <p className="truncate text-[11px] leading-tight text-[#6B7280]">{subtitle}</p>
                {extra && <div className="mt-1">{extra}</div>}
            </div>
            {children && <div className="shrink-0 text-right">{children}</div>}
        </div>
        {below && <div className="mt-2 border-t border-[#E7EBEF] pt-2">{below}</div>}
    </div>
);

const CompactFee = ({ label, amount }: { label: string; amount: string }) => (
    <>
        <p className="text-[10px] leading-tight text-[#6B7280]">{label}</p>
        <p className="text-base font-bold leading-tight tabular-nums text-[#111827]">{amount}</p>
    </>
);

// Everything on the card comes from the API; a part is left out when its value is missing.
const DoctorCard = ({ doctor, isLoading = false, onBook }: DoctorCardProps) => {
    const router = useRouter();

    const fees = doctor.fees_breakdown ?? {};
    const symbol = doctor.currency_symbol || '₹';

    // Modes this doctor offers (for this visitor), from the API's consultation type.
    const type = doctor.consultation_type;
    const offers = (mode: Mode) => type === 'both' || type === mode || (Array.isArray(type) && type.includes(mode));
    const modes: Mode[] = (['in-person', 'video'] as Mode[]).filter(offers);

    const [selected, setSelected] = useState<Mode | null>(null);
    const activeMode: Mode | null = selected && modes.includes(selected) ? selected : modes[0] ?? null;

    const speciality = Array.isArray(doctor.speciality) ? doctor.speciality[0] : doctor.speciality;
    const department = typeof speciality === 'string' ? speciality : speciality?.name;
    const role = typeof speciality === 'object' && speciality ? (speciality as { role?: string }).role : undefined;
    const languages = Array.isArray(doctor.languages_known) ? doctor.languages_known.filter(Boolean) : [];
    const years = Number(doctor.years_experience) || 0;
    const status = doctor.availability_status;

    // In-person: Private OPD and General OPD, always in rupees.
    const inPersonPrices: Price[] = [];
    {
        const { general, private: privateFee } = fees.clinic_visit ?? {};
        if (typeof privateFee === 'number') inPersonPrices.push({ label: 'Private OPD', amount: money(privateFee, symbol) });
        if (typeof general === 'number') inPersonPrices.push({ label: 'General OPD', amount: money(general, symbol) });
    }

    // Video: what the API sent for this visitor.
    //  - Not logged in, doctor takes international payment: the Indian price and the international one.
    //  - Logged-in patient: only their own price (₹ in India, $ for an international patient).
    const videoPrice = typeof fees.video_consultation === 'number' ? money(fees.video_consultation, symbol) : undefined;
    const overseasPrice = typeof fees.international?.video_consultation === 'number'
        ? money(fees.international.video_consultation, fees.international?.currency_symbol || '$')
        : undefined;
    const videoInr = symbol === '$' ? undefined : videoPrice;
    const videoUsd = symbol === '$' ? videoPrice : overseasPrice;
    const [currency, setCurrency] = useState<Currency>('inr');
    const videoFee = <VideoFee inr={videoInr} usd={videoUsd} currency={currency} onCurrency={setCurrency} />;
    const videoBoth = !!videoInr && !!videoUsd;
    const videoShown = videoBoth ? (currency === 'usd' ? videoUsd : videoInr) : videoInr ?? videoUsd;

    // The doctor's profile opens on the mode chosen here ("Appointment Type"): the tab the patient
    // picked, or the doctor's only mode. Without a choice the profile decides.
    const openProfile = () => {
        if (onBook) onBook();
        const chosen = selected && modes.includes(selected) ? selected : modes.length === 1 ? modes[0] : null;
        router.push(`/find-doctors/${doctor.id}${chosen ? `?type=${chosen}` : ''}`);
    };

    const modeMeta: Record<Mode, { tab: string; title: string; subtitle: string; badge: string; feeLabel: string; icon: typeof Video; cta: string }> = {
        'in-person': { tab: 'In-Person', title: 'Hospital Clinic Visit', subtitle: 'In-Person OPD Only', badge: 'OPD ONLY', feeLabel: 'OPD Fee', icon: Hospital, cta: 'Book Clinic Visit' },
        video: { tab: 'Video Call', title: 'Video Consultation', subtitle: 'Standard online fee', badge: 'VIDEO ONLY', feeLabel: 'Consultation Fee', icon: Video, cta: 'Book Video Consult' },
    };

    const panelClass = 'rounded-2xl bg-[#F6F8FA] p-3';
    const available = status && status.key !== 'unavailable';

    return (
        <article className="flex h-full flex-col rounded-2xl bg-white p-2 sm:p-5 md:p-5 lg:p-5  shadow-[0_2px_10px_rgba(16,24,40,0.06)] ring-1 ring-[#EEF0F2] transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.10)]">
            <div className="flex h-full flex-col gap-3 sm:gap-4">

                {/* Department and the next day with an open slot (the day only, never a time) */}
                {(department || status) && (
                    <div className="flex items-center justify-between gap-3">
                        {department && (
                            <span
                                title={department}
                                className={cn(
                                    'min-w-0 truncate rounded-full px-3 py-1.5 text-[11px] font-bold uppercase leading-none tracking-wide',
                                    modes.length > 0 ? 'bg-primary/10 text-primary' : 'bg-[#EEF1F5] text-[#475569]'
                                )}
                            >
                                {department}
                            </span>
                        )}
                        {status && (
                            <span className={cn('ml-auto flex shrink-0 items-center gap-1.5 text-xs font-semibold', available ? 'text-emerald-700' : 'text-amber-600')}>
                                <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', available ? 'bg-emerald-500' : 'bg-amber-500')} />
                                {status.label}
                            </span>
                        )}
                    </div>
                )}

                {/* Doctor */}
                <div className="flex items-center gap-3.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={doctor.avatar}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-[#E7E8EB] sm:h-14 sm:w-14 sm:rounded-2xl"
                        referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                        {/* Not an <h3>: the site forces its serif heading font on those, and the card name uses the body font. */}
                        <p role="heading" aria-level={3} className="flex flex-wrap items-center gap-2 text-[15px] font-bold leading-snug text-[#111827] break-words sm:text-[17px]">
                            {doctor.name}
                            {doctor.is_test_doctor && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                            )}
                        </p>
                        {role && <p className="truncate text-[13px] text-[#4B5563]" title={role}>{role}</p>}
                        {(years > 0 || languages.length > 0) && (
                            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-[#6B7280]">
                                {years > 0 && <span className="shrink-0 font-medium text-[#374151]">Exp: {years} yrs</span>}
                                {years > 0 && languages.length > 0 && <span aria-hidden>•</span>}
                                {languages.length > 0 && <span className="truncate" title={languages.join(', ')}>{shortLanguages(languages)}</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Phones: one compact tile per mode. The hospital visit tile lists Private OPD and
                    General OPD together; the video tile has the ₹ INR / $ USD switch when both prices exist. */}
                {modes.length > 0 && (
                    <div className="space-y-2 sm:hidden">
                        {modes.includes('in-person') && (
                            <CompactTile
                                icon={Hospital}
                                title={modeMeta['in-person'].title}
                                subtitle={inPersonPrices.length === 1 ? `${inPersonPrices[0].label} only` : 'In-person OPD'}
                                // Two prices: listed under the title, across the tile's full width.
                                below={inPersonPrices.length > 1 ? (
                                    <dl className="grid grid-cols-2 gap-x-4">
                                        {inPersonPrices.map((price) => (
                                            <div key={price.label} className="flex items-baseline justify-between gap-2">
                                                <dt className="text-[11px] text-[#6B7280]">{price.label}</dt>
                                                <dd className="text-sm font-bold tabular-nums text-[#111827]">{price.amount}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : undefined}
                            >
                                {inPersonPrices.length === 1 && <CompactFee label={modeMeta['in-person'].feeLabel} amount={inPersonPrices[0].amount} />}
                            </CompactTile>
                        )}
                        {modes.includes('video') && (
                            <CompactTile
                                icon={Video}
                                title={modeMeta.video.title}
                                subtitle={modeMeta.video.subtitle}
                                extra={videoBoth ? <CurrencyToggle currency={currency} onCurrency={setCurrency} /> : undefined}
                            >
                                {videoShown && <CompactFee label={modeMeta.video.feeLabel} amount={videoShown} />}
                            </CompactTile>
                        )}
                    </div>
                )}

                {/* Larger screens, both modes: tabs to switch. */}
                {modes.length > 1 && activeMode && (
                    <div className={cn(panelClass, 'hidden sm:block')}>
                        <div>
                            <div role="tablist" aria-label="Consultation type" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-[#E9EDF1] p-1">
                                {modes.map((mode) => {
                                    const Icon = modeMeta[mode].icon;
                                    const active = mode === activeMode;
                                    return (
                                        <button
                                            key={mode}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setSelected(mode)}
                                            className={cn(
                                                'flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors',
                                                active ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                                            )}
                                        >
                                            <Icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
                                            {modeMeta[mode].tab}
                                        </button>
                                    );
                                })}
                            </div>
                            {activeMode === 'video' ? videoFee : <PriceRow prices={inPersonPrices} />}
                        </div>
                    </div>
                )}

                {/* Larger screens, one mode only: no tabs. */}
                {modes.length === 1 && activeMode && (() => {
                    const meta = modeMeta[activeMode];
                    const Icon = meta.icon;
                    // Two prices to show: a titled block. One price: a tile with the fee on the right.
                    const twoPrices = activeMode === 'video' ? !!videoInr && !!videoUsd : inPersonPrices.length > 1;
                    const onlyPrice = activeMode === 'video' ? videoInr ?? videoUsd : inPersonPrices[0]?.amount;

                    return (
                        <div className={cn(panelClass, 'hidden sm:block')}>
                            {twoPrices ? (
                                <>
                                    <div className="mb-3 flex items-center justify-between gap-2 px-1">
                                        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#111827]">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="truncate">{meta.title}</span>
                                        </p>
                                        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold leading-none tracking-wide text-primary">{meta.badge}</span>
                                    </div>
                                    {activeMode === 'video' ? videoFee : <PriceRow prices={inPersonPrices} />}
                                </>
                            ) : (
                                <SingleFee
                                    icon={Icon}
                                    title={meta.title}
                                    subtitle={activeMode === 'in-person' && inPersonPrices[0] ? `${inPersonPrices[0].label} only` : meta.subtitle}
                                    feeLabel={meta.feeLabel}
                                    amount={onlyPrice}
                                />
                            )}
                        </div>
                    );
                })()}

                {/* No OPD open for booking: say so and point to support. */}
                {modes.length === 0 && (
                    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <TriangleAlert className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-amber-950">No OPD schedule right now</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                                This doctor has no in-person or video OPD open for online booking at the moment. Please contact support for an appointment.
                            </p>
                        </div>
                    </div>
                )}

                {modes.length > 0 ? (
                    <button
                        type="button"
                        onClick={openProfile}
                        disabled={isLoading}
                        className="mt-auto flex h-11 sm:h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                        {modes.length > 1 && activeMode ? (
                            <>
                                <span className="sm:hidden">Book Appointment</span>
                                <span className="hidden sm:inline">{modeMeta[activeMode].cta}</span>
                            </>
                        ) : (
                            modeMeta[modes[0]].cta
                        )}
                        <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                ) : (
                    // Opens the doctor's profile at the hospital contact details.
                    <button
                        type="button"
                        onClick={() => router.push(`/find-doctors/${doctor.id}#contact`)}
                        disabled={isLoading}
                        className="mt-auto flex h-11 sm:h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#EEF1F5] text-sm font-semibold text-[#374151] transition-colors hover:bg-[#E2E7ED] disabled:opacity-60"
                    >
                        <Phone className="h-4 w-4" />
                        Contact Support
                    </button>
                )}
            </div>
        </article>
    );
};

export default DoctorCard;
