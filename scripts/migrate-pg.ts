import { PrismaClient as PgClient } from '@prisma/client'
import { PrismaClient as SqliteClient } from '../prisma/generated/sqlite-client'
import * as dotenv from 'dotenv'

dotenv.config()

const pg = new PgClient({
  datasources: {
    db: {
      url: 'postgresql://florentpostgree:laureenqWeR55t@212.227.84.152:5432/contentpropostgree'
    }
  }
})
const sqlite = new SqliteClient({
  datasources: {
    db: {
      url: 'file:C:/Users/Flo/zai/db/custom.db'
    }
  }
})

async function migrate() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...')

  try {
    // 0. Cleanup PG (Optional but safer for fresh start)
    console.log('🧹 Cleaning up existing data in PostgreSQL...')
    await pg.supportTicket.deleteMany();
    await pg.usageRecord.deleteMany();
    await pg.contentSession.deleteMany();
    await pg.subscription.deleteMany();
    await pg.plan.deleteMany();
    await pg.skillVersion.deleteMany();
    await pg.skillTool.deleteMany();
    await pg.skill.deleteMany();
    await pg.agent.deleteMany();
    await pg.agentCategory.deleteMany();
    await pg.businessProfile.deleteMany();
    await pg.subscription.deleteMany();
    await pg.plan.deleteMany();
    await pg.user.deleteMany();
    await pg.tool.deleteMany();
    await pg.siteSettings.deleteMany();
    await pg.legalPage.deleteMany();
    await pg.emailTemplate.deleteMany();
    
    // 1. Users
    const users = await sqlite.user.findMany()
    console.log(`Migrating ${users.length} users...`)
    for (const data of users) {
      await pg.user.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 2. Business Profiles
    const profiles = await sqlite.businessProfile.findMany()
    console.log(`Migrating ${profiles.length} business profiles...`)
    for (const data of profiles) {
      await pg.businessProfile.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 3. Agent Categories
    const categories = await sqlite.agentCategory.findMany()
    console.log(`Migrating ${categories.length} agent categories...`)
    for (const data of categories) {
      await pg.agentCategory.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 4. Agents
    const agents = await sqlite.agent.findMany()
    console.log(`Migrating ${agents.length} agents...`)
    for (const data of agents) {
      await pg.agent.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 5. Skills
    const skills = await sqlite.skill.findMany()
    console.log(`Migrating ${skills.length} skills...`)
    for (const data of skills) {
      await pg.skill.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 6. Tools
    const tools = await sqlite.tool.findMany()
    console.log(`Migrating ${tools.length} tools...`)
    for (const data of tools) {
      await pg.tool.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 7. SkillTools (Relation Many-to-Many)
    const skillTools = await sqlite.skillTool.findMany()
    console.log(`Migrating ${skillTools.length} skill-tool relations...`)
    for (const data of skillTools) {
      await pg.skillTool.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 8. Site Settings
    const settings = await sqlite.siteSettings.findMany()
    console.log(`Migrating ${settings.length} site settings...`)
    for (const data of settings) {
      await pg.siteSettings.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 9. Legal Pages
    const legalPages = await sqlite.legalPage.findMany()
    console.log(`Migrating ${legalPages.length} legal pages...`)
    for (const data of legalPages) {
      await pg.legalPage.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

    // 10. Email Templates
    const emailTemplates = await sqlite.emailTemplate.findMany()
    console.log(`Migrating ${emailTemplates.length} email templates...`)
    for (const data of emailTemplates) {
      await pg.emailTemplate.upsert({
        where: { id: data.id },
        update: {},
        create: data
      })
    }

     // 11. Plans
     const plans = await sqlite.plan.findMany()
     console.log(`Migrating ${plans.length} plans...`)
     for (const data of plans) {
       await pg.plan.upsert({
         where: { id: data.id },
         update: {},
         create: data
       })
     }

     // 12. Subscriptions
     const subscriptions = await sqlite.subscription.findMany()
     console.log(`Migrating ${subscriptions.length} subscriptions...`)
     for (const data of subscriptions) {
       await pg.subscription.upsert({
         where: { id: data.id },
         update: {},
         create: data
       })
     }

    console.log('✅ Migration completed successfully!')
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    if (error.message) console.error('Error message:', error.message)
    if (error.stack) console.error('Stack trace:', error.stack)
    // Detailed prisma error if available
    if (error.code) console.error('Error code:', error.code)
  } finally {
    await pg.$disconnect()
    await sqlite.$disconnect()
  }
}

migrate()
