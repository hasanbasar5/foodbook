import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#06141f",
        ink: "#0f172a",
        brand: {
          50: "#f3fbff",
          100: "#dff4ff",
          200: "#b8e9ff",
          300: "#7ad6ff",
          400: "#37bfff",
          500: "#0891d1",
          600: "#0f6b8f",
          700: "#104c64",
          800: "#10374a",
          900: "#0d2632"
        },
        mint: "#53d9b3"
      },
      boxShadow: {
        shell: "0 28px 80px rgba(4, 19, 28, 0.18)",
        soft: "0 16px 50px rgba(8, 30, 45, 0.08)"
      },
      backgroundImage: {
        "login-art": "url('/assets/images/thumbs/long-in-img-1.png')",
        "shell-grid":
          "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(244,248,251,0.98)), url('/assets/images/bg/banner-three-bg1.png')"
      },
      animation: {
        "slide-up": "slideUp 0.25s ease-out",
        float: "float 5s ease-in-out infinite"
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      }
    }
  },
  plugins: [],
};

export default config;
