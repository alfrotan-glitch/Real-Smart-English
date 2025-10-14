// src/index.tsx
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";

// Ensure root container exists
const container = document.getElementById("root");
if (!container) {
  throw new Error('Missing <div id="root"></div> in index.html');
}

// App tree (StrictMode for dev-only checks; React 19-safe)
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// If SSR markup exists in #root, hydrate; otherwise mount normally.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

export {};
