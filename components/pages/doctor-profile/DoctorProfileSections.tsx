import {
    Award,
    BadgeCheck,
    Briefcase,
    CalendarClock,
    GraduationCap,
    HeartPulse,
    Microscope,
    ScrollText,
    Sparkles,
    Stethoscope,
    Users,
} from 'lucide-react';
import type { DoctorProfileSection } from '@/types/doctor-details';
import RichText from './RichText';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    availability_info: CalendarClock,
    specializations_info: Stethoscope,
    expertise_info: Microscope,
    key_procedures_info: HeartPulse,
    special_interests: Sparkles,
    memberships_info: Users,
    education_info: GraduationCap,
    professional_experience_info: Briefcase,
    fellowships_info: ScrollText,
    certifications_info: BadgeCheck,
    awards_info: Award,
};

// Renders every profile section the API returns, in the API's order.
// Sections without data are not sent, so no empty titles are shown.
const DoctorProfileSections = ({ sections }: { sections?: DoctorProfileSection[] }) => {
    if (!sections?.length) return null;

    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {sections.map((section) => {
                const Icon = ICONS[section.key] ?? ScrollText;
                const wide = section.key === 'availability_info' || (section.type === 'html' && section.html.includes('<table'));

                return (
                    <section
                        key={section.key}
                        className={`rounded-lg border border-[#E7E8EB] p-5 shadow-[0px_2px_4px_0px_#0000001A] ${wide ? 'md:col-span-2' : ''}`}
                    >
                        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1F1E1E]">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                            </span>
                            {section.title}
                        </h3>

                        {section.type === 'html' ? (
                            <div className={wide ? 'overflow-x-auto' : undefined}>
                                <RichText html={section.html} />
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {section.items.map((item, index) => (
                                    <li key={index} className="border-l-2 border-primary/40 pl-3">
                                        {item.title && <p className="text-sm font-semibold text-[#1F1E1E]">{item.title}</p>}
                                        {item.subtitle && <p className="text-sm text-[#4D4D4D]">{item.subtitle}</p>}
                                        {item.meta && <p className="text-xs font-medium text-primary">{item.meta}</p>}
                                        {item.description && <p className="mt-1 text-sm text-[#4D4D4D]">{item.description}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

export default DoctorProfileSections;
