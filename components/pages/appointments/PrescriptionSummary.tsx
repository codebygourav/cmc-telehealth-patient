"use client";

import { ChevronRight, Download, FileText } from "lucide-react";

/** The doctor's prescription for this appointment: medicines, diagnosis, tests, instructions and the PDF. */
export default function PrescriptionSummary({ prescription, onViewDetail }: { prescription: any; onViewDetail?: () => void }) {
    const medicines: any[] = prescription?.medicines || [];
    const instructions = Array.isArray(prescription?.instructions_by_doctor)
        ? prescription.instructions_by_doctor.filter(Boolean).join("\n")
        : prescription?.instructions_by_doctor;
    const rows = [
        ["Diagnosis", prescription?.diagnosis],
        ["Tests / Investigation", prescription?.order_investigation],
        ["Notes", prescription?.notes],
        ["Instructions", instructions],
        ["Next visit", prescription?.next_visit_date],
    ].filter(([, value]) => value && String(value).trim());

    if (!medicines.length && !rows.length && !prescription?.pdf_url) return null;

    return (
        <div className="mt-6 g-border global-radius bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1F1E1E]">
                    <FileText size={20} className="text-primary" /> Prescription
                </h3>
                <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex">
                    {onViewDetail && (
                        <button type="button" onClick={onViewDetail}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/5">
                            View details <ChevronRight size={16} />
                        </button>
                    )}
                    {prescription?.pdf_url && (
                        <a href={prescription.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:opacity-90">
                            <Download size={16} /> Download PDF
                        </a>
                    )}
                </div>
            </div>

            {medicines.length > 0 && (
                <>
                    {/* Phones: one card per medicine */}
                    <ol className="space-y-2 sm:hidden">
                        {medicines.map((m, i) => {
                            const how = [m.dosage, m.frequency, m.duration].filter((v: any) => v && String(v).trim()).join(" · ");
                            const notes = [m.meal?.replace(/_/g, " "), m.display_instructions || m.instructions].filter(Boolean).join(" · ");
                            return (
                                <li key={m.id || i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                    <p className="flex gap-2 text-sm font-semibold text-[#1F1E1E]">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">{i + 1}</span>
                                        <span className="min-w-0 break-words">{m.display_name || m.name || "-"}</span>
                                    </p>
                                    {how && <p className="mt-1 pl-7 text-sm text-[#4D4D4D]">{how}</p>}
                                    {notes && <p className="mt-1 whitespace-pre-line pl-7 text-sm text-[#4D4D4D]">{notes}</p>}
                                </li>
                            );
                        })}
                    </ol>

                    {/* Wider screens: table */}
                    <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-muted-foreground">
                            <tr><th className="py-2 pr-3">#</th><th className="py-2 pr-3">Medicine</th><th className="py-2 pr-3">Dosage</th><th className="py-2 pr-3">Frequency</th><th className="py-2 pr-3">Duration</th><th className="py-2">Instructions</th></tr>
                        </thead>
                        <tbody>
                            {medicines.map((m, i) => (
                                <tr key={m.id || i} className="border-b last:border-0 align-top">
                                    <td className="py-2 pr-3">{i + 1}</td>
                                    <td className="py-2 pr-3 font-medium text-[#1F1E1E]">{m.display_name || m.name || "-"}</td>
                                    <td className="py-2 pr-3">{m.dosage || "-"}</td>
                                    <td className="py-2 pr-3">{m.frequency || "-"}</td>
                                    <td className="py-2 pr-3">{m.duration || "-"}</td>
                                    <td className="py-2 whitespace-pre-line">{[m.meal?.replace(/_/g, " "), m.display_instructions || m.instructions].filter(Boolean).join(" · ") || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </>
            )}

            {rows.length > 0 && (
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rows.map(([label, value]) => (
                        <div key={label as string} className="rounded-lg bg-gray-50 p-3">
                            <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
                            <dd className="mt-1 whitespace-pre-line text-sm text-[#1F1E1E]">{String(value)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
