"use client"

import { Card } from "@/components/ui/card"
import { Sparkles, ShoppingBag, Camera, Tag, MessageSquare } from "lucide-react"

export default function EcommerceStudioPage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-500/20 rounded-xl">
          <ShoppingBag className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Studio E-commerce</h1>
          <p className="text-neutral-500 mt-1">Boostez vos ventes avec des fiches produits et des visuels impactants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Tag, label: "Fiches Produits", color: "text-blue-500" },
          { icon: Camera, label: "Visuels Produits", color: "text-yellow-500" },
          { icon: MessageSquare, label: "Avis & Questions", color: "text-red-500" }
        ].map((item, i) => (
          <Card key={i} className="p-6 bg-neutral-900 border-neutral-800 hover:border-orange-500/50 transition-all cursor-pointer group">
            <item.icon className={`w-10 h-10 mb-4 ${item.color} group-hover:scale-110 transition-transform`} />
            <h3 className="text-lg font-semibold text-white">{item.label}</h3>
            <p className="text-sm text-neutral-500 mt-2">Configuration de l'agent spécialisé en cours...</p>
          </Card>
        ))}
      </div>

      <Card className="p-12 border-dashed border-neutral-700 bg-transparent flex flex-col items-center justify-center text-center">
        <Sparkles className="w-12 h-12 text-orange-500/30 mb-4" />
        <h2 className="text-xl font-medium text-neutral-400">Le studio marchand arrive bientôt</h2>
        <p className="text-neutral-500 max-w-md mt-2">
          Nous préparons des intégrations directes avec vos catalogues pour une automatisation totale de vos boutiques.
        </p>
      </Card>
    </div>
  )
}
