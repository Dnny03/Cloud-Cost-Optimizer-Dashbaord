// frontend/src/components/auth/RegisterForm.jsx
/**
 * Registration Form Component
 *
 * This component renders the new user registration form.
 * It collects username, optional email, role selection, and password
 * to create a new account in the system.
 *
 * Features:
 * - Username input with minimum length validation
 * - Optional email with format validation
 * - Role selection (viewer/admin)
 * - Password with visibility toggle
 * - Form validation with HTML5 attributes
 * - Accessibility attributes for screen readers
 * - Loading state handling during registration
 *
 * Note: Admin role is only granted to the first registered user.
 * Subsequent admin requests are downgraded to viewer by the backend.
 */

import React from "react";

/**
 * RegisterForm - Renders the new account registration form
 *
 * @param {Object} props - Component props
 * @param {string} props.username - Current username input value
 * @param {Function} props.setUsername - Handler to update username state
 * @param {string} props.email - Current email input value (optional field)
 * @param {Function} props.setEmail - Handler to update email state
 * @param {string} props.role - Selected role value ("viewer" or "admin")
 * @param {Function} props.setRole - Handler to update role selection
 * @param {string} props.password - Current password input value
 * @param {Function} props.setPassword - Handler to update password state
 * @param {boolean} props.showRegPw - Whether password is visible or hidden
 * @param {Function} props.setShowRegPw - Handler to toggle password visibility
 * @param {boolean} props.loading - Whether form submission is in progress
 * @param {Function} props.validateEmail - Helper function to validate email format
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onSwitchToLogin - Handler to navigate back to login form
 *
 * @returns {JSX.Element} The registration form
 */
export default function RegisterForm({
                                         username,
                                         setUsername,
                                         email,
                                         setEmail,
                                         role,
                                         setRole,
                                         password,
                                         setPassword,
                                         showRegPw,
                                         setShowRegPw,
                                         loading,
                                         validateEmail,
                                         onSubmit,
                                         onSwitchToLogin
                                     }) {
    return (
        // Form with noValidate to use custom validation instead of browser defaults
        <form onSubmit={onSubmit} className="auth-form" noValidate>
            {/* Username input field - required */}
            <label className="auth-label">
                Username
                <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    autoComplete="username"  // Helps password managers
                    autoFocus  // Focus this field on form load
                    required  // HTML5 validation attribute
                    minLength={3}  // Username must be at least 3 characters
                    aria-required="true"  // Accessibility: indicates required field
                />
            </label>

            {/* Email input field - optional */}
            {/* Used for password recovery if provided */}
            <label className="auth-label">
                Email (optional)
                <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"  // Helps password managers and autofill
                    // Mark as invalid only if email is provided but format is wrong
                    aria-invalid={email && !validateEmail(email) ? "true" : "false"}
                />
            </label>

            {/* Role selector dropdown */}
            {/* Note: Only the first user can actually get admin role */}
            {/* Backend will downgrade subsequent admin requests to viewer */}
            <label className="auth-label">
                Role
                <select
                    className="auth-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    aria-label="Select user role"  // Accessibility label for screen readers
                >
                    {/* Viewer: Read-only access to dashboard data */}
                    <option value="viewer">Viewer</option>
                    {/* Admin: Full access to all features and data */}
                    <option value="admin">Admin</option>
                </select>
            </label>

            {/* Password input field with visibility toggle */}
            <label className="auth-label">
                Password
                {/* Wrapper div to position the toggle button alongside input */}
                <div className="pw-field">
                    <input
                        className="auth-input"
                        // Dynamic type switching: "text" shows password, "password" hides it
                        type={showRegPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"  // Dots hint that this is a password field
                        autoComplete="new-password"  // Tells browser this is for a new account
                        required  // HTML5 validation attribute
                        minLength={6}  // Minimum 6 characters for security
                        aria-required="true"  // Accessibility: indicates required field
                    />
                    {/* Show/Hide password toggle button */}
                    {/* Allows users to verify their password before submitting */}
                    <button
                        type="button"  // Prevents form submission when clicked
                        className="pw-toggle"
                        onClick={() => setShowRegPw((v) => !v)}  // Toggle visibility state
                        aria-label={showRegPw ? "Hide password" : "Show password"}  // Dynamic accessibility label
                    >
                        {showRegPw ? "Hide" : "Show"}
                    </button>
                </div>
            </label>

            {/* Submit button with loading state */}
            {/* Disabled during API call to prevent duplicate submissions */}
            <button
                className="auth-button"
                disabled={loading}  // Prevent clicks while registering
                type="submit"
                aria-busy={loading}  // Accessibility: indicates loading state
            >
                {/* Dynamic text based on loading state */}
                {loading ? "Creating…" : "Create Account"}
            </button>

            {/* Navigation link back to login */}
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