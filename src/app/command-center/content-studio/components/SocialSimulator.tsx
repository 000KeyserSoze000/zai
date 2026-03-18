"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
    Linkedin, Youtube, Instagram, Facebook, Twitter,
    Play, Heart, MessageCircle, Share2, Bookmark, Send,
    Eye, Clock, MoreHorizontal, ExternalLink, Image as ImageIcon,
    Check, X, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { SocialPost } from "@/lib/types"

interface SocialSimulatorProps {
    socialPosts: SocialPost[]
    selectedPlatforms: string[]
    videoTitle?: string
    thumbnailUrl?: string
}

// Simulated engagement data for each platform
const simulateEngagement = (platform: string) => {
    const base = {
        linkedin: { likes: Math.floor(Math.random() * 150) + 50, comments: Math.floor(Math.random() * 20) + 5, shares: Math.floor(Math.random() * 30) + 10 },
        youtube_community: { likes: Math.floor(Math.random() * 500) + 100, comments: Math.floor(Math.random() * 50) + 10 },
        tiktok: { likes: Math.floor(Math.random() * 10000) + 1000, comments: Math.floor(Math.random() * 500) + 50, shares: Math.floor(Math.random() * 200) + 30 },
        x: { likes: Math.floor(Math.random() * 300) + 50, retweets: Math.floor(Math.random() * 100) + 20, replies: Math.floor(Math.random() * 30) + 5 },
        instagram: { likes: Math.floor(Math.random() * 2000) + 500, comments: Math.floor(Math.random() * 100) + 20, saves: Math.floor(Math.random() * 50) + 10 },
        facebook: { likes: Math.floor(Math.random() * 200) + 50, comments: Math.floor(Math.random() * 30) + 5, shares: Math.floor(Math.random() * 20) + 5 },
        threads: { likes: Math.floor(Math.random() * 500) + 100, replies: Math.floor(Math.random() * 30) + 5, reposts: Math.floor(Math.random() * 20) + 3 },
        school: { likes: Math.floor(Math.random() * 100) + 20, comments: Math.floor(Math.random() * 15) + 3 },
    }
    return base[platform as keyof typeof base] || base.linkedin
}

// Format number for display
const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

// Thumbnail display component with platform-specific cropping
function ThumbnailImage({ 
    src, 
    alt, 
    aspectRatio,
    className = "" 
}: { 
    src?: string
    alt: string
    aspectRatio: "landscape" | "square" | "portrait"
    className?: string 
}) {
    if (!src) {
        return (
            <div className={`bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${className}`}>
                <div className="text-center text-white p-4">
                    <Play className="w-16 h-16 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-lg">Miniature</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img 
                src={src} 
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Video play overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                </div>
            </div>
        </div>
    )
}

// LinkedIn Preview
function LinkedInPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    VO
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900">Votre Entreprise</p>
                    <p className="text-xs text-gray-500">Suivi par 2,5k abonnés • 2h</p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
            </div>
            
            {/* Hashtags */}
            <div className="px-4 pb-3 flex flex-wrap gap-1">
                {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-600 text-xs hover:underline cursor-pointer">{tag}</span>
                ))}
            </div>
            
            {/* Thumbnail - LinkedIn landscape format */}
            <ThumbnailImage 
                src={thumbnailUrl}
                alt={videoTitle || "Video thumbnail"}
                aspectRatio="landscape"
                className="aspect-video w-full"
            />
            
            {/* Engagement */}
            <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    </div>
                    <span>{formatNumber(engagement.likes)}</span>
                </div>
                <div className="flex gap-3">
                    <span>{formatNumber(engagement.comments)} commentaires</span>
                    <span>{formatNumber((engagement as any).shares || 0)} partages</span>
                </div>
            </div>
            
            {/* Actions */}
            <div className="px-4 py-2 flex justify-around">
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition">
                    <Heart className="w-5 h-5" /> J'aime
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition">
                    <MessageCircle className="w-5 h-5" /> Commenter
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition">
                    <Share2 className="w-5 h-5" /> Partager
                </button>
            </div>
        </div>
    )
}

// Instagram Preview
function InstagramPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="p-3 flex items-center gap-3 border-b">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-xs font-bold">VO</span>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm">votre.entreprise</p>
                    <p className="text-xs text-gray-500">Sponsorisé</p>
                </div>
                <MoreHorizontal className="w-5 h-5" />
            </div>
            
            {/* Thumbnail - Instagram square format */}
            <ThumbnailImage 
                src={thumbnailUrl}
                alt={videoTitle || "Instagram post"}
                aspectRatio="square"
                className="aspect-square w-full"
            />
            
            {/* Actions */}
            <div className="p-3">
                <div className="flex justify-between mb-2">
                    <div className="flex gap-4">
                        <Heart className="w-6 h-6 cursor-pointer hover:text-red-500" />
                        <MessageCircle className="w-6 h-6 cursor-pointer" />
                        <Send className="w-6 h-6 cursor-pointer" />
                    </div>
                    <Bookmark className="w-6 h-6 cursor-pointer" />
                </div>
                
                <p className="font-semibold text-sm">{formatNumber(engagement.likes)} J'aime</p>
                
                <p className="text-sm mt-1">
                    <span className="font-semibold">votre.entreprise</span>{' '}
                    <span className="whitespace-pre-line">{post.content.slice(0, 150)}...</span>
                </p>
                
                <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-blue-600 text-xs">{tag}</span>
                    ))}
                </div>
                
                <p className="text-xs text-gray-400 mt-2">Voir les {formatNumber(engagement.comments)} commentaires</p>
            </div>
        </div>
    )
}

// TikTok Preview
function TikTokPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-black rounded-xl overflow-hidden max-w-sm mx-auto aspect-[9/16] relative">
            {/* Thumbnail Background - TikTok portrait format */}
            {thumbnailUrl ? (
                <img 
                    src={thumbnailUrl} 
                    alt={videoTitle || "TikTok video"}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-20 h-20 text-white opacity-30" />
                    </div>
                </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm mb-2">@votre.entreprise</p>
                <p className="text-white text-sm leading-relaxed mb-3">{post.content.slice(0, 100)}...</p>
                <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="text-white/80 text-xs">{tag}</span>
                    ))}
                </div>
            </div>
            
            {/* Right sidebar */}
            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                        <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    <span className="text-white text-xs">{formatNumber(engagement.likes)}</span>
                </div>
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                        <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs">{formatNumber(engagement.comments)}</span>
                </div>
                <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                        <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs">{formatNumber((engagement as any).shares || 0)}</span>
                </div>
            </div>
            
            {/* Profile */}
            <div className="absolute right-3 bottom-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold">
                        VO
                    </div>
                </div>
            </div>
        </div>
    )
}

// X (Twitter) Preview
function XPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-black rounded-xl p-4 max-w-md mx-auto border border-gray-800">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    VO
                </div>
                <div className="flex-1">
                    <p className="font-bold text-white">Votre Entreprise</p>
                    <p className="text-xs text-gray-500">@votre_entreprise</p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </div>
            
            {/* Content */}
            <p className="text-white text-base mb-3 whitespace-pre-line">{post.content}</p>
            
            {/* Thumbnail - X landscape format */}
            {thumbnailUrl && (
                <div className="rounded-xl overflow-hidden mb-3 border border-gray-800">
                    <img 
                        src={thumbnailUrl} 
                        alt={videoTitle || "X post image"}
                        className="w-full aspect-video object-cover"
                    />
                </div>
            )}
            
            {/* Hashtags */}
            <div className="flex flex-wrap gap-1 mb-3">
                {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-400 text-sm">{tag}</span>
                ))}
            </div>
            
            {/* Time */}
            <p className="text-gray-500 text-xs mb-3">10:30 · 18 mars 2025</p>
            
            {/* Stats */}
            <div className="border-t border-b border-gray-800 py-2 mb-3 flex gap-6 text-sm">
                <span><span className="font-bold text-white">{formatNumber((engagement as any).retweets || 0)}</span> <span className="text-gray-500">Retweets</span></span>
                <span><span className="font-bold text-white">{formatNumber((engagement as any).replies || 0)}</span> <span className="text-gray-500">Réponses</span></span>
            </div>
            
            {/* Actions */}
            <div className="flex justify-around text-gray-500">
                <MessageCircle className="w-5 h-5 cursor-pointer hover:text-blue-400" />
                <div className="flex items-center gap-1 cursor-pointer hover:text-green-400">
                    <Share2 className="w-5 h-5 rotate-180" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-pink-500">
                    <Heart className="w-5 h-5" />
                    <span className="text-xs">{formatNumber(engagement.likes)}</span>
                </div>
                <Share2 className="w-5 h-5 cursor-pointer hover:text-blue-400" />
            </div>
        </div>
    )
}

// YouTube Community Preview
function YouTubePreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                    VO
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900">Votre Chaîne</p>
                    <p className="text-xs text-gray-500">il y a 2 heures</p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Content */}
            <div className="px-3 pb-3">
                <p className="text-gray-800 text-sm">{post.content}</p>
            </div>
            
            {/* Video thumbnail - YouTube 16:9 format */}
            <ThumbnailImage 
                src={thumbnailUrl}
                alt={videoTitle || "YouTube video"}
                aspectRatio="landscape"
                className="aspect-video w-full border-y"
            />
            
            {/* Video title overlay */}
            <div className="px-3 py-2 bg-gray-50 border-b">
                <p className="text-sm font-medium text-gray-900">{videoTitle || "Nouvelle Vidéo"}</p>
                <p className="text-xs text-gray-500">Votre Chaîne • 12:34</p>
            </div>
            
            {/* Engagement */}
            <div className="px-3 py-2 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-full">
                        <Heart className="w-4 h-4" /> {formatNumber(engagement.likes)}
                    </button>
                    <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-full">
                        <Eye className="w-4 h-4" /> Je n'aime pas
                    </button>
                </div>
                <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-full">
                    <MessageCircle className="w-4 h-4" /> {formatNumber(engagement.comments)}
                </button>
            </div>
        </div>
    )
}

// Facebook Preview
function FacebookPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    VO
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900">Votre Page</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>il y a 3h</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                            Public
                        </span>
                    </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Content */}
            <div className="px-3 pb-2">
                <p className="text-gray-800 text-sm whitespace-pre-line">{post.content}</p>
            </div>
            
            {/* Thumbnail - Facebook landscape format */}
            <ThumbnailImage 
                src={thumbnailUrl}
                alt={videoTitle || "Facebook post"}
                aspectRatio="landscape"
                className="aspect-video w-full"
            />
            
            {/* Engagement bar */}
            <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 border-b">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px]">👍</div>
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">❤️</div>
                    </div>
                    <span>{formatNumber(engagement.likes)}</span>
                </div>
                <div className="flex gap-3">
                    <span>{formatNumber(engagement.comments)} commentaires</span>
                    <span>{formatNumber((engagement as any).shares || 0)} partages</span>
                </div>
            </div>
            
            {/* Actions */}
            <div className="px-3 py-1 flex justify-around">
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg flex-1 justify-center">
                    <Heart className="w-5 h-5" /> J'aime
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg flex-1 justify-center">
                    <MessageCircle className="w-5 h-5" /> Commenter
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg flex-1 justify-center">
                    <Share2 className="w-5 h-5" /> Partager
                </button>
            </div>
        </div>
    )
}

// Threads Preview
function ThreadsPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-black rounded-xl p-4 max-w-md mx-auto border border-gray-800">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
                        VO
                    </div>
                </div>
                <div className="flex-1">
                    <p className="font-bold text-white text-sm">votre.entreprise</p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </div>
            
            {/* Content */}
            <p className="text-white text-sm mb-3 whitespace-pre-line">{post.content}</p>
            
            {/* Thumbnail - Threads supports images */}
            {thumbnailUrl && (
                <div className="rounded-xl overflow-hidden mb-3 border border-gray-800">
                    <img 
                        src={thumbnailUrl} 
                        alt={videoTitle || "Threads post"}
                        className="w-full aspect-[4/5] object-cover"
                    />
                </div>
            )}
            
            {/* Hashtags */}
            <div className="flex flex-wrap gap-1 mb-3">
                {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-400 text-xs">{tag}</span>
                ))}
            </div>
            
            {/* Engagement */}
            <div className="flex items-center justify-between text-gray-500 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:text-pink-500">
                        <Heart className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-400">
                        <MessageCircle className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-gray-300">
                        <Share2 className="w-5 h-5 rotate-180" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-gray-300">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span>{formatNumber(engagement.likes)} j'aime</span>
                </div>
            </div>
        </div>
    )
}

// School/Community Preview
function SchoolPreview({ post, engagement, thumbnailUrl, videoTitle }: { 
    post: SocialPost, 
    engagement: ReturnType<typeof simulateEngagement>,
    thumbnailUrl?: string,
    videoTitle?: string
}) {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 max-w-md mx-auto border border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    VO
                </div>
                <div className="flex-1">
                    <p className="font-bold text-white">{videoTitle || "Votre Formation"}</p>
                    <p className="text-xs text-gray-400">Par Votre Entreprise</p>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Nouveau</Badge>
            </div>
            
            {/* Thumbnail - School landscape format */}
            <ThumbnailImage 
                src={thumbnailUrl}
                alt={videoTitle || "Course thumbnail"}
                aspectRatio="landscape"
                className="aspect-video w-full rounded-lg mb-4"
            />
            
            {/* Content */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <p className="text-white text-sm leading-relaxed">{post.content}</p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-400" /> {formatNumber(engagement.likes)}
                </span>
                <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" /> {formatNumber(engagement.comments)}
                </span>
                <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {Math.floor(Math.random() * 500) + 100}
                </span>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {post.hashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                        {tag}
                    </Badge>
                ))}
            </div>
            
            {/* CTA */}
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir la formation
            </Button>
        </div>
    )
}

// Main Simulator Component
export function SocialSimulator({ socialPosts, selectedPlatforms, videoTitle, thumbnailUrl }: SocialSimulatorProps) {
    const [isSimulated, setIsSimulated] = useState(true)
    const [selectedPost, setSelectedPost] = useState<string>(selectedPlatforms[0] || 'linkedin')
    const [engagementData] = useState(() => {
        const data: Record<string, ReturnType<typeof simulateEngagement>> = {}
        selectedPlatforms.forEach(platform => {
            data[platform] = simulateEngagement(platform)
        })
        return data
    })

    const getPreview = (platform: string, post: SocialPost) => {
        const engagement = engagementData[platform] || simulateEngagement(platform)
        
        switch (platform) {
            case 'linkedin':
                return <LinkedInPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'instagram':
                return <InstagramPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'tiktok':
                return <TikTokPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'x':
                return <XPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'youtube_community':
                return <YouTubePreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'facebook':
                return <FacebookPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'threads':
                return <ThreadsPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            case 'school':
                return <SchoolPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
            default:
                return <LinkedInPreview post={post} engagement={engagement} thumbnailUrl={thumbnailUrl} videoTitle={videoTitle} />
        }
    }

    const platformNames: Record<string, string> = {
        linkedin: 'LinkedIn',
        youtube_community: 'YouTube',
        tiktok: 'TikTok',
        x: 'X (Twitter)',
        instagram: 'Instagram',
        facebook: 'Facebook',
        threads: 'Threads',
        school: 'School',
    }

    const filteredPosts = socialPosts.filter(p => selectedPlatforms.includes(p.platform))

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-white font-medium">Mode Prévisualisation</p>
                            <p className="text-xs text-neutral-400">
                                Voyez exactement comment vos posts apparaîtront sur chaque plateforme
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="simulation-mode" className="text-sm text-neutral-400">
                            {isSimulated ? 'Simulé' : 'Réel'}
                        </Label>
                        <Switch
                            id="simulation-mode"
                            checked={isSimulated}
                            onCheckedChange={setIsSimulated}
                        />
                    </div>
                </div>
            </div>

            {/* Thumbnail Preview Info */}
            {thumbnailUrl && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-sm text-orange-400">
                        🖼️ <span className="font-medium">Miniature intégrée</span> - La miniature est automatiquement adaptée au format de chaque plateforme sociale.
                    </p>
                </div>
            )}

            {/* Platform Tabs */}
            <Tabs value={selectedPost} onValueChange={setSelectedPost} className="w-full">
                <TabsList className="bg-neutral-800 border border-neutral-700 flex-wrap h-auto gap-1 p-1 w-full justify-start overflow-x-auto">
                    {filteredPosts.map((post) => (
                        <TabsTrigger
                            key={post.id}
                            value={post.platform}
                            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center gap-2"
                        >
                            {platformNames[post.platform] || post.platform}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {filteredPosts.map((post) => (
                    <TabsContent key={post.id} value={post.platform} className="mt-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Preview */}
                            <div className="flex-1 flex justify-center">
                                {getPreview(post.platform, post)}
                            </div>
                            
                            {/* Stats Panel */}
                            <div className="lg:w-80 space-y-4">
                                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
                                        Engagement Simulé
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-300 flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-red-400" /> Likes
                                            </span>
                                            <span className="text-white font-mono font-bold">
                                                {formatNumber(engagementData[post.platform]?.likes || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-300 flex items-center gap-2">
                                                <MessageCircle className="w-4 h-4 text-blue-400" /> Commentaires
                                            </span>
                                            <span className="text-white font-mono font-bold">
                                                {formatNumber(engagementData[post.platform]?.comments || 0)}
                                            </span>
                                        </div>
                                        {(engagementData[post.platform] as any)?.shares && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-300 flex items-center gap-2">
                                                    <Share2 className="w-4 h-4 text-green-400" /> Partages
                                                </span>
                                                <span className="text-white font-mono font-bold">
                                                    {formatNumber((engagementData[post.platform] as any).shares)}
                                                </span>
                                            </div>
                                        )}
                                        {(engagementData[post.platform] as any)?.retweets && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-300 flex items-center gap-2">
                                                    <Share2 className="w-4 h-4 text-green-400" /> Retweets
                                                </span>
                                                <span className="text-white font-mono font-bold">
                                                    {formatNumber((engagementData[post.platform] as any).retweets)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
                                        Format de Miniature
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {post.platform === 'instagram' && (
                                            <p className="text-neutral-300">📷 Format carré (1:1) - 1080x1080px</p>
                                        )}
                                        {post.platform === 'tiktok' && (
                                            <p className="text-neutral-300">📱 Format portrait (9:16) - 1080x1920px</p>
                                        )}
                                        {(post.platform === 'linkedin' || post.platform === 'facebook' || post.platform === 'x' || post.platform === 'youtube_community') && (
                                            <p className="text-neutral-300">🖥️ Format paysage (16:9) - 1280x720px</p>
                                        )}
                                        {post.platform === 'threads' && (
                                            <p className="text-neutral-300">🖼️ Format portrait (4:5) - 1080x1350px</p>
                                        )}
                                        {post.platform === 'school' && (
                                            <p className="text-neutral-300">🎓 Format paysage (16:9) - 1280x720px</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
                                        Performance Estimée
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-sm text-neutral-300">Portée estimée: {formatNumber((engagementData[post.platform]?.likes || 0) * 15)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm text-neutral-300">Taux d'engagement: {((engagementData[post.platform]?.likes || 0) / 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-sm text-neutral-300">Meilleur moment: 18h-20h</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                    <p className="text-sm text-orange-400">
                                        💡 <span className="font-medium">Astuce:</span> Les engagements affichés sont des estimations basées sur les performances moyennes de votre secteur.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
