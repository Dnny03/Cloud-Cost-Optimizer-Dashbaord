// frontend/src/main.jsx
/**
 * Application Entry Point
 *
 * This is the main entry point for the Cloud Cost Optimizer React application.
 * It initializes the React application and mounts it to the DOM.
 *
 * Responsibilities:
 * - Import the root App component
 * - Import global styles
 * - Create the React root and render the application
 * - Enable React StrictMode for development checks
 *
 * This file is referenced by index.html and is the first JavaScript
 * that executes when the application loads.
 */

import React from "react"

// ReactDOM client API for React 18+
// createRoot is the new API replacing ReactDOM.render
import ReactDOM from "react-dom/client"

// Root application component containing routing and layout
import App from "./App.jsx"

// Global CSS styles applied to the entire application
// Includes CSS variables, base styles, and utility classes
import "./styles/global.css"

/**
 * Application Initialization
 *
 * 1. document.getElementById("root") - Gets the mount point from index.html
 *    The #root div is where the entire React app will be rendered
 *
 * 2. ReactDOM.createRoot() - Creates a React 18 concurrent root
 *    This enables concurrent features like automatic batching
 *
 * 3. .render() - Renders the App component into the root
 *
 * React.StrictMode:
 * - Development-only wrapper that enables additional checks
 * - Detects deprecated APIs and unsafe lifecycles
 * - Warns about legacy patterns
 * - Double-invokes certain functions to detect side effects
 * - Has no effect in production builds
 */
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)