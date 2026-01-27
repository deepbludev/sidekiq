/**
 * Auth feature slice barrel export.
 *
 * Public API for the auth feature. External modules should import
 * from `@sidekiq/auth` or `@sidekiq/auth/*` paths.
 *
 * @module auth
 */

// Components
export { AuthCard } from "./components/auth-card";
export { ForgotPasswordForm } from "./components/forgot-password-form";
export { OAuthButtons } from "./components/oauth-buttons";
export { ResetPasswordForm } from "./components/reset-password-form";
export { SignInForm } from "./components/sign-in-form";
export { SignUpForm } from "./components/sign-up-form";

// API - Client-safe auth client (better-auth/react)
export { authClient, type Session } from "./api/client";
