"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function PushNotificationBanner() {
  const {
    permission,
    loading,
    subscribeToPush,
    isSupported,
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("push_banner_dismissed");
      if (!isDismissed && permission !== "granted" && permission !== "denied" && isSupported) {
        setDismissed(false);
      }
    }
  }, [permission, isSupported]);

  if (dismissed || !isSupported || permission === "granted" || permission === "denied") {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("push_banner_dismissed", "true");
    }
  };

  const handleEnable = async () => {
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setDismissed(true);
      }
    } catch (err) {
      console.error("Failed to enable notifications from banner:", err);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/15 via-primary/10 to-accent border-b border-primary/20 px-4 py-3 sm:px-6 sm:py-4 shadow-sm transition-all duration-300 relative">
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 pr-8 sm:pr-10">
        {/* Left Info Section */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight flex items-center gap-2">
              Enable Push Notifications
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary">
                Instant Alerts
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-normal max-w-2xl">
              Receive real-time notifications for incoming doctor appointments, updates, and consultation alerts directly on your mobile and desktop.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end mt-1 sm:mt-0">
          <Button
            size="default"
            disabled={loading}
            onClick={handleEnable}
            className="h-10 sm:h-11 px-5 sm:px-6 text-xs sm:text-sm font-bold shadow-md rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            {loading ? (
              "Enabling..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Functional Cross (Close) Icon Button */}
      <button
        type="button"
        onClick={handleDismiss}
        title="Dismiss push notification banner"
        className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 rounded-full text-black hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6 text-black stroke-[2.5]" />
        <span className="sr-only">Close banner</span>
      </button>
    </div>
  );
}
