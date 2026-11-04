"use client";

import React, { useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import CompleteProfileStep from "@/components/auth/registration/CompleteProfileStep";
import api from "@/lib/axios";

const CompleteProfilePage = () => {
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const fromUrl = params.get('email') || params.get('login');

            // Strip any query parameter immediately so the URL address bar stays clean
            if (window.location.search) {
                window.history.replaceState(null, "", window.location.pathname);
            }

            const storedEmail = localStorage.getItem('reg_email');
            const emailToUse = fromUrl || storedEmail || "";
            if (emailToUse) {
                setEmail(emailToUse);
                try {
                    localStorage.setItem('reg_email', emailToUse);
                } catch {
                    // ignore
                }
            } else {
                // If not in local storage, fetch user details using the backend setup_token / auth token
                api.get('/auth/status')
                    .then((res) => {
                        const data = res?.data?.data;
                        const resolved = data?.phone || data?.email || data?.login;
                        if (resolved) {
                            setEmail(resolved);
                            try {
                                localStorage.setItem('reg_email', resolved);
                            } catch {
                                // ignore
                            }
                        }
                    })
                    .catch(() => {});
            }
        }
    }, []);

    return (
        <AuthLayout title="" subtitle="">
            <div className="w-full">
                <div className="flex flex-col gap-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold font-source-sans mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-sm text-muted-foreground font-source-sans px-4">
                            Almost there! Please provide additional details to finish your registration.
                        </p>
                    </div>
                    <CompleteProfileStep email={email} />
                </div>
            </div>
        </AuthLayout>
    );
};

export default CompleteProfilePage;
