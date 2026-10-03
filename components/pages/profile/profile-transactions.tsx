"use client";

import { useTransactions } from "@/queries/transactions";
import { useState } from "react";
import { TransactionReceiptPDF } from "@/components/pdf/TransactionReceiptPDF";
import { cn } from "@/lib/utils";
import { getPaymentMethodIcon, getTransactionStatusIcon } from "@/src/utils/getIcons";
import {
    ArrowUpRight,
    Calendar,
    Clock,
    Download,
    FileText,
    Loader2,
    Receipt,
    ShieldAlert,
    User,
    Video,
    MapPin,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formatAmount = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
};

function formatDoctorName(name?: string | null) {
    if (!name) return null;
    const clean = name.replace(/^(Dr\.\s*)+/gi, "").trim();
    return clean ? `Dr. ${clean}` : null;
}

export default function ProfileTransactions() {
    const { data, isLoading, isError, refetch } = useTransactions();
    const [selectedStatus, setSelectedStatus] = useState<string>("All");

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading appointment transactions...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                <p className="text-sm font-semibold text-foreground">Could not load transactions</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    const transactions = data?.data || [];

    const statuses = ["All", ...Array.from(new Set(transactions.map((t: any) => t.status || "paid")))];

    const filteredTransactions = selectedStatus === "All"
        ? transactions
        : transactions.filter((t: any) => (t.status || "paid") === selectedStatus);

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10">
                <Receipt className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold text-foreground">No Transactions Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    You have no appointment transactions recorded yet. Once you book an appointment, your transaction history and receipts will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {statuses.map((status: any) => {
                    const count = status === "All"
                        ? transactions.length
                        : transactions.filter((t: any) => (t.status || "paid") === status).length;
                    const isActive = selectedStatus === status;

                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setSelectedStatus(status)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer border",
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                    : "border-border/70 bg-background text-foreground/80 hover:border-primary/40 hover:bg-muted"
                            )}
                        >
                            <span className="capitalize">{status}</span>
                            <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px]",
                                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {filteredTransactions.map((item: any) => {
                    const { icon: StatusIcon, color: statusColor, bg: statusBg } = getTransactionStatusIcon(item.status || "paid");
                    const { icon: PayIcon, color: payColor } = getPaymentMethodIcon(item.payment_method || "card");

                    const docName = formatDoctorName(item.doctor_name || item.paid_to);
                    const apptDate = item.appointment_date || item.date;
                    const apptTime = item.appointment_time;
                    const consultationType = item.consultation_type;

                    return (
                        <div
                            key={item.id}
                            className="rounded-2xl border border-border/80 bg-white p-4 sm:p-6 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs flex flex-col gap-4"
                        >
                            {/* Card Header: Patient / Doctor Info + Amount */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 sm:pb-0 border-b sm:border-b-0 border-border/40">
                                <div className="flex items-start gap-3">
                                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5", statusBg)}>
                                        <StatusIcon className={cn("h-5 w-5", statusColor)} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-base font-bold text-foreground">
                                                {item.patient_name ? `${item.patient_name}` : "Appointment Booking"}
                                            </h4>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "capitalize text-[10px] font-bold px-2 py-0.5 rounded-md",
                                                    item.status === "paid" || item.status === "completed"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : item.status === "pending"
                                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                                )}
                                            >
                                                {item.status_label || item.status || "Paid"}
                                            </Badge>
                                        </div>

                                        {/* Doctor Name */}
                                        {docName && (
                                            <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                                                <span>{docName}</span>
                                            </p>
                                        )}

                                        {/* Appointment Date & Time */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            {apptDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-primary/80" />
                                                    <span>{apptDate}</span>
                                                </span>
                                            )}
                                            {apptTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-primary/80" />
                                                    <span>{apptTime}</span>
                                                </span>
                                            )}
                                            {consultationType && (
                                                <span className="flex items-center gap-1 font-medium text-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md">
                                                    {consultationType.toLowerCase().includes("video") ? (
                                                        <Video className="h-3 w-3 text-primary" />
                                                    ) : (
                                                        <MapPin className="h-3 w-3 text-primary" />
                                                    )}
                                                    <span className="capitalize">{consultationType}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Amount & Payment Method */}
                                <div className="flex sm:flex-col justify-between items-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    <span className="text-xs text-muted-foreground sm:hidden">Amount Paid:</span>
                                    <p className="text-xl font-bold text-foreground">
                                        {formatAmount(item.amount, item.currency)}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                        <PayIcon className={cn("h-3.5 w-3.5", payColor)} />
                                        <span className="capitalize">{item.payment_method || "Online"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details & Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                {/* Txn IDs */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground min-w-0 break-all">
                                    {item.transaction_id && (
                                        <span className="font-mono text-[11px] sm:text-xs break-all">
                                            <strong className="font-sans font-semibold text-foreground">Txn ID:</strong> {item.transaction_id}
                                        </span>
                                    )}
                                    {item.order_id && (
                                        <span className="font-mono text-[11px] sm:text-xs break-all">
                                            <strong className="font-sans font-semibold text-foreground">Order ID:</strong> {item.order_id}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    <TransactionReceiptPDF transaction={item} variant="button" />
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-3 rounded-xl border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary font-semibold text-xs gap-1.5 shrink-0"
                                    >
                                        <Link href={`/transactions/${item.id}`}>
                                            View Details
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
