"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, IdCard, KeyRound, Link2Off, Loader2, Lock, MapPin, Pencil, Phone, Receipt, ShieldCheck, User, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/userContext";
import { familyProfilesKey, useActiveProfile } from "@/context/activeProfileContext";
import { leaveFamilyManager, familyApiError, type FamilyManager, type FamilyProfile } from "@/api/family";
import PersonalInfoForm from "@/components/pages/profile/personal-info";
import ManageAddressForm from "@/components/pages/profile/manage-address";
import ChangePasswordForm from "@/components/pages/profile/change-password";
import MemberLoginSection from "@/components/pages/family/MemberLoginSection";
import { emptyFamilyMember } from "@/components/pages/family/FamilyMemberForm";
import ProfileMedicalRecords from "@/components/pages/profile/profile-medical-records";
import UnlinkMemberDialog from "@/components/pages/family/UnlinkMemberDialog";
import { ProfileAvatar } from "@/components/layout/ProfileSwitcherList";
import HeroSection from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ProfileTransactions from "@/components/pages/profile/profile-transactions";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

type ProfileTab = "basic" | "address" | "password" | "records" | "transactions";

function ProfilePageContent() {
    const { user } = useAuth();
    const { activeProfile, isFamilyView, switchTo, managedBy } = useActiveProfile();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as ProfileTab;
    const initialTab = tabParam || "basic";
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
    const [unlinkTarget, setUnlinkTarget] = useState<FamilyProfile | null>(null);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Member-side: leave the primary account's management from profile page
    const [leaveTarget, setLeaveTarget] = useState<FamilyManager | null>(null);
    const [leaving, setLeaving] = useState(false);

    const member = isFamilyView ? activeProfile : null;

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: familyProfilesKey(user?.id) });
    };

    const afterUnlink = async () => {
        setUnlinkTarget(null);
        switchTo(null);
        await refresh();
    };

    const confirmLeave = async () => {
        if (!leaveTarget) return;
        try {
            setLeaving(true);
            const res = await leaveFamilyManager(leaveTarget.link_id);
            toast.success(res?.message || "Unlinked from the primary account.");
            setLeaveTarget(null);
            await refresh();
        } catch (err) {
            toast.error(familyApiError(err));
        } finally {
            setLeaving(false);
        }
    };

    const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
        { id: "basic", label: "Basic Information", icon: User },
        { id: "address", label: "Address Details", icon: MapPin },
        { id: "password", label: "Change Password", icon: Lock },
        { id: "records", label: "Medical Records", icon: FileText },
        { id: "transactions", label: "Transactions", icon: Receipt },
    ];

    return (
        <div>
            <HeroSection
                title={member ? `${member.first_name}'s Profile` : "Profile Settings"}
                description={member
                    ? `You are managing ${member.name}'s profile. Changes here are saved on their profile.`
                    : "Manage your personal information, address, and password."}
            />

            <div className="container-max-width mx-auto w-full space-y-5">
                {/* Managed By Primary Account Banner */}
                {managedBy.length > 0 && !member && (
                    <section className="space-y-2">
                        {managedBy.map((manager) => (
                            <div key={manager.link_id} className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                    <div className="min-w-0 text-sm">
                                        <p className="font-semibold text-[#1F1E1E]">Your profile is managed by {manager.holder_name || "a primary account"}</p>
                                        <p className="break-all text-muted-foreground">
                                            {manager.holder_email ? `${manager.holder_email} · ` : ""}They can book for you and see your appointments and reports.
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="shrink-0 border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => setLeaveTarget(manager)}>
                                    <Link2Off className="mr-1 h-4 w-4" /> Unlink from primary account
                                </Button>
                            </div>
                        ))}
                    </section>
                )}

                {member && (
                    <section className="mx-auto rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <ProfileAvatar name={member.name} index={1} className="h-12 w-12" />
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                                        {member.name}
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{member.relationship_label}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">Family profile managed by your account ({user?.email})</p>
                                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-[#4D4D4D] sm:grid-cols-2">
                                        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{member.phone || "No phone"}</span>
                                        <span className="flex items-center gap-2"><IdCard className="h-4 w-4 text-primary" />{member.unit_id ? `Unit ID ${member.unit_id}` : "No Unit ID yet"}</span>
                                        {member.has_login && (
                                            <span className="flex min-w-0 items-center gap-2 sm:col-span-2"><KeyRound className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">Own login: {member.login_email}</span></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/family-members"><Pencil className="mr-1 h-4 w-4" /> Edit details</Link>
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => setUnlinkTarget(member)}>
                                    <Link2Off className="mr-1 h-4 w-4" /> Unlink profile
                                </Button>
                            </div>
                        </div>
                        <button type="button" onClick={() => switchTo(null)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                            <Users className="h-4 w-4" /> Switch back to my profile
                        </button>
                    </section>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <div className="flex overflow-x-auto rounded-lg border border-[#E7E8EB] bg-white p-2 shadow-[0px_2px_4px_0px_#0000001A] lg:flex-col lg:space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex shrink-0 items-center gap-2.5 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors lg:w-full",
                                            isActive
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-[#4D4D4D] hover:bg-[#F5F6F8] hover:text-primary"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="lg:col-span-3">
                        <section className="rounded-lg border border-[#E7E8EB] bg-white p-5 shadow-[0px_2px_4px_0px_#0000001A] sm:p-8">
                            <h2 className="mb-1 text-lg font-semibold text-[#1F1E1E]">
                                {activeTab === "basic" && "Basic Information"}
                                {activeTab === "address" && "Address Details"}
                                {activeTab === "password" && "Change Password"}
                                {activeTab === "records" && "Medical Records & Reports"}
                                {activeTab === "transactions" && "Appointment Transactions & Receipts"}
                            </h2>
                            <p className="mb-6 text-sm text-muted-foreground">
                                {activeTab === "basic" && (member ? `These details appear on ${member.first_name}'s appointments and bookings.` : "These details appear on your appointments and bookings.")}
                                {activeTab === "address" && "Update your address for clinic visits and prescription delivery."}
                                {activeTab === "password" && (member ? `${member.first_name}'s login. A code is sent to their email to reset the password.` : "Update your account password to keep your profile secure.")}
                                {activeTab === "records" && "Upload and manage private reports under your profile. Reports here are not shared with doctors unless attached to an appointment."}
                                {activeTab === "transactions" && "View all appointment payment records and download official PDF transaction receipts."}
                            </p>

                            {user ? (
                                <>
                                    {activeTab === "basic" && <PersonalInfoForm key={activeProfile?.patient_id ?? "own"} user={user} viewing={member} />}
                                    {activeTab === "address" && <ManageAddressForm user={user} />}
                                    {activeTab === "password" && (member
                                        // Viewing a family member: their password (code to their email), never the signed-in account's.
                                        ? <MemberLoginSection value={emptyFamilyMember} onChange={() => undefined} idPrefix="profile-member" profile={member} />
                                        : <ChangePasswordForm />)}
                                    {activeTab === "records" && <ProfileMedicalRecords user={user} />}
                                    {activeTab === "transactions" && <ProfileTransactions />}
                                </>
                            ) : (
                                <div className="h-40 animate-pulse rounded-md bg-gray-100" aria-busy="true" />
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Leave / Unlink confirmation dialog for member leaving primary account management */}
            <Dialog open={!!leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)}>
                <DialogContent className="max-w-[95vw] rounded-xl p-5 sm:max-w-md">
                    <DialogTitle className="text-lg font-semibold">Unlink from {leaveTarget?.holder_name || "the primary account"}?</DialogTitle>
                    <div className="space-y-2 text-sm text-[#4D4D4D]">
                        <p>After unlinking:</p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>{leaveTarget?.holder_name || "They"} can no longer book for you or see your appointments and reports.</li>
                            <li>You keep your login and all your appointments and medical history.</li>
                        </ul>
                    </div>
                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => setLeaveTarget(null)} disabled={leaving}>Cancel</Button>
                        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmLeave} disabled={leaving}>
                            {leaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlinking...</> : "Unlink"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <UnlinkMemberDialog target={unlinkTarget} onClose={() => setUnlinkTarget(null)} onUnlinked={afterUnlink} />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
