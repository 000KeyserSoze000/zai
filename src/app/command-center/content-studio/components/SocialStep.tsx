"use client"

import { useState } from "react"
import {
    Check, X, ChevronLeft, ChevronRight,
    Loader2, Copy, Share2, Eye, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import type { SocialPost } from "@/lib/types"
import { SOCIAL_PLATFORMS } from "../constants"
import { SocialSimulator } from "./SocialSimulator"

interface SocialStepProps {
    socialPosts: SocialPost[]
    setSocialPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>
    selectedPlatforms: string[]
    setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>
    isGenerating: boolean
    generationProgress: number
    onGoBack: () => void
    onContinue: () => void
    skillMapping: any
    setSkillMapping: (mapping: any) => void
}

export function SocialStep({
    socialPosts,
    setSocialPosts,
    selectedPlatforms,
    setSelectedPlatforms,
    isGenerating,
    generationProgress,
    onGoBack,
    onContinue,
    skillMapping,
    setSkillMapping,
}: SocialStepProps) {
    const { toast } = useToast()
    const { t } = useTranslation()
    const [showSimulator, setShowSimulator] = useState(false)

    const togglePlatform = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        )
    }

    if (isGenerating) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-white font-medium">{t('contentStudio.social.generating')}</p>
                        <Progress value={generationProgress} className="w-64 h-2" />
                    </div>
                </div>
            </div>
        )
    }

    if (socialPosts.length === 0) return null

    return (
        <div className="space-y-6">
            {/* Agent Selection */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Social Strategist</h3>
                        <p className="text-sm text-neutral-400">Select the agent specializing in your growth strategy</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setSkillMapping({ social: "guimkt-threads-viral-content" })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                            skillMapping.social === "guimkt-threads-viral-content" 
                            ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                        }`}
                    >
                        <div className="font-bold text-white mb-1">Viral Hook Specialist</div>
                        <div className="text-xs text-neutral-400">Maximizes engagement, shares, and scroll-stopping hooks for all platforms.</div>
                    </button>
                    
                    <button
                        onClick={() => setSkillMapping({ social: "guimkt-classic-ad-creative-final" })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                            skillMapping.social === "guimkt-classic-ad-creative-final" 
                            ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                        }`}
                    >
                        <div className="font-bold text-white mb-1">Classic Ad Creative</div>
                        <div className="text-xs text-neutral-400">Professional copywriting focused on conversion and clear brand messaging.</div>
                    </button>
                </div>
            </div>

            {/* Preview Toggle Button - PROMINENT */}
            <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Prévisualisation des Réseaux Sociaux</p>
                            <p className="text-xs text-neutral-400">Voyez exactement comment vos posts apparaîtront sur chaque plateforme</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowSimulator(!showSimulator)}
                        className={`gap-2 ${showSimulator 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        {showSimulator ? 'Masquer la Prévisualisation' : 'Voir la Prévisualisation'}
                    </Button>
                </div>
            </div>

            {/* Social Simulator */}
            {showSimulator && (
                <div className="bg-neutral-900 border border-purple-500/30 rounded-lg p-6">
                    <SocialSimulator 
                        socialPosts={socialPosts}
                        selectedPlatforms={selectedPlatforms.length > 0 ? selectedPlatforms : socialPosts.map(p => p.platform)}
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">{t('contentStudio.social.title')}</h3>
                    <p className="text-sm text-neutral-400">
                        {socialPosts.filter(p => selectedPlatforms.includes(p.platform)).length} {t('contentStudio.social.postsSelected')} {socialPosts.length}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setSelectedPlatforms(socialPosts.map(p => p.platform))}
                        className="border-neutral-600 text-neutral-300 hover:text-white"
                    >
                        {t('contentStudio.social.selectAll')}
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setSelectedPlatforms([])}
                        className="border-neutral-600 text-neutral-300 hover:text-white"
                    >
                        {t('contentStudio.social.deselectAll')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue={socialPosts[0]?.platform || 'linkedin'} className="w-full">
                <TabsList className="bg-neutral-800 border border-neutral-700 flex-wrap h-auto gap-1 p-1">
                    {socialPosts.map((post) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === post.platform)
                        const Icon = platform?.icon || Share2
                        const isSelected = selectedPlatforms.includes(post.platform)
                        return (
                            <TabsTrigger
                                key={post.id}
                                value={post.platform}
                                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center gap-2 relative"
                                onDoubleClick={() => togglePlatform(post.platform)}
                            >
                                <Icon className="w-4 h-4" style={{ color: isSelected ? platform?.color : '#666' }} />
                                <span className={isSelected ? '' : 'opacity-50'}>{platform?.name || post.platform}</span>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-neutral-800" />
                                )}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {socialPosts.map((post) => {
                    const platform = SOCIAL_PLATFORMS.find(p => p.id === post.platform)
                    const Icon = platform?.icon || Share2
                    const isSelected = selectedPlatforms.includes(post.platform)
                    return (
                        <TabsContent key={post.id} value={post.platform} className="mt-4">
                            <div className={`bg-neutral-900 border rounded-lg p-6 transition-all ${isSelected ? 'border-neutral-700' : 'border-neutral-800 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${platform?.color}20` }}>
                                            <Icon className="w-4 h-4" style={{ color: platform?.color }} />
                                        </div>
                                        <Badge style={{ backgroundColor: `${platform?.color}20`, color: platform?.color, borderColor: `${platform?.color}30` }}>
                                            {platform?.name || post.platform}
                                        </Badge>
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => togglePlatform(post.platform)}
                                            className={isSelected ? "text-green-500" : "text-neutral-500"}
                                        >
                                            {isSelected ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                                            {isSelected ? t('contentStudio.social.selected') : t('contentStudio.social.deselected')}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost" size="sm"
                                            className="text-neutral-400 hover:text-white"
                                            onClick={() => {
                                                navigator.clipboard.writeText(post.content)
                                                toast({ title: t('common.copied'), description: t('contentStudio.social.copySuccess') })
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            {t('common.copy')}
                                        </Button>
                                    </div>
                                </div>

                                <Textarea
                                    value={post.content}
                                    onChange={(e) => {
                                        setSocialPosts(prev => prev.map(p =>
                                            p.id === post.id ? { ...p, content: e.target.value } : p
                                        ))
                                    }}
                                    className="min-h-[200px] bg-neutral-800 border-neutral-600 text-white mb-4"
                                />

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {post.hashtags.map((hashtag, i) => (
                                            <Badge key={i} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                {hashtag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <span className="text-xs text-neutral-500">
                                        {post.content.length} {t('contentStudio.social.characters')}
                                    </span>
                                </div>
                            </div>
                        </TabsContent>
                    )
                })}
            </Tabs>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onGoBack} className="border-neutral-600 text-neutral-300">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('contentStudio.social.back')}
                </Button>
                <Button onClick={onContinue} className="bg-orange-500 hover:bg-orange-600 text-white">
                    {t('contentStudio.social.continueToPublish')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
