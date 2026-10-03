"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CheckCircle2, Clock, Download, Printer, X } from "lucide-react";

export interface BookingConfirmationDetails {
    confirmed: boolean; // true = confirmed, false = awaiting doctor confirmation
    statusLabel: string;
    bookingId: string;
    patientName: string;
    patientAgeGender?: string;
    patientPhone?: string;
    patientUid?: string | null;
    bookedBy?: string | null;
    email?: string;
    doctorName: string;
    department?: string;
    date: string;
    time: string;
    consultationType?: string;
    amount?: string;
    paymentId?: string | null;
}

interface BookingConfirmationModalProps {
    open: boolean;
    details: BookingConfirmationDetails | null;
    onClose: () => void;
    onViewAppointments?: () => void;
    viewAppointmentsLabel?: string;
}

// Label / value rows shown in the modal, the PDF and the print view.
const rowsFor = (d: BookingConfirmationDetails): [string, string][] =>
    (
        [
            ["Booking ID", d.bookingId],
            ["Status", d.statusLabel],
            ["Patient", d.patientName],
            ["Age / Gender", d.patientAgeGender],
            ["Patient Phone", d.patientPhone],
            ["Patient UID", d.patientUid],
            ["Booked By", d.bookedBy],
            ["Email", d.email],
            ["Doctor", d.doctorName],
            ["Department", d.department],
            ["Date", d.date],
            ["Time", d.time],
            ["Consultation", d.consultationType],
            ["Amount Paid", d.amount],
            ["Payment ID", d.paymentId],
        ] as [string, string | null | undefined][]
    ).filter((row): row is [string, string] => !!row[1] && String(row[1]).trim() !== "");

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export default function BookingConfirmationModal({ open, details, onClose, onViewAppointments, viewAppointmentsLabel = "Go to My Appointments" }: BookingConfirmationModalProps) {
    if (!open || !details) return null;

    const rows = rowsFor(details);
    const title = details.confirmed ? "Appointment Confirmed" : "Booking Received";
    const isVideo = /video/i.test(details.consultationType || "");
    const note = details.confirmed
        ? isVideo
            ? "Your video consultation is confirmed. Join from My Appointments; the link opens 1 hour before the call."
            : "Your appointment is confirmed. Please reach the clinic at least 45 minutes before your appointment."
        : "Your booking is awaiting the doctor's confirmation. The doctor will set the call time and you will receive an email.";

    const downloadPdf = () => {
        const doc = new jsPDF();
        doc.setFillColor(1, 50, 32);
        doc.rect(0, 0, 210, 28, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text(title, 14, 17);
        doc.setFontSize(9);
        doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 196, 17, { align: "right" });

        autoTable(doc, {
            startY: 36,
            // The built-in PDF font has no ₹ glyph (it printed as "¹"), so use "Rs." in the PDF.
            body: rows.map(([label, value]) => [label, value.replace(/₹\s*/g, "Rs. ")]),
            theme: "grid",
            styles: { fontSize: 11, cellPadding: 3, textColor: [31, 30, 30] },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [90, 90, 90] } },
        });

        const y = ((doc as any).lastAutoTable?.finalY ?? 120) + 10;
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(doc.splitTextToSize(note, 182), 14, y);
        doc.save(`Booking-${details.bookingId}.pdf`);
    };

    const print = () => {
        const win = window.open("", "_blank", "width=720,height=900");
        if (!win) return;
        const tableRows = rows
            .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
            .join("");
        win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1f1e1e;margin:24px}
h1{background:#013220;color:#fff;margin:0 0 16px;padding:16px;border-radius:8px;font-size:20px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;font-size:14px}
th{width:34%;background:#f9fafb;color:#4d4d4d}p{font-size:13px;color:#4d4d4d;margin-top:14px}
</style></head><body><h1>${escapeHtml(title)}</h1><table>${tableRows}</table><p>${escapeHtml(note)}</p>
<script>window.onload=function(){window.print();}</script></body></html>`);
        win.document.close();
    };

    return (
        <div className="sheet-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <div className="sheet-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
                <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center gap-2 px-6 pt-6 text-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${details.confirmed ? "bg-green-100" : "bg-amber-100"}`}>
                        {details.confirmed ? <CheckCircle2 className="h-7 w-7 text-green-600" /> : <Clock className="h-7 w-7 text-amber-600" />}
                    </div>
                    <h2 className="text-lg font-semibold text-[#1F1E1E]">{title}</h2>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${details.confirmed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                    >
                        {details.statusLabel}
                    </span>
                    <p className="text-sm text-[#4D4D4D]">{note}</p>
                </div>

                <dl className="mx-6 mt-4 divide-y divide-[#E7E8EB] rounded-lg border border-[#E7E8EB]">
                    {rows.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                            <dt className="text-[#4D4D4D]">{label}</dt>
                            <dd className="text-right font-semibold text-[#1F1E1E] break-all">{value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="grid grid-cols-2 gap-3 p-6">
                    <button
                        type="button"
                        onClick={downloadPdf}
                        className="flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                        <Download className="h-4 w-4" /> Download PDF
                    </button>
                    <button
                        type="button"
                        onClick={print}
                        className="flex items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                    >
                        <Printer className="h-4 w-4" /> Print
                    </button>
                    {onViewAppointments && (
                        <button
                            type="button"
                            onClick={onViewAppointments}
                            className="col-span-2 rounded-md py-2 text-sm font-medium text-[#4D4D4D] hover:bg-[#F5F6F8]"
                        >
                            {viewAppointmentsLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
