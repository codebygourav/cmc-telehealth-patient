"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IdCard, KeyRound, Link, Link2Off, Loader2, Mail, Pencil, Phone, Plus, ShieldCheck, Users } from "lucide-react";
import HeroSection from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { addFamilyProfile, familyApiError, familyFieldErrors, leaveFamilyManager, lookupFamilyMember, type ExistingProfileMatch, updateFamilyProfile, type FamilyManager, type FamilyProfile } from "@/api/family";
import { clearSessionDraft, readSessionDraft, useSessionDraft } from "@/lib/useSessionDraft";
import { familyProfilesKey, profileSubtitle, useActiveProfile } from "@/context/activeProfileContext";
import { useAuth } from "@/context/userContext";
import { ProfileAvatar } from "@/components/layout/ProfileSwitcherList";
import ExistingProfileMatchPanel from "@/components/pages/family/ExistingProfileMatchPanel";
import UnlinkMemberDialog from "@/components/pages/family/UnlinkMemberDialog";
import RelinkDialog from "@/components/pages/family/RelinkDialog";
import SheetDialog from "@/components/custom/SheetDialog";
import FamilyMemberForm, {
    emptyFamilyMember,
    familyMemberDraft,
    familyMemberFromProfile,
    toFamilyMemberInput,
    validateFamilyMember,
    type FamilyMemberErrors,
    type FamilyMemberFormValue,
} from "@/components/pages/family/FamilyMemberForm";

function FamilyProfilesContent() {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { familyMembers, relationships, maxProfiles, loading, switchTo, activeProfile, managedBy, viewedProfile, viewedFamily, unlinkedFamily, isFamilyView } = useActiveProfile();
    // Like being signed in to the viewed profile: that profile, then family added under it.
    const profiles = viewedProfile ? [viewedProfile, ...viewedFamily, ...unlinkedFamily] : [];

    // Add / edit form (null = closed, "new" = add, else the patient id being edited)
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState<FamilyMemberFormValue>(emptyFamilyMember);
    const [errors, setErrors] = useState<FamilyMemberErrors>({});
    const [saving, setSaving] = useState(false);
    // The person being added is already a patient here: offer to link that profile.
    const [match, setMatch] = useState<ExistingProfileMatch | null>(null);

    // Unlink dialog
    const [unlinkTarget, setUnlinkTarget] = useState<FamilyProfile | null>(null);

    // Member-side: leave the primary account's management
    const [leaveTarget, setLeaveTarget] = useState<FamilyManager | null>(null);
    const [leaving, setLeaving] = useState(false);

    // The open add / edit form survives a page reload (never the password).
    const DRAFT_KEY = "family-member-form-draft";
    useSessionDraft<{ editing: string; form: FamilyMemberFormValue }>(
        DRAFT_KEY,
        editing ? { editing, form: familyMemberDraft(form) } : null,
        (saved) => {
            if (!saved?.editing || !saved.form) return;
            // Draft is only applied if editing is already open
        },
    );

    // ?add=1 (from the profile menu) opens the add form once, then leaves the URL.
    const router = useRouter();
    const pathname = usePathname();
    const addHandled = useRef(false);
    const wantsAdd = searchParams.get("add") === "1";
    useEffect(() => {
        if (!wantsAdd || addHandled.current) return;
        addHandled.current = true;
        openAdd();
        router.replace(pathname, { scroll: false });
    }, [wantsAdd]); // eslint-disable-line react-hooks/exhaustive-deps

    const closeForm = () => {
        setEditing(null);
        setMatch(null);
        clearSessionDraft(DRAFT_KEY);
    };

    const refresh = () => queryClient.invalidateQueries({ queryKey: familyProfilesKey(user?.id) });

    const openAdd = () => {
        setMatch(null);
        setForm(emptyFamilyMember);
        setErrors({});
        setEditing("new");
    };

    const openEdit = (profile: FamilyProfile) => {
        setMatch(null);
        setForm(familyMemberFromProfile(profile));
        setErrors({});
        setEditing(profile.patient_id);
    };

    // Link Again: only the code check; their details can be edited once linked.
    const [relinkTarget, setRelinkTarget] = useState<FamilyProfile | null>(null);
    const openRelink = (profile: FamilyProfile) => setRelinkTarget(profile);

    const findExisting = (loginEmail?: string) => lookupFamilyMember({
        name: form.name.trim(),
        phone: form.phone,
        unit_id: form.patient_type === "old" ? form.unit_id.trim() || null : null,
        login_email: loginEmail ?? (form.login_email_verified ? form.login_email.trim() : null),
    });

    // The typed login email already has an account: show that profile to link.
    const onEmailTaken = async (email: string) => {
        try {
            const found = await findExisting(email);
            if (found) setMatch(found);
        } catch {
            // the email error under the field is enough
        }
    };

    const save = async (createNew = false) => {
        const found = validateFamilyMember(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        try {
            setSaving(true);
            // New member: link an existing patient profile instead of creating a duplicate.
            if (editing === "new" && !createNew) {
                const existing = await findExisting();
                if (existing) {
                    setMatch(existing);
                    return;
                }
            }
            const loginNote = form.login_email.trim() && form.login_email_verified ? ` ${form.name.trim()} can now sign in with ${form.login_email.trim()}.` : "";
            if (editing === "new") {
                await addFamilyProfile(toFamilyMemberInput(form));
                toast.success(`${form.name.trim()} added to your family profiles.${loginNote}`);
            } else if (editing) {
                await updateFamilyProfile(editing, toFamilyMemberInput(form));
                toast.success(`Family profile updated.${loginNote}`);
            }
            closeForm();
            await refresh();
        } catch (err) {
            const fieldErrors = familyFieldErrors(err);
            setErrors({ ...fieldErrors, unit_id: fieldErrors.uid || fieldErrors.unit_id });
            // The verified email expired on the server: verify again.
            if (fieldErrors.login_email) setForm((current) => ({ ...current, login_email_verified: false, login_code_sent: false }));
            toast.error(familyApiError(err));
        } finally {
            setSaving(false);
        }
    };

    const editingProfile = editing && editing !== "new" ? familyMembers.find((m) => m.patient_id === editing) : undefined;

    const openUnlink = (profile: FamilyProfile) => setUnlinkTarget(profile);

    const afterUnlink = async (profile: FamilyProfile) => {
        if (activeProfile?.patient_id === profile.patient_id) switchTo(null);
        setUnlinkTarget(null);
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

    const atLimit = familyMembers.length >= maxProfiles;

    return (
        <div>
            <HeroSection
                title="Family Profiles"
                description="Book appointments and view records for your family from one account."
            />

            <div className="container-max-width mx-auto w-full space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {isFamilyView && viewedProfile
                            ? `${viewedFamily.length} family ${viewedFamily.length === 1 ? "profile" : "profiles"} added under ${viewedProfile.first_name} · New members are added to ${viewedProfile.first_name}'s family.`
                            : `${viewedFamily.length} family ${viewedFamily.length === 1 ? "profile" : "profiles"} · Switch profiles from the menu at the top right.`}
                    </p>
                    <Button className="btn-primary-cta w-full sm:w-auto" onClick={openAdd} disabled={atLimit || editing === "new"}>
                        <Plus className="mr-1 h-4 w-4" /> Add Family Member
                    </Button>
                </div>

                {managedBy.length > 0 && (
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {loading && [0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-gray-100" />)}

                    {profiles.map((profile, index) => (
                        <article key={profile.patient_id} className="flex flex-col rounded-lg border border-[#E7E8EB] bg-white p-5 shadow-[0px_2px_4px_0px_#0000001A]">
                            <div className="flex items-start gap-3">
                                <ProfileAvatar name={profile.name} index={index} className="h-12 w-12" />
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                                        {profile.name}
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                            {profile.is_self ? "Primary Account" : profile.relationship_label}
                                        </span>
                                        {profile.is_unlinked ? (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Unlinked</span>
                                        ) : (
                                            index === 0 && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Viewing now</span>
                                            )
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{profileSubtitle(profile).replace(/^[^·]*·\s*/, "")}</p>
                                </div>
                            </div>
                            <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-[#4D4D4D] sm:grid-cols-2">
                                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{profile.phone || "No phone"}</div>
                                <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-primary" />{profile.unit_id ? `Unit ID ${profile.unit_id}` : "No Unit ID yet"}</div>
                                {(profile.login_email || profile.email) && (
                                    <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
                                        <Mail className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="truncate">{profile.has_login ? `Own login: ${profile.login_email}` : `Email: ${profile.login_email || profile.email}`}</span>
                                    </div>
                                )}
                            </dl>
                            {!profile.is_self && (
                                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E7E8EB] pt-3">
                                    {profile.is_unlinked ? (
                                        <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => openRelink(profile)}>
                                            <Link className="mr-1 h-4 w-4" /> Link Again
                                        </Button>
                                    ) : (
                                        <>
                                            {index === 0 ? (
                                                <Button size="sm" variant="outline" onClick={() => switchTo(null)}>
                                                    <Users className="mr-1 h-4 w-4" /> Switch back to my profile
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => switchTo(profile.patient_id)}>
                                                    <Users className="mr-1 h-4 w-4" /> View
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => openEdit(profile)}>
                                                <Pencil className="mr-1 h-4 w-4" /> Edit
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => openUnlink(profile)}>
                                                <Link2Off className="mr-1 h-4 w-4" /> Unlink
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}

                    {!loading && viewedFamily.length === 0 && !editing && (
                        <button type="button" onClick={openAdd}
                            className="flex min-h-36 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#D1D5DB] p-5 text-sm font-semibold text-[#4D4D4D] hover:border-primary hover:text-primary">
                            <Plus className="h-5 w-5" /> Add your first family member
                        </button>
                    )}
                </div>
            </div>

            <Dialog open={!!leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)}>
                <DialogContent className="max-w-[95vw] rounded-md p-5 sm:max-w-md">
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


            {/* Add / edit: wide dialog on desktop, bottom sheet on phones (buttons always visible). */}
            <SheetDialog
                open={!!editing}
                onOpenChange={(open) => !open && !saving && closeForm()}
                title={editing === "new" ? "New Family Member" : "Edit Family Member"}
                description="Booking alerts for this person come to your account. Add their Unit ID if they have visited before."
                className={match ? "sm:max-w-6xl" : "sm:max-w-5xl"}
                footer={match ? undefined : (
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <Button variant="outline" className="h-10" onClick={closeForm} disabled={saving}>Cancel</Button>
                        <Button className="btn-primary-cta h-10" onClick={() => save()} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editing === "new" ? "Add Member" : "Save Changes"}
                        </Button>
                    </div>
                )}
            >
                <div className={match ? "grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]" : ""}>
                    <FamilyMemberForm value={form} onChange={(next) => { setForm(next); setErrors({}); setMatch(null); }} errors={errors} relationships={relationships} idPrefix="family-page"
                        profile={editingProfile ?? null} onEmailTaken={editing === "new" ? onEmailTaken : undefined} />
                    {match && (
                        <aside className="lg:sticky lg:top-0 lg:self-start">
                            <p className="mb-2 text-xs text-muted-foreground">
                                The details you entered match a patient who already has a profile here. Link that profile instead of creating a second copy of their records.
                            </p>
                            <ExistingProfileMatchPanel
                                match={match}
                                relationship={toFamilyMemberInput(form).relationship}
                                relationshipLabel={toFamilyMemberInput(form).relationship_label}
                                idPrefix="family-page"
                                onLinked={async () => { closeForm(); await refresh(); }}
                                onCreateNew={() => { setMatch(null); save(true); }}
                                onCancel={() => setMatch(null)}
                            />
                        </aside>
                    )}
                </div>
            </SheetDialog>

            <RelinkDialog profile={relinkTarget} onClose={() => setRelinkTarget(null)}
                onLinked={async () => { setRelinkTarget(null); await refresh(); }} />

            <UnlinkMemberDialog target={unlinkTarget} onClose={() => setUnlinkTarget(null)} onUnlinked={afterUnlink} />
        </div>
    );
}

export default function FamilyProfilesPage() {
    return (
        <Suspense fallback={<div className="container-max-width mx-auto h-64 w-full animate-pulse rounded-lg bg-gray-100" />}>
            <FamilyProfilesContent />
        </Suspense>
    );
}
