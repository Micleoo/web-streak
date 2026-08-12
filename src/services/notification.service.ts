export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Browser does not support service workers');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );
      console.log('[NotificationService] SW registered:', registration);
      return registration;
    } catch (error) {
      console.error('[NotificationService] SW registration failed:', error);
      return null;
    }
  }

  static async subscribeToPush(
    registration: ServiceWorkerRegistration,
    vapidPublicKey: string
  ): Promise<PushSubscription | null> {
    try {
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('[NotificationService] Already subscribed');
        return subscription;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: newSubscription })
      });

      console.log('[NotificationService] Subscribed to push');
      return newSubscription;
    } catch (error) {
      console.error('[NotificationService] Push subscription failed:', error);
      return null;
    }
  }

  static async enableNotifications(vapidPublicKey: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      const registration = await this.registerServiceWorker();
      if (!registration) {
        return false;
      }

      await this.subscribeToPush(registration, vapidPublicKey);

      await fetch('/api/users/notification-enabled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEnabled: true })
      });

      return true;
    } catch (error) {
      console.error('[NotificationService] Enable failed:', error);
      return false;
    }
  }

  static async disableNotifications(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await fetch('/api/users/notification-enabled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEnabled: false })
      });

      return true;
    } catch (error) {
      console.error('[NotificationService] Disable failed:', error);
      return false;
    }
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
