"use client";
import { useEffect, useState, createContext, useContext } from "react";

// Create the ThemeContext
const ThemeContext = createContext<
  | {
      theme: string;
      toggleTheme: () => void;
    }
  | undefined
>(undefined);

// Hook to use the ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// ThemeProvider component
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<string>("dark");

  useEffect(() => {
    // Check if window (and thus localStorage) is available
    const storedTheme =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initialTheme = storedTheme ?? "dark";
    setTheme(initialTheme);
    document
      .querySelector("body")
      ?.classList.add(initialTheme, "text-foreground", "bg-background");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    document.querySelector("body")?.classList.replace(theme, newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
    setTheme(newTheme);
  };

  useEffect(() => {
    return () => {
      document.querySelector("body")?.classList.remove(theme);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
