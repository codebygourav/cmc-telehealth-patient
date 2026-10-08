import { Star, Languages as LanguagesIcon, Stethoscope, BriefcaseMedical, IndianRupee, Globe, ExternalLink } from 'lucide-react';
import type { DoctorDetailData } from '@/types/doctor-details';

interface DoctorHeaderProps {
    doctor: DoctorDetailData;
}

const SOCIAL_LABELS: Record<string, string> = {
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    youtube: 'YouTube',
    website: 'Website',
};

const InfoItem = ({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">{label}</p>
            <p className="text-sm font-semibold text-[#1F1E1E] break-words">{children}</p>
        </div>
    </div>
);

// Everything here comes from the API; an item is left out when its value is missing.
const DoctorHeader = ({ doctor }: DoctorHeaderProps) => {
    const { profile, review_summary: reviews, consultation_fee: fee } = doctor;
    const languages = (Array.isArray(doctor.languages) ? doctor.languages : []).filter((l) => l && l.trim());
    const years = Number(profile.years_experience) || 0;
    const totalReviews = Number(reviews?.total_reviews) || 0;
    const socialLinks = Object.entries(doctor.social_links || {}).filter(([, url]) => !!url);
    const feeLabel = fee
        ? fee.min === fee.max
            ? `₹${fee.min.toLocaleString('en-IN')}`
            : `₹${fee.min.toLocaleString('en-IN')} - ₹${fee.max.toLocaleString('en-IN')}`
        : null;
    const hasInfo = years > 0 || languages.length > 0 || !!feeLabel;

    return (
        <section className="overflow-hidden rounded-lg border border-[#E7E8EB] shadow-[0px_2px_4px_0px_#0000001A]">
            <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center">
                <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-primary/10"
                    referrerPolicy="no-referrer"
                />

                <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                    {profile.department && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            <Stethoscope size={13} />
                            {profile.department}
                        </span>
                    )}
                    <h2 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold leading-tight text-[#1F1E1E] sm:justify-start">
                        {profile.name}
                        {(profile as { is_test_doctor?: boolean }).is_test_doctor && (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                        )}
                    </h2>
                    {(profile as { department_role?: string | null })?.department_role && (
                        <p className="-mt-1 text-sm font-medium text-primary">({(profile as { department_role?: string | null }).department_role})</p>
                    )}
                    {profile.sub_title && <p className="text-sm text-[#4D4D4D]">{profile.sub_title}</p>}

                    {(totalReviews > 0 || socialLinks.length > 0) && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                            {totalReviews > 0 && (
                                <span className="inline-flex items-center gap-1 text-sm text-[#4D4D4D]">
                                    <Star size={15} color="#FABD2E" fill="#FABD2E" />
                                    <span className="font-semibold text-[#1F1E1E]">{reviews.average_rating}</span>
                                    <span className="text-xs text-[#8A8A8A]">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                                </span>
                            )}
                            {socialLinks.map(([platform, url]) => (
                                <a
                                    key={platform}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/5"
                                >
                                    {platform === 'website' ? <Globe className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                    {SOCIAL_LABELS[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1)}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {hasInfo && (
                <div className="grid grid-cols-1 gap-4 border-t border-[#E7E8EB] bg-[#F9FAFB] px-5 py-4 sm:grid-cols-3">
                    {years > 0 && (
                        <InfoItem icon={BriefcaseMedical} label="Experience">
                            {years} {years === 1 ? 'Year' : 'Years'}
                            {profile.career_start_year ? <span className="font-normal text-[#8A8A8A]"> · since {profile.career_start_year}</span> : null}
                        </InfoItem>
                    )}
                    {languages.length > 0 && (
                        <InfoItem icon={LanguagesIcon} label="Speaks">
                            {languages.join(', ')}
                        </InfoItem>
                    )}
                    {feeLabel && (
                        <InfoItem icon={IndianRupee} label="Consultation Fee">
                            {feeLabel}
                        </InfoItem>
                    )}
                </div>
            )}
        </section>
    );
};

export default DoctorHeader;
