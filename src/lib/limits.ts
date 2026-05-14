import { db } from '@/lib/db';

// ─── Plan Limits ───────────────────────────────────────────────
export const FREE_USER_MAX_EMAILS = 10;
export const FREE_USER_MAX_CAMPAIGNS_PER_DAY = 3;
export const PREMIUM_USER_MAX_EMAILS = 500;
export const PREMIUM_USER_MAX_CAMPAIGNS_PER_DAY = 50;

// ─── Attachment Size Limits ────────────────────────────────────
export const MAX_ATTACHMENT_SIZE_FREE = 5 * 1024 * 1024; // 5MB
export const MAX_ATTACHMENT_SIZE_PREMIUM = 25 * 1024 * 1024; // 25MB

/**
 * Returns the maximum allowed attachment size for the given plan.
 */
export function getMaxAttachmentSize(isPremium: boolean): number {
  return isPremium ? MAX_ATTACHMENT_SIZE_PREMIUM : MAX_ATTACHMENT_SIZE_FREE;
}

/**
 * Check whether a user is allowed to send a campaign with the given
 * number of receivers.
 *
 * Checks:
 *  1. User exists and is not blocked
 *  2. Receiver count does not exceed plan email limit
 *  3. Today's campaign count does not exceed plan daily campaign limit
 */
export async function canSendCampaign(
  userId: string,
  receiverCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Fetch user
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.isBlocked) {
    return { allowed: false, reason: 'Your account has been blocked' };
  }

  const isPremium = user.isPremium;
  const maxEmails = isPremium ? PREMIUM_USER_MAX_EMAILS : FREE_USER_MAX_EMAILS;
  const maxCampaignsPerDay = isPremium
    ? PREMIUM_USER_MAX_CAMPAIGNS_PER_DAY
    : FREE_USER_MAX_CAMPAIGNS_PER_DAY;

  // 2. Check email limit
  if (receiverCount > maxEmails) {
    return {
      allowed: false,
      reason: `Receiver count (${receiverCount}) exceeds your plan limit of ${maxEmails} emails per campaign. Upgrade to premium for higher limits.`,
    };
  }

  // 3. Check today's campaign count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCampaignCount = await db.campaign.count({
    where: {
      userId,
      createdAt: {
        gte: todayStart,
      },
    },
  });

  if (todayCampaignCount >= maxCampaignsPerDay) {
    return {
      allowed: false,
      reason: `You have reached your daily campaign limit of ${maxCampaignsPerDay}. Upgrade to premium for higher limits.`,
    };
  }

  return { allowed: true };
}
