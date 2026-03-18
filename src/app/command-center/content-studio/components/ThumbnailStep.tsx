"use client"

import {
    Check, ChevronLeft, ChevronRight, Plus,
    Loader2, ImageDown, FileImage,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import type { Thumbnail } from "@/lib/types"
import { AVAILABLE_LOGOS } from "../constants"

interface ThumbnailStepProps {
    thumbnails: Thumbnail[]
    setThumbnails: React.Dispatch<React.SetStateAction<Thumbnail[]>>
    selectedLogos: string[]
    isGenerating: boolean
    generationProgress: number
    onGoBack: () => void
    onContinue: () => void
    onExportThumbnail: (thumbnail: Thumbnail, format: 'png' | 'jpg') => void
    onExportAll: (format: 'png' | 'jpg') => void
}

export function ThumbnailStep({
    thumbnails,
    setThumbnails,
    selectedLogos,
    isGenerating,
    generationProgress,
    onGoBack,
    onContinue,
    onExportThumbnail,
    onExportAll,
}: ThumbnailStepProps) {
    const { t } = useTranslation()

    const selectThumbnail = (id: string) => {
        setThumbnails(prev => prev.map(t => ({
            ...t,
            selected: t.id === id
        })))
    }

    if (isGenerating) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-white font-medium">{t('contentStudio.thumbnails.generating')}</p>
                        <Progress value={generationProgress} className="w-64 h-2" />
                        <p className="text-sm text-neutral-400">{t('contentStudio.thumbnails.generatingTime')}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (thumbnails.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">{t('contentStudio.thumbnails.title')}</h3>
                    <p className="text-sm text-neutral-400">{t('contentStudio.thumbnails.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-300">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('contentStudio.thumbnails.generateMore')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportAll('png')}
                        className="border-green-600 text-green-400 hover:bg-green-500/10"
                    >
                        <ImageDown className="w-4 h-4 mr-2" />
                        {t('contentStudio.thumbnails.exportPng')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportAll('jpg')}
                        className="border-blue-600 text-blue-400 hover:bg-blue-500/10"
                    >
                        <FileImage className="w-4 h-4 mr-2" />
                        {t('contentStudio.thumbnails.exportJpg')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {thumbnails.map((thumbnail) => (
                    <div
                        key={thumbnail.id}
                        className={`bg-neutral-900 border rounded-lg overflow-hidden transition-all ${thumbnail.selected
                                ? 'border-orange-500 ring-2 ring-orange-500/20'
                                : 'border-neutral-700 hover:border-neutral-500'
                            }`}
                    >
                        <div
                            className="aspect-video relative cursor-pointer"
                            onClick={() => selectThumbnail(thumbnail.id)}
                            style={thumbnail.imageUrl ? {
                                backgroundImage: `url(${thumbnail.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {
                                background: 'linear-gradient(135deg, rgba(255,107,0,0.2) 0%, rgba(0,217,255,0.2) 100%)'
                            }}
                        >
                            {/* Reference photo on the right side */}
                            {thumbnail.referencePhoto && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32">
                                    <img
                                        src={thumbnail.referencePhoto}
                                        alt="Reference"
                                        className="w-full h-full object-cover rounded-lg shadow-xl border-2 border-white/20"
                                    />
                                </div>
                            )}

                            {thumbnail.theme && (
                                <div className="absolute top-2 left-2">
                                    <Badge className="bg-black/60 text-white border-0 text-xs">{thumbnail.theme}</Badge>
                                </div>
                            )}

                            {/* Text overlay */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 ${thumbnail.referencePhoto ? 'pr-28 md:pr-36' : ''}`}>
                                {thumbnail.textOverlay.map((text, index) => (
                                    <div
                                        key={text.id}
                                        className="text-center font-black uppercase tracking-wide"
                                        style={{
                                            color: text.color,
                                            fontSize: index === 0 ? 'clamp(18px, 4vw, 28px)' : 'clamp(14px, 3vw, 20px)',
                                            textShadow: `
                        2px 2px 0 ${text.strokeColor || '#000'},
                        -2px -2px 0 ${text.strokeColor || '#000'},
                        2px -2px 0 ${text.strokeColor || '#000'},
                        -2px 2px 0 ${text.strokeColor || '#000'},
                        0 4px 8px rgba(0,0,0,0.5)
                      `,
                                            lineHeight: 1.2,
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {text.content}
                                    </div>
                                ))}
                            </div>

                            {/* Selected logos */}
                            {selectedLogos.length > 0 && (
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    {selectedLogos.map((logoId) => {
                                        const logo = AVAILABLE_LOGOS.find(l => l.id === logoId)
                                        if (!logo) return null
                                        return (
                                            <div
                                                key={logoId}
                                                className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm shadow-lg"
                                                style={{
                                                    backgroundColor: logo.color,
                                                    color: ['#FF6B00', '#61DAFB', '#3ECF8E', '#38BDF8'].includes(logo.color) ? '#000' : '#FFF',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                }}
                                            >
                                                {logo.icon}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {thumbnail.selected && (
                                <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-400 text-xs">{t('contentStudio.thumbnails.resolution')}</Badge>
                                    {thumbnail.theme && (
                                        <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-400 text-xs">{thumbnail.theme}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => onExportThumbnail(thumbnail, 'png')}
                                    className="flex-1 border-green-600 text-green-400 hover:bg-green-500/10"
                                >
                                    <ImageDown className="w-4 h-4 mr-1" />
                                    PNG
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => onExportThumbnail(thumbnail, 'jpg')}
                                    className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-500/10"
                                >
                                    <FileImage className="w-4 h-4 mr-1" />
                                    JPG
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onGoBack} className="border-neutral-600 text-neutral-300">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('contentStudio.thumbnails.back')}
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={!thumbnails.some(t => t.selected)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                    {t('contentStudio.thumbnails.continueToPosts')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
