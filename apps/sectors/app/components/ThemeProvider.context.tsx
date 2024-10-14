import { useEffect, useState, createContext, useContext } from "react";

// Create the ThemeContext
const ThemeContext = createContext<{
    theme: string;
    toggleTheme: () => void;
} | undefined>(undefined);

// Hook to use the ThemeContext
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

// ThemeProvider component
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") ?? "dark");

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        document.querySelector("body")?.classList.replace(theme, newTheme);
        localStorage.setItem("theme", newTheme);
        setTheme(newTheme);
    };

    useEffect(() => {
        const body = document.querySelector("body");
        body?.classList.add(theme, "text-foreground", "bg-background");

        return () => {
            body?.classList.remove(theme);
        };
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
