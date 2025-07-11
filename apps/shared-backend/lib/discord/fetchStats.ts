// lib/discord/fetchStats.ts
import { Client, GatewayIntentBits, TextBasedChannel, Message, ThreadChannel, PermissionsBitField } from 'discord.js'

interface FetchStatsOptions {
  token: string
  guildId: string
  backfill?: boolean
  backfillYear?: number
  onLog?: (message: string) => void
}

interface MonthlyStats {
  memberCount: number
  totalMessages: number
  uniquePosters: number
}

// Helper function to get readable channel type names
function getChannelTypeName(type: number): string {
  switch (type) {
    case 0: return 'Text Channel'
    case 5: return 'Announcement Channel'
    case 11: return 'Forum Post'
    case 15: return 'Forum Channel'
    case 16: return 'Media Channel'
    case 13: return 'Stage Channel'
    case 2: return 'Voice Channel'
    case 14: return 'Directory Channel'
    case 4: return 'Category'
    default: return `Unknown Type (${type})`
  }
}

export async function fetchDiscordStats({
  token,
  guildId,
  backfill = false,
  backfillYear = new Date().getFullYear(),
  onLog,
}: FetchStatsOptions): Promise<Record<string, MonthlyStats>> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  })

  // Helper function to log messages
  const log = (message: string) => {
    if (onLog) {
      onLog(message)
    } else {
      console.log(message)
    }
  }

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        log(`✅ Logged in as ${client.user?.tag}`)
        const guild = await client.guilds.fetch(guildId)
        const memberCount = guild.memberCount

        // Ensure we have all channels loaded
        log(`🔄 Fetching all guild channels...`)
        await guild.channels.fetch()
        log(`✅ Guild channels loaded`)

        // Get bot member to check permissions
        const botMember = await guild.members.fetch(client.user!.id)

        // Check if we have the right permissions to see all channels
        const botPermissions = botMember.permissions.toArray()
        log(`🔑 Bot permissions: ${botPermissions.join(', ')}`)

        // Check if we have ViewChannel permission at guild level
        const hasGuildViewPermission = botMember.permissions.has(PermissionsBitField.Flags.ViewChannel)
        log(`👁️  Bot has guild-level ViewChannel permission: ${hasGuildViewPermission}`)

        const allChannels = Array.from(guild.channels.cache.values())
        const allTextChannels = Array.from(guild.channels.cache.filter(c => c.isTextBased()).values())

        // Get forum channels and fetch their posts
        const forumChannels = allChannels.filter(c => c.type === 15) // Forum Channel type
        log(`\n🔍 Found ${forumChannels.length} forum channels`)

        const forumPosts: any[] = []
        for (const forum of forumChannels) {
          try {
            log(`  → Fetching posts from forum: ${forum.name}`)

            // Check bot's permissions for this specific forum
            const botPermissionsInForum = forum.permissionsFor(botMember)
            const canViewForum = botPermissionsInForum?.has(PermissionsBitField.Flags.ViewChannel)
            const canReadHistory = botPermissionsInForum?.has(PermissionsBitField.Flags.ReadMessageHistory)

            log(`    🔑 Bot permissions in ${forum.name}:`)
            log(`      - ViewChannel: ${canViewForum ? '✅' : '❌'}`)
            log(`      - ReadMessageHistory: ${canReadHistory ? '✅' : '❌'}`)

            if (!canViewForum) {
              log(`    ❌ Bot cannot view forum ${forum.name} - missing ViewChannel permission`)
              continue
            }

            const posts = await forum.threads.fetchActive()
            log(`    ✅ Found ${posts.threads.size} active posts`)

            // Also fetch archived posts
            const archivedPosts = await forum.threads.fetchArchived()
            log(`    ✅ Found ${archivedPosts.threads.size} archived posts`)

            // Combine all posts
            const allPosts = new Map([...posts.threads, ...archivedPosts.threads])
            log(`    📊 Total posts in ${forum.name}: ${allPosts.size}`)

            // Add posts to our collection (avoiding duplicates)
            for (const [id, post] of allPosts) {
              if (!forumPosts.find(p => p.id === post.id)) {
                forumPosts.push(post)
              }
            }
          } catch (err: any) {
            log(`    ❌ Failed to fetch posts from forum ${forum.name}: ${err.message || err}`)

            // Try to get more specific error information
            if (err.message && err.message.includes('Missing Access')) {
              log(`    💡 This forum is likely private. To access it:`)
              log(`      1. Make sure the bot has a role with ViewChannel permission`)
              log(`      2. Check if the forum has role-based permissions that exclude the bot`)
              log(`      3. Verify the bot's role is above the @everyone role in the server`)
            }
          }
        }

        log(`📊 Total forum posts found: ${forumPosts.length}`)

        // Combine regular text channels with forum posts
        const allTextChannelsWithPosts = [...allTextChannels, ...forumPosts]

        // Test access to each channel to see if we can actually fetch messages
        log(`\n🧪 Testing channel access...`)
        const accessibleChannels: any[] = []
        const inaccessibleChannels: any[] = []

        for (const channel of allTextChannelsWithPosts) {
          try {
            // Try to fetch a single message to test access
            await (channel as TextBasedChannel).messages.fetch({ limit: 1 })
            accessibleChannels.push(channel)
            log(`  ✅ ${channel.name} - Accessible`)
          } catch (err: any) {
            inaccessibleChannels.push(channel)
            const errorMsg = err?.message || 'Unknown error'
            log(`  ❌ ${channel.name} - Inaccessible: ${errorMsg}`)
          }
        }

        log(`\n📊 Channel access summary:`)
        log(`  ✅ Accessible channels: ${accessibleChannels.length}`)
        log(`  ❌ Inaccessible channels: ${inaccessibleChannels.length}`)

        // Use the accessible channels for processing
        const channels = accessibleChannels

        log(`🔍 Total channels in guild: ${guild.channels.cache.size}`)
        log(`🔍 Text-based channels: ${allTextChannels.length}`)
        log(`🔍 Forum posts: ${forumPosts.length}`)
        log(`🔍 Total text channels + forum posts: ${allTextChannelsWithPosts.length}`)
        log(`🔍 Viewable text channels: ${channels.length}`)
        log(`🔍 Missing channels: ${allTextChannelsWithPosts.length - channels.length}`)

        // Show all channels to see what we're missing
        log(`\n📋 ALL channels in guild:`)
        allChannels.forEach((channel, index) => {
          const isTextBased = channel.isTextBased()
          const typeName = getChannelTypeName(channel.type)
          log(`  ${index + 1}. ${channel.name} (${channel.id}) - Type: ${channel.type} (${typeName}) - Text-based: ${isTextBased ? 'Yes' : 'No'}`)
        })

        // Log all text channels and their accessibility with more details
        log(`📋 All text channels and their status:`)
        allTextChannelsWithPosts.forEach((channel, index) => {
          const isAccessible = accessibleChannels.includes(channel)
          const status = isAccessible ? '✅ Accessible' : '❌ No Access'
          const channelType = channel.type === 11 ? 'Forum Post' : getChannelTypeName(channel.type)
          log(`  ${index + 1}. ${channel.name} (${channel.id}) - Type: ${channel.type} (${channelType}) - ${status}`)
        })

        log(`\n📋 Channels to process:`)
        channels.forEach((channel, index) => {
          log(`  ${index + 1}. ${channel.name} (${channel.id}) - Type: ${channel.type}`)
        })

        // Analyze missing channels by type with more details
        const missingChannels = inaccessibleChannels

        const missingByType: Record<string, { count: number; channels: string[] }> = {}
        missingChannels.forEach(channel => {
          const typeName = getChannelTypeName(channel.type)
          if (!missingByType[typeName]) {
            missingByType[typeName] = { count: 0, channels: [] }
          }
          missingByType[typeName].count++
          missingByType[typeName].channels.push(channel.name)
        })

        if (Object.keys(missingByType).length > 0) {
          log(`\n❌ Missing channels by type:`)
          Object.entries(missingByType).forEach(([type, info]) => {
            log(`  ${type}: ${info.count} channels`)
            info.channels.forEach(channelName => {
              log(`    - ${channelName}`)
            })
          })
        }

        // Also log channels that might be private but not caught by the filter
        const potentiallyPrivateChannels = accessibleChannels.filter(c => {
          // Check if channel has permission overwrites (might indicate private channel)
          const hasOverwrites = 'permissionOverwrites' in c && c.permissionOverwrites && c.permissionOverwrites.cache.size > 0
          return hasOverwrites
        })

        if (potentiallyPrivateChannels.length > 0) {
          log(`\n🔒 Potentially private channels (have permission overwrites):`)
          potentiallyPrivateChannels.forEach((channel, index) => {
            log(`  ${index + 1}. ${channel.name} (${channel.id}) - Type: ${channel.type}`)
          })
        }

        const now = new Date()
        const data: Record<string, MonthlyStats> = {}

        if (backfill) {
          log(`🔄 Backfilling Jan → last full month of ${backfillYear}`)

          /** map YYYY-MM → { totalMessages, uniquePosters:Set<userId> } **/
          const buckets: Record<string, { totalMessages: number; uniquePosters: Set<string> }> = {}
          const startDate = new Date(backfillYear, 0, 1)      // Jan 1, backfillYear
          const endDate = new Date(now.getFullYear(), now.getMonth(), 1)  // 1st of current month

          log(`📅 Processing period: ${startDate.toISOString()} → ${endDate.toISOString()}`)
          log(`📊 Found ${channels.length} channels to process`)

          for (const channel of channels) {
            log(`\n📝 Processing channel: ${channel.name} (${channel.id})`)

            // — process the main channel —
            let lastId: string | null = null
            let messageCount = 0
            try {
              log(`  → Fetching main channel messages...`)
              let fetchCount = 0
              outer: while (true) {
                const msgs = await (channel as TextBasedChannel).messages.fetch({ limit: 100, before: lastId || undefined })
                if (msgs.size === 0) break
                fetchCount++

                for (const msg of msgs.values()) {
                  const ts = msg.createdAt
                  if (ts < startDate) break outer
                  if (ts < endDate) {
                    const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`
                    if (!buckets[key]) buckets[key] = { totalMessages: 0, uniquePosters: new Set() }
                    buckets[key].totalMessages++
                    if (!msg.author.bot) buckets[key].uniquePosters.add(msg.author.id)
                    messageCount++
                  }
                }

                lastId = msgs.last()?.id || null
                if (!lastId) break
                await new Promise(r => setTimeout(r, 500))
              }
              log(`    → Fetched ${fetchCount} batches of messages`)
              log(`  ✅ Main channel: processed ${messageCount} messages`)
            } catch (err: any) {
              if (err?.message && err.message.includes('Missing Access')) {
                log(`⚠️  Skipping channel ${channel.name} - Missing Access (likely private channel)`)
              } else {
                log(`❌ Failed to process main channel ${channel.name}: ${err.message || err}`)
              }
              continue
            }

            // — now include all thread messages for that channel —
            if ('threads' in channel && channel.threads) {
              log(`  → Processing threads for channel ${channel.name}...`)

              // active threads with pagination
              let active = { threads: new Map<string, ThreadChannel>() }
              try {
                log(`    → Fetching active threads with pagination...`)
                let before: string | null = null
                let totalActiveThreads = 0
                let fetchCount = 0

                while (true) {
                  fetchCount++
                  const options: any = { limit: 100 }
                  if (before) options.before = before

                  const activeBatch = await channel.threads.fetchActive(options)
                  console.log(`      → Batch ${fetchCount}: fetched ${activeBatch.threads.size} active threads`)

                  if (activeBatch.threads.size === 0) break

                  // Merge threads into our collection
                  for (const [id, thread] of activeBatch.threads) {
                    active.threads.set(id, thread)
                  }

                  totalActiveThreads = active.threads.size
                  before = activeBatch.threads.last()?.id || null

                  if (!before) break

                  // Rate limiting
                  await new Promise(r => setTimeout(r, 1000))
                }

                console.log(`    ✅ Found ${totalActiveThreads} total active threads (${fetchCount} batches)`)
              } catch (err: any) {
                if (err?.message && err.message.includes('Missing Access')) {
                  console.warn(`⚠️  Skipping active threads in channel ${channel.name} - Missing Access`)
                } else {
                  console.error(`❌ Failed to fetch active threads in channel ${channel.name}: ${err.message || err}`)
                }
              }

              for (const thread of active.threads.values()) {
                console.log(`    → Processing active thread: ${thread.name} (${thread.id})`)
                let threadLastId: string | null = null
                let threadMessageCount = 0
                try {
                  while (true) {
                    const msgs = await thread.messages.fetch({ limit: 100, before: threadLastId || undefined })
                    if (msgs.size === 0) break
                    for (const msg of msgs.values()) {
                      const ts = msg.createdAt
                      if (ts < startDate) break
                      if (ts < endDate) {
                        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`
                        if (!buckets[key]) buckets[key] = { totalMessages: 0, uniquePosters: new Set() }
                        buckets[key].totalMessages++
                        if (!msg.author.bot) buckets[key].uniquePosters.add(msg.author.id)
                        threadMessageCount++
                      }
                    }
                    threadLastId = msgs.last()?.id || null
                    if (!threadLastId) break
                    await new Promise(r => setTimeout(r, 500))
                  }
                  console.log(`      ✅ Active thread ${thread.name}: processed ${threadMessageCount} messages`)
                } catch (err: any) {
                  console.error(`❌ Failed to process active thread ${thread.name} in channel ${channel.name}: ${err.message || err}`)
                  continue
                }
              }

              // archived threads with pagination
              let archived = { threads: new Map<string, ThreadChannel>() }
              try {
                console.log(`    → Fetching archived threads with pagination...`)
                let before: string | null = null
                let totalArchivedThreads = 0
                let fetchCount = 0

                while (true) {
                  fetchCount++
                  const options: any = { limit: 100 }
                  if (before) options.before = before

                  const archivedBatch = await channel.threads.fetchArchived(options)
                  console.log(`      → Batch ${fetchCount}: fetched ${archivedBatch.threads.size} archived threads`)

                  if (archivedBatch.threads.size === 0) break

                  // Merge threads into our collection
                  for (const [id, thread] of archivedBatch.threads) {
                    archived.threads.set(id, thread)
                  }

                  totalArchivedThreads = archived.threads.size
                  before = archivedBatch.threads.last()?.id || null

                  if (!before) break

                  // Rate limiting
                  await new Promise(r => setTimeout(r, 1000))
                }

                console.log(`    ✅ Found ${totalArchivedThreads} total archived threads (${fetchCount} batches)`)
              } catch (err: any) {
                if (err?.message && err.message.includes('Missing Access')) {
                  console.warn(`⚠️  Skipping archived threads in channel ${channel.name} - Missing Access`)
                } else {
                  console.error(`❌ Failed to fetch archived threads in channel ${channel.name}: ${err.message || err}`)
                }
              }

              for (const thread of archived.threads.values()) {
                console.log(`    → Processing archived thread: ${thread.name} (${thread.id})`)
                let threadLastId: string | null = null
                let threadMessageCount = 0
                try {
                  while (true) {
                    const msgs = await thread.messages.fetch({ limit: 100, before: threadLastId || undefined })
                    if (msgs.size === 0) break
                    for (const msg of msgs.values()) {
                      const ts = msg.createdAt
                      if (ts < startDate) break
                      if (ts < endDate) {
                        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`
                        if (!buckets[key]) buckets[key] = { totalMessages: 0, uniquePosters: new Set() }
                        buckets[key].totalMessages++
                        if (!msg.author.bot) buckets[key].uniquePosters.add(msg.author.id)
                        threadMessageCount++
                      }
                    }
                    threadLastId = msgs.last()?.id || null
                    if (!threadLastId) break
                    await new Promise(r => setTimeout(r, 500))
                  }
                  console.log(`      ✅ Archived thread ${thread.name}: processed ${threadMessageCount} messages`)
                } catch (err: any) {
                  console.error(`❌ Failed to process archived thread ${thread.name} in channel ${channel.name}: ${err.message || err}`)
                  continue
                }
              }
            }
          }

          console.log(`\n📊 Processing results...`)
          // populate data object per month
          for (let m = 0; m < now.getMonth(); m++) {
            const dt = new Date(backfillYear, m, 1)
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
            const monthStats = buckets[key] || { totalMessages: 0, uniquePosters: new Set<string>() }
            data[key] = {
              memberCount,
              totalMessages: monthStats.totalMessages,
              uniquePosters: monthStats.uniquePosters.size
            }
            console.log(`  → ${key}: ${monthStats.totalMessages} msgs, ${monthStats.uniquePosters.size} uniquePosters, ${memberCount} members`)
          }

        } else {
          // — last-month only —
          const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
          const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`

          console.log(`📅 Processing last month: ${monthStart.toISOString()} → ${monthEnd.toISOString()}`)
          console.log(`📅 Current date: ${now.toISOString()}`)
          console.log(`📊 Found ${channels.length} channels to process`)

          let totalMessages = 0
          const uniquePostersSet = new Set<string>()

          for (const channel of channels) {
            console.log(`\n📝 Processing channel: ${channel.name} (${channel.id})`)

            // main channel
            let lastId: string | null = null
            let messageCount = 0
            try {
              console.log(`  → Fetching main channel messages...`)
              let fetchCount = 0
              while (true) {
                const msgs = await (channel as TextBasedChannel).messages.fetch({ limit: 100, before: lastId || undefined })
                if (msgs.size === 0) break
                fetchCount++

                for (const msg of msgs.values()) {
                  const ts = msg.createdAt
                  if (ts >= monthStart && ts < monthEnd) {
                    totalMessages++
                    if (!msg.author.bot) uniquePostersSet.add(msg.author.id)
                    messageCount++
                  }
                  if (ts < monthStart) { msgs.clear(); break }
                }
                lastId = msgs.last()?.id || null
                if (!lastId) break
                await new Promise(r => setTimeout(r, 500))
              }
              console.log(`    → Fetched ${fetchCount} batches of messages`)
              console.log(`  ✅ Main channel: processed ${messageCount} messages`)
            } catch (err: any) {
              if (err?.message && err.message.includes('Missing Access')) {
                console.warn(`⚠️  Skipping channel ${channel.name} - Missing Access (likely private channel)`)
              } else {
                console.error(`❌ Failed to process main channel ${channel.name}: ${err.message || err}`)
              }
              continue
            }

            // threads in channel
            if ('threads' in channel && channel.threads) {
              console.log(`  → Processing threads for channel ${channel.name}...`)

              // active threads with pagination
              let active = { threads: new Map<string, ThreadChannel>() }
              try {
                console.log(`    → Fetching active threads with pagination...`)
                let before: string | null = null
                let totalActiveThreads = 0
                let fetchCount = 0

                while (true) {
                  fetchCount++
                  const options: any = { limit: 100 }
                  if (before) options.before = before

                  const activeBatch = await channel.threads.fetchActive(options)
                  console.log(`      → Batch ${fetchCount}: fetched ${activeBatch.threads.size} active threads`)

                  if (activeBatch.threads.size === 0) break

                  // Merge threads into our collection
                  for (const [id, thread] of activeBatch.threads) {
                    active.threads.set(id, thread)
                  }

                  totalActiveThreads = active.threads.size
                  before = activeBatch.threads.last()?.id || null

                  if (!before) break

                  // Rate limiting
                  await new Promise(r => setTimeout(r, 1000))
                }

                console.log(`    ✅ Found ${totalActiveThreads} total active threads (${fetchCount} batches)`)
              } catch (err: any) {
                if (err?.message && err.message.includes('Missing Access')) {
                  console.warn(`⚠️  Skipping active threads in channel ${channel.name} - Missing Access`)
                } else {
                  console.error(`❌ Failed to fetch active threads in channel ${channel.name}: ${err.message || err}`)
                }
              }

              for (const thread of active.threads.values()) {
                console.log(`    → Processing active thread: ${thread.name} (${thread.id})`)
                let threadLastId: string | null = null
                let threadMessageCount = 0
                try {
                  while (true) {
                    const msgs = await thread.messages.fetch({ limit: 100, before: threadLastId || undefined })
                    if (msgs.size === 0) break
                    for (const msg of msgs.values()) {
                      const ts = msg.createdAt
                      if (ts >= monthStart && ts < monthEnd) {
                        totalMessages++
                        if (!msg.author.bot) uniquePostersSet.add(msg.author.id)
                        threadMessageCount++
                      }
                      if (ts < monthStart) { msgs.clear(); break }
                    }
                    threadLastId = msgs.last()?.id || null
                    if (!threadLastId) break
                    await new Promise(r => setTimeout(r, 500))
                  }
                  console.log(`      ✅ Active thread ${thread.name}: processed ${threadMessageCount} messages`)
                } catch (err: any) {
                  console.error(`❌ Failed to process active thread ${thread.name} in channel ${channel.name}: ${err.message || err}`)
                  continue
                }
              }

              // archived threads with pagination
              let archived = { threads: new Map<string, ThreadChannel>() }
              try {
                console.log(`    → Fetching archived threads with pagination...`)
                let before: string | null = null
                let totalArchivedThreads = 0
                let fetchCount = 0

                while (true) {
                  fetchCount++
                  const options: any = { limit: 100 }
                  if (before) options.before = before

                  const archivedBatch = await channel.threads.fetchArchived(options)
                  console.log(`      → Batch ${fetchCount}: fetched ${archivedBatch.threads.size} archived threads`)

                  if (archivedBatch.threads.size === 0) break

                  // Merge threads into our collection
                  for (const [id, thread] of archivedBatch.threads) {
                    archived.threads.set(id, thread)
                  }

                  totalArchivedThreads = archived.threads.size
                  before = archivedBatch.threads.last()?.id || null

                  if (!before) break

                  // Rate limiting
                  await new Promise(r => setTimeout(r, 1000))
                }

                console.log(`    ✅ Found ${totalArchivedThreads} total archived threads (${fetchCount} batches)`)
              } catch (err: any) {
                if (err?.message && err.message.includes('Missing Access')) {
                  console.warn(`⚠️  Skipping archived threads in channel ${channel.name} - Missing Access`)
                } else {
                  console.error(`❌ Failed to fetch archived threads in channel ${channel.name}: ${err.message || err}`)
                }
              }

              for (const thread of archived.threads.values()) {
                console.log(`    → Processing archived thread: ${thread.name} (${thread.id})`)
                let threadLastId: string | null = null
                let threadMessageCount = 0
                try {
                  while (true) {
                    const msgs = await thread.messages.fetch({ limit: 100, before: threadLastId || undefined })
                    if (msgs.size === 0) break
                    for (const msg of msgs.values()) {
                      const ts = msg.createdAt
                      if (ts >= monthStart && ts < monthEnd) {
                        totalMessages++
                        if (!msg.author.bot) uniquePostersSet.add(msg.author.id)
                        threadMessageCount++
                      }
                      if (ts < monthStart) { msgs.clear(); break }
                    }
                    threadLastId = msgs.last()?.id || null
                    if (!threadLastId) break
                    await new Promise(r => setTimeout(r, 500))
                  }
                  console.log(`      ✅ Archived thread ${thread.name}: processed ${threadMessageCount} messages`)
                } catch (err: any) {
                  console.error(`❌ Failed to process archived thread ${thread.name} in channel ${channel.name}: ${err.message || err}`)
                  continue
                }
              }
            }
          }

          data[key] = {
            memberCount,
            totalMessages,
            uniquePosters: uniquePostersSet.size
          }
          console.log(`\n📊 Final stats for ${key}: ${totalMessages} msgs, ${uniquePostersSet.size} uniquePosters, ${memberCount} members`)
        }

        client.destroy()
        resolve(data)
      } catch (error) {
        client.destroy()
        reject(error)
      }
    })

    client.login(token)
  })
}
