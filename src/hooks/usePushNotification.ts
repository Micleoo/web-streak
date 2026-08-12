import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';

export function usePushNotification() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

  useEffect(() => {
    // Check if notifications supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);

    // If permission is already granted, we assume subscribed for now
    // A more robust implementation would check the actual SW subscription
    if (user && Notification.permission === 'granted') {
      setIsSubscribed(true); 
    }
  }, [user]);

  const enable = async () => {
    setIsLoading(true);
    try {
      if (!vapidPublicKey) {
        console.error('VITE_VAPID_PUBLIC_KEY is not set');
        return false;
      }
      const success = await NotificationService.enableNotifications(vapidPublicKey);
      if (success) {
        setIsSubscribed(true);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const disable = async () => {
    setIsLoading(true);
    try {
      const success = await NotificationService.disableNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    enable,
    disable
  };
}
