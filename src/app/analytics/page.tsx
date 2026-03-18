"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
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
  Legend
} from "recharts"
import { toast } from "sonner"

interface AnalyticsData {
  summary: {
    totalTokens: number
    totalCost: number
    totalSessions: number
    sessionsCompleted: number
    sessionsInProgress: number
    sessionsFailed: number
  }
  chartData: Array<{ date: string; tokens: number; cost: number; sessions: number }>
  modelUsage: Array<{ model: string; count: number; tokens: number; cost: number }>
  recentActivity: Array<{
    id: string
    action: string
    resourceType: string
    tokensUsed: number
    cost: number
    createdAt: string
  }>
  subscription: {
    plan: string
    sessionsUsed: number
    sessionsLimit: number
    sessionsRemaining: number
  } | null
  sessions: Array<any>
}

const COLORS = ['#FF6B00', '#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analytics?period=${timeRange}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des analytics')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast.error('Erreur lors du chargement des analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  // Calculate cost change (mock comparison for now)
  const costChange = data ? -12 : 0
  const callsChange = data ? 8 : 0
  const imagesCount = data?.sessions.reduce((acc, s) => acc + (s.thumbnails?.length || 0), 0) || 0

  // Transform chart data for display
  const costChartData = data?.chartData.map(d => ({
    day: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    tokens: d.tokens,
    cost: d.cost,
    sessions: d.sessions
  })) || []

  // Transform model usage for pie chart
  const usagePieData = data?.modelUsage.map(m => ({
    name: m.model,
    value: m.cost
  })) || []

  // Total cost for percentage calculation
  const totalModelCost = data?.modelUsage.reduce((acc, m) => acc + m.cost, 0) || 1

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-neutral-400">Suivi des coûts, performances et métriques</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="7" className="text-white hover:bg-neutral-700">7 derniers jours</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-neutral-700">30 derniers jours</SelectItem>
                <SelectItem value="90" className="text-white hover:bg-neutral-700">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="border-neutral-600 text-neutral-300"
              onClick={fetchAnalytics}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Erreur</h3>
            <p className="text-neutral-500">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4 bg-orange-500 hover:bg-orange-600">
              Réessayer
            </Button>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  <Badge className={`${
                    costChange < 0 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  } text-xs`}>
                    {costChange < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                    {Math.abs(costChange)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white font-mono">${data.summary.totalCost.toFixed(2)}</p>
                <p className="text-sm text-neutral-500">Coût total</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-cyan-500" />
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{callsChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white">{data.summary.totalSessions}</p>
                <p className="text-sm text-neutral-500">Sessions</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-white">{imagesCount}</p>
                <p className="text-sm text-neutral-500">Images générées</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.summary.totalSessions > 0 
                    ? ((data.summary.sessionsCompleted / data.summary.totalSessions) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-neutral-500">Taux de succès</p>
              </div>
            </div>

            {/* Subscription Info */}
            {data.subscription && (
              <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-neutral-700 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {data.subscription.plan}
                    </Badge>
                    <div className="text-sm text-neutral-400">
                      <span className="text-white font-medium">{data.subscription.sessionsUsed}</span>
                      <span> / {data.subscription.sessionsLimit} sessions utilisées</span>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-400">
                    <span className="text-green-400 font-medium">{data.subscription.sessionsRemaining}</span>
                    <span> sessions restantes</span>
                  </div>
                </div>
                <Progress 
                  value={(data.subscription.sessionsUsed / data.subscription.sessionsLimit) * 100} 
                  className="mt-3 h-2"
                />
              </div>
            )}

            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="bg-neutral-800 border border-neutral-700 mb-6">
                <TabsTrigger value="costs" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Coûts
                </TabsTrigger>
                <TabsTrigger value="usage" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Cpu className="w-4 h-4 mr-2" />
                  Utilisation
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Logs
                </TabsTrigger>
              </TabsList>

              {/* Costs Tab */}
              <TabsContent value="costs">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Évolution des Coûts</h3>
                    {costChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="day" stroke="#666" />
                          <YAxis stroke="#666" tickFormatter={(value) => `$${value}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
                          />
                          <Legend />
                          <Bar dataKey="cost" name="Coût ($)" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-neutral-500">
                        Aucune donnée disponible
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Répartition par Modèle</h3>
                    {usagePieData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={usagePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {usagePieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                              formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-4">
                          {data?.modelUsage.map((item, index) => (
                            <div key={item.model} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-neutral-400">{item.model}</span>
                              </div>
                              <span className="text-white font-mono">${item.cost.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-neutral-500">
                        Aucune donnée
                      </div>
                    )}
                  </div>
                </div>

                {/* Model Usage Table */}
                {data?.modelUsage && data.modelUsage.length > 0 && (
                  <div className="mt-6 bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Utilisation par Modèle</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-700">
                            <th className="text-left py-3 px-4 text-neutral-400 font-medium">Modèle</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">Appels</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">Tokens</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">Coût</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">% Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.modelUsage.map((model) => {
                            const percentage = totalModelCost > 0 ? ((model.cost / totalModelCost) * 100).toFixed(1) : '0'
                            return (
                              <tr key={model.model} className="border-b border-neutral-800">
                                <td className="py-3 px-4">
                                  <span className="text-white font-medium">{model.model}</span>
                                </td>
                                <td className="text-right py-3 px-4 text-neutral-300 font-mono">{model.count}</td>
                                <td className="text-right py-3 px-4 text-neutral-300 font-mono">
                                  {model.tokens > 0 ? `${(model.tokens / 1000).toFixed(1)}k` : '-'}
                                </td>
                                <td className="text-right py-3 px-4 text-orange-400 font-mono">${model.cost.toFixed(4)}</td>
                                <td className="text-right py-3 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <Progress value={parseFloat(percentage)} className="w-16 h-2" />
                                    <span className="text-neutral-400 text-sm w-12 text-right">{percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Usage Tab */}
              <TabsContent value="usage">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Activité Quotidienne</h3>
                    {costChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={costChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="day" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Line type="monotone" dataKey="sessions" stroke="#FF6B00" strokeWidth={2} dot={{ fill: '#FF6B00' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-neutral-500">
                        Aucune donnée disponible
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Statistiques</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                        <span className="text-neutral-400">Sessions Complétées</span>
                        <span className="text-white font-mono">{data.summary.sessionsCompleted}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                        <span className="text-neutral-400">Sessions En Cours</span>
                        <span className="text-yellow-400 font-mono">{data.summary.sessionsInProgress}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                        <span className="text-neutral-400">Sessions Échouées</span>
                        <span className="text-red-400 font-mono">{data.summary.sessionsFailed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                        <span className="text-neutral-400">Tokens Utilisés</span>
                        <span className="text-cyan-400 font-mono">{(data.summary.totalTokens / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <h3 className="text-lg font-semibold text-white">Logs d'Activité</h3>
                    <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-300">
                      {data.recentActivity.length} entrées
                    </Badge>
                  </div>
                  {data.recentActivity.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-neutral-800">
                          <tr>
                            <th className="text-left py-3 px-4 text-neutral-400 font-medium">Date</th>
                            <th className="text-left py-3 px-4 text-neutral-400 font-medium">Action</th>
                            <th className="text-left py-3 px-4 text-neutral-400 font-medium">Type</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">Tokens</th>
                            <th className="text-right py-3 px-4 text-neutral-400 font-medium">Coût</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentActivity.map((log) => (
                            <tr key={log.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                              <td className="py-3 px-4 font-mono text-sm text-neutral-400">
                                {new Date(log.createdAt).toLocaleString('fr-FR')}
                              </td>
                              <td className="py-3 px-4 text-white">{log.action}</td>
                              <td className="py-3 px-4 text-neutral-300">{log.resourceType || '-'}</td>
                              <td className="py-3 px-4 text-right font-mono text-neutral-300">
                                {log.tokensUsed || 0}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-orange-400">
                                ${(log.cost || 0).toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-neutral-500">
                      Aucune activité récente
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
