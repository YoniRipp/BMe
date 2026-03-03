import { test, expect } from '@playwright/test';

test.describe('Navigation - Public Routes', () => {
  test('should access the /welcome (landing) page without authentication', async ({ page }) => {
    await page.goto('/welcome');

    // The landing page should have the hero heading
    await expect(page.getByRole('heading', { name: /one app for your whole life/i })).toBeVisible();

    // Navigation links should be present
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('should access the /login page without authentication', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should access the /signup page without authentication', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should access the /pricing page without authentication', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: /simple pricing/i })).toBeVisible();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('should access the /forgot-password page without authentication', async ({ page }) => {
    await page.goto('/forgot-password');

    // The page should load without redirecting to /welcome
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Navigation - Protected Route Redirects', () => {
  const protectedRoutes = [
    { path: '/', name: 'Dashboard' },
    { path: '/money', name: 'Money' },
    { path: '/body', name: 'Body' },
    { path: '/energy', name: 'Energy' },
    { path: '/schedule', name: 'Schedule' },
    { path: '/goals', name: 'Goals' },
    { path: '/insights', name: 'Insights' },
    { path: '/settings', name: 'Settings' },
    { path: '/groups', name: 'Groups' },
  ];

  for (const route of protectedRoutes) {
    test('should redirect ' + route.name + ' (' + route.path + ') to /welcome when not authenticated', async ({
      page,
    }) => {
      await page.goto(route.path);

      await expect(page).toHaveURL(/\/welcome/);
    });
  }
});

test.describe('Navigation - Landing Page Links', () => {
  test('should navigate from landing page to login', async ({ page }) => {
    await page.goto('/welcome');

    // Use the nav-bar "Sign in" link (the first one)
    await page.getByRole('link', { name: /sign in/i }).first().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should navigate from landing page to signup via Get Started', async ({ page }) => {
    await page.goto('/welcome');

    // Click the "Get Started" button/link (first one in the hero, not the nav)
    await page.getByRole('link', { name: /get started/i }).first().click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  });

  test('should navigate from landing page to pricing', async ({ page }) => {
    await page.goto('/welcome');

    // Click the "View Pricing" button in the hero section
    await page.getByRole('link', { name: /view pricing/i }).click();

    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { name: /simple pricing/i })).toBeVisible();
  });

  test('should display all feature cards on the landing page', async ({ page }) => {
    await page.goto('/welcome');

    // Verify key feature titles are visible (use heading role for unique match)
    await expect(page.getByRole('heading', { name: 'Voice-First Tracking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Insights' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Money Management' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Workout Tracking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nutrition & Food' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Goal Setting' })).toBeVisible();
  });

  test('should display Free and Pro pricing tiers on landing page', async ({ page }) => {
    await page.goto('/welcome');

    // Scroll to pricing section and verify both tiers are shown
    // Use exact match with heading role since "Free" and "Pro" appear as h3 headings
    const freeHeadings = page.getByRole('heading', { name: 'Free', exact: true });
    const proHeadings = page.getByRole('heading', { name: 'Pro', exact: true });

    await expect(freeHeadings.first()).toBeVisible();
    await expect(proHeadings.first()).toBeVisible();

    // Verify pricing amounts are present on the page
    await expect(page.getByText('$0').first()).toBeVisible();
    await expect(page.getByText('$4.99').first()).toBeVisible();
  });
});

test.describe('Navigation - Pricing Page', () => {
  test('should display both pricing tiers with features', async ({ page }) => {
    await page.goto('/pricing');

    // Check that both plan names are present
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();

    // Check that key features are listed
    await expect(page.getByText('Manual data entry for all domains')).toBeVisible();
    await expect(page.getByText(/voice input/i).first()).toBeVisible();
  });
});
