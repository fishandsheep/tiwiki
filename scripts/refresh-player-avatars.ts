import Database from 'better-sqlite3'
import { preparePlayerAvatar } from '../server/services/admin'

type PlayerRow = {
  id: string
  handle: string
  avatar_source_url: string
  avatar: string
}

const db = new Database('data/ti.db')
db.pragma('foreign_keys = ON')

async function main() {
  const onlyIds = new Set(process.argv.slice(2).filter(Boolean))
  const players = db
    .prepare(`
      select id, handle, avatar_source_url, avatar
      from players
      where trim(coalesce(avatar_source_url, '')) != ''
      order by id asc
    `)
    .all() as PlayerRow[]
  const queue = onlyIds.size ? players.filter((player) => onlyIds.has(player.id)) : players

  const update = db.prepare(`
    update players
    set avatar = @avatar,
        avatar_source_url = @avatar_source_url
    where id = @id
  `)

  let ok = 0
  let failed = 0

  for (const player of queue) {
    try {
      const processed = await preparePlayerAvatar(player.id, player.avatar_source_url)
      if (!processed.avatar || !processed.avatar_source_url) {
        failed += 1
        console.error(`skip ${player.id}: empty result`)
        continue
      }
      update.run({
        id: player.id,
        avatar: processed.avatar,
        avatar_source_url: processed.avatar_source_url,
      })
      ok += 1
      console.log(`ok ${player.id} ${player.handle} -> ${processed.avatar}`)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`fail ${player.id} ${player.handle}: ${message}`)
    }
  }

  console.log(`done total=${queue.length} ok=${ok} failed=${failed}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    db.close()
  })
