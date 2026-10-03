export function isJoinCallEligible(notification: {
    join_url?: string | null;
    can_join?: boolean | null;
    desc?: string | null;
    title?: string | null;
    appointment_date?: string | null;
}): boolean {
    if (!notification || !notification.join_url) return false;

    // Explicit backend flag if present
    if (typeof notification.can_join === "boolean") {
        return notification.can_join;
    }

    const text = `${notification.title || ""} ${notification.desc || ""}`;

    // Month Name pattern e.g., "for Oct 15, 2026", "Oct 15, 2026", "October 15, 2026"
    const months = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December";
    const monthRegex = new RegExp(`(?:for\\s+|on\\s+)?(${months})\\s+(\\d{1,2}),?\\s*(\\d{4})`, "i");
    const monthMatch = text.match(monthRegex);

    if (monthMatch) {
        const monthStr = monthMatch[1];
        const dayStr = monthMatch[2];
        const yearStr = monthMatch[3];
        const apptDate = new Date(`${monthStr} ${dayStr}, ${yearStr}`);
        if (!isNaN(apptDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            apptDate.setHours(0, 0, 0, 0);

            // If appointment date is after today, it is upcoming -> DO NOT show Join Call
            if (apptDate.getTime() > today.getTime()) {
                return false;
            }
        }
    }

    // ISO date pattern YYYY-MM-DD
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const apptDate = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
        if (!isNaN(apptDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            apptDate.setHours(0, 0, 0, 0);
            if (apptDate.getTime() > today.getTime()) {
                return false;
            }
        }
    }

    return true;
}
