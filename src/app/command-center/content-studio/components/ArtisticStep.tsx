"use client"

import {
    Check, ChevronLeft, ChevronRight, RefreshCw,
    Loader2, Sparkles, Video, Lightbulb, Upload, X, ImagePlus, Palette
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import type { ArtisticDirection } from "@/lib/types"
import { useRef } from "react"

interface ArtisticStepProps {
    artisticDirections: ArtisticDirection[]
    setArtisticDirections: React.Dispatch<React.SetStateAction<ArtisticDirection[]>>
    isGenerating: boolean
    generationProgress: number
    isAnalyzingVideo: boolean
    referenceVideoUrl: string
    setReferenceVideoUrl: (url: string) => void
    onAnalyzeVideo: () => void
    onGenerateThumbnails: () => void
    onGoBack: () => void
    isGeneratingThumbnails?: boolean
    // New props for custom thumbnail content
    referencePhoto: string | null
    setReferencePhoto: (photo: string | null) => void
    thumbnailTitle: string
    setThumbnailTitle: (title: string) => void
    thumbnailShortTitle: string
    setThumbnailShortTitle: (title: string) => void
    // Auto-generate titles
    onAutoGenerateTitles?: () => void
    isAutoGeneratingTitles?: boolean
    videoTitle?: string
    skillMapping: any
    setSkillMapping: (mapping: any) => void
}

export function ArtisticStep({
    artisticDirections,
    setArtisticDirections,
    isGenerating,
    generationProgress,
    isAnalyzingVideo,
    referenceVideoUrl,
    setReferenceVideoUrl,
    onAnalyzeVideo,
    onGenerateThumbnails,
    onGoBack,
    isGeneratingThumbnails,
    referencePhoto,
    setReferencePhoto,
    thumbnailTitle,
    setThumbnailTitle,
    thumbnailShortTitle,
    setThumbnailShortTitle,
    onAutoGenerateTitles,
    isAutoGeneratingTitles,
    videoTitle,
    skillMapping,
    setSkillMapping
}: ArtisticStepProps) {
    const { t } = useTranslation()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const selectDirection = (id: string) => {
        setArtisticDirections(prev => prev.map(d => ({
            ...d,
            selected: d.id === id
        })))
    }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setReferencePhoto(event.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removePhoto = () => {
        setReferencePhoto(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    if (isGeneratingThumbnails) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-white font-medium">{t('contentStudio.artistic.generatingThumbnails')}</p>
                        <p className="text-sm text-neutral-400">{t('contentStudio.artistic.generatingTime')}</p>
                        <Progress value={generationProgress} className="w-64 h-2" />
                    </div>
                </div>
            </div>
        )
    }

    if (isGenerating) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-white font-medium">{t('contentStudio.artistic.generatingDirections')}</p>
                        <Progress value={generationProgress} className="w-64 h-2" />
                    </div>
                </div>
            </div>
        )
    }

    if (artisticDirections.length === 0) return null

    return (
        <div className="space-y-6">
            {/* Agent Selection */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Palette className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Visual Expert</h3>
                        <p className="text-sm text-neutral-400">Select the agent specializing in your visual identity</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setSkillMapping({ artistic: "interaction-design" })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                            skillMapping.artistic === "interaction-design" 
                            ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                        }`}
                    >
                        <div className="font-bold text-white mb-1">Creative Director</div>
                        <div className="text-xs text-neutral-400">Expert in brand aesthetics, mood, and high-end visual storytelling.</div>
                    </button>
                    
                    <button
                        onClick={() => setSkillMapping({ artistic: "guimkt-design-system-extractor" })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                            skillMapping.artistic === "guimkt-design-system-extractor" 
                            ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                        }`}
                    >
                        <div className="font-bold text-white mb-1">Design System Analyst</div>
                        <div className="text-xs text-neutral-400">Precision styles based on existing branding and UI/UX consistency.</div>
                    </button>
                </div>
            </div>

            {/* Photo Upload and Custom Text Section */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border border-cyan-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{t('contentStudio.artistic.customizeTitle')}</h3>
                        <p className="text-sm text-neutral-400">{t('contentStudio.artistic.customizeSubtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photo Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-300">{t('contentStudio.artistic.photoLabel')}</label>
                        <div className="relative">
                            {referencePhoto ? (
                                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-neutral-600">
                                    <img
                                        src={referencePhoto}
                                        alt={t('contentStudio.artistic.photoLabel')}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={removePhoto}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-40 border-2 border-dashed border-neutral-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-all"
                                >
                                    <Upload className="w-8 h-8 text-neutral-500 mb-2" />
                                    <p className="text-sm text-neutral-400">{t('contentStudio.artistic.photoPlaceholder')}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{t('contentStudio.artistic.photoHint')}</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Custom Text Inputs */}
                    <div className="space-y-4">
                        {/* Auto-generate button */}
                        {onAutoGenerateTitles && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onAutoGenerateTitles}
                                disabled={isAutoGeneratingTitles || !videoTitle}
                                className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 mb-2"
                            >
                                {isAutoGeneratingTitles ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('contentStudio.artistic.autoGenerating')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {t('contentStudio.artistic.autoGenerate')}
                                    </>
                                )}
                            </Button>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">{t('contentStudio.artistic.mainTitleLabel')}</label>
                            <Input
                                placeholder={t('contentStudio.artistic.mainTitlePlaceholder')}
                                value={thumbnailTitle}
                                onChange={(e) => setThumbnailTitle(e.target.value)}
                                className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-cyan-500"
                            />
                            <p className="text-xs text-neutral-500">{t('contentStudio.artistic.mainTitleHint')}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">{t('contentStudio.artistic.shortTitleLabel')}</label>
                            <Input
                                placeholder={t('contentStudio.artistic.shortTitlePlaceholder')}
                                value={thumbnailShortTitle}
                                onChange={(e) => setThumbnailShortTitle(e.target.value)}
                                className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-cyan-500"
                            />
                            <p className="text-xs text-neutral-500">{t('contentStudio.artistic.shortTitleHint')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Reference Input */}
            <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-orange-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{t('contentStudio.artistic.videoStyleTitle')}</h3>
                        <p className="text-sm text-neutral-400">{t('contentStudio.artistic.videoStyleSubtitle')}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={referenceVideoUrl}
                        onChange={(e) => setReferenceVideoUrl(e.target.value)}
                        className="flex-1 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-orange-500"
                    />
                    <Button
                        onClick={onAnalyzeVideo}
                        disabled={!referenceVideoUrl.trim() || isAnalyzingVideo}
                        className="bg-orange-500 hover:bg-orange-600 text-white min-w-[140px]"
                    >
                        {isAnalyzingVideo ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('contentStudio.artistic.analyzing')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {t('contentStudio.artistic.analyzeButton')}
                            </>
                        )}
                    </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <Lightbulb className="w-3 h-3" />
                    <span>{t('contentStudio.artistic.videoStyleHint')}</span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">{t('contentStudio.artistic.title')}</h3>
                    <p className="text-sm text-neutral-400">{t('contentStudio.artistic.subtitle')}</p>
                </div>
                <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-300">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('contentStudio.artistic.regenerate')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {artisticDirections.map((direction) => (
                    <div
                        key={direction.id}
                        onClick={() => selectDirection(direction.id)}
                        className={`bg-neutral-900 border rounded-lg p-6 cursor-pointer transition-all ${direction.selected
                                ? 'border-orange-500 ring-2 ring-orange-500/20'
                                : 'border-neutral-700 hover:border-neutral-500'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-white">{direction.name}</h4>
                            {direction.selected && (
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mb-4">
                            {Object.values(direction.colorPalette).map((color, i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border border-neutral-600"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="text-neutral-400">
                                <span className="text-neutral-500">{t('contentStudio.artistic.fonts')}:</span> {direction.typography.headingFont}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {direction.moodKeywords.map((keyword, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-neutral-800 border-neutral-700 text-neutral-400">
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onGoBack}
                    className="border-neutral-600 text-neutral-300"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('contentStudio.artistic.back')}
                </Button>
                <Button
                    onClick={onGenerateThumbnails}
                    disabled={!artisticDirections.some(d => d.selected)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                    {t('contentStudio.artistic.generateThumbnails')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
