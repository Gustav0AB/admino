import "@/shared/i18n";
import "./web/tailwind.css";
import "./web/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./web/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
