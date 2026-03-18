"use client"

import { useState, useEffect } from "react"
import {
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  Image as ImageIcon,
  FileText,
  Share2,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSessionStore } from "@/lib/api-store"
import { toast } from "sonner"

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  
  const { sessions, isLoading, error, fetchSessions, deleteSession } = useSessionStore()

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Show error toast if needed
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = (session.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (session.context || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalThumbnails = sessions.reduce((acc, s) => acc + (s.thumbnails?.length || 0), 0)
  const totalPosts = sessions.reduce((acc, s) => acc + (s.socialPosts?.length || 0), 0)
  const publishedPosts = sessions.reduce((acc, s) => {
    const published = s.socialPosts?.filter((p: any) => p.status === 'published') || []
    return acc + published.length
  }, 0)
  const totalCost = sessions.reduce((acc, s) => acc + (s.cost || 0), 0)

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Complète</Badge>
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En cours</Badge>
      case 'draft':
        return <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30">Brouillon</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erreur</Badge>
      default:
        return null
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return '💼'
      case 'youtube_community':
        return '📺'
      case 'school':
        return '🎓'
      case 'x':
        return '𝕏'
      case 'instagram':
        return '📷'
      case 'facebook':
        return '📘'
      case 'tiktok':
        return '🎵'
      case 'threads':
        return '🧵'
      default:
        return '📱'
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      await deleteSession(id)
      toast.success('Session supprimée')
    }
  }

  // Collect all thumbnails and posts for tabs
  const allThumbnails = sessions.flatMap(s => 
    (s.thumbnails || []).map((t: any) => ({ ...t, sessionTitle: s.title, sessionId: s.id }))
  )
  
  const allPosts = sessions.flatMap(s => 
    (s.socialPosts || []).map((p: any) => ({ ...p, sessionTitle: s.title, sessionId: s.id }))
  )

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bibliothèque</h1>
              <p className="text-neutral-400">Gérez vos sessions et contenus générés</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`border-neutral-600 ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`border-neutral-600 ${viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Rechercher une session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-neutral-600 text-neutral-300">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === 'all' ? 'Tous les statuts' : statusFilter}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white hover:bg-neutral-700">
                Tous les statuts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="text-white hover:bg-neutral-700">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Complètes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('processing')} className="text-white hover:bg-neutral-700">
                <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                En cours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('draft')} className="text-white hover:bg-neutral-700">
                <FileText className="w-4 h-4 mr-2 text-neutral-500" />
                Brouillons
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-1">Sessions Totales</p>
            <p className="text-2xl font-bold text-white">{sessions.length}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-1">Miniatures</p>
            <p className="text-2xl font-bold text-white">{totalThumbnails}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-1">Posts Publiés</p>
            <p className="text-2xl font-bold text-white">{publishedPosts}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-1">Coût Total</p>
            <p className="text-2xl font-bold text-orange-400 font-mono">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && sessions.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucune session</h3>
            <p className="text-neutral-500">Créez votre première session dans Content Studio</p>
          </div>
        )}

        {/* Content Tabs */}
        {sessions.length > 0 && (
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="bg-neutral-800 border border-neutral-700 mb-6">
              <TabsTrigger value="sessions" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="thumbnails" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <ImageIcon className="w-4 h-4 mr-2" />
                Miniatures
              </TabsTrigger>
              <TabsTrigger value="posts" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Posts
              </TabsTrigger>
            </TabsList>

            {/* Sessions Tab */}
            <TabsContent value="sessions">
              <ScrollArea className="h-[calc(100vh-450px)]">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSessions.map((session) => (
                      <Dialog key={session.id}>
                        <DialogTrigger asChild>
                          <div
                            className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden cursor-pointer hover:border-neutral-500 transition-all"
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-cyan-500/20 flex items-center justify-center">
                              {session.thumbnails?.length > 0 ? (
                                <div className="text-center">
                                  <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm text-neutral-400">{session.thumbnails.length} miniatures</p>
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-500">Pas de miniature</p>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium text-white line-clamp-1">{session.title || 'Sans titre'}</h3>
                                {getStatusBadge(session.status)}
                              </div>
                              <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{session.context || 'Pas de contexte'}</p>
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                                <span className="font-mono text-orange-400">${(session.cost || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">{session.title || 'Sans titre'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session.status)}
                              {session.metadata && (
                                <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-300">
                                  Score SEO: {session.metadata.seoScore || 0}%
                                </Badge>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-neutral-500 mb-1">Titre optimisé</p>
                              <p className="text-white">{session.metadata?.titles?.[session.metadata.selectedTitle || 0] || 'Non généré'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-500 mb-1">Contexte</p>
                              <p className="text-neutral-300">{session.context || 'Pas de contexte'}</p>
                            </div>
                            {session.metadata?.tags && (
                              <div>
                                <p className="text-sm text-neutral-500 mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                  {session.metadata.tags.map((tag: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                              <div className="flex items-center gap-4 text-sm text-neutral-400">
                                <span>{session.thumbnails?.length || 0} miniatures</span>
                                <span>{session.socialPosts?.length || 0} posts</span>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-300">
                                  <Download className="w-4 h-4 mr-2" />
                                  Exporter
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDelete(session.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 flex items-center justify-between hover:border-neutral-500 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-neutral-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{session.title || 'Sans titre'}</h3>
                              {getStatusBadge(session.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <span>{new Date(session.createdAt).toLocaleDateString('fr-FR')}</span>
                              <span>{session.thumbnails?.length || 0} miniatures</span>
                              <span>{session.socialPosts?.length || 0} posts</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-orange-400">${(session.cost || 0).toFixed(2)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                              <DropdownMenuItem className="text-white hover:bg-neutral-700">
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-neutral-700">
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-neutral-700">
                                <Copy className="w-4 h-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-neutral-700" />
                              <DropdownMenuItem 
                                className="text-red-400 hover:bg-neutral-700"
                                onClick={() => handleDelete(session.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Thumbnails Tab */}
            <TabsContent value="thumbnails">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allThumbnails.map((thumbnail: any) => (
                  <div
                    key={thumbnail.id}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-cyan-500/20 relative">
                      {thumbnail.selected && (
                        <Badge className="absolute top-2 left-2 bg-green-500/80 text-white">
                          Sélectionnée
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-white truncate mb-1">{thumbnail.sessionTitle || 'Sans titre'}</p>
                      <p className="text-xs text-neutral-500">{thumbnail.resolution || '1280x720'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {allThumbnails.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucune miniature</h3>
                  <p className="text-neutral-500">Générez des miniatures dans Content Studio</p>
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <div className="space-y-3">
                {allPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                      <div>
                        <p className="font-medium text-white">{post.sessionTitle || 'Sans titre'}</p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <span className="capitalize">{post.platform.replace('_', ' ')}</span>
                          <span>•</span>
                          {post.publishedAt ? (
                            <span>Publié le {new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
                          ) : (
                            <span>Non publié</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {post.status === 'published' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Publié
                        </Badge>
                      )}
                      {post.status === 'scheduled' && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Planifié
                        </Badge>
                      )}
                      {post.status === 'draft' && (
                        <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30">
                          Brouillon
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {allPosts.length === 0 && (
                <div className="text-center py-12">
                  <Share2 className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun post</h3>
                  <p className="text-neutral-500">Générez des posts sociaux dans Content Studio</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
