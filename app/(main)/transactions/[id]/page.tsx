"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchTransactionById } from "@/api/transactions";
import {
    CreditCard,
    Smartphone,
    Banknote,
    CheckCircle,
    XCircle,
    Calendar,
    Clock,
    Hash,
    User,
    Stethoscope,
    Receipt,
    ArrowLeft,
    FileText,
    Link2,
    Download,
    File,
    Landmark,
    Building2,
    Copy,
    Check
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TransactionReceiptPDF } from "@/components/pdf/TransactionReceiptPDF";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DetailHeader } from "@/components/custom/DetailHeader";

interface TransactionDetailProps {
    params: { id: string };
}

export const dynamic = "force-dynamic";

// Helper function to get status icon and color
const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
        case "paid":
            return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" };
        case "pending":
            return { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" };
        case "cancelled":
        case "failed":
            return { icon: XCircle, color: "text-red-600", bg: "bg-red-50" };
        default:
            return { icon: Clock, color: "text-gray-600", bg: "bg-gray-50" };
    }
};

const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
        case "card":
            return CreditCard;
        case "upi":
            return Smartphone;
        default:
            return Banknote;
    }
};

const formatAmount = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount));
};


function formatDoctorName(name?: string | null) {
    if (!name) return null;
    const clean = name.replace(/^(Dr\.\s*)+/gi, "").trim();
    return clean ? `Dr. ${clean}` : null;
}

export default function TransactionDetail({ params }: TransactionDetailProps) {
    const router = useRouter();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                setLoading(true);
                const { id } = await params;
                const data = await fetchTransactionById(id, "");
                setTransaction(data);
            } catch (err: any) {
                console.error("Failed to fetch transaction:", err);
                if (err.response?.status === 401) {
                    setError("Unauthorized. Please login again.");
                    setTimeout(() => {
                        router.push("/auth/login");
                    }, 2000);
                } else {
                    setError("Failed to load transaction details");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [params, router]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-500">Loading transaction details...</p>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600">{error || "Transaction not found"}</p>
                    <button
                        onClick={() => router.push("/profile?tab=transactions")}
                        className="mt-4 text-sm text-primary hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back to Profile Transactions
                    </button>
                </div>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(transaction.status).icon;
    const statusStyle = getStatusIcon(transaction.status);
    const docName = formatDoctorName(transaction.doctor_name || transaction.paid_to);

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Back Button and Download */}
                <DetailHeader
                    title="Transaction Details"
                    subtitle="Back to Transactions"
                    onBack={() => router.push("/profile?tab=transactions")}
                />

                {/* Status Card */}
                <div className={`${statusStyle.bg} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xs border border-gray-100`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <StatusIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${statusStyle.color} shrink-0`} />
                            <div>
                                <p className={`font-semibold text-base sm:text-lg ${statusStyle.color}`}>
                                    {transaction.status_label || transaction.status}
                                </p>
                                <p className="font-medium text-xs text-gray-700">{transaction.date || "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col justify-between items-baseline sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/50">
                            <p className="text-xs sm:text-sm text-gray-600">Amount</p>
                            <p className="font-bold text-xl sm:text-2xl text-gray-900">
                                {formatAmount(transaction.amount, transaction.currency)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Clean Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    {/* Transaction ID Header */}
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 bg-gray-50/50">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 shrink-0">Transaction ID</p>
                        <div className="flex items-center gap-2 min-w-0 break-all">
                            <p className="font-mono font-semibold text-xs sm:text-sm text-gray-900 break-all">
                                {transaction.transaction_id || transaction.id}
                            </p>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(transaction.transaction_id || transaction.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer shrink-0"
                            >
                                {copiedId ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="divide-y divide-gray-100 text-sm">
                        {/* Patient Name */}
                        {transaction.patient_name && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Patient Name</p>
                                <p className="font-semibold text-gray-900 text-sm sm:text-right break-words">{transaction.patient_name}</p>
                            </div>
                        )}

                        {/* Doctor Name */}
                        {docName && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Doctor Name</p>
                                <p className="font-semibold text-primary text-sm sm:text-right break-words">{docName}</p>
                            </div>
                        )}

                        {/* Appointment Date & Time */}
                        {(transaction.appointment_date || transaction.appointment_time) && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Appointment Schedule</p>
                                <div className="sm:text-right">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {transaction.appointment_date || ""} {transaction.appointment_time ? `at ${transaction.appointment_time}` : ""}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Consultation Mode */}
                        {transaction.consultation_type && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Consultation Mode</p>
                                <p className="font-semibold text-gray-900 text-sm capitalize sm:text-right">{transaction.consultation_type}</p>
                            </div>
                        )}

                        {/* Appointment ID */}
                        {transaction.appointment_id && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Appointment Ref</p>
                                <Link
                                    href={`/appointments/${transaction.appointment_id}`}
                                    className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1 break-all"
                                >
                                    <span>#{transaction.appointment_id}</span>
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                </Link>
                            </div>
                        )}

                        {/* Order ID */}
                        {transaction.order_id && (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Order ID</p>
                                <p className="font-mono text-gray-900 text-xs break-all sm:text-right">{transaction.order_id}</p>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Payment Method</p>
                            <p className="font-semibold text-gray-900 text-sm capitalize sm:text-right">{transaction.payment_method || "Online"}</p>
                        </div>

                        {/* Show Bank/UPI details */}
                        {(transaction.payment_method?.toLowerCase() !== "upi" && transaction.bank_name) ||
                            (transaction.payment_method?.toLowerCase() === "upi" && (transaction.upi_id || transaction.account_details)) ? (
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">
                                    {transaction.payment_method?.toLowerCase() === "upi" ? "UPI ID" : "Bank Name"}
                                </p>
                                <div className="sm:text-right break-all">
                                    <p className="font-medium text-gray-900 text-sm break-all">
                                        {transaction.payment_method?.toLowerCase() === "upi"
                                            ? (transaction.upi_id || transaction.account_details)
                                            : transaction.bank_name}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Attachments Section */}
                    <TransactionReceiptPDF transaction={{ ...transaction, doctor_name: docName }} />
                </div>
            </div>
        </div>
    );
}