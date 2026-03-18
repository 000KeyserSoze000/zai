"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import fr from "./translations/fr.json"
import en from "./translations/en.json"
import es from "./translations/es.json"

export type Locale = "fr" | "en" | "es"

const translations: Record<Locale, Record<string, unknown>> = { fr, en, es }

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
]

interface I18nContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    // Handle undefined or null path
    if (!path || typeof path !== 'string') {
        return String(path ?? '')
    }
    
    const keys = path.split(".")
    let current: unknown = obj
    for (const key of keys) {
        if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[key]
        } else {
            return path // Return the key itself as fallback
        }
    }
    return typeof current === "string" ? current : path
}

// Get initial locale from localStorage (client-side only)
function getInitialLocale(): Locale {
    if (typeof window === "undefined") return "fr"
    try {
        const saved = localStorage.getItem("locale") as Locale | null
        if (saved && translations[saved]) {
            return saved
        }
    } catch {
        // localStorage not available
    }
    return "fr"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        try {
            localStorage.setItem("locale", newLocale)
            // Update the HTML lang attribute
            document.documentElement.lang = newLocale
        } catch {
            // localStorage not available
        }
    }, [])

    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            let result = getNestedValue(translations[locale] as Record<string, unknown>, key)
            // Fallback to French if key not found in current locale
            if (result === key && locale !== "fr") {
                result = getNestedValue(translations.fr as Record<string, unknown>, key)
            }

            if (params && result !== key) {
                Object.entries(params).forEach(([k, v]) => {
                    result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
                })
            }

            return result
        },
        [locale]
    )

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error("useTranslation must be used within an I18nProvider")
    }
    return context
}
