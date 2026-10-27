import type { ReactNode } from "react";

/** Title + one line under it, for each step of the sign-in / sign-up / reset screen. */
export default function StepHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
    return (
        <div className="text-center">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
    );
}
