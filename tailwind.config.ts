import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        "sans": ["var(--font-plus-jakarta)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        purple: {
          100: "#F4F1FF",
          200: "#E2D9FD",
          300: "#D0C1FB",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED", // Electric Violet
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        gold: {
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
        },
        dark: {
          400: "#A1A1AA", // Zinc 400
          500: "#71717A", // Zinc 500
          600: "#52525B", // Zinc 600
          700: "#3F3F46", // Zinc 700
          800: "#27272A", // Zinc 800 (Secondary)
          900: "#18181B", // Zinc 900 (Surface)
          950: "#09090B", // Zinc 950 (Background)
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
            from: { opacity: "0", transform: "translateY(20px)" },
            to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
            "0%, 100%": { boxShadow: "0 0 20px -5px rgba(139, 92, 246, 0.5)" },
            "50%": { boxShadow: "0 0 30px 5px rgba(139, 92, 246, 0.7)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulse-glow 3s infinite",
      },
      backgroundImage: {
        'purple-gradient': "linear-gradient(to right, #8B5CF6, #6366F1)",
        'gold-gradient': "linear-gradient(to right, #F59E0B, #D97706)",
        'night-gradient': "radial-gradient(circle at center, #1E1435 0%, #0F0720 100%)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
