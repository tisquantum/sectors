import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 15px 5px rgba(255, 0, 124, 0.5), 0 0 25px 10px rgba(0, 255, 255, 0.5), 0 0 50px 20px rgba(255, 255, 0, 0.5)'
          },
          '50%': {
            boxShadow: '0 0 20px 10px rgba(0, 255, 255, 0.5), 0 0 35px 20px rgba(255, 0, 124, 0.5), 0 0 70px 40px rgba(255, 255, 0, 0.5)'
          },
        },
      },
      animation: {
        glow: 'glow 2s infinite',
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
export default config;
