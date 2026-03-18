import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

// GET /api/analytics - Get analytics data for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get usage records
    const usageRecords = await db.usageRecord.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: daysAgo }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get content sessions
    const sessions = await db.contentSession.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: daysAgo }
      },
      select: {
        id: true,
        title: true,
        status: true,
        tokensUsed: true,
        cost: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate totals
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokensUsed || 0), 0)
    const totalCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0)
    const sessionsCompleted = sessions.filter(s => s.status === 'COMPLETED').length
    const sessionsInProgress = sessions.filter(s => s.status === 'PROCESSING').length
    const sessionsFailed = sessions.filter(s => s.status === 'FAILED').length

    // Group by day for chart data
    const dailyData: Record<string, { tokens: number; cost: number; sessions: number }> = {}
    
    sessions.forEach(session => {
      const date = session.createdAt.toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { tokens: 0, cost: 0, sessions: 0 }
      }
      dailyData[date].tokens += session.tokensUsed || 0
      dailyData[date].cost += session.cost || 0
      dailyData[date].sessions += 1
    })

    // Convert to array for charts
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Model usage breakdown (from usage records)
    const modelUsage: Record<string, { count: number; tokens: number; cost: number }> = {}
    usageRecords.forEach(record => {
      const metadata = record.metadata ? JSON.parse(record.metadata as string) : {}
      const model = metadata.model || 'unknown'
      if (!modelUsage[model]) {
        modelUsage[model] = { count: 0, tokens: 0, cost: 0 }
      }
      modelUsage[model].count += 1
      modelUsage[model].tokens += record.tokensUsed || 0
      modelUsage[model].cost += record.cost || 0
    })

    const modelUsageArray = Object.entries(modelUsage)
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.tokens - a.tokens)

    // Recent activity
    const recentActivity = usageRecords.slice(-20).reverse().map(record => ({
      id: record.id,
      action: record.action,
      resourceType: record.resourceType,
      tokensUsed: record.tokensUsed,
      cost: record.cost,
      createdAt: record.createdAt.toISOString(),
    }))

    // Subscription info
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true }
    })

    return NextResponse.json({
      summary: {
        totalTokens,
        totalCost,
        totalSessions: sessions.length,
        sessionsCompleted,
        sessionsInProgress,
        sessionsFailed,
      },
      chartData,
      modelUsage: modelUsageArray,
      recentActivity,
      subscription: subscription ? {
        plan: subscription.plan.name,
        sessionsUsed: subscription.sessionsUsed,
        sessionsLimit: subscription.sessionsLimit,
        sessionsRemaining: subscription.sessionsLimit - subscription.sessionsUsed,
      } : null,
      sessions: sessions.slice(0, 10), // Last 10 sessions
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
