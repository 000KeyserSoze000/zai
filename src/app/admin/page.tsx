"use client"

import { useState, useEffect } from "react"
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  CreditCard,
  Target,
  Server,
  Search,
  MessageSquare,
  Video,
  Palette,
  Share2,
  ArrowRight,
  Euro,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from "recharts"
import { formatCurrency } from "@/lib/currency"
import { useTranslation } from "@/lib/i18n"

interface AdminStats {
  users: {
    total: number
    active: number
    new7Days: number
    byPlan: { name: string; value: number; color: string }[]
    growth: { month: string; users: number; sessions: number }[]
  }
  sessions: {
    total: number
    last7Days: number
    last30Days: number
    byDay: { date: string; day: string; sessions: number; errors: number }[]
  }
  content: {
    thumbnails: number
    socialPosts: number
    seoMetadata: number
    byDay: { day: string; thumbnails: number; posts: number; seo: number }[]
  }
  revenue: {
    mrr: number
    arr: number
    byPlan: { plan: string; mrr: number; users: number; arpu: number }[]
    costsThisMonth: number
    tokensThisMonth: number
  }
  support: {
    open: number
    pending: number
    resolved7Days: number
    recentTickets: {
      id: string
      subject: string
      status: string
      priority: string
      createdAt: string
      user: string
    }[]
  }
  seo: {
    avgScore: number
    videosOptimized: number
  }
}

// UserPlus icon component
function UserPlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" x2="19" y1="8" y2="14"/>
      <line x1="22" x2="16" y1="11" y2="11"/>
    </svg>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState('7d')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Stats fetch error:', err)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-neutral-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error || 'No data'}</p>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    )
  }

  const userStats = [
    { label: t('admin.totalUsers'), value: stats.users.total, change: '+12.5', trend: 'up', icon: Users },
    { label: t('admin.activeUsers'), value: stats.users.active, change: '+8.3', trend: 'up', icon: Activity },
    { label: t('admin.newUsers7d'), value: stats.users.new7Days, change: '+23.1', trend: 'up', icon: UserPlus },
    { label: t('admin.conversionRate'), value: '14.2%', change: '+2.1', trend: 'up', icon: Target },
  ]

  const platformStats = [
    { label: t('admin.totalSessions'), value: stats.sessions.total, change: '+15.2', trend: 'up', icon: Zap },
    { label: t('admin.avgTime'), value: '4m 32s', change: '-0.8', trend: 'down', icon: Clock },
    { label: t('admin.successRate'), value: '98.5%', change: '+0.3', trend: 'up', icon: CheckCircle },
    { label: t('admin.uptime'), value: '99.9%', change: 0, trend: 'stable', icon: Server },
  ]

  const contentStats = [
    { label: t('admin.thumbnails'), value: stats.content.thumbnails, icon: ImageIcon, color: 'text-purple-400' },
    { label: t('admin.socialPosts'), value: stats.content.socialPosts, icon: Share2, color: 'text-cyan-400' },
    { label: t('admin.seoMetadata'), value: stats.content.seoMetadata, icon: Search, color: 'text-green-400' },
    { label: t('admin.artisticDir'), value: stats.revenue.tokensThisMonth, icon: Palette, color: 'text-pink-400' },
  ]

  const financialStats = [
    { label: t('admin.monthlyRevenue'), value: stats.revenue.mrr, change: '+18.5', trend: 'up', icon: Euro, format: 'currency' as const },
    { label: t('admin.annualRevenue'), value: stats.revenue.arr, change: '+24.2', trend: 'up', icon: TrendingUp, format: 'currency' as const },
    { label: t('admin.arpu'), value: stats.users.total > 0 ? stats.revenue.mrr / stats.users.total : 0, change: '+3.2', trend: 'up', icon: CreditCard, format: 'currency' as const },
    { label: t('admin.churnRate'), value: '2.1%', change: '-0.3', trend: 'down', icon: XCircle, format: 'percent' as const },
  ]

  const ticketStats = [
    { label: t('admin.openTickets'), value: stats.support.open, color: 'text-red-400' },
    { label: t('admin.pendingTickets'), value: stats.support.pending, color: 'text-yellow-400' },
    { label: t('admin.resolved7d'), value: stats.support.resolved7Days, color: 'text-green-400' },
    { label: t('admin.avgTime'), value: '2h 15m', color: 'text-blue-400' },
  ]

  const seoStats = [
    { label: t('admin.avgScore'), value: stats.seo.avgScore, change: '+3.2', trend: 'up', icon: Target },
    { label: t('admin.videosOptimized'), value: stats.seo.videosOptimized, change: '+12.8', trend: 'up', icon: Video },
    { label: t('admin.estimatedCTR'), value: '8.2%', change: '+0.5', trend: 'up', icon: TrendingUp },
    { label: t('admin.tagsGenerated'), value: stats.content.seoMetadata * 5, change: '+8.4', trend: 'up', icon: Search },
  ]

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('admin.title')}</h1>
              <p className="text-neutral-400">{t('admin.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="24h" className="text-white hover:bg-neutral-700">{t('admin.last24h')}</SelectItem>
                <SelectItem value="7d" className="text-white hover:bg-neutral-700">{t('admin.last7d')}</SelectItem>
                <SelectItem value="30d" className="text-white hover:bg-neutral-700">{t('admin.last30d')}</SelectItem>
                <SelectItem value="90d" className="text-white hover:bg-neutral-700">{t('admin.last90d')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchStats} variant="outline" className="border-neutral-600 text-neutral-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('admin.refresh')}
            </Button>
            <Button variant="outline" className="border-neutral-600 text-neutral-300">
              <Download className="w-4 h-4 mr-2" />
              {t('admin.export')}
            </Button>
          </div>
        </div>

        {/* Main Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {financialStats.slice(0, 2).map((stat) => (
            <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-green-500" />
                <Badge className={`${
                  stat.trend === 'up' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                } text-xs`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
              </p>
              <p className="text-sm text-neutral-500">{stat.label}</p>
            </div>
          ))}
          {userStats.slice(0, 2).map((stat) => (
            <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-orange-500" />
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stat.change}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
              <p className="text-sm text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-neutral-800 border border-neutral-700 mb-6 flex flex-wrap">
            <TabsTrigger value="users" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              {t('admin.usersTab')}
            </TabsTrigger>
            <TabsTrigger value="platform" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Server className="w-4 h-4 mr-2" />
              {t('admin.platformTab')}
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              {t('admin.contentTab')}
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              {t('admin.financialTab')}
            </TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Search className="w-4 h-4 mr-2" />
              {t('admin.seoTab')}
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('admin.supportTab')}
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {userStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-neutral-400">{stat.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <Badge className={`${
                      stat.trend === 'up' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    } text-xs`}>
                      {stat.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('admin.userGrowth')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.users.growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                    <Legend />
                    <Area type="monotone" dataKey="users" name={t('admin.total')} stroke="#FF6B00" fill="#FF6B0033" strokeWidth={2} />
                    <Area type="monotone" dataKey="sessions" name={t('admin.sessions')} stroke="#00D9FF" fill="#00D9FF33" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('admin.planDistribution')}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.users.byPlan} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {stats.users.byPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {stats.users.byPlan.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-neutral-400">{item.name}</span>
                      </div>
                      <span className="text-white font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PLATFORM TAB */}
          <TabsContent value="platform">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {platformStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-cyan-500" />
                    <span className="text-sm text-neutral-400">{stat.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    {stat.change !== 0 && (
                      <Badge className={`${
                        stat.trend === 'up' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        stat.trend === 'down' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                      } text-xs`}>
                        {stat.change}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('admin.dailyActivity')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.sessions.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="sessions" name={t('admin.sessions')} fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" name={t('admin.errors')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {contentStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-sm text-neutral-400">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('admin.contentByDay')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.content.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="thumbnails" name={t('admin.thumbnails')} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="posts" name={t('admin.posts')} fill="#00D9FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seo" name={t('admin.seo')} fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {financialStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-neutral-400">{stat.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white font-mono">
                      {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                    </p>
                    <Badge className={`${
                      stat.trend === 'up' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    } text-xs`}>
                      {stat.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('admin.revenueByPlan')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">{t('admin.plan')}</th>
                      <th className="text-right py-3 px-2 text-neutral-400 font-medium">MRR</th>
                      <th className="text-right py-3 px-2 text-neutral-400 font-medium">{t('admin.users')}</th>
                      <th className="text-right py-3 px-2 text-neutral-400 font-medium">ARPU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.revenue.byPlan.map((item) => (
                      <tr key={item.plan} className="border-b border-neutral-800">
                        <td className="py-3 px-2 text-white">{item.plan}</td>
                        <td className="py-3 px-2 text-right text-green-400 font-mono">{formatCurrency(item.mrr)}</td>
                        <td className="py-3 px-2 text-right text-neutral-300">{item.users}</td>
                        <td className="py-3 px-2 text-right text-neutral-300 font-mono">{formatCurrency(item.arpu)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-600">
                      <td className="py-3 px-2 text-white font-semibold">{t('admin.total')}</td>
                      <td className="py-3 px-2 text-right text-green-400 font-mono font-semibold">
                        {formatCurrency(stats.revenue.mrr)}
                      </td>
                      <td className="py-3 px-2 text-right text-white font-semibold">{stats.users.total}</td>
                      <td className="py-3 px-2 text-right text-neutral-300 font-mono">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* SEO TAB */}
          <TabsContent value="seo">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {seoStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-neutral-400">{stat.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      +{stat.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('admin.seoScoreDistribution')}</h3>
              <p className="text-neutral-400">{t('admin.avgSeoScore')}: <span className="text-green-400 font-mono">{stats.seo.avgScore}/100</span></p>
              <p className="text-neutral-400 mt-2">{t('admin.videosOptimized')}: <span className="text-white font-mono">{stats.seo.videosOptimized}</span></p>
            </div>
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {ticketStats.map((stat) => (
                <div key={stat.label} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                  <p className="text-sm text-neutral-400 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <h3 className="text-lg font-semibold text-white">{t('admin.recentTickets')}</h3>
                <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-300">
                  {t('admin.viewAll')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <ScrollArea className="h-[400px]">
                {stats.support.recentTickets.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">{t('admin.noTickets')}</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-neutral-800">
                      <tr>
                        <th className="text-left py-3 px-4 text-neutral-400 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-neutral-400 font-medium">{t('admin.user')}</th>
                        <th className="text-left py-3 px-4 text-neutral-400 font-medium">{t('admin.subject')}</th>
                        <th className="text-center py-3 px-4 text-neutral-400 font-medium">{t('admin.status')}</th>
                        <th className="text-center py-3 px-4 text-neutral-400 font-medium">{t('admin.priority')}</th>
                        <th className="text-left py-3 px-4 text-neutral-400 font-medium">{t('admin.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.support.recentTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                          <td className="py-3 px-4 font-mono text-sm text-orange-400">{ticket.id.slice(0, 8)}...</td>
                          <td className="py-3 px-4 text-neutral-300">{ticket.user}</td>
                          <td className="py-3 px-4 text-white">{ticket.subject}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`${
                              ticket.status === 'OPEN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              ticket.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>
                              {ticket.status === 'OPEN' ? t('admin.open') : ticket.status === 'PENDING' ? t('admin.pending') : t('admin.resolved')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`${
                              ticket.priority === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              ticket.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                            }`}>
                              {ticket.priority === 'HIGH' ? t('admin.high') : ticket.priority === 'MEDIUM' ? t('admin.medium') : t('admin.low')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-neutral-400 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
