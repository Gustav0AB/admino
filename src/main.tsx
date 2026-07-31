import "@/shared/i18n";
import "@generic/components/styles.css";
import "./web/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./web/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
