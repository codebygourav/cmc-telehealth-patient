"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useNotifications, useUnreadCount } from "@/queries/useNotifications";
import { markAllAsRead, markNotificationAsRead } from "@/api/notifications";
import { isJoinCallEligible } from "@/lib/notification-utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Settings,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function NotificationDropdown() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications(1);
  const { data: totalUnread = 0 } = useUnreadCount();

  const notifications = notificationsData?.data ?? [];

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleNotificationClick = async (id: string | number) => {
    setReadingId(String(id));
    try {
      await markNotificationAsRead(String(id));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    } catch (err) {
      console.error(err);
    } finally {
      setReadingId(null);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsMarkingAll(true);
      await markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getNotificationTypeIcon = (group: string) => {
    switch (group?.toLowerCase()) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "review":
        return <Settings className="h-4 w-4 text-amber-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-rose-500" />;
      case "availability":
        return <Clock className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const formatNotificationTime = (date: string) => {
    if (!date) return "";
    const then = new Date(date);
    if (isNaN(then.getTime())) return "";
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    if (diff < 0) return "just now";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-10 global-radius border-[#E7E8EB] bg-background hover:bg-foreground/10 text-foreground transition-all duration-100">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white animate-pulse">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] sm:w-96 p-0 overflow-hidden shadow-2xl border-border/50"
      >
        <div className="flex flex-col max-h-[550px] bg-background">
          {/* Header Section */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Recent Alerts</span>
            </div>
            {totalUnread > 0 && (
              <Badge variant="secondary" className="bg-primary rounded-sm text-primary-foreground text-[11px] font-semibold h-5 px-2">
                {totalUnread} New
              </Badge>
            )}
          </div>

          {/* Bulk Action Row */}
          <div className="flex items-center justify-end gap-3 px-4 py-2 border-b border-border/40 text-xs">
            <button
              type="button"
              disabled={isMarkingAll || totalUnread === 0}
              onClick={handleMarkAllRead}
              className="font-semibold text-primary hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isMarkingAll ? "Updating..." : "Mark all read"}
            </button>
          </div>

          {/* Items Section */}
          <ScrollArea className="flex-1 overflow-y-auto min-h-0 bg-accent/[0.02]">
            <div className="px-1 py-1">
              {isLoadingNotifications ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Loading alerts...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex flex-col p-3 border-b border-border/60 last:border-0 transition-all duration-300 cursor-pointer group",
                        !notification.is_read ? "bg-primary/[0.04]" : "hover:bg-accent/40",
                        expandedId === String(notification.id) && "bg-accent/20"
                      )}
                      onClick={(e) => toggleExpand(e, String(notification.id))}
                    >
                      <div className="flex flex-col w-full">
                        {/* Header Row */}
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all relative border border-border/10 shadow-xs bg-primary/10">
                            {getNotificationTypeIcon(notification.group)}
                            {!notification.is_read && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary/5 shadow-sm" />
                            )}
                          </div>

                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className={cn(
                              "text-[13px] truncate transition-colors",
                              !notification.is_read ? "text-foreground font-semibold" : ""
                            )}>
                              {notification.title}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">
                                {formatNotificationTime(notification.created_at)}
                              </span>
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-all duration-300",
                                expandedId === String(notification.id) ? "rotate-180 text-primary" : "group-hover:text-muted-foreground/60"
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Expandable Content Section */}
                        <div className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          expandedId === String(notification.id) ? "grid-rows-[1fr] opacity-100 border-t border-border/5" : "grid-rows-[0fr] opacity-0"
                        )}>
                          <div className="overflow-hidden ml-12 pr-1">
                            <p className="text-xs text-muted-foreground/90 leading-relaxed mb-1 font-medium">
                              {notification.desc}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
                                  {notification.group}
                                </span>

                                {isJoinCallEligible(notification) && (
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-[10px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-sm transition-all active:scale-95"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(
                                        `/start-consultation?room_url=${encodeURIComponent(notification.join_url || "")}&appointment_id=${notification.appointment_id || ""}`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    Join Call
                                  </Button>
                                )}
                              </div>

                              {!notification.is_read && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={readingId === String(notification.id)}
                                  className="h-7 px-3 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-md shadow-sm transition-all active:scale-95"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleNotificationClick(notification.id);
                                  }}
                                >
                                  {readingId === String(notification.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center group">
                  <div className="p-4 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors mb-3">
                    <Bell className="h-10 w-10 text-muted-foreground/30 stroke-[1.25]" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">No Notifications</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Section */}
          <div className="border-t border-border/60 p-2 bg-muted/10">
            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center h-10 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-md transition-all uppercase tracking-widest cursor-pointer"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
