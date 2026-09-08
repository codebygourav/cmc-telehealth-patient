import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    bannerImage?: string;
}

const AuthLayout = ({ title, subtitle, children, bannerImage }: AuthLayoutProps) => {
    if (bannerImage) {
        return (
            <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-5xl bg-card shadow-2xl rounded-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[650px] lg:min-h-[700px] my-auto">
                    {/* Left 50%: Banner Image */}
                    <div className="relative hidden md:block w-full h-full min-h-[650px] lg:min-h-[700px] bg-slate-50">
                        <Image
                            src={bannerImage}
                            alt="Auth Banner"
                            fill
                            className="object-cover object-center"
                            priority
                        />
                    </div>

                    {/* Right 50%: Form Container */}
                    <div className="flex flex-col justify-center py-8 px-6 sm:px-10 lg:px-12 w-full">
                        {title && (
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                                {subtitle && (
                                    <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-xl">

                    {/* Card Container */}
                    <div className="mt-8 bg-card py-8 px-6 shadow-xl rounded-xl border border-border sm:px-10">
                        {/* Header */}
                        {title && (
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                                {subtitle && (
                                    <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                                )}
                            </div>
                        )}

                        {/* Content (Form / Message) */}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;