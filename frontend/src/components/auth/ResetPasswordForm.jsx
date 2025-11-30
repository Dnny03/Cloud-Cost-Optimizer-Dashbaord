// frontend/src/components/auth/ResetPasswordForm.jsx
/**
 * Reset Password Form Component
 *
 * This component renders the final step of the password recovery flow.
 * Users enter and confirm their new password after receiving a reset token.
 *
 * Part of the password recovery flow:
 * Login -> Forgot Password -> Reset Password -> Login
 *
 * Features:
 * - New password and confirmation inputs
 * - Show/hide toggle for both password fields
 * - Real-time password match validation
 * - Submit button disabled when passwords don't match
 * - Hidden token field for form context
 * - Accessibility attributes for screen readers
 * - Loading state handling during submission
 *
 * The reset token is passed from the parent component and can come from:
 * - URL parameter (?reset=<token>) from email link
 * - Direct entry in forgot password form
 * - API response in development mode
 */

import React from "react";

/**
 * ResetPasswordForm - Renders the password reset form
 *
 * @param {Object} props - Component props
 * @param {string} props.resetToken - The password reset token (hidden from user)
 * @param {string} props.newPassword - Current new password input value
 * @param {Function} props.setNewPassword - Handler to update new password state
 * @param {string} props.confirmPassword - Current confirmation password input value
 * @param {Function} props.setConfirmPassword - Handler to update confirmation password state
 * @param {boolean} props.showNewPw - Whether new password is visible or hidden
 * @param {Function} props.setShowNewPw - Handler to toggle new password visibility
 * @param {boolean} props.showConfirmPw - Whether confirm password is visible or hidden
 * @param {Function} props.setShowConfirmPw - Handler to toggle confirm password visibility
 * @param {boolean} props.loading - Whether form submission is in progress
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onSwitchToLogin - Handler to navigate back to login form
 *
 * @returns {JSX.Element} The password reset form
 */
export default function ResetPasswordForm({
                                              resetToken,
                                              newPassword,
                                              setNewPassword,
                                              confirmPassword,
                                              setConfirmPassword,
                                              showNewPw,
                                              setShowNewPw,
                                              showConfirmPw,
                                              setShowConfirmPw,
                                              loading,
                                              onSubmit,
                                              onSwitchToLogin
                                          }) {
    return (
        // Form with noValidate to use custom validation instead of browser defaults
        <form onSubmit={onSubmit} className="auth-form" noValidate>
            {/* Hidden token field - stores the reset token but not visible to user */}
            {/* The token is used in the parent component's onSubmit handler */}
            {/* This hidden field maintains the token in the form context */}
            <input
                type="hidden"
                value={resetToken}
            />

            {/* Instructions for the user */}
            <p>Enter your new password below:</p>

            {/* New password input field with visibility toggle */}
            <label className="auth-label">
                New Password
                {/* Wrapper div to position the toggle button alongside input */}
                <div className="pw-field">
                    <input
                        className="auth-input"
                        // Dynamic type switching: "text" shows password, "password" hides it
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"  // Dots hint that this is a password field
                        autoComplete="new-password"  // Tells browser this is for a new password
                        autoFocus  // Focus this field when form loads
                        required  // HTML5 validation attribute
                        minLength={6}  // Minimum 6 characters for security
                        aria-required="true"  // Accessibility: indicates required field
                    />
                    {/* Show/Hide password toggle for new password field */}
                    <button
                        type="button"  // Prevents form submission when clicked
                        className="pw-toggle"
                        onClick={() => setShowNewPw((v) => !v)}  // Toggle visibility state
                        aria-label={showNewPw ? "Hide password" : "Show password"}  // Dynamic accessibility label
                    >
                        {showNewPw ? "Hide" : "Show"}
                    </button>
                </div>
            </label>

            {/* Confirm password input field with visibility toggle */}
            {/* Used to verify user typed their intended password correctly */}
            <label className="auth-label">
                Confirm Password
                {/* Wrapper div to position the toggle button alongside input */}
                <div className="pw-field">
                    <input
                        className="auth-input"
                        // Dynamic type switching: "text" shows password, "password" hides it
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"  // Dots hint that this is a password field
                        autoComplete="new-password"  // Tells browser this is for a new password
                        required  // HTML5 validation attribute
                        minLength={6}  // Minimum 6 characters for security
                        aria-required="true"  // Accessibility: indicates required field
                        // Mark as invalid if user has entered confirmation but it doesn't match
                        aria-invalid={confirmPassword && newPassword !== confirmPassword ? "true" : "false"}
                    />
                    {/* Show/Hide password toggle for confirm password field */}
                    {/* Separate toggle from new password for independent control */}
                    <button
                        type="button"  // Prevents form submission when clicked
                        className="pw-toggle"
                        onClick={() => setShowConfirmPw((v) => !v)}  // Toggle visibility state
                        aria-label={showConfirmPw ? "Hide password" : "Show password"}  // Dynamic accessibility label
                    >
                        {showConfirmPw ? "Hide" : "Show"}
                    </button>
                </div>
            </label>

            {/* Real-time password match feedback */}
            {/* Shown immediately when user types in confirm field and passwords don't match */}
            {/* Provides instant feedback before form submission */}
            {confirmPassword && newPassword !== confirmPassword && (
                <div style={{color: '#ff6b6b', fontSize: '0.875rem', marginTop: '-0.5rem'}}>
                    Passwords do not match
                </div>
            )}

            {/* Submit button with loading state and validation */}
            {/* Disabled when:
                - Form is currently submitting (loading)
                - Passwords have been entered but don't match
            */}
            <button
                className="auth-button"
                disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
                type="submit"
                aria-busy={loading}  // Accessibility: indicates loading state
            >
                {/* Dynamic text based on loading state */}
                {loading ? "Updating…" : "Update Password"}
            </button>

            {/* Navigation link back to login */}
            {/* Allows user to cancel and return to login if needed */}
            <div className="auth-links">
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