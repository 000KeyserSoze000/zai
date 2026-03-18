"use client"

import { useState } from "react"
import {
    Check, ChevronLeft, Loader2, Zap, Send,
    Search, Palette, ImageIcon, Share2,
    Download, FileImage, BarChart3, Eye, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import type { VideoMetadata, ArtisticDirection, Thumbnail, SocialPost } from "@/lib/types"
import { SOCIAL_PLATFORMS } from "../constants"
import { SocialSimulator } from "./SocialSimulator"

interface PublishStepProps {
    metadata: VideoMetadata | null
    artisticDirections: ArtisticDirection[]
    thumbnails: Thumbnail[]
    socialPosts: SocialPost[]
    selectedPlatforms: string[]
    setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>
    isGenerating: boolean
    isPublished: boolean
    onPublish: () => void
    onGoBack: () => void
    onTogglePlatform: (platform: string) => void
    thumbnailTitle?: string
    thumbnailShortTitle?: string
}

export function PublishStep({
    metadata,
    artisticDirections,
    thumbnails,
    socialPosts,
    selectedPlatforms,
    setSelectedPlatforms,
    isGenerating,
    isPublished,
    onPublish,
    onGoBack,
    onTogglePlatform,
    thumbnailTitle,
    thumbnailShortTitle,
}: PublishStepProps) {
    const { t } = useTranslation()
    const [showSimulator, setShowSimulator] = useState(false)

    // Get selected thumbnail URL
    const selectedThumbnail = thumbnails.find(t => t.selected)
    const thumbnailPreviewUrl = selectedThumbnail?.imageUrl || ''

    return (
        <div className="space-y-6">
            {/* BEFORE PUBLISH */}
            {!isPublished && (
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{t('contentStudio.publish.title')}</h3>
                            <p className="text-sm text-neutral-400">{t('contentStudio.publish.subtitle')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {SOCIAL_PLATFORMS.map((platform) => {
                            const Icon = platform.icon
                            const isSelected = selectedPlatforms.includes(platform.id)
                            const post = socialPosts.find(p => p.platform === platform.id)

                            return (
                                <div
                                    key={platform.id}
                                    onClick={() => onTogglePlatform(platform.id)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500'
                                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: platform.color + '20' }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: platform.color }} />
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-medium text-white text-sm">{platform.name}</p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {post ? `${post.content.length} ${t('contentStudio.social.characters')}` : t('contentStudio.social.noPost')}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 mb-6">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setSelectedPlatforms(SOCIAL_PLATFORMS.map(p => p.id))}
                            className="border-neutral-600 text-neutral-300 hover:text-white"
                        >
                            {t('contentStudio.publish.selectAll')}
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setSelectedPlatforms([])}
                            className="border-neutral-600 text-neutral-300 hover:text-white"
                        >
                            {t('contentStudio.publish.deselectAll')}
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setShowSimulator(!showSimulator)}
                            className={`border-purple-500/50 ${showSimulator ? 'bg-purple-500/20 text-purple-400' : 'text-purple-400 hover:bg-purple-500/10'}`}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {showSimulator ? 'Masquer' : 'Prévisualiser'}
                        </Button>
                    </div>

                    {/* Social Simulator View */}
                    {showSimulator && (
                        <div className="mb-6">
                            <SocialSimulator
                                socialPosts={socialPosts}
                                selectedPlatforms={selectedPlatforms}
                                videoTitle={metadata?.titles[metadata.selectedTitle || 0]}
                                thumbnailUrl={thumbnailPreviewUrl}
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onGoBack} className="border-neutral-600 text-neutral-300">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {t('contentStudio.publish.back')}
                        </Button>
                        <Button
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={isGenerating || selectedPlatforms.length === 0}
                            onClick={onPublish}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('contentStudio.publish.publishing')}
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    {t('contentStudio.publish.publishButton')} {selectedPlatforms.length} {t('contentStudio.publish.platforms')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* AFTER PUBLISH */}
            {isPublished && (
                <>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-green-400">{t('contentStudio.publish.workflowComplete')}</p>
                                <p className="text-sm text-green-400/70 mt-1">
                                    {t('contentStudio.publish.workflowCompleteDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-orange-500" />
                            {t('contentStudio.publish.sessionSummary')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">{t('contentStudio.publish.videoContent')}</h4>
                                <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                                    {/* Selected Thumbnail */}
                                    {thumbnails.filter(t => t.selected).length > 0 && (
                                        <div className="pb-3 border-b border-neutral-700">
                                            <p className="text-xs text-neutral-500 mb-2">{t('contentStudio.publish.selectedThumbnail')}</p>
                                            <div className="flex items-start gap-4">
                                                <div className="w-40 h-24 rounded-lg overflow-hidden border border-neutral-600 flex-shrink-0 relative">
                                                    {thumbnails.find(t => t.selected)?.imageUrl ? (
                                                        <img
                                                            src={thumbnails.find(t => t.selected)?.imageUrl}
                                                            alt={t('contentStudio.publish.selectedThumbnail')}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 flex items-center justify-center">
                                                            <ImageIcon className="w-8 h-8 text-neutral-500" />
                                                        </div>
                                                    )}
                                                    {/* Text overlay preview */}
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                                        {thumbnails.find(t => t.selected)?.textOverlay.map((text, index) => (
                                                            <div
                                                                key={text.id}
                                                                className="text-center font-black uppercase tracking-wide"
                                                                style={{
                                                                    color: text.color,
                                                                    fontSize: index === 0 ? 'clamp(10px, 2vw, 14px)' : 'clamp(8px, 1.5vw, 10px)',
                                                                    textShadow: `1px 1px 0 ${text.strokeColor || '#000'}`,
                                                                }}
                                                            >
                                                                {text.content}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium">
                                                        {thumbnails.find(t => t.selected)?.theme || 'Miniature'}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        {t('contentStudio.thumbnails.resolution')} • {(thumbnails.find(t => t.selected)?.imageUrl ? t('contentStudio.publish.aiGenerated') : 'Gradients')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Thumbnail Titles */}
                                    {(thumbnailTitle || thumbnailShortTitle) && (
                                        <div className="pb-3 border-b border-neutral-700">
                                            <p className="text-xs text-neutral-500 mb-2">{t('contentStudio.publish.thumbnailTitles')}</p>
                                            <div className="space-y-1">
                                                {thumbnailTitle && (
                                                    <p className="text-white font-bold uppercase">{thumbnailTitle}</p>
                                                )}
                                                {thumbnailShortTitle && (
                                                    <p className="text-neutral-300 uppercase text-sm">{thumbnailShortTitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-neutral-500">{t('contentStudio.publish.selectedTitle')}</p>
                                        <p className="text-white font-medium">{metadata?.titles[metadata?.selectedTitle || 0]}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-neutral-500">{t('contentStudio.publish.tags')}</p>
                                            <p className="text-white">{metadata?.tags.length || 0} {t('contentStudio.publish.tags')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500">{t('contentStudio.publish.seoScore')}</p>
                                            <p className="text-green-400 font-mono">{metadata?.seoScore || 0}/100</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500">{t('contentStudio.publish.audience')}</p>
                                            <p className="text-white">{metadata?.targetAudience || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">{t('contentStudio.publish.generatedAssets')}</h4>
                                <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">{t('contentStudio.publish.artisticDirections')}</span>
                                        <span className="text-white font-mono">{artisticDirections.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">{t('contentStudio.publish.thumbnails')}</span>
                                        <span className="text-white font-mono">{thumbnails.length} ({thumbnails.filter(t => t.selected).length} {t('contentStudio.thumbnails.selected')})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">{t('contentStudio.publish.socialPosts')}</span>
                                        <span className="text-white font-mono">{socialPosts.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">{t('contentStudio.publish.publishedPlatforms')}</span>
                                        <span className="text-green-400 font-mono">{selectedPlatforms.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cost breakdown */}
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">{t('contentStudio.publish.costsByAgent')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { icon: Search, color: 'text-blue-400', name: t('contentStudio.costs.seoMetadata'), tokens: '~1,500', cost: '$0.002' },
                                    { icon: Palette, color: 'text-purple-400', name: t('contentStudio.costs.artisticDirection'), tokens: '~892', cost: '$0.002' },
                                    { icon: ImageIcon, color: 'text-pink-400', name: t('contentStudio.costs.thumbnailGeneration'), tokens: `${thumbnails.length} ${t('contentStudio.costs.images')}`, cost: `$${(thumbnails.length * 0.02).toFixed(3)}` },
                                    { icon: Share2, color: 'text-cyan-400', name: t('contentStudio.costs.socialPosts'), tokens: '~1,500', cost: '$0.003' },
                                    { icon: Send, color: 'text-green-400', name: t('contentStudio.costs.publication'), tokens: `${selectedPlatforms.length} ${t('contentStudio.publish.platforms')}`, cost: '$0.000' },
                                ].map(({ icon: Icon, color, name, tokens, cost }, i) => (
                                    <div key={i} className="bg-neutral-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className={`w-4 h-4 ${color}`} />
                                            <span className="text-white font-medium">{name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">{t('contentStudio.publish.tokens')}</span>
                                            <span className="text-white font-mono">{tokens}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">{t('contentStudio.publish.cost')}</span>
                                            <span className="text-orange-400 font-mono">{cost}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-orange-500" />
                                    <span className="text-lg font-medium text-white">{t('contentStudio.publish.totalSessionCost')}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-orange-400 font-mono">
                                        ${(0.002 + 0.002 + (thumbnails.length * 0.02) + 0.003).toFixed(3)}
                                    </p>
                                    <p className="text-xs text-neutral-500">{t('contentStudio.publish.totalTokens')}: ~4,000</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1 border-neutral-600 text-neutral-300 hover:text-white">
                                <Download className="w-4 h-4 mr-2" />
                                {t('contentStudio.publish.downloadAssets')}
                            </Button>
                            <Button variant="outline" className="flex-1 border-neutral-600 text-neutral-300 hover:text-white">
                                <FileImage className="w-4 h-4 mr-2" />
                                {t('contentStudio.publish.exportPdf')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
