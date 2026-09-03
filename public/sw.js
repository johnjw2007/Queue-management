// QueueSense AI Service Worker for Mobile Push & System Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data;
    self.registration.showNotification(title || '⚠️ Saveetha Surveillance Warning', {
      body: body || 'Queue discipline infraction recorded.',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'queuesense-alert',
      vibrate: [200, 100, 200], // Phone vibration pattern for mobile alert
      requireInteraction: true,
      data: data || {},
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/student') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/student');
      }
    })
  );
});
