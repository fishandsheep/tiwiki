import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ===== TI 百科 DB schema (Drizzle / better-sqlite3) =====
// 爬虫写事实字段;summaryZh/chinaSummary 为人工中文,爬虫不覆写。

export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey(), // "ti6"
  status: text('status').notNull().default('completed'), // completed | cancelled
  tiNo: integer('ti_no').notNull().unique(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  year: integer('year').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  country: text('country'),
  city: text('city'),
  venue: text('venue'),
  prizePoolUsd: integer('prize_pool_usd').default(0),
  championTeamId: text('champion_team_id'),
  runnerUpTeamId: text('runner_up_team_id'),
  // 人工中文原创,爬虫不覆写
  summaryZh: text('summary_zh').default(''),
  chinaSummary: text('china_summary').default(''),
  liquipediaUrl: text('liquipedia_url'),
  wikipediaUrl: text('wikipedia_url'),
  fetchedAt: text('fetched_at'),
})

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  region: text('region'),
  country: text('country'),
  logo: text('logo').default(''),
  logoSourceUrl: text('logo_source_url').default(''),
  descriptionZh: text('description_zh').default(''),
  liquipediaUrl: text('liquipedia_url'),
})

export const players = sqliteTable('players', {
  id: text('id').primaryKey(), // slug of handle
  handle: text('handle').notNull(),
  realName: text('real_name'),
  country: text('country'),
  region: text('region'),
  avatar: text('avatar').default(''),
  avatarSourceUrl: text('avatar_source_url').default(''),
  // 1-5 = 位置;coach/standin
  position: text('position'),
  liquipediaUrl: text('liquipedia_url'),
})

export const placements = sqliteTable(
  'placements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id),
    rank: integer('rank').notNull(),
    prizeUsd: integer('prize_usd').default(0),
    isChinaTeam: integer('is_china_team', { mode: 'boolean' }).default(false),
  },
  (t) => ({
    uniqTournamentTeam: uniqueIndex('placements_tournament_team_unique').on(
      t.tournamentId,
      t.teamId,
    ),
  }),
)

export const participants = sqliteTable(
  'participants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id),
    region: text('region'),
    country: text('country'),
    teamLogo: text('team_logo').default(''),
    teamLogoSourceUrl: text('team_logo_source_url').default(''),
    inviteType: text('invite_type'), // 直接邀请 / xx区预选 / 外卡赛
    seed: text('seed'),
  },
  (t) => ({
    uniqPartTournamentTeam: uniqueIndex('participants_tournament_team_unique').on(
      t.tournamentId,
      t.teamId,
    ),
  }),
)

export const rosters = sqliteTable(
  'rosters',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    role: text('role'), // 核心一/二号位/.../教练/替补
    playerAvatar: text('player_avatar').default(''),
    playerAvatarSourceUrl: text('player_avatar_source_url').default(''),
    playerCountry: text('player_country').default(''),
  },
  (t) => ({
    uniqRoster: uniqueIndex('rosters_tournament_team_player_unique').on(
      t.tournamentId,
      t.teamId,
      t.playerId,
    ),
  }),
)

export type Tournament = typeof tournaments.$inferSelect
export type Team = typeof teams.$inferSelect
export type Player = typeof players.$inferSelect
export type Placement = typeof placements.$inferSelect
export type Participant = typeof participants.$inferSelect
export type Roster = typeof rosters.$inferSelect
