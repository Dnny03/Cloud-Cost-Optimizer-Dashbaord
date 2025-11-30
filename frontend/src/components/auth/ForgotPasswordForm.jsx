// frontend/src/components/auth/ForgotPasswordForm.jsx
/**
 * Forgot Password Form Component
 *
 * This component renders the password recovery request form.
 * Users can enter either their username or email to receive
 * password reset instructions.
 *
 * Part of the authentication flow:
 * Login -> Forgot Password -> Reset Password -> Login
 *
 * Features:
 * - Username or email input options
 * - Manual token entry fallback for development/testing
 * - Navigation back to login
 * - Loading state handling
 * - Accessibility attributes for screen readers
 */

import React from "react";

/**
 * ForgotPasswordForm - Renders the forgot password request form
 *
 * @param {Object} props - Component props
 * @param {string} props.username - Current username input value
 * @param {Function} props.setUsername - Handler to update username state
 * @param {string} props.email - Current email input value
 * @param {Function} props.setEmail - Handler to update email state
 * @param {boolean} props.loading - Whether form submission is in progress
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.setResetToken - Handler to set reset token (for manual entry)
 * @param {Function} props.setMode - Handler to change auth mode (login/register/forgot/reset)
 * @param {Function} props.onSwitchToLogin - Handler to navigate back to login form
 *
 * @returns {JSX.Element} The forgot password form
 */
export default function ForgotPasswordForm({
                                               username,
                                               setUsername,
                                               email,
                                               setEmail,
                                               loading,
                                               onSubmit,
                                               setResetToken,
                                               setMode,
                                               onSwitchToLogin
                                           }) {
    return (
        // Form with noValidate to use custom validation instead of browser defaults
        <form onSubmit={onSubmit} className="auth-form" noValidate>
            {/* Instructions for the user */}
            <p>Enter your username or email to receive reset instructions.</p>

            {/* Username input field */}
            {/* Users can recover password using either username or email */}
            <label className="auth-label">
                Username
                <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    autoComplete="username"  // Helps password managers
                    autoFocus  // Focus this field on form load
                />
            </label>

            {/* Email input field - alternative to username */}
            <label className="auth-label">
                Or Email
                <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"  // Helps password managers
                />
            </label>

            {/* Submit button with loading state */}
            {/* Disabled during submission to prevent double-clicks */}
            <button
                className="auth-button"
                disabled={loading}
                type="submit"
                aria-busy={loading}  // Accessibility: indicates loading state
            >
                {loading ? "Sending…" : "Send Reset"}
            </button>

            {/* Navigation links section */}
            <div className="auth-links">
                {/* Manual token entry button */}
                {/* Useful for development/testing when email isn't configured */}
                {/* In production, tokens are typically sent via email */}
                <button
                    type="button"  // Prevents form submission
                    onClick={() => {
                        // Prompt user for manual token entry as backup method
                        // This is especially useful during development when
                        // email sending may not be configured
                        const token = prompt("If you have a reset token, enter it here:");
                        if (token) {
                            setResetToken(token);  // Store the token
                            setMode("reset");      // Switch to reset password form
                        }
                    }}
                    aria-label="I have a reset token"  // Accessibility label
                >
                    I already have a token
                </button>

                {/* Back to login navigation button */}
                <button
                    type="button"  // Prevents form submission
                    onClick={onSwitchToLogin}
                    aria-label="Return to sign in"  // Accessibility label
                >
                    Back to sign in
                </button>
            </div>
        </form>
    );
}