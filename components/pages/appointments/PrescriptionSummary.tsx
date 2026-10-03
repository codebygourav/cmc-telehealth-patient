"use client";

import { Download, FileText } from "lucide-react";

/** The doctor's prescription for this appointment: medicines, diagnosis, tests, instructions and the PDF. */
export default function PrescriptionSummary({ prescription }: { prescription: any }) {
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1F1E1E]">
                    <FileText size={20} className="text-primary" /> Prescription
                </h3>
                {prescription?.pdf_url && (
                    <a href={prescription.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        <Download size={16} /> Download Prescription (PDF)
                    </a>
                )}
            </div>

            {medicines.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-muted-foreground">
                            <tr><th className="py-2 pr-3">#</th><th className="py-2 pr-3">Medicine</th><th className="py-2 pr-3">Dosage</th><th className="py-2 pr-3">Frequency</th><th className="py-2 pr-3">Duration</th><th className="py-2">Instructions</th></tr>
                        </thead>
                        <tbody>
                            {medicines.map((m, i) => (
                                <tr key={m.id || i} className="border-b last:border-0 align-top">
                                    <td className="py-2 pr-3">{i + 1}</td>
                                    <td className="py-2 pr-3 font-medium text-[#1F1E1E]">{m.name || "-"}</td>
                                    <td className="py-2 pr-3">{m.dosage || "-"}</td>
                                    <td className="py-2 pr-3">{m.frequency || "-"}</td>
                                    <td className="py-2 pr-3">{m.duration || "-"}</td>
                                    <td className="py-2 whitespace-pre-line">{[m.meal?.replace(/_/g, " "), m.instructions].filter(Boolean).join(" · ") || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
