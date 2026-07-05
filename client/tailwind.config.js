/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light: "#ECFEFF",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
        background: "#F8FAFC",
        sidebar: "#FFFFFF",
        card: "#FFFFFF",
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          tertiary: "#94A3B8",
        },
        border: "#E2E8F0",
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          text: "#065F46",
          50: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          text: "#92400E",
          50: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          text: "#991B1B",
          50: "#FEF2F2",
        },
        // Dark mode surface colors
        dark: {
          bg: "#0B0F1A",
          card: "#111827",
          sidebar: "#0F1629",
          border: "#1E293B",
          hover: "#1E293B",
          surface: "#1A2332",
        },
      },
      borderRadius: {
        'xl': '16px',
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        float: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(37, 99, 235, 0.15)",
        'glow-accent': "0 0 20px rgba(6, 182, 212, 0.15)",
        'inner-subtle': "inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-soft': 'pulseSoft 2s infinite ease-in-out',
        'float': 'float 3s infinite ease-in-out',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
