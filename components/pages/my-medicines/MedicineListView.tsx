"use client";

import { Pill } from "lucide-react";
import type { Prescription } from "@/types/prescriptions";
import { ChevronRight, Download, Stethoscope } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTabs from "@/components/custom/CustomTabs";
import { usePrescriptions } from "@/queries/usePrescriptions";
import { useAuth } from "@/context/userContext";
import { useState } from "react";
import HeroSection from "@/components/hero-section";
import { EmptyState } from "@/components/custom/EmptyState";

interface MedicineListViewProps {
    onViewDetail: (id: string) => void;
}

export const MedicineListView = ({ onViewDetail }: MedicineListViewProps) => {
    const [activeTab, setActiveTab] = useState<"current" | "past">("current");
    const { user } = useAuth();
    const patientID = user?.patient_id;

    const {
        data: prescriptionsResponse,
        isLoading: isListLoading,
        isError: isListError,
    } = usePrescriptions({ patientID, filter: activeTab });

    const prescriptions = prescriptionsResponse?.data || [];
    // One card per visit (the API returns one row per medicine).
    const visits = Object.values(
        prescriptions.reduce<Record<string, Prescription[]>>((groups, item) => {
            (groups[item.appointment_id] ||= []).push(item);
            return groups;
        }, {}),
    );

    return (
        <div className="space-y-8 duration-500 animate-in fade-in">

            <HeroSection
                title="Medicines"
                description="Track your current and past medications."
            />

            <CustomTabs
                variant="pill"
                activeTabBg="#013220"
                activeTabColor="white"
                tabs={[
                    { key: "current", label: "Current Medicine" },
                    { key: "past", label: "Past Medicine" },
                ]}
                activeTab={activeTab}
                onTabChange={(val) => setActiveTab(val as "current" | "past")}
                tabsListClassName="max-w-md"
            />

            {isListLoading ? (
                <div className="grid grid-cols-1 gap-6 container-max-width mx-auto w-full">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[200px] w-full global-radius" />
                    ))}
                </div>
            ) : isListError ? (
                <div className="container-max-width mx-auto w-fullpy-20 text-center border border-dashed bg-destructive/5 global-radius border-destructive/20">
                    <h3 className="mb-2 text-xl font-bold text-destructive">
                        Failed to load medicines
                    </h3>
                    <p className="text-on-surface-variant">
                        There was an error fetching your medications. Please try again later.
                    </p>
                </div>
            ) : visits.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 container-max-width mx-auto w-full md:grid-cols-2">
                    {visits.map((items) => (
                        <VisitCard key={items[0].appointment_id} items={items} onView={() => onViewDetail(items[0].appointment_id)} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Pill />}
                    title="No medicines found"
                    description={`You don't have any ${activeTab} medications at the moment.`}
                />
            )}
        </div>
    );
};

const VisitCard = ({ items, onView }: { items: Prescription[]; onView: () => void }) => {
    const first = items[0];
    const doctor = first.doctor_name ? (/^dr/i.test(first.doctor_name.trim()) ? first.doctor_name : `Dr. ${first.doctor_name}`) : "Doctor";

    return (
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Stethoscope className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1F1E1E]">{doctor}</p>
                    <p className="text-sm text-muted-foreground">{first.appointment_date || "Consultation"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {items.length} medicine{items.length === 1 ? "" : "s"}
                </span>
            </div>

            {first.diagnosis && <p className="mt-3 text-sm text-[#4D4D4D]"><span className="font-semibold">Diagnosis:</span> {first.diagnosis}</p>}

            <ul className="mt-3 flex-1 space-y-1.5">
                {items.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                        <Pill className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                            <span className="font-medium text-[#1F1E1E]">{item.display_name || item.medicine_name || item.medician_name}</span>
                            {item.frequencylabel && <span className="text-muted-foreground"> · {item.frequencylabel}</span>}
                        </span>
                    </li>
                ))}
                {items.length > 4 && <li className="pl-6 text-xs text-muted-foreground">+{items.length - 4} more</li>}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                <button type="button" onClick={onView}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:opacity-90">
                    View prescription <ChevronRight className="size-4" />
                </button>
                {first.pdf_url && (
                    <a href={first.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-primary hover:bg-primary/5">
                        <Download className="size-4" /> PDF
                    </a>
                )}
            </div>
        </div>
    );
};
