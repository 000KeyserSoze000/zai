/**
 * Content Studio Constants
 * Shared configuration used across all Content Studio components.
 */

import {
    FileText,
    Search,
    Palette,
    ImageIcon,
    Share2,
    Send,
    Linkedin,
    Youtube,
    Music2,
    Twitter,
    Instagram,
    Facebook,
    MessageCircle,
    GraduationCap,
} from "lucide-react"

// Workflow step definitions
export const WORKFLOW_STEPS = [
    { id: 'context', name: 'Contexte', icon: FileText, description: 'Decrivez votre video' },
    { id: 'metadata', name: 'SEO', icon: Search, description: 'Titres, tags, description' },
    { id: 'artistic', name: 'Direction', icon: Palette, description: 'Styles visuels' },
    { id: 'thumbnails', name: 'Miniatures', icon: ImageIcon, description: 'Generation images' },
    { id: 'social', name: 'Posts', icon: Share2, description: 'Reseaux sociaux' },
    { id: 'publish', name: 'Publication', icon: Send, description: 'Diffusion finale' },
]

// Logo options for thumbnails
export const AVAILABLE_LOGOS = [
    { id: 'zai', name: 'Z.ai', color: '#FF6B00', icon: 'Z', recommended: true },
    { id: 'vercel', name: 'Vercel', color: '#000000', icon: '▲' },
    { id: 'openai', name: 'OpenAI', color: '#10A37F', icon: '◯' },
    { id: 'supabase', name: 'Supabase', color: '#3ECF8E', icon: '⚡' },
    { id: 'nextjs', name: 'Next.js', color: '#000000', icon: 'N' },
    { id: 'typescript', name: 'TypeScript', color: '#3178C6', icon: 'TS' },
    { id: 'react', name: 'React', color: '#61DAFB', icon: '⚛' },
    { id: 'tailwind', name: 'Tailwind', color: '#38BDF8', icon: '◇' },
    { id: 'stripe', name: 'Stripe', color: '#635BFF', icon: 'S' },
    { id: 'github', name: 'GitHub', color: '#181717', icon: '◉' },
    { id: 'figma', name: 'Figma', color: '#F24E1E', icon: 'F' },
]

// SEO writing suggestions
export const SEO_SUGGESTIONS = [
    { type: 'hook', text: 'Ajouter un chiffre au debut du titre', example: '5 astuces pour...' },
    { type: 'emotion', text: 'Utiliser un mot emotionnel', example: 'Incroyable, Secret, Puissant...' },
    { type: 'curiosity', text: 'Creer de la curiosite', example: 'Ce que personne ne vous dit sur...' },
    { type: 'benefit', text: 'Mettre en avant le benefice', example: '...pour doubler vos vues' },
]

// Social media platform definitions
export const SOCIAL_PLATFORMS = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', bgColor: 'bg-[#0A66C2]' },
    { id: 'youtube_community', name: 'YouTube', icon: Youtube, color: '#FF0000', bgColor: 'bg-[#FF0000]' },
    { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000', bgColor: 'bg-black' },
    { id: 'x', name: 'X', icon: Twitter, color: '#000000', bgColor: 'bg-black' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', bgColor: 'bg-[#E4405F]' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', bgColor: 'bg-[#1877F2]' },
    { id: 'threads', name: 'Threads', icon: MessageCircle, color: '#000000', bgColor: 'bg-black' },
    { id: 'school', name: 'School', icon: GraduationCap, color: '#FF6B00', bgColor: 'bg-orange-500' },
] as const

// Platform IDs type
export type PlatformId = typeof SOCIAL_PLATFORMS[number]['id']

// Background themes for thumbnail generation
export const THUMBNAIL_THEMES = [
    {
        name: 'Technologie',
        getPrompt: (colors: { primary: string; secondary: string; background: string }) =>
            `Abstract technology background with ${colors.primary} and ${colors.secondary} gradient, digital particles, futuristic circuit patterns, glowing nodes and connections, dark ${colors.background} background, sleek modern tech aesthetic, space for text on the left side, high-tech atmosphere`
    },
    {
        name: 'Business',
        getPrompt: (colors: { primary: string; secondary: string; background: string }) =>
            `Professional business environment background, modern office with ${colors.primary} accent lighting, sleek ${colors.secondary} tones, glass and metal textures, ${colors.background} ambient lighting, corporate success atmosphere, clean space for text overlay, professional photography style`
    },
    {
        name: 'Paysage',
        getPrompt: (colors: { primary: string; secondary: string; background: string }) =>
            `Cinematic landscape background, dramatic ${colors.primary} sunset or sunrise colors, ${colors.secondary} mountains or hills in distance, ${colors.background} sky with atmospheric clouds, epic wide angle view, space for text on horizon area, inspiring and epic mood`
    },
]
