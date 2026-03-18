"use client"

import { useState } from "react"
import {
    Check, Copy, RefreshCw, Edit3, Plus, X,
    TrendingUp, Target, BarChart3, Clock,
    Lightbulb, Sparkles, Zap, ChevronRight,
    Palette, Share2, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Layers } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n"
import type { VideoMetadata, ParallelTaskState, SkillMapping } from "@/lib/types"

interface MetadataStepProps {
    metadata: VideoMetadata | null
    setMetadata: React.Dispatch<React.SetStateAction<VideoMetadata | null>>
    isGenerating: boolean
    generationProgress: number
    parallelTasks: ParallelTaskState
    context: string
    onRegenerate: () => void
    onExecuteParallel: () => void
    skillMapping: SkillMapping
    setSkillMapping: React.Dispatch<React.SetStateAction<SkillMapping>>
    contentBlueprint: any | null
}

const SEO_SUGGESTIONS = [
    { text: "Use numbers", example: "5 Tips for..." },
    { text: "Add urgency", example: "Don't miss..." },
    { text: "Be specific", example: "In 5 minutes" },
    { text: "Use power words", example: "Ultimate, Secret, Proven" },
]

const AVAILABLE_LOGOS = [
    { id: "youtube", name: "YouTube", icon: "▶", color: "#FF0000" },
    { id: "instagram", name: "Instagram", icon: "📷", color: "#E4405F" },
    { id: "tiktok", name: "TikTok", icon: "♪", color: "#000000" },
    { id: "x", name: "X", icon: "𝕏", color: "#000000" },
    { id: "linkedin", name: "LinkedIn", icon: "in", color: "#0A66C2" },
]

export function MetadataStep({
    metadata,
    setMetadata,
    isGenerating,
    generationProgress,
    parallelTasks,
    context,
    onRegenerate,
    onExecuteParallel,
    skillMapping,
    setSkillMapping,
    contentBlueprint,
}: MetadataStepProps) {
    const { t } = useTranslation()
    const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null)
    const [newTag, setNewTag] = useState("")
    const [selectedLogos, setSelectedLogos] = useState<string[]>([])
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const updateTitle = (index: number, value: string) => {
        if (!metadata) return
        const newTitles = [...metadata.titles]
        newTitles[index] = value
        setMetadata({ ...metadata, titles: newTitles })
    }

    const regenerateTitle = async (index: number) => {
        // Placeholder for regenerate single title
    }

    const addTag = () => {
        if (!metadata || !newTag.trim()) return
        setMetadata({ ...metadata, tags: [...metadata.tags, newTag.trim()] })
        setNewTag("")
    }

    const removeTag = (tag: string) => {
        if (!metadata) return
        setMetadata({ ...metadata, tags: metadata.tags.filter(t => t !== tag) })
    }

    const removeHashtag = (hashtag: string) => {
        if (!metadata) return
        setMetadata({ ...metadata, hashtags: metadata.hashtags.filter(h => h !== hashtag) })
    }

    const toggleLogo = (logoId: string) => {
        setSelectedLogos(prev => 
            prev.includes(logoId) ? prev.filter(id => id !== logoId) : [...prev, logoId]
        )
    }

    if (isGenerating) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-white font-medium">{t('contentStudio.metadata.generating')}</p>
                        <Progress value={generationProgress} className="w-64 h-2" />
                    </div>
                </div>
            </div>
        )
    }

    if (!metadata) return null

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Agent Selection */}
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Expert Choice</h3>
                            <p className="text-sm text-neutral-400">Select the agent specializing in your objective</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setSkillMapping(prev => ({ ...prev, metadata: "youtube-extraction" }))}
                            className={`p-4 rounded-lg border text-left transition-all ${
                                skillMapping.metadata === "youtube-extraction" 
                                ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                                : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                            }`}
                        >
                            <div className="font-bold text-white mb-1">YouTube SEO Expert</div>
                            <div className="text-xs text-neutral-400">Optimized for search rankings, keywords, and click-through rates.</div>
                        </button>
                        
                        <button
                            onClick={() => setSkillMapping(prev => ({ ...prev, metadata: "seo" }))}
                            className={`p-4 rounded-lg border text-left transition-all ${
                                skillMapping.metadata === "seo" 
                                ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                                : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                            }`}
                        >
                            <div className="font-bold text-white mb-1">Viral Marketing Strategist</div>
                            <div className="text-xs text-neutral-400">Focused on retention, brand storytelling, and multi-platform reach.</div>
                        </button>
                    </div>
                </div>

                {/* Content Blueprint Banner */}
                {contentBlueprint && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2">
                             <Sparkles className="w-12 h-12 text-orange-500/10" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-orange-500" />
                            <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Expert Strategy Blueprint</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <span className="text-[10px] text-neutral-500 uppercase block mb-1">Target Persona</span>
                                <p className="text-xs text-neutral-300 leading-relaxed italic">"{contentBlueprint.targetPersona || 'Analysed'}"</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-500 uppercase block mb-1">Value Proposition</span>
                                <p className="text-xs text-neutral-300 leading-relaxed font-medium">{contentBlueprint.valueProposition || 'Optimized'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-500 uppercase block mb-1">Vibe & Style</span>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[9px] bg-neutral-900 border-neutral-700">{contentBlueprint.toneOfVoice || 'Neutral'}</Badge>
                                    <Badge variant="outline" className="text-[9px] bg-neutral-900 border-neutral-700">{contentBlueprint.visualStyle || 'Modern'}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEO Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs uppercase">{t('contentStudio.publish.seoScore')}</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">{metadata.seoScore}%</div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Target className="w-4 h-4" />
                            <span className="text-xs uppercase">{t('common.titles')}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{metadata.titles.length}</div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs uppercase">{t('contentStudio.publish.tags')}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{metadata.tags.length}</div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs uppercase">{t('common.characters')}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{metadata.description.length}</div>
                    </div>
                </div>

                {/* Titles Section */}
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{t('contentStudio.metadata.titlesLabel')}</h3>
                                <p className="text-sm text-neutral-400">{t('contentStudio.metadata.selectTitle')}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRegenerate}
                            className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('contentStudio.metadata.regenerate')}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {metadata.titles.map((title, i) => (
                            <div
                                key={i}
                                onClick={() => editingTitleIndex !== i && setMetadata({ ...metadata, selectedTitle: i })}
                                onDoubleClick={() => setEditingTitleIndex(i)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${metadata.selectedTitle === i
                                        ? 'bg-orange-500/10 border-orange-500'
                                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    {editingTitleIndex === i ? (
                                        <Input
                                            value={title}
                                            onChange={(e) => updateTitle(i, e.target.value)}
                                            onBlur={() => setEditingTitleIndex(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingTitleIndex(null)}
                                            autoFocus
                                            className="flex-1 bg-neutral-900 border-orange-500 text-white"
                                        />
                                    ) : (
                                        <span className={metadata.selectedTitle === i ? 'text-white' : 'text-neutral-300'}>
                                            {title}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(title, `title-${i}`) }}
                                                    className="h-8 w-8 text-neutral-400 hover:text-white"
                                                >
                                                    {copiedField === `title-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('common.copy')}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); regenerateTitle(i) }}
                                                    className="h-8 w-8 text-neutral-400 hover:text-white"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('contentStudio.metadata.regenerate')}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setEditingTitleIndex(i) }}
                                                    className="h-8 w-8 text-neutral-400 hover:text-white"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('common.edit')}</TooltipContent>
                                        </Tooltip>
                                        {metadata.selectedTitle === i && (
                                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center ml-2">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-neutral-500">
                                    {title.length} {t('common.characters')} {title.length > 70 && <span className="text-yellow-500">({t('contentStudio.metadata.max70')})</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SEO Suggestions */}
                    <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-white">{t('contentStudio.metadata.seoSuggestions')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {SEO_SUGGESTIONS.map((suggestion, i) => (
                                <div key={i} className="text-xs p-2 bg-neutral-900 rounded border border-neutral-700">
                                    <span className="text-neutral-300">{suggestion.text}</span>
                                    <span className="block text-neutral-500 mt-1">{suggestion.example}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{t('contentStudio.metadata.descriptionLabel')}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{metadata.description.length}/5000 {t('common.characters')}</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => copyToClipboard(metadata.description, 'description')}
                                        className="h-8 w-8 text-neutral-400 hover:text-white"
                                    >
                                        {copiedField === 'description' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('contentStudio.metadata.copyDescription')}</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                    <Textarea
                        value={metadata.description}
                        onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                        className="min-h-[150px] bg-neutral-800 border-neutral-600 text-white resize-y"
                    />
                </div>

                {/* Tags & Hashtags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{t('contentStudio.metadata.tagsLabel')}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => copyToClipboard(metadata.tags.join(', '), 'tags')}
                                        className="h-8 w-8 text-neutral-400 hover:text-white"
                                    >
                                        {copiedField === 'tags' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('contentStudio.metadata.copyTags')}</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {metadata.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="bg-neutral-800 border-neutral-600 text-neutral-300 pr-1 flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder={t('contentStudio.metadata.addTag')}
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                className="bg-neutral-800 border-neutral-600 text-white"
                            />
                            <Button onClick={addTag} size="icon" className="bg-orange-500 hover:bg-orange-600">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{t('contentStudio.metadata.hashtagsLabel')}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => copyToClipboard(metadata.hashtags.join(' '), 'hashtags')}
                                        className="h-8 w-8 text-neutral-400 hover:text-white"
                                    >
                                        {copiedField === 'hashtags' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('contentStudio.metadata.copyHashtags')}</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {metadata.hashtags.map((hashtag, i) => (
                                <Badge key={i} className="bg-orange-500/20 text-orange-400 border-orange-500/30 pr-1 flex items-center gap-1">
                                    {hashtag}
                                    <button onClick={() => removeHashtag(hashtag)} className="ml-1 hover:text-red-400 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Logos for Thumbnails */}
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{t('contentStudio.metadata.logosTitle')}</h3>
                            <p className="text-sm text-neutral-400">{t('contentStudio.metadata.logosSubtitle')}</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {selectedLogos.length} {t('contentStudio.thumbnails.selected')}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {AVAILABLE_LOGOS.map((logo) => (
                            <button
                                key={logo.id}
                                onClick={() => toggleLogo(logo.id)}
                                className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 relative ${selectedLogos.includes(logo.id)
                                        ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20'
                                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                                    }`}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                                    style={{ backgroundColor: `${logo.color}20`, color: logo.color === '#000000' ? '#fff' : logo.color }}
                                >
                                    {logo.icon}
                                </div>
                                <span className="text-xs text-neutral-300">{logo.name}</span>
                                {selectedLogos.includes(logo.id) && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {selectedLogos.length > 0 && (
                        <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                            <div className="flex items-center gap-2 text-sm text-neutral-300">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                <span>{t('contentStudio.metadata.logosHint')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={onExecuteParallel}
                        className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 text-white"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        {t('contentStudio.metadata.executeParallel')}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* Parallel Tasks Status */}
                {(parallelTasks.artistic.status === 'running' || parallelTasks.social.status === 'running') && (
                    <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-xl min-w-[300px]">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                            <span className="font-semibold text-white">{t('contentStudio.metadata.parallelTasks.title')}</span>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-neutral-400 flex items-center gap-1">
                                    <Palette className="w-3 h-3" />
                                    {t('contentStudio.metadata.parallelTasks.artistic')}
                                </span>
                                <span className={parallelTasks.artistic.status === 'completed' ? 'text-green-400' : 'text-orange-400'}>
                                    {parallelTasks.artistic.progress}%
                                </span>
                            </div>
                            <Progress value={parallelTasks.artistic.progress} className="h-1.5" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-neutral-400 flex items-center gap-1">
                                    <Share2 className="w-3 h-3" />
                                    {t('contentStudio.metadata.parallelTasks.social')}
                                </span>
                                <span className={parallelTasks.social.status === 'completed' ? 'text-green-400' : 'text-cyan-400'}>
                                    {parallelTasks.social.progress}%
                                </span>
                            </div>
                            <Progress value={parallelTasks.social.progress} className="h-1.5" />
                        </div>
                        {parallelTasks.artistic.status === 'completed' && parallelTasks.social.status === 'completed' && (
                            <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                                <Check className="w-4 h-4" />
                                {t('contentStudio.metadata.parallelTasks.completed')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}
