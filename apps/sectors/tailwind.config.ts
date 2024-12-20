import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    // Path to Tremor module
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    //TREMOR START
    transparent: "transparent",
    current: "currentColor",
    //TREMOR END
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 15px 5px rgba(255, 0, 124, 0.5), 0 0 25px 10px rgba(0, 255, 255, 0.5), 0 0 50px 20px rgba(255, 255, 0, 0.5)",
          },
          "50%": {
            boxShadow:
              "0 0 20px 10px rgba(0, 255, 255, 0.5), 0 0 35px 20px rgba(255, 0, 124, 0.5), 0 0 70px 40px rgba(255, 255, 0, 0.5)",
          },
        },
      },
      animation: {
        glow: "glow 2s infinite",
      },
      //TREMOR START
      colors: {
        // light mode
        tremor: {
          brand: {
            faint: colors.blue[50],
            muted: colors.blue[200],
            subtle: colors.blue[400],
            DEFAULT: colors.blue[500],
            emphasis: colors.blue[700],
            inverted: colors.white,
          },
          background: {
            muted: colors.gray[50],
            subtle: colors.gray[100],
            DEFAULT: colors.white,
            emphasis: colors.gray[700],
          },
          border: {
            DEFAULT: colors.gray[200],
          },
          ring: {
            DEFAULT: colors.gray[200],
          },
          content: {
            subtle: colors.gray[400],
            DEFAULT: colors.gray[500],
            emphasis: colors.gray[700],
            strong: colors.gray[900],
            inverted: colors.white,
          },
        },
        // dark mode
        "dark-tremor": {
          brand: {
            faint: "#0B1229",
            muted: colors.blue[950],
            subtle: colors.blue[800],
            DEFAULT: colors.blue[500],
            emphasis: colors.blue[400],
            inverted: colors.blue[950],
          },
          background: {
            muted: "#131A2B",
            subtle: colors.gray[800],
            DEFAULT: colors.gray[900],
            emphasis: colors.gray[300],
          },
          border: {
            DEFAULT: colors.gray[800],
          },
          ring: {
            DEFAULT: colors.gray[800],
          },
          content: {
            subtle: colors.gray[600],
            DEFAULT: colors.gray[500],
            emphasis: colors.gray[200],
            strong: colors.gray[50],
            inverted: colors.gray[950],
          },
        },
      },
      boxShadow: {
        // light
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        // dark
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
    //TREMOR END
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    ...[
      "[#B28800]",
      "[#FF5733]",
      "[#C70039]",
      "[#900C3F]",
      "[#581845]",
      "[#2C3E50]",
      "[#154360]",
      "[#FFD700]",
      "[#FFC300]",
      "[#FFB000]",
      "[#FF9C00]",
      "[#FF8800]",
      "[#FF7400]",
      "[#FF6000]",
      "[#FF4C00]",
      "[#FF3800]",
      "[#FF2400]",
      "[#FF4500]",
      "[#FF3300]",
      "[#FF2200]",
      "[#FF1100]",
      "[#FF0000]",
      "[#E60000]",
      "[#CC0000]",
      "[#B30000]",
      "[#990000]",
      "[#800000]",
      "[#FF1493]",
      "[#FF0066]",
      "[#E60060]",
      "[#CC005C]",
      "[#B30058]",
      "[#990054]",
      "[#800050]",
      "[#66004C]",
      "[#4C0048]",
      "[#330044]",
      "[#4B0082]",
      "[#6A0DAD]",
      "[#7F00FF]",
      "[#8A2BE2]",
      "[#9932CC]",
      "[#BA55D3]",
      "[#DA70D6]",
      "[#EE82EE]",
      "[#D8BFD8]",
      "[#DDA0DD]",
      "[#00CED1]",
      "[#20B2AA]",
      "[#40E0D0]",
      "[#48D1CC]",
      "[#5F9EA0]",
      "[#66CDAA]",
      "[#7FFFD4]",
      "[#76EEC6]",
      "[#70DBDB]",
      "[#AFEEEE]",
      "[#228B22]",
      "[#32CD32]",
      "[#00FF00]",
      "[#7CFC00]",
      "[#00FA9A]",
      "[#ADFF2F]",
      "[#9ACD32]",
      "[#8FBC8F]",
      "[#556B2F]",
      "[#6B8E23]",
      "[#4682B4]",
      "[#4169E1]",
      "[#0000FF]",
      "[#0000CD]",
      "[#00008B]",
      "[#191970]",
      "[#6495ED]",
      "[#1E90FF]",
      "[#00BFFF]",
      "[#87CEFA]",
    ].flatMap((customColor) => [
      `bg-${customColor}`,
      `border-${customColor}`,
      `hover:bg-${customColor}`,
      `hover:border-${customColor}`,
      `hover:text-${customColor}`,
      `fill-${customColor}`,
      `ring-${customColor}`,
      `stroke-${customColor}`,
      `text-${customColor}`,
      `ui-selected:bg-${customColor}`,
      `ui-selected:border-${customColor}`,
      `ui-selected:text-${customColor}`,
    ]),
  ],
  darkMode: "class",
  plugins: [
    nextui({
      addCommonColors: true,
      themes: {
        "purple-dark": {
          extend: "dark", // <- inherit default values from dark theme
          colors: {
            background: "#0D001A",
            foreground: "#ffffff",
            primary: {
              50: "#3B096C",
              100: "#520F83",
              200: "#7318A2",
              300: "#9823C2",
              400: "#c031e2",
              500: "#DD62ED",
              600: "#F182F6",
              700: "#FCADF9",
              800: "#FDD5F9",
              900: "#FEECFE",
              DEFAULT: "#DD62ED",
              foreground: "#ffffff",
            },
            focus: "#F182F6",
          },
          layout: {
            disabledOpacity: "0.3",
            radius: {
              small: "4px",
              medium: "6px",
              large: "8px",
            },
            borderWidth: {
              small: "1px",
              medium: "2px",
              large: "3px",
            },
          },
        },
        political: {
          colors: {
            background: {
              DEFAULT: "#F0ECD8",
              foreground: "#0c0c0d",
            },
            content1: "#e3ddc0",
            content2: "#13325d",
            content3: "#721C24",
            content4: "#8B0000",
            danger: {
              "50": "#fff9f5",
              "100": "#fff3eb",
              "200": "#ffe4d1",
              "300": "#ffd5b8",
              "400": "#ffc9a3",
              "500": "#ffac70",
              "600": "#ff9447",
              "700": "#f06400",
              "800": "#a34400",
              "900": "#4d2000",
              DEFAULT: "#FF6A00",
            },
            default: {
              "50": "#f9f9fb",
              "100": "#f2f3f7",
              "200": "#e2e4ee",
              "300": "#d2d6e5",
              "400": "#c5cadd",
              "500": "#a5acca",
              "600": "#8b95bb",
              "700": "#596597",
              "800": "#3c4567",
              "900": "#1c2030",
              DEFAULT: "#e2e4ee",
              foreground: "#1c2030",
            },
            divider: "#000",
            focus: "#1C4191",
            foreground: {
              "50": "#fafafa",
              "100": "#f5f5f5",
              "200": "#e8e8e8",
              "300": "#dbdbdb",
              "400": "#d1d1d1",
              "500": "#b8b8b8",
              "600": "#a3a3a3",
              "700": "#787878",
              "800": "#525252",
              "900": "#262626",
              DEFAULT: "#000000",
              foreground: "#fafafa",
            },
            overlay: "#F0ECD8",
            primary: {
              "50": "#f6f9fe",
              "100": "#edf3fd",
              "200": "#d6e5fa",
              "300": "#bfd7f8",
              "400": "#accbf6",
              "500": "#7eaef1",
              "600": "#5a97ed",
              "700": "#1868d8",
              "800": "#104793",
              "900": "#082145",
              DEFAULT: "#0D2240",
            },
            secondary: {
              "50": "#fef5f6",
              "100": "#feeced",
              "200": "#fcd4d7",
              "300": "#fbbcc1",
              "400": "#f9a9af",
              "500": "#f67983",
              "600": "#f45260",
              "700": "#e10e20",
              "800": "#990a16",
              "900": "#48050a",
              DEFAULT: "#E31B2C",
            },
            success: {
              "50": "#f6fef9",
              "100": "#edfcf3",
              "200": "#d8f9e5",
              "300": "#c2f5d6",
              "400": "#b0f2ca",
              "500": "#9fefbf",
              "600": "#61e596",
              "700": "#22ce67",
              "800": "#178c46",
              "900": "#0b4221",
              DEFAULT: "#36C26E",
            },
            warning: {
              "50": "#fdfaf6",
              "100": "#fcf6ee",
              "200": "#f8ebd8",
              "300": "#f4dfc3",
              "400": "#f0d6b2",
              "500": "#e8c087",
              "600": "#e2ae65",
              "700": "#c98526",
              "800": "#895b1a",
              "900": "#402b0c",
              DEFAULT: "#F5AF4E",
            },
          },
          extend: "light",
        },
      },
    }),
    require("@headlessui/tailwindcss"),
    require("@tailwindcss/forms"),
    require('@tailwindcss/container-queries'),
  ],
};
export default config;
