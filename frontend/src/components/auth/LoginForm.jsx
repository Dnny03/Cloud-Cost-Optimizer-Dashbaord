// frontend/src/components/auth/LoginForm.jsx
/**
 * Login Form Component
 *
 * This component renders the sign-in form for existing users.
 * It provides username/password authentication with password visibility toggle
 * and navigation links to registration and password recovery flows.
 *
 * Features:
 * - Username and password input fields
 * - Show/hide password toggle for better UX
 * - Form validation with HTML5 attributes
 * - Accessibility attributes for screen readers
 * - Loading state handling during authentication
 * - Navigation to register and forgot password flows
 */

import React from "react";

/**
 * LoginForm - Renders the user sign-in form
 *
 * @param {Object} props - Component props
 * @param {string} props.username - Current username input value
 * @param {Function} props.setUsername - Handler to update username state
 * @param {string} props.password - Current password input value
 * @param {Function} props.setPassword - Handler to update password state
 * @param {boolean} props.showPw - Whether password is visible (text) or hidden (dots)
 * @param {Function} props.setShowPw - Handler to toggle password visibility
 * @param {boolean} props.loading - Whether form submission is in progress
 * @param {string} props.error - Current error message (used for aria-invalid)
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onSwitchToRegister - Handler to navigate to registration form
 * @param {Function} props.onSwitchToForgot - Handler to navigate to forgot password form
 *
 * @returns {JSX.Element} The login form
 */
export default function LoginForm({
                                      username,
                                      setUsername,
                                      password,
                                      setPassword,
                                      showPw,
                                      setShowPw,
                                      loading,
                                      error,
                                      onSubmit,
                                      onSwitchToRegister,
                                      onSwitchToForgot
                                  }) {
    return (
        // Form with noValidate to use custom validation instead of browser defaults
        // This allows for consistent error handling across browsers
        <form onSubmit={onSubmit} className="auth-form" noValidate>
            {/* Username input field */}
            <label className="auth-label">
                Username
                <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    autoComplete="username"  // Helps password managers identify the field
                    autoFocus  // Focus this field when form loads for quick input
                    required  // HTML5 validation attribute
                    minLength={3}  // Minimum 3 characters required
                    aria-required="true"  // Accessibility: indicates required field
                    aria-invalid={!username ? "true" : "false"}  // Accessibility: indicates validation state
                />
            </label>

            {/* Password input field with visibility toggle */}
            <label className="auth-label">
                Password
                {/* Wrapper div to position the toggle button alongside input */}
                <div className="pw-field">
                    <input
                        className="auth-input"
                        // Dynamic type switching: "text" shows password, "password" hides it
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"  // Dots hint that this is a password field
                        autoComplete="current-password"  // Helps password managers
                        required  // HTML5 validation attribute
                        minLength={6}  // Minimum 6 characters for security
                        aria-required="true"  // Accessibility: indicates required field
                        // Only mark as invalid if there's an error and password is empty
                        aria-invalid={error && !password ? "true" : "false"}
                    />
                    {/* Show/Hide password toggle button */}
                    {/* Allows users to verify their password input */}
                    <button
                        type="button"  // Prevents form submission when clicked
                        className="pw-toggle"
                        onClick={() => setShowPw((v) => !v)}  // Toggle visibility state
                        aria-label={showPw ? "Hide password" : "Show password"}  // Dynamic accessibility label
                    >
                        {showPw ? "Hide" : "Show"}
                    </button>
                </div>
            </label>

            {/* Submit button with loading state */}
            {/* Disabled during API call to prevent duplicate submissions */}
            <button
                className="auth-button"
                disabled={loading}  // Prevent clicks while authenticating
                type="submit"
                aria-busy={loading}  // Accessibility: indicates loading state
            >
                {/* Dynamic text based on loading state */}
                {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* Navigation links to other authentication flows */}
            {/* Quick links for other flows */}
            <div className="auth-links">
                {/* Link to registration for new users */}
                <button
                    type="button"  // Prevents form submission
                    onClick={onSwitchToRegister}
                    aria-label="Create new account"  // Accessibility label
                >
                    Create account
                </button>
                {/* Link to password recovery for users who forgot credentials */}
                <button
                    type="button"  // Prevents form submission
                    onClick={onSwitchToForgot}
                    aria-label="Reset forgotten password"  // Accessibility label
                >
                    Forgot password?
                </button>
            </div>
        </form>
    );
}