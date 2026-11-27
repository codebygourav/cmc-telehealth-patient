// @ts-nocheck
declare const self: any;

self.addEventListener("push", (event: any) => {
    if (!event.data) return;

    try {
        let rawData: any = {};
        try {
            rawData = event.data.json();
        } catch {
            rawData = { body: event.data.text() };
        }

        const payloadData = rawData.data || rawData;
        const notificationData = rawData.notification || {};

        const title = rawData.title || notificationData.title || payloadData.title || "New Notification";
        const desc = rawData.desc || rawData.body || rawData.message || notificationData.body || payloadData.desc || payloadData.body || payloadData.message || "";
        const join_url = rawData.join_url || payloadData.join_url || notificationData.join_url;
        const appointment_id = rawData.appointment_id || payloadData.appointment_id || notificationData.appointment_id;
        const group = rawData.group || payloadData.group || "";

        const options: any = {
            body: desc,
            icon: rawData.icon || notificationData.icon || "/icons/icon-192x192.png",
            badge: rawData.badge || notificationData.badge || "/icons/icon-192x192.png",
            tag: rawData.id || payloadData.id || rawData.tag || ("notification-" + Date.now()),
            requireInteraction: true,
            data: {
                url: rawData.url || payloadData.url || "/notifications",
                join_url: join_url,
                appointment_id: appointment_id,
                title: title,
                group: group,
                ...payloadData,
            },
        };

        if (join_url) {
            options.actions = [
                {
                    action: "join_call",
                    title: "Join Call",
                },
            ];
        }

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error("Error displaying push notification:", e);
        const text = event.data ? event.data.text() : "New Notification";
        event.waitUntil(
            self.registration.showNotification("New Notification", {
                body: text,
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-192x192.png",
                data: { url: "/notifications" },
            })
        );
    }
});

self.addEventListener("message", (event: any) => {
    if (event.data && event.data.type === "SHOW_NOTIFICATION") {
        const { title, options } = event.data;
        self.registration.showNotification(title || "New Notification", options);
    }
});

self.addEventListener("notificationclick", (event: any) => {
    event.notification.close();

    const notifData = event.notification.data || {};
    const join_url = notifData.join_url;
    const appointment_id = notifData.appointment_id;

    let targetUrl = notifData.url || "/notifications";

    if (join_url) {
        targetUrl = `/start-consultation?room_url=${encodeURIComponent(join_url)}&appointment_id=${appointment_id || ""}`;
    }

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any[]) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
