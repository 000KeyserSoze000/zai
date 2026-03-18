"use client"

import { useEffect, useState } from "react"
import { Wrench, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface MaintenanceSettings {
  maintenanceMode: boolean
  maintenanceMessage: string | null
  siteName: string
}

export default function MaintenancePage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/maintenance-status")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching maintenance status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8 text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-500 tracking-wider">
            {settings?.siteName || "ContentPro"}
          </h1>
        </div>

        {/* Maintenance Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center">
            <Wrench className="w-12 h-12 text-orange-500 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("maintenance.title")}
        </h2>

        {/* Message */}
        <p className="text-neutral-400 mb-8 text-lg">
          {settings?.maintenanceMessage || t("maintenance.defaultMessage")}
        </p>

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("maintenance.refresh")}
        </Button>

        {/* Footer */}
        <p className="mt-12 text-neutral-600 text-sm">
          {t("maintenance.footer")}
        </p>
      </div>
    </div>
  )
}
