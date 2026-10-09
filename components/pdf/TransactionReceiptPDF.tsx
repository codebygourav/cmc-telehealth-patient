"use client";

import { Download, FileDownIcon, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface TransactionData {
    transaction_id?: string;
    id?: string;
    status?: string;
    status_label?: string;
    date?: string;
    amount?: string;
    currency?: string;
    paid_to?: string;
    order_id?: string;
    payment_method?: string;
    bank_name?: string;
    upi_id?: string;
    account_details?: string;
    patient_name?: string;
    doctor_name?: string;
}

interface TransactionReceiptPDFProps {
    transaction: TransactionData;
    variant?: "button" | "card";
}

/**
 * Receipt PDF from the server: the same CMC letterhead (header / footer) as the prescription and
 * medical record PDFs (resources/views/ReceiptTemplate/receipt.blade.php).
 */
export const TransactionReceiptPDF: React.FC<TransactionReceiptPDFProps> = ({
    transaction,
    variant = "card",
}) => {
    const [downloading, setDownloading] = useState(false);

    const generatePDF = async () => {
        const paymentId = transaction?.id;
        if (!paymentId || downloading) return;

        setDownloading(true);
        try {
            const res = await api.get(`/patient/transactions/${paymentId}/receipt`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `CMC-Telehealth-Receipt-${transaction.transaction_id || paymentId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            toast.error('Could not download the receipt. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const Icon = downloading ? Loader2 : Download;

    if (variant === "button") {
        return (
            <button
                type="button"
                onClick={generatePDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
                <Icon className={`h-3.5 w-3.5 ${downloading ? "animate-spin" : ""}`} />
                <span>Receipt PDF</span>
            </button>
        );
    }

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
                Attachments
            </h3>

            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-md shadow-xs flex items-center justify-center border border-gray-200 shrink-0">
                        <FileDownIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-semibold text-gray-900 text-sm truncate">
                            Receipt.pdf
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            Online receipt for this transaction
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={generatePDF}
                    className="text-primary hover:text-primary/80 transition-colors p-2 cursor-pointer shrink-0 rounded-lg hover:bg-primary/10"
                    title="Download Receipt PDF"
                >
                    <Icon className={`w-5 h-5 ${downloading ? "animate-spin" : ""}`} />
                </button>
            </div>
        </div>
    );
};
