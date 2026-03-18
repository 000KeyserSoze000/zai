"use client"

import { useTranslation, LOCALES, type Locale } from "@/lib/i18n"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
    const { locale, setLocale } = useTranslation()
    const current = LOCALES.find((l) => l.code === locale) || LOCALES[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size={collapsed ? "icon" : "sm"}
                    className="text-neutral-400 hover:text-white hover:bg-neutral-800 gap-2"
                >
                    <Globe className="w-4 h-4" />
                    {!collapsed && (
                        <span className="text-xs">{current.flag} {current.code.toUpperCase()}</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-neutral-900 border-neutral-700">
                {LOCALES.map((loc) => (
                    <DropdownMenuItem
                        key={loc.code}
                        onClick={() => setLocale(loc.code as Locale)}
                        className={`cursor-pointer ${locale === loc.code ? "text-orange-400" : "text-neutral-300"} hover:text-white`}
                    >
                        <span className="mr-2">{loc.flag}</span>
                        <span>{loc.label}</span>
                        {locale === loc.code && (
                            <span className="ml-auto text-xs text-orange-500">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
