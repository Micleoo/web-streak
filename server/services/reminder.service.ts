import webpush from 'web-push';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

// Setup web push with our VAPID keys
// Need to handle if keys are not configured yet
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not configured in environment. Push notifications will not work.');
}

interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  data?: {
    url?: string;
    pendingCount?: number;
  };
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const [targetUser] = await db
      .select({ pushSubscription: user.pushSubscription })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!targetUser || !targetUser.pushSubscription) {
      console.warn(`[sendPushNotification] No subscription for user ${userId}`);
      return;
    }

    const subscription = targetUser.pushSubscription as webpush.PushSubscription;

    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: payload.title,
        body: payload.body,
        tag: payload.tag || 'default',
        url: payload.data?.url || '/dashboard'
      }));
    } catch (sendError: any) {
      // Handle subscription expired
      if (sendError.statusCode === 410 || sendError.statusCode === 404) {
        console.log(`[sendPushNotification] Subscription expired for user ${userId}`);
        await clearUserPushSubscription(userId);
      }
      throw sendError;
    }
  } catch (error) {
    console.error(`[sendPushNotification] Error:`, error);
  }
}

async function clearUserPushSubscription(userId: string) {
  try {
    await db
      .update(user)
      .set({ pushSubscription: null, notificationEnabled: false })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('[clearUserPushSubscription] Error:', error);
  }
}
