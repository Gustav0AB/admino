/** @type {import('tailwindcss').Config} */
// Color keys map to the CSS custom properties defined in src/web/styles.css (:root).
// All UI components now live in src/shared/ui, so scanning ./src covers everything.
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-muted": "var(--color-primary-muted)",
        secondary: "var(--color-secondary)",
        "secondary-hover": "var(--color-secondary-hover)",
        "secondary-muted": "var(--color-secondary-muted)",
        danger: "var(--color-danger)",
        "danger-hover": "var(--color-danger-hover)",
        "danger-muted": "var(--color-danger-muted)",
      },
    },
  },
  plugins: [],
};
