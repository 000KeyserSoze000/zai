"use client"

/**
 * useContentGeneration Hook
 * Extracts all AI generation logic from the Content Studio page.
 * Handles metadata, artistic directions, thumbnails, social posts,
 * video analysis, fallback data, and API logging.
 */

import { useState, useCallback } from "react"
import { useSessionStore, useWorkflowStore, useLogsStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type {
    VideoMetadata,
    ArtisticDirection,
    Thumbnail,
    SocialPost,
} from "@/lib/types"
import { THUMBNAIL_THEMES } from "../constants"


// ============================================
// Parallel Task State
// ============================================

export interface ParallelTaskState {
    artistic: { status: string; progress: number }
    social: { status: string; progress: number }
}

export interface SkillMapping {
    metadata: string
    artistic: string
    social: string
}

export interface ContentGenerationState {
    // Data
    metadata: VideoMetadata | null
    artisticDirections: ArtisticDirection[]
    thumbnails: Thumbnail[]
    socialPosts: SocialPost[]
    // State
    isGenerating: boolean
    isGeneratingThumbnails: boolean
    generationProgress: number
    parallelTasks: ParallelTaskState
    isAnalyzingVideo: boolean
    skillMapping: SkillMapping
    contentBlueprint: any
    // Setters
    setMetadata: React.Dispatch<React.SetStateAction<VideoMetadata | null>>
    setArtisticDirections: React.Dispatch<React.SetStateAction<ArtisticDirection[]>>
    setThumbnails: React.Dispatch<React.SetStateAction<Thumbnail[]>>
    setSocialPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>
    setSkillMapping: React.Dispatch<React.SetStateAction<SkillMapping>>
    // Actions
    generateMetadata: (context: string) => Promise<void>
    executeParallelTasks: (context: string) => Promise<void>
    generateThumbnails: (options?: {
        referencePhoto?: string | null
        customTitle?: string
        customShortTitle?: string
    }) => Promise<void>
    generateSocialPosts: (context: string) => Promise<void>
    analyzeVideoReference: (videoUrl: string, context: string) => Promise<void>
}

// ============================================
// Main Hook
// ============================================

export function useContentGeneration(): ContentGenerationState {
    const { currentSession } = useSessionStore()
    const { setStep } = useWorkflowStore()
    const { addLog } = useLogsStore()
    const { toast } = useToast()

    // Data state
    const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
    const [artisticDirections, setArtisticDirections] = useState<ArtisticDirection[]>([])
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
    const [contentBlueprint, setContentBlueprint] = useState<any | null>(null)
    
    // Generation state
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false)
    
    // Parallel tasks state
    const [parallelTasks, setParallelTasks] = useState<ParallelTaskState>({
        artistic: { status: "idle", progress: 0 },
        social: { status: "idle", progress: 0 },
    })
    
    // Skill mapping (which agent/skill to use for each generation type)
    const [skillMapping, setSkillMapping] = useState<SkillMapping>({
        metadata: "youtube-extraction",
        artistic: "artistic-directions",
        social: "social-posts",
    })
    
    const sessionId = currentSession?.id || ""

    // -----------------------------------------------
    // Helper: progress animation
    // -----------------------------------------------
    const startProgress = useCallback((speed = 5, interval = 200) => {
        const id = setInterval(() => {
            setGenerationProgress((prev) => Math.min(prev + speed, 85))
        }, interval)
        return id
    }, [])

    // -----------------------------------------------
    // Parse JSON from AI response
    // -----------------------------------------------
    function parseAIJson(text: string): unknown {
        const jsonMatch =
            text.match(/```json\s*([\s\S]*?)\s*```/) ||
            text.match(/```\s*([\s\S]*?)\s*```/)
        const jsonStr = jsonMatch ? jsonMatch[1] : text
        return JSON.parse(jsonStr)
    }

    // -----------------------------------------------
    // 1. Generate Metadata
    // -----------------------------------------------
    const generateMetadata = useCallback(
        async (context: string) => {
            setIsGenerating(true)
            setGenerationProgress(0)
            const startTime = Date.now()
            const interval = startProgress(5, 200)

            try {
                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        type: "skill_execution", 
                        skillSlug: skillMapping.metadata,
                        context 
                    }),
                })

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
                const result = await response.json()
                
                // --- STRATEGIC ANALYSIS PHASE (Internal) ---
                if (!contentBlueprint) {
                    try {
                        console.log("[Content Studio] Starting Analyst Phase...")
                        const analystRes = await fetch("/api/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "skill_execution",
                                skillSlug: "content-analyst",
                                context
                            }),
                        })
                        if (analystRes.ok) {
                            const analystResult = await analystRes.json()
                            const blueprintRaw = analystResult.data
                            let blueprintData = blueprintRaw
                            if (typeof blueprintRaw === 'string') {
                                try { blueprintData = parseAIJson(blueprintRaw) } catch (e) {}
                            }
                            console.log("[Content Studio] Content Blueprint Created:", blueprintData)
                            setContentBlueprint(blueprintData?.blueprint || blueprintData)
                        }
                    } catch (e) {
                        console.error("Analyst phase failed:", e)
                    }
                }
                // ------------------------------------------

                clearInterval(interval)
                setGenerationProgress(100)

                const apiRawData = result.data
                let apiData: any = apiRawData
                
                console.log("[Content Studio] Raw API result:", JSON.stringify(result).slice(0, 500))
                console.log("[Content Studio] apiRawData type:", typeof apiRawData)
                console.log("[Content Studio] apiRawData value:", JSON.stringify(apiRawData).slice(0, 500))
                
                if (typeof apiRawData === 'string') {
                    console.log("[Content Studio] Data is string, attempting to parse...")
                    try {
                        apiData = parseAIJson(apiRawData)
                        console.log("[Content Studio] Parsed data:", JSON.stringify(apiData).slice(0, 500))
                    } catch (e) {
                        console.error("Failed to parse Skill Metadata JSON:", e)
                    }
                } else {
                    console.log("[Content Studio] Data is already an object, using directly")
                    apiData = apiRawData
                }

                console.log("[Content Studio] Final apiData:", JSON.stringify(apiData).slice(0, 500))
                console.log("[Content Studio] Titles from apiData:", apiData?.titles)
                console.log("[Content Studio] Description from apiData:", apiData?.description?.slice(0, 100))
                
                // Use AI data or fallback - explicitly check for valid data
                const aiTitles = Array.isArray(apiData?.titles) && apiData.titles.length > 0 
                    ? apiData.titles 
                    : null
                const aiDescription = typeof apiData?.description === 'string' && apiData.description.length > 10
                    ? apiData.description
                    : null
                
                console.log("[Content Studio] Using AI titles:", !!aiTitles, aiTitles?.length)
                console.log("[Content Studio] Using AI description:", !!aiDescription, aiDescription?.length)

                if (!aiTitles || !aiDescription) {
                    throw new Error("L'IA n'a pas généré de métadonnées valides.")
                }

                const generated: VideoMetadata = {
                    id: "meta-" + Date.now(),
                    sessionId,
                    titles: aiTitles,
                    selectedTitle: 0,
                    description: aiDescription,
                    tags: apiData?.tags || [],
                    hashtags: apiData?.hashtags || [],
                    seoScore: apiData?.seoScore || 0,
                    targetAudience: apiData?.targetAudience || "",
                    keyMoments: apiData?.keyMoments || [],
                }

                setMetadata(generated)
                console.log("[Content Studio] Set metadata with titles:", generated.titles)
                console.log("[Content Studio] Set metadata with description length:", generated.description.length)
                addLog({
                    sessionId,
                    operation: "Metadata Generation",
                    model: "z-ai/default",
                    status: "success",
                    requestTime: Date.now() - startTime,
                    tokensUsed: result.usage?.totalTokens || 1500,
                    cost: 0.002,
                })
            } catch (error) {
                toast({
                    title: "Erreur de génération SEO",
                    description: error instanceof Error ? error.message : "Impossible de générer les métadonnées",
                    variant: "destructive",
                })
            }

            setIsGenerating(false)
        },
        [sessionId, addLog, startProgress]
    )

    // -----------------------------------------------
    // 2. Parallel: Artistic + Social
    // -----------------------------------------------
    const executeParallelTasks = useCallback(
        async (context: string) => {
            const parallelStartTime = Date.now()
            setParallelTasks({
                artistic: { status: "running", progress: 0 },
                social: { status: "running", progress: 0 },
            })
            setIsGenerating(true)

            const artisticInterval = setInterval(() => {
                setParallelTasks((prev) => ({
                    ...prev,
                    artistic: { ...prev.artistic, progress: Math.min(prev.artistic.progress + 8, 85) },
                }))
            }, 200)

            const socialInterval = setInterval(() => {
                setParallelTasks((prev) => ({
                    ...prev,
                    social: { ...prev.social, progress: Math.min(prev.social.progress + 10, 85) },
                }))
            }, 200)

            try {
                const [artisticResult, socialResult] = await Promise.all([
                    fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "skill_execution",
                            skillSlug: skillMapping.artistic,
                            context: JSON.stringify({
                                rawContext: context,
                                blueprint: contentBlueprint
                            }),
                            metadata: {
                                title: metadata?.titles[metadata.selectedTitle || 0],
                                tags: metadata?.tags,
                            },
                        }),
                    }).then((res) => {
                        if (!res.ok) throw new Error(`Artistic API Error: ${res.statusText}`)
                        return res.json()
                    }),
                    fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "skill_execution",
                            skillSlug: skillMapping.social,
                            context: JSON.stringify({
                                rawContext: context,
                                blueprint: contentBlueprint
                            }),
                            metadata: {
                                title: metadata?.titles[metadata.selectedTitle || 0],
                                tags: metadata?.tags,
                                description: metadata?.description,
                            },
                        }),
                    }).then((res) => {
                        if (!res.ok) throw new Error(`Social API Error: ${res.statusText}`)
                        return res.json()
                    }),
                ])

                clearInterval(artisticInterval)
                clearInterval(socialInterval)
                setParallelTasks({
                    artistic: { status: "completed", progress: 100 },
                    social: { status: "completed", progress: 100 },
                })

                // Process artistic directions
                const artisticRawData = artisticResult.data
                let artisticData: any = artisticRawData
                if (typeof artisticRawData === 'string') {
                    try { artisticData = parseAIJson(artisticRawData) } catch (e) {}
                }
                const apiDirections = artisticData?.directions || artisticData || []

                if (!Array.isArray(apiDirections) || apiDirections.length === 0) {
                    throw new Error("Aucune direction artistique générée par l'IA.")
                }

                const directions: ArtisticDirection[] = apiDirections.map((dir: any, i: number) => ({
                    id: "dir-" + i,
                    sessionId,
                    name: dir.name || `Direction ${i + 1}`,
                    style: dir.style || "modern",
                    colorPalette: dir.colorPalette || { primary: "#FF6B00", secondary: "#1A1A2E", accent: "#00D9FF", background: "#0F0F1A", text: "#FFFFFF" },
                    typography: dir.typography || { headingFont: "Inter", bodyFont: "Inter", headingWeight: "800", emphasis: "uppercase" },
                    moodKeywords: dir.moodKeywords || [],
                    selected: i === 0,
                }))

                setArtisticDirections(directions)

                // Process social posts
                const socialRawData = socialResult.data
                let socialData: any = socialRawData
                if (typeof socialRawData === 'string') {
                    try { socialData = parseAIJson(socialRawData) } catch (e) { console.error("Failed to parse social JSON:", e) }
                }
                
                const apiPosts = socialData?.posts || socialData || []
                const platformOrder = ["linkedin", "youtube_community", "tiktok", "x", "instagram", "facebook", "threads", "school"]

                if (!Array.isArray(apiPosts) || apiPosts.length === 0) {
                    throw new Error("Aucun post social généré par l'IA.")
                }

                const posts: SocialPost[] = platformOrder.map((platform, i) => {
                    const apiPost = Array.isArray(apiPosts)
                        ? apiPosts.find((p: any) => p.platform === platform) || apiPosts[i] || {}
                        : {}
                    return {
                        id: `post-${i + 1}`,
                        sessionId,
                        platform: platform as SocialPost["platform"],
                        content: apiPost.content || "",
                        hashtags: apiPost.hashtags || metadata?.hashtags || [],
                        status: "draft" as const,
                    }
                })

                setSocialPosts(posts)

                const totalTime = Date.now() - parallelStartTime
                addLog({
                    sessionId,
                    operation: "Parallel: Artistic + Social",
                    model: "z-ai/default",
                    status: "success",
                    requestTime: totalTime,
                    tokensUsed: (artisticResult.usage?.totalTokens || 0) + (socialResult.usage?.totalTokens || 0),
                    cost: 0.004,
                })

                toast({
                    title: "Génération terminée !",
                    description: `Artistic + Social générés en ${(totalTime / 1000).toFixed(1)}s`,
                })

                setStep(2)
                setTimeout(() => {
                    setParallelTasks({
                        artistic: { status: "idle", progress: 0 },
                        social: { status: "idle", progress: 0 },
                    })
                }, 2000)
            } catch (error) {
                clearInterval(artisticInterval)
                clearInterval(socialInterval)
                console.error("Parallel execution error:", error)
                setParallelTasks({
                    artistic: { status: "error", progress: 0 },
                    social: { status: "error", progress: 0 },
                })
                toast({
                    title: "Erreur de génération",
                    description: error instanceof Error ? error.message : "Veuillez réessayer",
                    variant: "destructive",
                })
            }

            setIsGenerating(false)
        },
        [sessionId, metadata, addLog, toast, setStep, skillMapping, contentBlueprint]
    )

    // -----------------------------------------------
    // 3. Generate Artistic Directions (standalone)
    // -----------------------------------------------
    const generateArtisticDirections = useCallback(
        async (context: string) => {
            setIsGenerating(true)
            setGenerationProgress(0)
            const startTime = Date.now()
            const interval = startProgress(8, 200)

            try {
                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "skill_execution",
                        skillSlug: skillMapping.artistic,
                        context: JSON.stringify({
                            rawContext: context,
                            blueprint: contentBlueprint
                        }),
                        metadata: {
                            title: metadata?.titles[metadata.selectedTitle || 0],
                            tags: metadata?.tags,
                        },
                    }),
                })

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
                const result = await response.json()
                clearInterval(interval)
                setGenerationProgress(100)

                const artisticRawData = result.data
                let artisticData: any = artisticRawData
                const apiDirections = artisticData?.directions || artisticData || []
                
                const directions: ArtisticDirection[] = apiDirections.map((dir: any, i: number) => ({
                    id: "dir-" + i,
                    sessionId,
                    name: dir.name || `Direction ${i + 1}`,
                    style: dir.style || "modern",
                    colorPalette: dir.colorPalette || { primary: "#FF6B00", secondary: "#1A1A2E", accent: "#00D9FF", background: "#0F0F1A", text: "#FFFFFF" },
                    typography: dir.typography || { headingFont: "Inter", bodyFont: "Inter", headingWeight: "800", emphasis: "uppercase" },
                    moodKeywords: dir.moodKeywords || [],
                    selected: i === 0,
                }))

                if (directions.length === 0) {
                    throw new Error("Aucune direction artistique générée.")
                }

                setArtisticDirections(directions)
                addLog({
                    sessionId,
                    operation: "Artistic Directions",
                    model: "z-ai/default",
                    status: "success",
                    requestTime: Date.now() - startTime,
                    tokensUsed: result.usage?.totalTokens || 892,
                    cost: 0.002,
                })
            } catch (error) {
                toast({
                    title: "Erreur Direction Artistique",
                    description: error instanceof Error ? error.message : "Impossible de générer les directions",
                    variant: "destructive",
                })
            }

            setIsGenerating(false)
            setStep(2)
        },
        [sessionId, metadata, addLog, startProgress, setStep]
    )

    // -----------------------------------------------
    // 4. Generate Thumbnails
    // -----------------------------------------------
    const generateThumbnails = useCallback(async (options?: {
        referencePhoto?: string | null
        customTitle?: string
        customShortTitle?: string
    }) => {
        setIsGeneratingThumbnails(true)
        setGenerationProgress(0)
        const startTime = Date.now()

        const selectedDirection = artisticDirections.find((d) => d.selected)
        if (!selectedDirection) return

        const colors = selectedDirection.colorPalette
        const title = metadata?.titles[metadata.selectedTitle || 0] || "Video"

        // Use custom text if provided, otherwise generate from title
        const line1 = options?.customTitle?.trim()?.toUpperCase() || 
            (() => {
                const words = title.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "").split(" ").filter((w) => w.length > 2)
                return words.slice(0, 2).join(" ").toUpperCase() || "DECOUVREZ"
            })()
        const line2 = options?.customShortTitle?.trim()?.toUpperCase() || 
            (() => {
                const words = title.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "").split(" ").filter((w) => w.length > 2)
                return words.length > 2 ? words.slice(2, 4).join(" ").toUpperCase() : "MAINTENANT"
            })()

        const interval = startProgress(3, 500)
        const generatedThumbnails: Thumbnail[] = []

        try {
            for (let i = 0; i < THUMBNAIL_THEMES.length; i++) {
                const theme = THUMBNAIL_THEMES[i]
                const response = await fetch("/api/generate-thumbnail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: theme.getPrompt(colors),
                        size: "1344x768",
                    }),
                })

                if (response.ok) {
                    const result = await response.json()
                    generatedThumbnails.push({
                        id: `thumb-${i + 1}`,
                        sessionId,
                        directionId: selectedDirection.id,
                        imageUrl: result.images[0]?.url || "",
                        textOverlay: [
                            {
                                id: `t${i}-1`, content: line1,
                                position: { x: 20, y: 35 }, fontSize: 64,
                                fontFamily: selectedDirection.typography.headingFont,
                                color: colors.primary, strokeColor: colors.background,
                                strokeWidth: 3, rotation: 0,
                            },
                            {
                                id: `t${i}-2`, content: line2,
                                position: { x: 20, y: 55 }, fontSize: 42,
                                fontFamily: selectedDirection.typography.bodyFont,
                                color: colors.text, strokeColor: colors.background,
                                strokeWidth: 2, rotation: 0,
                            },
                        ],
                        resolution: "1280x720",
                        compressed: false,
                        selected: i === 0,
                        status: "ready",
                        theme: theme.name,
                        referencePhoto: options?.referencePhoto || undefined,
                    })
                }
                setGenerationProgress(30 + (i + 1) * 20)
            }

            clearInterval(interval)
            setGenerationProgress(100)
            setThumbnails(generatedThumbnails)

            addLog({
                sessionId,
                operation: "Thumbnail Generation",
                model: "z-ai/image",
                status: "success",
                requestTime: Date.now() - startTime,
                cost: generatedThumbnails.length * 0.02,
            })
        } catch (error) {
            clearInterval(interval)
            console.error("Thumbnail generation error:", error)
            toast({
                title: "Erreur de génération d'images",
                description: error instanceof Error ? error.message : "Impossible de générer les miniatures",
                variant: "destructive",
            })
        }

        setIsGeneratingThumbnails(false)
        setStep(3) // Pass to thumbnails step after generation
    }, [sessionId, artisticDirections, metadata, addLog, startProgress, setStep])

    // -----------------------------------------------
    // 5. Generate Social Posts (standalone)
    // -----------------------------------------------
    const generateSocialPosts = useCallback(
        async (context: string) => {
            setIsGenerating(true)
            setGenerationProgress(0)
            const startTime = Date.now()
            const interval = startProgress(5, 400)

            const title = metadata?.titles[metadata.selectedTitle || 0] || "Nouveau contenu"

            try {
                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "skill_execution",
                        skillSlug: skillMapping.social,
                        context: JSON.stringify({
                            rawContext: context,
                            blueprint: contentBlueprint
                        }),
                        metadata: {
                            title,
                            tags: metadata?.tags,
                            description: metadata?.description,
                        },
                    }),
                })

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
                const result = await response.json()
                clearInterval(interval)
                setGenerationProgress(100)

                const socialRawData = result.data
                let socialData: any = socialRawData
                if (typeof socialRawData === 'string') {
                    try { socialData = parseAIJson(socialRawData) } catch (e) {}
                }
                const apiPosts = socialData?.posts || socialData || []
                const platformOrder = ["linkedin", "youtube_community", "tiktok", "x", "instagram", "facebook", "threads", "school"]

                if (!Array.isArray(apiPosts) || apiPosts.length === 0) {
                    throw new Error("Aucun post social généré.")
                }

                const posts: SocialPost[] = platformOrder.map((platform, i) => {
                    const apiPost = Array.isArray(apiPosts)
                        ? apiPosts.find((p: any) => p.platform === platform) || apiPosts[i] || {}
                        : {}
                    return {
                        id: `post-${i + 1}`,
                        sessionId,
                        platform: platform as SocialPost["platform"],
                        content: apiPost.content || "",
                        hashtags: apiPost.hashtags || metadata?.hashtags || [],
                        status: "draft" as const,
                    }
                })

                if (posts.every(p => !p.content)) {
                    throw new Error("Aucun post social généré.")
                }

                setSocialPosts(posts)
                addLog({
                    sessionId,
                    operation: "Social Posts Generation",
                    model: "z-ai/default",
                    status: "success",
                    requestTime: Date.now() - startTime,
                    tokensUsed: result.usage?.totalTokens || 1500,
                    cost: 0.003,
                })
            } catch (error) {
                clearInterval(interval)
                console.error("Social posts error:", error)
                toast({
                    title: "Erreur Posts Sociaux",
                    description: error instanceof Error ? error.message : "Impossible de générer les posts",
                    variant: "destructive",
                })
            }

            setIsGenerating(false)
            setStep(4)
        },
        [sessionId, metadata, addLog, startProgress, setStep]
    )

    // -----------------------------------------------
    // 6. Analyze Video Reference
    // -----------------------------------------------
    const analyzeVideoReference = useCallback(
        async (videoUrl: string, context: string) => {
            if (!videoUrl.trim()) return
            setIsAnalyzingVideo(true)
            const startTime = Date.now()

            try {
                const response = await fetch("/api/analyze-video", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ videoUrl, context }),
                })

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
                const result = await response.json()
                
                // Analyze video returns a direct direction object
                const apiDir = result.direction || result.data || {}

                if (result.success && apiDir) {
                    const newDirection: ArtisticDirection = {
                        id: apiDir.id || "dir-ref-" + Date.now(),
                        sessionId,
                        name: apiDir.name || "Référence Vidéo",
                        style: apiDir.style || "modern",
                        colorPalette: apiDir.colorPalette || { primary: "#FF6B00", secondary: "#1A1A2E", accent: "#00D9FF", background: "#0F0F1A", text: "#FFFFFF" },
                        typography: apiDir.typography || { headingFont: "Inter", bodyFont: "Inter", headingWeight: "800", emphasis: "uppercase" },
                        moodKeywords: apiDir.moodKeywords || ["inspiré", "vidéo"],
                        selected: true,
                    }
                    
                    setArtisticDirections(prev => [newDirection, ...prev.map(d => ({ ...d, selected: false }))])

                    addLog({
                        sessionId,
                        operation: "Video Style Analysis",
                        model: "z-ai/vlm",
                        status: "success",
                        requestTime: Date.now() - startTime,
                        tokensUsed: result.usage?.totalTokens || 500,
                        cost: 0.01,
                    })
                    
                    toast({
                        title: "Analyse terminée",
                        description: `Style extrait: ${newDirection.style}`,
                    })
                }
            } catch (error: any) {
                console.error("Video analysis error:", error)
                toast({
                    title: "Erreur d'analyse",
                    description: error.message || "Impossible d'analyser la vidéo. Vérifiez l'URL.",
                    variant: "destructive",
                })
            }

            setIsAnalyzingVideo(false)
        },
        [sessionId, addLog, toast]
    )

    return {
        // Data
        metadata,
        artisticDirections,
        thumbnails,
        socialPosts,
        // State
        isGenerating,
        isGeneratingThumbnails,
        generationProgress,
        parallelTasks,
        isAnalyzingVideo,
        skillMapping,
        contentBlueprint,
        // Setters
        setMetadata,
        setArtisticDirections,
        setThumbnails,
        setSocialPosts,
        setSkillMapping,
        // Actions
        generateMetadata,
        executeParallelTasks,
        generateThumbnails,
        generateSocialPosts,
        analyzeVideoReference,
    }
}
