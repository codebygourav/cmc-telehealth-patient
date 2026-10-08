'use client';

import { ClipboardList, Download, FileText, FlaskConical, ListChecks, NotebookPen, Pill, Stethoscope, type LucideIcon } from 'lucide-react';
import type { MedicineDetailsData } from '@/types/prescriptions';
import { cn } from '@/lib/utils';

const text = (value: unknown): string =>
    (Array.isArray(value) ? value.filter(Boolean).join('\n') : value == null ? '' : String(value))
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();

const statusClass: Record<string, string> = {
    Ongoing: 'bg-emerald-50 text-emerald-700',
    Upcoming: 'bg-blue-50 text-blue-700',
    Past: 'bg-gray-100 text-gray-600',
};

/** One visit's prescription: doctor + date, medicines, the doctor's notes and the PDF. */
export const PrescriptionDocument = ({ data }: { data: MedicineDetailsData }) => {
    const doctor = data.doctor_name ? (/^dr/i.test(data.doctor_name.trim()) ? data.doctor_name : `Dr. ${data.doctor_name}`) : null;
    const details: { label: string; icon: LucideIcon; value: string }[] = [
        { label: 'Diagnosis', icon: Stethoscope, value: text(data.diagnosis) },
        { label: 'Tests / Investigation', icon: FlaskConical, value: text(data.order_investigation) },
        { label: "Doctor's notes", icon: NotebookPen, value: text(data.notes) },
        { label: 'Instructions', icon: ListChecks, value: text(data.instructions_by_doctor) },
    ].filter((item) => item.value);

    return (
        <div className="space-y-5">
            {/* Visit header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Stethoscope className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-[#1F1E1E]">{doctor || 'Prescription'}</p>
                        <p className="text-sm text-muted-foreground">
                            {[data.department, data.appointment_date].filter(Boolean).join(' · ') || 'Consultation'}
                        </p>
                    </div>
                </div>
                {data.pdf_url && (
                    <a href={data.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:opacity-90">
                        <Download className="size-4" /> Download Prescription (PDF)
                    </a>
                )}
            </div>

            {/* Medicines */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                    <Pill className="size-5 text-primary" /> Prescribed medicines
                    <span className="text-sm font-normal text-muted-foreground">({data.medicines.length})</span>
                </h3>
                {data.medicines.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No medicines were prescribed for this visit.</p>
                ) : (
                    <ol className="divide-y divide-gray-100">
                        {data.medicines.map((m, i) => {
                            const how = text(m.display_instructions || m.instructions) || [m.frequencylabel, m.meal?.replace(/_/g, ' ')].filter(Boolean).join(' · ');
                            return (
                                <li key={m.prescription_id || i} className="flex gap-3 py-3">
                                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-[#1F1E1E] break-words">{m.display_name || m.name}</p>
                                            {m.status && (
                                                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', statusClass[m.status] || statusClass.Past)}>{m.status}</span>
                                            )}
                                        </div>
                                        {how && <p className="mt-1 text-sm text-[#4D4D4D]">{how}</p>}
                                        {m.date && <p className="mt-1 text-xs text-muted-foreground">{m.end_date ? 'Period' : 'From'}: {m.date}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>

            {/* Doctor's notes */}
            {details.length > 0 && (
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                        <ClipboardList className="size-5 text-primary" /> Consultation notes
                    </h3>
                    <dl className="divide-y divide-gray-100">
                        {details.map(({ label, icon: Icon, value }) => {
                            const lines = value.split(/\n+/).map((line) => line.replace(/^(\d+[.)]\s+|[-•*]\s*)/, '').trim()).filter(Boolean);
                            return (
                                <div key={label} className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr] sm:gap-4">
                                    <dt className="flex items-center gap-2 text-sm font-semibold text-[#1F1E1E]">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                                        {label}
                                    </dt>
                                    <dd className="text-sm leading-relaxed text-[#4D4D4D] sm:pt-1">
                                        {lines.length > 1 ? (
                                            <ul className="space-y-1">
                                                {lines.map((line, i) => (
                                                    <li key={i} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />{line}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            lines[0]
                                        )}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </section>
            )}

            {!data.pdf_url && data.medicines.length === 0 && details.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4" /> The doctor has not added a prescription yet.</p>
            )}
        </div>
    );
};
