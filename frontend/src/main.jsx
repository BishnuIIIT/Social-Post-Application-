/**
 * @file main.jsx
 * @description React application entry point.
 * Mounts the root <App /> component into the #root DOM node.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Global design tokens, resets, and base typography must load before any
// component-level CSS Modules so that custom properties are available everywhere.
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
