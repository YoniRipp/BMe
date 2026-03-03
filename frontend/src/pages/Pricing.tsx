import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

const FREE_FEATURES = [
  'Manual data entry for all domains',
  'Money tracking (income & expenses)',
  'Workout logging',
  'Food & nutrition tracking',
  'Daily schedule management',
  'Goal setting & tracking',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Voice input — speak to track anything',
  'AI Insights — personalized analytics',
  'AI Food Lookup — instant nutrition data',
  'Daily AI summary & recommendations',
  'Priority support',
];

export function Pricing() {
  const { isPro, subscribe } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Simple pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Start free. Upgrade when you want the AI-powered experience.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('annual')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billingCycle === 'annual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Annual
          <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
            Save 38%
          </span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <CardDescription>Track everything manually</CardDescription>
            <p className="text-3xl font-bold">
              $0<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro tier */}
        <Card className="border-primary ring-1 ring-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Pro</CardTitle>
              {billingCycle === 'annual' && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Best value
                </span>
              )}
            </div>
            <CardDescription>AI-powered life tracking</CardDescription>
            {billingCycle === 'monthly' ? (
              <p className="text-3xl font-bold">
                $7.99<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            ) : (
              <div>
                <p className="text-3xl font-bold">
                  $59<span className="text-sm font-normal text-muted-foreground">/year</span>
                </p>
                <p className="text-sm text-muted-foreground">~$4.92/month</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button className="w-full" onClick={() => subscribe(billingCycle)}>
                {billingCycle === 'annual' ? 'Subscribe Annually' : 'Subscribe Monthly'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
