"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"

export default function AdminOrchestratorIndex() {
  const { t } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    router.push("/admin/orchestrator/categories")
  }, [router])

  return (
    <div className="flex h-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 font-medium">{t("orchestrator.common.redirecting")}</p>
      </div>
    </div>
  )
}
