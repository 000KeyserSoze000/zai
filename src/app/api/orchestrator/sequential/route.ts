import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-utils'
import { OrchestrationService } from '@/lib/orchestration'
import { z } from 'zod'

const requestSchema = z.object({
  sessionId: z.string().optional(),
  initialContext: z.string().min(1),
  steps: z.array(z.object({
    slug: z.string(),
    name: z.string().optional()
  })).min(1)
})

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await requireAuth(req)
    const userId = user.id

    // 2. Validate input
    const body = requestSchema.parse(await req.json())
    const { sessionId, initialContext, steps } = body

    // 3. Fetch default/active orchestration config to satisfy Service constructor
    // (Even if we use generic skill execution, the service needs a config)
    const configData = await db.orchestrationConfig.findFirst({
      where: { isActive: true }
    })

    if (!configData) {
      return apiError('Aucune configuration d\'orchestration active trouvée.', 500)
    }

    const config = {
      id: configData.id,
      name: configData.name,
      isDefault: configData.isDefault,
      categories: JSON.parse(configData.categories),
      steps: [] // We don't need fixed steps for dynamic sequential workflow
    }

    // 4. Initialize service
    const service = new OrchestrationService(config as any)

    // 5. Execute sequential workflow
    console.log(`[Sequential API] Starting workflow with ${steps.length} steps for user ${userId}`)
    const result = await service.executeSequentialWorkflow(sessionId || 'temp-session', initialContext, steps)

    // 6. Return results
    return NextResponse.json({
      success: true,
      data: result,
      logs: service.getLogs(),
      totalCost: service.getTotalCost()
    })

  } catch (error) {
    console.error('[Sequential API] Error:', error)
    if (error instanceof z.ZodError) {
      return apiError('Données invalides : ' + error.issues.map(e => e.message).join(', '), 400)
    }
    return apiError(error instanceof Error ? error.message : 'Échec de l\'exécution séquentielle', 500)
  }
}
