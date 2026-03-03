import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Page', () => {
  test('should render the login page with all expected elements', async ({ page }) => {
    await page.goto('/login');

    // The page should display the sign-in heading
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // Email and password fields should be present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Sign in submit button should be present (exact match to avoid "Sign in with Google")
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

    // "Forgot your password?" link should be present
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible();

    // "Sign up" link should be present
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should show HTML5 validation when submitting empty login form', async ({ page }) => {
    await page.goto('/login');

    // Both fields have the required attribute, so clicking submit with
    // empty fields will trigger native validation and the form will NOT submit.
    const emailInput = page.getByLabel(/email/i);
    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });

    // Clear any pre-filled values and submit
    await emailInput.fill('');
    await signInButton.click();

    // The email field should be invalid (required + empty)
    const emailValidity = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing
    );
    expect(emailValidity).toBe(true);

    // The button text should still say "Sign in" (not "Signing in..."),
    // proving the form submission was prevented by validation.
    await expect(signInButton).toHaveText('Sign in');
  });

  test('should show validation for invalid email format', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });

    await emailInput.fill('not-an-email');
    await passwordInput.fill('somepassword');
    await signInButton.click();

    // The email input has type="email", so the browser should flag it as invalid
    const emailTypeMismatch = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.typeMismatch
    );
    expect(emailTypeMismatch).toBe(true);

    // Button should still say "Sign in" (form was not submitted)
    await expect(signInButton).toHaveText('Sign in');
  });

  test('should navigate to signup page from login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  });

  test('should navigate to forgot password page from login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /forgot your password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Authentication - Signup Page', () => {
  test('should render the signup page with all expected elements', async ({ page }) => {
    await page.goto('/signup');

    // The page should display the create account heading
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    // Name, email, and password fields should be present
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Sign up button should be present (exact match to avoid "Sign up with Google")
    await expect(page.getByRole('button', { name: 'Sign up', exact: true })).toBeVisible();

    // "Sign in" link should be present for existing users
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('should show HTML5 validation when submitting empty signup form', async ({ page }) => {
    await page.goto('/signup');

    const nameInput = page.getByLabel(/name/i);
    const signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });

    await nameInput.fill('');
    await signUpButton.click();

    // The name field should be invalid (required + empty)
    const nameValidity = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing
    );
    expect(nameValidity).toBe(true);

    // Button text should still say "Sign up" (form not submitted)
    await expect(signUpButton).toHaveText('Sign up');
  });

  test('should enforce minimum password length via HTML5 validation', async ({ page }) => {
    await page.goto('/signup');

    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('short');
    await signUpButton.click();

    // The password input has minLength=8, so "short" should be flagged
    const passwordTooShort = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.tooShort
    );
    expect(passwordTooShort).toBe(true);
  });

  test('should show password strength error for weak passwords', async ({ page }) => {
    await page.goto('/signup');

    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });

    // Fill in a password that passes minLength but fails the JS strength check
    // (no uppercase, no digit)
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('alllowercase');
    await signUpButton.click();

    // The component shows an error via role="alert" for weak passwords
    await expect(page.getByRole('alert')).toContainText(/password must contain/i);
  });

  test('should navigate to login page from signup page', async ({ page }) => {
    await page.goto('/signup');

    await page.getByRole('link', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('Authentication - Redirect Behavior', () => {
  test('should redirect unauthenticated users to /welcome when accessing protected routes', async ({
    page,
  }) => {
    // Accessing the root (dashboard) without authentication should redirect
    await page.goto('/');

    // The app redirects unauthenticated users to /welcome (Landing page)
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should redirect unauthenticated users from /money to /welcome', async ({ page }) => {
    await page.goto('/money');

    await expect(page).toHaveURL(/\/welcome/);
  });

  test('should redirect unauthenticated users from /goals to /welcome', async ({ page }) => {
    await page.goto('/goals');

    await expect(page).toHaveURL(/\/welcome/);
  });
});
