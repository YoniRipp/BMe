export type UserRole = 'admin' | 'user';
export type SubscriptionStatus = 'free' | 'pro' | 'past_due' | 'canceled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionCurrentPeriodEnd?: string;
}
