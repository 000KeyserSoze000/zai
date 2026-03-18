import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get date ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // ============================================
    // USER STATS
    // ============================================
    const totalUsers = await db.user.count()
    const newUsers7Days = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })
    
    // Active users (users with sessions in last 7 days)
    const activeUsersData = await db.contentSession.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: sevenDaysAgo } }
    })
    const activeUsersCount = activeUsersData.length

    // Users by plan
    const subscriptions = await db.subscription.findMany({
      where: { status: { in: ['TRIAL', 'ACTIVE'] } },
      include: { plan: true }
    })

    const planCounts: Record<string, number> = {}
    subscriptions.forEach(sub => {
      const planName = sub.plan?.name || 'Unknown'
      planCounts[planName] = (planCounts[planName] || 0) + 1
    })

    const planColors: Record<string, string> = {
      'Starter': '#6B7280',
      'Creator': '#FF6B00', 
      'Business': '#00D9FF',
      'Agency': '#8B5CF6',
      'Enterprise': '#10B981'
    }

    const usersByPlan = Object.entries(planCounts).map(([name, value]) => ({
      name,
      value,
      color: planColors[name] || '#6B7280'
    }))

    // ============================================
    // SESSION STATS
    // ============================================
    const totalSessions = await db.contentSession.count()
    const sessions7Days = await db.contentSession.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })
    const sessions30Days = await db.contentSession.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    })

    // Sessions by day (last 7 days) - SQLite compatible
    const sessionsByDay = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      
      const count = await db.contentSession.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } }
      })
      sessionsByDay.push({
        date: dayStart.toISOString().split('T')[0],
        day: dayStart.toLocaleDateString('fr', { weekday: 'short' }),
        sessions: count,
        errors: 0 // We don't track errors yet
      })
    }

    // ============================================
    // CONTENT STATS
    // ============================================
    const completedSessions = await db.contentSession.findMany({
      where: { status: 'COMPLETED' },
      select: { thumbnails: true, socialPosts: true, metadata: true }
    })

    let thumbnailsCount = 0
    let socialPostsCount = 0
    let seoMetadataCount = 0

    completedSessions.forEach(session => {
      if (session.thumbnails) {
        try {
          const thumbs = JSON.parse(session.thumbnails)
          thumbnailsCount += Array.isArray(thumbs) ? thumbs.length : 1
        } catch { /* ignore */ }
      }
      if (session.socialPosts) {
        try {
          const posts = JSON.parse(session.socialPosts)
          socialPostsCount += Array.isArray(posts) ? posts.length : 1
        } catch { /* ignore */ }
      }
      if (session.metadata) {
        seoMetadataCount++
      }
    })

    // Content by day (last 7 days)
    const contentByDay = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      
      const sessions = await db.contentSession.findMany({
        where: { 
          createdAt: { gte: dayStart, lte: dayEnd },
          status: 'COMPLETED'
        },
        select: { thumbnails: true, socialPosts: true, metadata: true }
      })

      let thumbs = 0, posts = 0, seo = 0
      sessions.forEach(s => {
        if (s.thumbnails) {
          try { thumbs += JSON.parse(s.thumbnails).length } catch {}
        }
        if (s.socialPosts) {
          try { posts += JSON.parse(s.socialPosts).length } catch {}
        }
        if (s.metadata) seo++
      })

      contentByDay.push({
        day: dayStart.toLocaleDateString('fr', { weekday: 'short' }),
        thumbnails: thumbs,
        posts: posts,
        seo: seo
      })
    }

    // ============================================
    // REVENUE STATS
    // ============================================
    // Calculate MRR from active subscriptions
    let mrr = 0
    subscriptions.forEach(sub => {
      mrr += sub.plan?.priceMonthly || 0
    })

    // Revenue by plan
    const revenueByPlanMap: Record<string, { mrr: number; users: number }> = {}
    subscriptions.forEach(sub => {
      const planName = sub.plan?.name || 'Unknown'
      if (!revenueByPlanMap[planName]) {
        revenueByPlanMap[planName] = { mrr: 0, users: 0 }
      }
      revenueByPlanMap[planName].mrr += sub.plan?.priceMonthly || 0
      revenueByPlanMap[planName].users++
    })

    const revenueByPlan = Object.entries(revenueByPlanMap).map(([plan, data]) => ({
      plan,
      mrr: data.mrr,
      users: data.users,
      arpu: data.users > 0 ? data.mrr / data.users : 0
    }))

    // ============================================
    // USAGE & COSTS
    // ============================================
    const totalCosts = await db.contentSession.aggregate({
      _sum: { cost: true }
    })
    const totalTokens = await db.contentSession.aggregate({
      _sum: { tokensUsed: true }
    })

    const totalCostsThisMonth = totalCosts._sum.cost || 0
    const totalTokensThisMonth = totalTokens._sum.tokensUsed || 0

    // ============================================
    // SUPPORT STATS
    // ============================================
    let openTickets = 0
    let pendingTickets = 0
    let resolvedTickets7Days = 0
    let recentTickets: any[] = []

    try {
      openTickets = await db.supportTicket.count({ where: { status: 'OPEN' } })
      pendingTickets = await db.supportTicket.count({ where: { status: 'PENDING' } })
      resolvedTickets7Days = await db.supportTicket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: { gte: sevenDaysAgo }
        }
      })

      // Recent tickets
      recentTickets = await db.supportTicket.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    } catch (e) {
      console.log('Support tickets not available yet')
    }

    // ============================================
    // MONTHLY GROWTH (last 6 months)
    // ============================================
    const monthlyGrowth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      const monthUsers = await db.user.count({
        where: { createdAt: { lte: monthEnd } }
      })
      
      const monthSessions = await db.contentSession.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } }
      })

      monthlyGrowth.push({
        month: monthStart.toLocaleString('fr', { month: 'short' }),
        users: monthUsers,
        sessions: monthSessions,
        mrr: mrr * (1 - i * 0.05) // Simulated growth trend
      })
    }

    // ============================================
    // SEO STATS
    // ============================================
    const avgSeoScore = 85 // Placeholder - would calculate from actual metadata
    const videosOptimized = seoMetadataCount

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsersCount,
        new7Days: newUsers7Days,
        byPlan: usersByPlan,
        growth: monthlyGrowth
      },
      sessions: {
        total: totalSessions,
        last7Days: sessions7Days,
        last30Days: sessions30Days,
        byDay: sessionsByDay
      },
      content: {
        thumbnails: thumbnailsCount,
        socialPosts: socialPostsCount,
        seoMetadata: seoMetadataCount,
        byDay: contentByDay
      },
      revenue: {
        mrr,
        arr: mrr * 12,
        byPlan: revenueByPlan,
        costsThisMonth: totalCostsThisMonth,
        tokensThisMonth: totalTokensThisMonth
      },
      support: {
        open: openTickets,
        pending: pendingTickets,
        resolved7Days: resolvedTickets7Days,
        recentTickets: recentTickets.map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt,
          user: t.userId
        }))
      },
      seo: {
        avgScore: avgSeoScore,
        videosOptimized
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
