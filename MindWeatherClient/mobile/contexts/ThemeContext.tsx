import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'dark' | 'light' | 'ocean' | 'purple';

interface ThemeContextType {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'purple',
    setTheme: () => { },
});

const THEME_STORAGE_KEY = '@mindweather_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('purple');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load theme from storage on mount
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'ocean' || savedTheme === 'purple')) {
                setThemeState(savedTheme as ThemeName);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        } finally {
            setIsLoaded(true);
        }
    };


    const setTheme = async (newTheme: ThemeName) => {
        try {
            setThemeState(newTheme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    if (!isLoaded) {
        return null; // or a loading screen
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

// Theme color definitions
export const themes = {
    dark: {
        bg: {
            primary: '#111827',   // gray-900
            secondary: '#1F2937', // gray-800
            tertiary: '#374151',  // gray-700
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#9CA3AF', // gray-400
            tertiary: '#6B7280',  // gray-500
        },
        accent: {
            primary: '#7C3AED',   // purple-600
            secondary: '#A78BFA', // purple-400
        },
        border: '#374151',        // gray-700
    },
    light: {
        bg: {
            primary: '#FFFFFF',
            secondary: '#F3F4F6',  // gray-100
            tertiary: '#E5E7EB',   // gray-200
        },
        text: {
            primary: '#111827',    // gray-900
            secondary: '#6B7280',  // gray-500
            tertiary: '#9CA3AF',   // gray-400
        },
        accent: {
            primary: '#7C3AED',    // purple-600
            secondary: '#8B5CF6',  // purple-500
        },
        border: '#E5E7EB',         // gray-200
    },
    ocean: {
        bg: {
            primary: '#0C4A6E',    // sky-900
            secondary: '#075985',  // sky-800
            tertiary: '#0369A1',   // sky-700
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#BAE6FD',  // sky-200
            tertiary: '#7DD3FC',   // sky-300
        },
        accent: {
            primary: '#06B6D4',    // cyan-500
            secondary: '#22D3EE',  // cyan-400
        },
        border: '#0369A1',         // sky-700
    },
    purple: {
        bg: {
            primary: '#2E1065',   // violet-950
            secondary: '#4C1D95', // violet-900
            tertiary: '#5B21B6',  // violet-800
        },
        text: {
            primary: '#F3E8FF',   // violet-100
            secondary: '#E9D5FF', // violet-200
            tertiary: '#D8B4FE',  // violet-300
        },
        accent: {
            primary: '#C084FC',   // violet-400
            secondary: '#A78BFA', // violet-400
        },
        border: '#6D28D9',        // violet-700
    },
};
