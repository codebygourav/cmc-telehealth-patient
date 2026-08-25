import type { DoctorAboutInfo } from '@/types/doctor-details';

interface DoctorAboutProps {
    about: DoctorAboutInfo;
    className?: string;
}

const DoctorAbout = ({ about, className = '' }: DoctorAboutProps) => {
    const rawContent = about?.bio || about?.description || 'No description available.';

    return (
        <div className={`rounded-lg p-5 border border-[#E7E8EB] shadow-[0px_2px_4px_0px_#0000001A] ${className}`}>
            <h3 className="text-[#1F1E1E] text-lg font-semibold mb-2">Professional Summary</h3>
            <div
                className="text-[#4D4D4D] text-base space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: rawContent }}
            />
        </div>
    );
};

export default DoctorAbout;