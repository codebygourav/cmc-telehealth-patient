"use client";

/**
 * Contact us: the form, the list of a logged-in patient's inquiries with the support team's reply,
 * and the form as a drawer. Used by the floating button and the /contact-us page.
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/userContext";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, CornerDownRight, Loader2, MessageSquareText, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

type Fields = { first_name: string; last_name: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

// The support team's reply to an inquiry.
interface Reply {
    id: string;
    message: string;
    created_at: string | null;
}

interface Inquiry {
    id: string;
    message: string;
    created_at: string | null;
    status: "awaiting_reply" | "replied";
    replies: Reply[];
}

const MAX_MESSAGE = 2000;
const inputClass =
    "w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary aria-[invalid=true]:border-red-500";

export const inquiriesKey = (userId?: string) => ["contact-inquiries", userId] as const;

const formatWhen = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export function ContactForm({ onSent }: { onSent?: () => void }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    // The form can be on the page and in the drawer at once: each copy gets its own field ids.
    const uid = useId();
    // What was typed. A field not touched yet shows the logged-in patient's detail.
    const [typed, setTyped] = useState<Partial<Fields>>({});
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const account = (user ?? {}) as { id?: string; first_name?: string; last_name?: string; name?: string; email?: string };
    const form: Fields = {
        first_name: typed.first_name ?? account.first_name ?? account.name?.split(" ")[0] ?? "",
        last_name: typed.last_name ?? account.last_name ?? account.name?.split(" ").slice(1).join(" ") ?? "",
        email: typed.email ?? account.email ?? "",
        message: typed.message ?? "",
    };

    const set = (key: keyof Fields, value: string) => {
        setTyped((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const validate = (): Errors => {
        const found: Errors = {};
        if (!form.first_name.trim()) found.first_name = "First name is required.";
        if (!form.email.trim()) found.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = "Enter a valid email address.";
        if (!form.message.trim()) found.message = "Please write your message.";
        return found;
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError(null);

        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSending(true);
        try {
            await api.post("/contact-us", {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim() || null,
                email: form.email.trim(),
                message: form.message.trim(),
            });
            setTyped((current) => ({ ...current, message: "" }));
            if (account.id) {
                // The new inquiry shows in the patient's list at once.
                await queryClient.invalidateQueries({ queryKey: inquiriesKey(account.id) });
                onSent?.();
            }
            setSent(true);
        } catch (error) {
            const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[] | string>; message?: string } } }).response;
            const serverErrors = response?.data?.errors;

            if (response?.status === 429) {
                setFormError("Too many messages in a short time. Please try again in a minute.");
            } else if (serverErrors && typeof serverErrors === "object") {
                const mapped: Errors = {};
                (Object.keys(form) as (keyof Fields)[]).forEach((key) => {
                    const value = serverErrors[key];
                    if (value) mapped[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setErrors(mapped);
                if (Object.keys(mapped).length === 0) setFormError(response?.data?.message || "Could not send your message. Please try again.");
            } else {
                setFormError("Could not send your message. Please check your connection and try again.");
            }
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="py-6 text-center" role="status">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-3 text-lg font-semibold text-black">Message sent</h2>
                <p className="mt-1 text-sm text-[#4D4D4D]">Thank you for contacting us. We will reply to {form.email.trim()}.</p>
                <Button type="button" variant="outline" className="mt-5" onClick={() => setSent(false)}>
                    Send another message
                </Button>
            </div>
        );
    }

    const field = (key: keyof Fields, label: string, required: boolean, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <div>
            <label htmlFor={`${uid}-${key}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                id={`${uid}-${key}`}
                name={key}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `${uid}-${key}-error` : undefined}
                className={inputClass}
                {...props}
            />
            {errors[key] && <p id={`${uid}-${key}-error`} className="mt-1 text-xs text-red-600">{errors[key]}</p>}
        </div>
    );

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field("first_name", "First name", true, { maxLength: 100, autoComplete: "given-name" })}
                {field("last_name", "Last name", false, { maxLength: 100, autoComplete: "family-name" })}
            </div>
            {field("email", "Email", true, { type: "email", maxLength: 150, autoComplete: "email" })}

            <div>
                <label htmlFor={`${uid}-message`} className="mb-1.5 block text-sm font-medium text-slate-700">
                    Message <span className="text-red-600">*</span>
                </label>
                <textarea
                    id={`${uid}-message`}
                    name="message"
                    rows={5}
                    maxLength={MAX_MESSAGE}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? `${uid}-message-error` : `${uid}-message-count`}
                    className={inputClass}
                />
                <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span id={`${uid}-message-error`} className="text-red-600">{errors.message}</span>
                    <span id={`${uid}-message-count`} className="text-slate-500">{form.message.length} / {MAX_MESSAGE}</span>
                </div>
            </div>

            {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

            <Button type="submit" disabled={sending} className="w-full text-sm font-semibold btn-primary-cta">
                <Send size={16} className="m-0" />
                {sending ? "Sending..." : "Send message"}
            </Button>
        </form>
    );
}

/* ------------------------------------------------------------------ */
/* Earlier inquiries with the hospital's reply (logged-in patients)    */
/* ------------------------------------------------------------------ */

export function useInquiries() {
    const { user, initializing } = useAuth();
    const userId = user?.id as string | undefined;

    return useQuery({
        queryKey: inquiriesKey(userId),
        queryFn: async () => (await api.get<{ data: Inquiry[] }>("/contact-us/mine")).data.data,
        enabled: !initializing && !!userId,
        staleTime: 30 * 1000,
    });
}

/**
 * The patient's inquiries, newest first. Each shows what they asked and, once answered, the
 * support team's reply. There is no replying back here: a follow-up is a new inquiry.
 */
export function ContactInquiries() {
    const { user } = useAuth();
    const { data: inquiries, isLoading, isError } = useInquiries();

    if (!user) return null;

    if (isLoading) {
        return <p className="flex items-center justify-center gap-2 py-10 text-sm text-[#4D4D4D]"><Loader2 className="h-4 w-4 animate-spin" /> Loading your inquiries…</p>;
    }

    if (isError) {
        return <p role="alert" className="py-8 text-center text-sm text-red-600">Could not load your inquiries. Please try again.</p>;
    }

    if (!inquiries || inquiries.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[#D9DCE1] bg-white px-4 py-10 text-center">
                <MessageSquareText className="mx-auto h-10 w-10 text-[#C4C4C4]" />
                <p className="mt-2 text-sm font-semibold text-black">No inquiries yet</p>
                <p className="mt-1 text-sm text-[#4D4D4D]">Send us a message and our reply will show here.</p>
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {inquiries.map((inquiry) => {
                const replied = inquiry.replies.length > 0;
                return (
                    <li key={inquiry.id} className="rounded-xl bg-white p-4 border-grey shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-[#EEF0F2] sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-xs text-[#8A8A8A]">{formatWhen(inquiry.created_at)}</p>
                            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", replied ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                                {replied ? "Replied" : "Awaiting reply"}
                            </span>
                        </div>

                        <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-black">{inquiry.message}</p>

                        {inquiry.replies.map((reply) => (
                            <div key={reply.id} className="mt-3 rounded-lg bg-[#F4F7F5] p-3">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                                    <CornerDownRight className="h-3.5 w-3.5" />
                                    Reply from our support team
                                    <span className="font-normal text-[#8A8A8A]">· {formatWhen(reply.created_at)}</span>
                                </p>
                                <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-[#1F1E1E]">{reply.message}</p>
                            </div>
                        ))}
                    </li>
                );
            })}
        </ul>
    );
}

/* ------------------------------------------------------------------ */
/* The form in a drawer (phones: bottom sheet, like the other dialogs) */
/* ------------------------------------------------------------------ */

export function ContactFormDrawer({ open, onClose, showInquiriesLink = true }: { open: boolean; onClose: () => void; showInquiriesLink?: boolean }) {
    const { user } = useAuth();

    // Escape closes the drawer.
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="sheet-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-drawer-title"
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className="sheet-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
                <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    <X className="h-5 w-5" />
                </button>

                <div className="px-5 pt-5 pb-5">
                    <h2 id="contact-drawer-title" className="text-lg font-semibold text-[#1F1E1E]">Contact us</h2>
                    <p className="mt-0.5 mb-4 text-sm text-[#4D4D4D]">Questions about booking, payment or your appointment? Send us a message.</p>

                    <ContactForm onSent={onClose} />

                    {user && showInquiriesLink && (
                        <Link href="/contact-us" onClick={onClose} className="mt-4 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                            View my inquiries and replies
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
