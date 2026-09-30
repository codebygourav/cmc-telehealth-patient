import type { DoctorAboutInfo } from '@/types/doctor-details';
import RichText, { hasText } from './RichText';

interface DoctorAboutProps {
    about: DoctorAboutInfo;
    className?: string;
}

// Bio and description from admin; hidden when both are empty.
const DoctorAbout = ({ about, className = '' }: DoctorAboutProps) => {
    const parts = [about?.bio, about?.description].filter((html): html is string => hasText(html));

    if (!parts.length) return null;

    return (
        <section className={`rounded-lg p-5 border border-[#E7E8EB] shadow-[0px_2px_4px_0px_#0000001A] ${className}`}>
            <h3 className="text-[#1F1E1E] text-lg font-semibold mb-2">Professional Summary</h3>
            <div className="space-y-3">
                {parts.map((html, index) => (
                    <RichText key={index} html={html} className="text-base" />
                ))}
            </div>
        </section>
    );
};

export default DoctorAbout;
