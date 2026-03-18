"use client"

import { FileText, Search, Palette, ImageIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/lib/i18n"

interface ContextStepProps {
    context: string
    setContext: (value: string) => void
    isGenerating: boolean
    onStartSession: () => void
}

export function ContextStep({ context, setContext, isGenerating, onStartSession }: ContextStepProps) {
    const { t } = useTranslation()

    const features = [
        { icon: Search, title: t('contentStudio.features.seoOptimized'), desc: t('contentStudio.features.seoOptimizedDesc') },
        { icon: Palette, title: t('contentStudio.features.artisticDirection'), desc: t('contentStudio.features.artisticDirectionDesc') },
        { icon: ImageIcon, title: t('contentStudio.features.proThumbnails'), desc: t('contentStudio.features.proThumbnailsDesc') },
    ]

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('contentStudio.contextTitle')}</h3>
                        <p className="text-sm text-neutral-400">{t('contentStudio.contextSubtitle')}</p>
                    </div>
                </div>

                <Textarea
                    placeholder={t('contentStudio.context.placeholder')}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[200px] bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-orange-500"
                />

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                        {context.length} {t('common.characters')}
                    </div>
                    <Button
                        onClick={onStartSession}
                        disabled={!context.trim() || isGenerating}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('contentStudio.startGeneration')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                    <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                        <feature.icon className="w-8 h-8 text-orange-500 mb-3" />
                        <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                        <p className="text-sm text-neutral-400">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
