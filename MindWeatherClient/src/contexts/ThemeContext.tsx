import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'ocean' | 'purple';

interface ThemeContextType {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    setTheme: () => {},
});

const THEME_STORAGE_KEY = 'mindweather_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['dark', 'light', 'ocean', 'purple'].includes(saved)) {
            setThemeState(saved as ThemeName);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme, isLoaded]);

    const setTheme = (newTheme: ThemeName) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

export const themes = {
    dark: {
        bg: {
            primary: '#111827',
            secondary: '#1F2937',
            tertiary: '#374151',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#9CA3AF',
            tertiary: '#6B7280',
        },
        accent: {
            primary: '#7C3AED',
            secondary: '#A78BFA',
        },
        border: '#374151',
    },
    light: {
        bg: {
            primary: '#FFFFFF',
            secondary: '#F3F4F6',
            tertiary: '#E5E7EB',
        },
        text: {
            primary: '#111827',
            secondary: '#6B7280',
            tertiary: '#9CA3AF',
        },
        accent: {
            primary: '#7C3AED',
            secondary: '#8B5CF6',
        },
        border: '#E5E7EB',
    },
    ocean: {
        bg: {
            primary: '#0C4A6E',
            secondary: '#075985',
            tertiary: '#0369A1',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#BAE6FD',
            tertiary: '#7DD3FC',
        },
        accent: {
            primary: '#06B6D4',
            secondary: '#22D3EE',
        },
        border: '#0369A1',
    },
    purple: {
        bg: {
            primary: '#2E1065',
            secondary: '#4C1D95',
            tertiary: '#5B21B6',
        },
        text: {
            primary: '#F3E8FF',
            secondary: '#E9D5FF',
            tertiary: '#D8B4FE',
        },
        accent: {
            primary: '#C084FC',
            secondary: '#A78BFA',
        },
        border: '#6D28D9',
    },
};
