import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
}

const STORAGE_KEY = "oceantech-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // Continue with the system preference if storage is unavailable.
  }

  return "system";
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreference] =
    useState<ThemePreference>(getInitialPreference);

  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  const theme: Theme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    try {
      if (preference === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // The theme still works for this session if storage is unavailable.
    }
  }, [theme, preference]);

  const toggleTheme = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme]);

  const setThemePreference = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      toggleTheme,
      setThemePreference,
    }),
    [theme, preference, toggleTheme, setThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
