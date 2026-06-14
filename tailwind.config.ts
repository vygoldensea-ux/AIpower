import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        fb: {
          blue: "#1877F2",
          "blue-dark": "#166FE5",
          "blue-light": "#E7F3FF",
          bg: "#F0F2F5",
          "gray-border": "#CED0D4",
          "gray-text": "#65676B",
          "gray-hover": "#E4E6EB",
          "text-primary": "#050505",
          "text-secondary": "#65676B",
          green: "#42B72A",
          "green-dark": "#36A420",
          red: "#FA3E3E",
        },
      },
      fontFamily: {
        fb: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        fb: "0 1px 2px rgba(0,0,0,0.1)",
        "fb-card": "0 1px 2px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
