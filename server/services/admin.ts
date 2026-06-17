import Database from 'better-sqlite3'
import { dirname, resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

type AdminFieldType = 'text' | 'textarea' | 'integer' | 'boolean' | 'url' | 'select'

interface AdminField {
  name: string
  label: string
  type: AdminFieldType
  required?: boolean
  readonly?: boolean
  nullable?: boolean
  defaultValue?: string | number | boolean | null
  references?: 'tournaments' | 'teams' | 'players'
}

interface AdminTableConfig {
  name: AdminTableName
  label: string
  primaryKey: string
  primaryKeyType: 'text' | 'integer'
  searchFields: string[]
  defaultSort: string
  defaultDir: 'asc' | 'desc'
  fields: AdminField[]
}

export interface AdminListParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  dir?: string
}

export interface AdminListResult {
  rows: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
}

export interface AdminMeta {
  tables: Array<{
    name: string
    label: string
    primaryKey: string
    primaryKeyType: 'text' | 'integer'
    fields: AdminField[]
    rowCount: number
  }>
  options: Record<string, Array<{ value: string; label: string }>>
}

export class AdminValidationError extends Error {
  statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'AdminValidationError'
  }
}

export class AdminConflictError extends Error {
  statusCode = 409

  constructor(message: string) {
    super(message)
    this.name = 'AdminConflictError'
  }
}

const tableConfigs = {
  tournaments: {
    name: 'tournaments',
    label: '赛事',
    primaryKey: 'id',
    primaryKeyType: 'text',
    searchFields: ['id', 'name', 'name_zh', 'city', 'venue'],
    defaultSort: 'ti_no',
    defaultDir: 'desc',
    fields: [
      { name: 'id', label: 'ID', type: 'text', required: true, readonly: true },
      { name: 'status', label: '状态', type: 'select', required: true, defaultValue: 'completed' },
      { name: 'ti_no', label: 'TI 编号', type: 'integer', required: true },
      { name: 'name', label: '英文名', type: 'text', required: true },
      { name: 'name_zh', label: '中文名', type: 'text', nullable: true },
      { name: 'year', label: '年份', type: 'integer', required: true },
      { name: 'start_date', label: '开始日期', type: 'text', nullable: true },
      { name: 'end_date', label: '结束日期', type: 'text', nullable: true },
      { name: 'country', label: '国家/地区', type: 'text', nullable: true },
      { name: 'city', label: '城市', type: 'text', nullable: true },
      { name: 'venue', label: '场馆', type: 'text', nullable: true },
      { name: 'prize_pool_usd', label: '奖金池 USD', type: 'integer', defaultValue: 0 },
      { name: 'champion_team_id', label: '冠军队伍', type: 'select', nullable: true, references: 'teams' },
      { name: 'runner_up_team_id', label: '亚军队伍', type: 'select', nullable: true, references: 'teams' },
      { name: 'summary_zh', label: '赛事简介', type: 'textarea', defaultValue: '' },
      { name: 'china_summary', label: '中国战队总结', type: 'textarea', defaultValue: '' },
      { name: 'liquipedia_url', label: 'Liquipedia URL', type: 'url', nullable: true },
      { name: 'wikipedia_url', label: 'Wikipedia URL', type: 'url', nullable: true },
      { name: 'fetched_at', label: '抓取时间', type: 'text', nullable: true },
    ],
  },
  teams: {
    name: 'teams',
    label: '队伍',
    primaryKey: 'id',
    primaryKeyType: 'text',
    searchFields: ['id', 'name', 'name_zh', 'region', 'country'],
    defaultSort: 'name',
    defaultDir: 'asc',
    fields: [
      { name: 'id', label: 'ID', type: 'text', required: true, readonly: true },
      { name: 'name', label: '队名', type: 'text', required: true },
      { name: 'name_zh', label: '中文名', type: 'text', nullable: true },
      { name: 'region', label: '赛区', type: 'text', nullable: true },
      { name: 'country', label: '国家/地区', type: 'text', nullable: true },
      { name: 'logo', label: 'Logo', type: 'url', defaultValue: '' },
      { name: 'logo_source_url', label: 'Logo 来源', type: 'url', defaultValue: '' },
      { name: 'description_zh', label: '中文描述', type: 'textarea', defaultValue: '' },
      { name: 'liquipedia_url', label: 'Liquipedia URL', type: 'url', nullable: true },
    ],
  },
  players: {
    name: 'players',
    label: '选手',
    primaryKey: 'id',
    primaryKeyType: 'text',
    searchFields: ['id', 'handle', 'real_name', 'country', 'region', 'homepage_url', 'liquipedia_url'],
    defaultSort: 'handle',
    defaultDir: 'asc',
    fields: [
      { name: 'id', label: 'ID', type: 'text', required: true, readonly: true },
      { name: 'handle', label: 'ID/昵称', type: 'text', required: true },
      { name: 'real_name', label: '真实姓名', type: 'text', nullable: true },
      { name: 'country', label: '国家/地区', type: 'text', nullable: true },
      { name: 'region', label: '赛区', type: 'text', nullable: true },
      { name: 'avatar', label: '头像', type: 'text', defaultValue: '' },
      { name: 'avatar_source_url', label: '头像来源', type: 'url', defaultValue: '' },
      { name: 'position', label: '位置', type: 'text', nullable: true },
      { name: 'liquipedia_url', label: 'Liquipedia URL', type: 'url', nullable: true },
    ],
  },
  placements: {
    name: 'placements',
    label: '最终排名',
    primaryKey: 'id',
    primaryKeyType: 'integer',
    searchFields: ['tournament_id', 'team_id'],
    defaultSort: 'id',
    defaultDir: 'desc',
    fields: [
      { name: 'id', label: 'ID', type: 'integer', readonly: true },
      { name: 'tournament_id', label: '赛事', type: 'select', required: true, references: 'tournaments' },
      { name: 'team_id', label: '队伍', type: 'select', required: true, references: 'teams' },
      { name: 'rank', label: '排名', type: 'integer', required: true },
      { name: 'prize_usd', label: '奖金 USD', type: 'integer', defaultValue: 0 },
      { name: 'is_china_team', label: '中国战队', type: 'boolean', defaultValue: false },
    ],
  },
  participants: {
    name: 'participants',
    label: '参赛队伍',
    primaryKey: 'id',
    primaryKeyType: 'integer',
    searchFields: ['tournament_id', 'team_id', 'region', 'country', 'invite_type'],
    defaultSort: 'id',
    defaultDir: 'desc',
    fields: [
      { name: 'id', label: 'ID', type: 'integer', readonly: true },
      { name: 'tournament_id', label: '赛事', type: 'select', required: true, references: 'tournaments' },
      { name: 'team_id', label: '队伍', type: 'select', required: true, references: 'teams' },
      { name: 'region', label: '赛区', type: 'text', nullable: true },
      { name: 'country', label: '国家/地区', type: 'text', nullable: true },
      { name: 'invite_type', label: '出线方式', type: 'text', nullable: true },
      { name: 'seed', label: '种子', type: 'text', nullable: true },
    ],
  },
  rosters: {
    name: 'rosters',
    label: '阵容',
    primaryKey: 'id',
    primaryKeyType: 'integer',
    searchFields: ['tournament_id', 'team_id', 'player_id', 'role', 'player_country'],
    defaultSort: 'id',
    defaultDir: 'desc',
    fields: [
      { name: 'id', label: 'ID', type: 'integer', readonly: true },
      { name: 'tournament_id', label: '赛事', type: 'select', required: true, references: 'tournaments' },
      { name: 'team_id', label: '队伍', type: 'select', required: true, references: 'teams' },
      { name: 'player_id', label: '选手', type: 'select', required: true, references: 'players' },
      { name: 'role', label: '角色', type: 'text', nullable: true },
      { name: 'player_country', label: '选手国家', type: 'text', defaultValue: '' },
    ],
  },
} as const satisfies Record<string, AdminTableConfig>

export type AdminTableName = keyof typeof tableConfigs

const textPrimaryKeys = new Set(['tournaments', 'teams', 'players'])

function defaultDb() {
  const dbPath = resolve(process.cwd(), 'data/ti.db')
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

let singleton: Database.Database | null = null

function getDefaultDb() {
  singleton ||= defaultDb()
  return singleton
}

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

function slugifyMediaName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'player'
}

function getConfig(table: string): AdminTableConfig {
  const config = tableConfigs[table as AdminTableName]
  if (!config) throw new AdminValidationError('未知的数据表')
  return config
}

function normalizePage(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function normalizeFieldValue(field: AdminField, value: unknown, partial: boolean) {
  const hasValue = value !== undefined
  if (!hasValue) {
    if (partial) return { include: false, value: undefined }
    if (field.type === 'boolean') return { include: true, value: field.defaultValue ? 1 : 0 }
    if (field.defaultValue !== undefined) return { include: true, value: field.defaultValue }
    if (field.nullable) return { include: true, value: null }
    if (field.required) throw new AdminValidationError(`${field.label} 为必填项`)
    return { include: false, value: undefined }
  }

  if (field.type === 'boolean') {
    return { include: true, value: value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0 }
  }

  if (field.type === 'integer') {
    if (value === '' || value == null) {
      if (field.required) throw new AdminValidationError(`${field.label} 为必填项`)
      return { include: true, value: field.nullable ? null : field.defaultValue ?? 0 }
    }
    const parsed = Number(value)
    if (!Number.isInteger(parsed)) throw new AdminValidationError(`${field.label} 必须是整数`)
    return { include: true, value: parsed }
  }

  if (value == null || value === '') {
    if (field.required) throw new AdminValidationError(`${field.label} 为必填项`)
    return { include: true, value: field.nullable ? null : field.defaultValue ?? '' }
  }

  return { include: true, value: String(value).trim() }
}

function normalizeMutation(config: AdminTableConfig, input: Record<string, unknown>, partial: boolean) {
  const values: Record<string, unknown> = {}
  for (const field of config.fields) {
    if (field.readonly && (!textPrimaryKeys.has(config.name) || field.name === config.primaryKey)) {
      if (partial) continue
      if (field.name === config.primaryKey && config.primaryKeyType === 'integer') continue
    }
    const normalized = normalizeFieldValue(field, input[field.name], partial)
    if (normalized.include) values[field.name] = normalized.value
  }
  if (!partial && config.primaryKeyType === 'text' && !values[config.primaryKey]) {
    throw new AdminValidationError(`${config.primaryKey} 为必填项`)
  }
  return values
}

function sourcePathExt(sourceUrl: string, contentType = '') {
  const sourceExt = (() => {
    try {
      return resolve(fileURLToPath(sourceUrl))
    } catch {
      try {
        return new URL(sourceUrl).pathname
      } catch {
        return sourceUrl
      }
    }
  })()
  const ext = sourceExt.match(/\.(png|jpe?g|webp|gif|svg)$/i)?.[0].toLowerCase()
  if (ext) return ext
  if (contentType.includes('png')) return '.png'
  if (contentType.includes('webp')) return '.webp'
  if (contentType.includes('gif')) return '.gif'
  if (contentType.includes('svg')) return '.svg'
  return '.jpg'
}

function normalizeRemoteUrl(value: string) {
  if (value.startsWith('//')) return `https:${value}`
  if (value.startsWith('/') && !value.startsWith('/media/')) return `https://liquipedia.net${value}`
  return value
}

function liquipediaFileNameFrom(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const plain = trimmed.replace(/^(File|Image):/i, '').trim()
  if (plain !== trimmed) return plain
  try {
    const url = new URL(normalizeRemoteUrl(trimmed))
    const match = decodeURIComponent(url.pathname).match(/\/(?:dota2\/)?(?:File|Image):([^/?#]+)/i)
    return match?.[1] || ''
  } catch {
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(trimmed) ? trimmed : ''
  }
}

async function fetchForAvatar(url: string, options: RequestInit = {}) {
  try {
    return await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'tiwiki-admin/1.0',
        ...(options.headers || {}),
      },
      signal: options.signal || AbortSignal.timeout(20000),
    })
  } catch {
    throw new AdminValidationError('头像来源下载失败：无法连接或请求超时，请确认图片地址可访问')
  }
}

function curlForAvatar(url: string) {
  const tempOutput = resolve(tmpdir(), `tiwiki-avatar-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const result = spawnSync('curl', [
    '-L',
    '--fail',
    '--silent',
    '--show-error',
    '--max-time',
    '30',
    '--user-agent',
    'tiwiki-admin/1.0',
    '--output',
    tempOutput,
    '--write-out',
    '%{content_type}\\n%{url_effective}',
    url,
  ], { encoding: 'utf8' })

  try {
    if (result.status !== 0) {
      throw new AdminValidationError(`头像来源下载失败：${result.stderr || 'curl 请求失败'}`)
    }
    const [contentType = '', effectiveUrl = url] = result.stdout.split('\n')
    const bytes = readFileSync(tempOutput)
    return { bytes, contentType, effectiveUrl }
  } finally {
    rmSync(tempOutput, { force: true })
  }
}

function commandExists(command: string) {
  const result = spawnSync(command, ['-version'], { encoding: 'utf8' })
  return result.status === 0
}

function processAvatarWithConvert(inputPath: string, outputPath: string) {
  return spawnSync('convert', [
    inputPath,
    '-auto-orient',
    '-thumbnail',
    '160x160>',
    '-strip',
    outputPath,
  ], { encoding: 'utf8' })
}

function processAvatarWithFfmpeg(inputPath: string, outputPath: string) {
  return spawnSync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-frames:v',
    '1',
    '-update',
    '1',
    '-vf',
    'scale=if(gt(iw\\,160)\\,160\\,iw):if(gt(ih\\,160)\\,160\\,ih):force_original_aspect_ratio=decrease,format=yuvj420p',
    outputPath,
  ], { encoding: 'utf8' })
}

async function resolveLiquipediaImageUrl(source: string) {
  const fileName = liquipediaFileNameFrom(source)
  if (!fileName) return normalizeRemoteUrl(source)
  const apiUrl = new URL('https://liquipedia.net/dota2/api.php')
  apiUrl.searchParams.set('action', 'query')
  apiUrl.searchParams.set('titles', `File:${fileName}`)
  apiUrl.searchParams.set('prop', 'imageinfo')
  apiUrl.searchParams.set('iiprop', 'url')
  apiUrl.searchParams.set('format', 'json')
  apiUrl.searchParams.set('formatversion', '2')

  let payload: { query?: { pages?: Array<{ imageinfo?: Array<{ url?: string }> }> } }
  try {
    const response = await fetchForAvatar(apiUrl.toString())
    if (!response.ok) throw new AdminValidationError(`头像来源解析失败：HTTP ${response.status}`)
    payload = await response.json() as typeof payload
  } catch (error) {
    if (error instanceof AdminValidationError && !error.message.startsWith('头像来源下载失败')) throw error
    const fallback = curlForAvatar(apiUrl.toString())
    payload = JSON.parse(fallback.bytes.toString('utf8')) as typeof payload
  }
  const resolved = payload.query?.pages?.[0]?.imageinfo?.[0]?.url
  if (!resolved) throw new AdminValidationError('头像来源解析失败：没有找到对应的 Liquipedia 图片')
  return resolved
}

async function readMediaSource(sourceUrl: string) {
  const value = sourceUrl.trim()
  if (!value) return null
  if (value.startsWith('/media/')) {
    const localPath = resolve(process.cwd(), 'public', value.replace(/^\/+/, ''))
    if (!existsSync(localPath)) throw new AdminValidationError('头像来源对应的本地文件不存在')
    return { bytes: readFileSync(localPath), ext: sourcePathExt(localPath), normalizedSource: value }
  }
  if (value.startsWith('file:')) {
    const localPath = fileURLToPath(value)
    if (!existsSync(localPath)) throw new AdminValidationError('头像来源对应的本地文件不存在')
    return { bytes: readFileSync(localPath), ext: sourcePathExt(localPath), normalizedSource: value }
  }
  if (!/^(https?:)?\/\//i.test(value) && !value.startsWith('/') && !liquipediaFileNameFrom(value)) {
    throw new AdminValidationError('头像来源必须是图片 URL、Liquipedia File 名称、file 或 /media/ 路径')
  }

  const url = await resolveLiquipediaImageUrl(value)
  let bytes: Buffer
  let contentType = ''
  let normalizedSource = url
  try {
    const response = await fetchForAvatar(url)
    if (!response.ok) throw new AdminValidationError(`头像来源下载失败：HTTP ${response.status}`)
    contentType = response.headers.get('content-type') || ''
    bytes = Buffer.from(await response.arrayBuffer())
    normalizedSource = response.url || url
  } catch (error) {
    if (error instanceof AdminValidationError && !error.message.startsWith('头像来源下载失败')) throw error
    const fallback = curlForAvatar(url)
    bytes = fallback.bytes
    contentType = fallback.contentType
    normalizedSource = fallback.effectiveUrl
  }
  if (contentType && !contentType.startsWith('image/')) {
    throw new AdminValidationError('头像来源下载失败：地址返回的不是图片文件')
  }
  if (bytes.length > 8 * 1024 * 1024) throw new AdminValidationError('头像来源图片超过 8MB')
  return {
    bytes,
    ext: sourcePathExt(normalizedSource, contentType),
    normalizedSource,
  }
}

async function preparePlayerAvatar(playerId: string | number, sourceUrl: unknown) {
  const source = typeof sourceUrl === 'string' ? sourceUrl.trim() : ''
  if (!source) return {}
  const media = await readMediaSource(source)
  if (!media) return {}

  const mediaDir = resolve(process.cwd(), 'public/media/liquipedia/players')
  mkdirSync(mediaDir, { recursive: true })
  const slug = slugifyMediaName(String(playerId))
  const tempInput = resolve(tmpdir(), `${slug}-${Date.now()}${media.ext}`)
  const tempOutput = resolve(tmpdir(), `${slug}-${Date.now()}-160.jpg`)
  const finalPath = resolve(mediaDir, `${slug}.jpg`)
  const passthroughPath = resolve(mediaDir, `${slug}${media.ext}`)
  writeFileSync(tempInput, media.bytes)
  try {
    if (commandExists('convert')) {
      const result = processAvatarWithConvert(tempInput, tempOutput)
      if (result.status !== 0) {
        throw new AdminValidationError(`头像图片处理失败：${result.stderr || 'ImageMagick convert 执行失败'}`)
      }
      rmSync(finalPath, { force: true })
      rmSync(passthroughPath, { force: true })
      writeFileSync(finalPath, readFileSync(tempOutput))
      return {
        avatar: `/media/liquipedia/players/${slug}.jpg`,
        avatar_source_url: media.normalizedSource,
      }
    }

    if (commandExists('ffmpeg')) {
      const result = processAvatarWithFfmpeg(tempInput, tempOutput)
      if (result.status !== 0) {
        throw new AdminValidationError(`头像图片处理失败：${result.stderr || 'ffmpeg 执行失败'}`)
      }
      rmSync(finalPath, { force: true })
      rmSync(passthroughPath, { force: true })
      writeFileSync(finalPath, readFileSync(tempOutput))
      return {
        avatar: `/media/liquipedia/players/${slug}.jpg`,
        avatar_source_url: media.normalizedSource,
      }
    }

    rmSync(finalPath, { force: true })
    rmSync(passthroughPath, { force: true })
    writeFileSync(passthroughPath, media.bytes)
    return {
      avatar: `/media/liquipedia/players/${slug}${media.ext}`,
      avatar_source_url: media.normalizedSource,
    }
  } finally {
    rmSync(tempInput, { force: true })
    rmSync(tempOutput, { force: true })
  }
}

function mapSqliteError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new AdminConflictError('记录已存在，违反唯一约束')
    }
    if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new AdminConflictError('关联数据不存在，或该记录仍被其他数据引用')
    }
    if (code.startsWith('SQLITE_CONSTRAINT')) {
      throw new AdminConflictError('数据违反数据库约束')
    }
  }
  throw error
}

export function createAdminService(sqlite: Database.Database = singleton) {
  return {
    getMeta(): AdminMeta {
      const tables = Object.values(tableConfigs).map((config) => ({
        name: config.name,
        label: config.label,
        primaryKey: config.primaryKey,
        primaryKeyType: config.primaryKeyType,
        fields: config.fields,
        rowCount: (sqlite.prepare(`select count(*) as total from ${quoteIdent(config.name)}`).get() as { total: number }).total,
      }))
      const options = {
        tournaments: sqlite
          .prepare("select id as value, coalesce(name_zh, name, id) || ' (' || id || ')' as label from tournaments order by ti_no desc")
          .all() as Array<{ value: string; label: string }>,
        teams: sqlite
          .prepare("select id as value, coalesce(name_zh, name, id) || ' (' || id || ')' as label from teams order by name asc")
          .all() as Array<{ value: string; label: string }>,
        players: sqlite
          .prepare("select id as value, handle || ' (' || id || ')' as label from players order by handle asc")
          .all() as Array<{ value: string; label: string }>,
      }
      return { tables, options }
    },

    listRows(table: string, params: AdminListParams = {}): AdminListResult {
      const config = getConfig(table)
      const page = normalizePage(params.page, 1, 1, 100000)
      const pageSize = normalizePage(params.pageSize, 25, 5, 100)
      const sort = config.fields.some((field) => field.name === params.sort) ? String(params.sort) : config.defaultSort
      const dir = String(params.dir).toLowerCase() === 'asc' ? 'asc' : config.defaultDir
      const search = String(params.search || '').trim()
      const where = search
        ? ` where ${config.searchFields.map((field) => `${quoteIdent(field)} like @search`).join(' or ')}`
        : ''
      const queryParams = search ? { search: `%${search}%` } : {}
      const total = sqlite
        .prepare(`select count(*) as total from ${quoteIdent(config.name)}${where}`)
        .get(queryParams) as { total: number }
      const rows = sqlite
        .prepare(
          `select * from ${quoteIdent(config.name)}${where} order by ${quoteIdent(sort)} ${dir} limit @limit offset @offset`,
        )
        .all({ ...queryParams, limit: pageSize, offset: (page - 1) * pageSize }) as Record<string, unknown>[]
      return { rows, total: total.total, page, pageSize }
    },

    async createRow(table: string, input: Record<string, unknown>) {
      const config = getConfig(table)
      const values = normalizeMutation(config, input, false)
      if (config.name === 'players' && values.avatar_source_url) {
        Object.assign(values, await preparePlayerAvatar(values.id as string, values.avatar_source_url))
      }
      const columns = Object.keys(values)
      if (!columns.length) throw new AdminValidationError('没有可写入字段')
      const sql = `insert into ${quoteIdent(config.name)} (${columns.map(quoteIdent).join(', ')}) values (${columns
        .map((column) => `@${column}`)
        .join(', ')})`
      try {
        const result = sqlite.prepare(sql).run(values)
        const id = config.primaryKeyType === 'integer' ? result.lastInsertRowid : values[config.primaryKey]
        return this.getRow(config.name, id)
      } catch (error) {
        mapSqliteError(error)
      }
    },

    async updateRow(table: string, id: string | number, input: Record<string, unknown>) {
      const config = getConfig(table)
      const values = normalizeMutation(config, input, true)
      delete values[config.primaryKey]
      if (config.name === 'players' && values.avatar_source_url) {
        Object.assign(values, await preparePlayerAvatar(id, values.avatar_source_url))
      }
      const columns = Object.keys(values)
      if (!columns.length) throw new AdminValidationError('没有可更新字段')
      const sql = `update ${quoteIdent(config.name)} set ${columns
        .map((column) => `${quoteIdent(column)} = @${column}`)
        .join(', ')} where ${quoteIdent(config.primaryKey)} = @__id`
      try {
        const result = sqlite.prepare(sql).run({ ...values, __id: id })
        if (!result.changes) throw new AdminValidationError('记录不存在')
        return this.getRow(config.name, id)
      } catch (error) {
        mapSqliteError(error)
      }
    },

    deleteRow(table: string, id: string | number) {
      const config = getConfig(table)
      try {
        const result = sqlite
          .prepare(`delete from ${quoteIdent(config.name)} where ${quoteIdent(config.primaryKey)} = @id`)
          .run({ id })
        if (!result.changes) throw new AdminValidationError('记录不存在')
        return { ok: true }
      } catch (error) {
        mapSqliteError(error)
      }
    },

    getRow(table: string, id: unknown) {
      const config = getConfig(table)
      return (
        (sqlite
          .prepare(`select * from ${quoteIdent(config.name)} where ${quoteIdent(config.primaryKey)} = @id`)
          .get({ id }) as Record<string, unknown> | undefined) || null
      )
    },
  }
}

const defaultAdminService = () => createAdminService(getDefaultDb())

export const adminService = {
  getMeta: () => defaultAdminService().getMeta(),
  listRows: (table: string, params?: AdminListParams) => defaultAdminService().listRows(table, params),
  createRow: (table: string, input: Record<string, unknown>) => defaultAdminService().createRow(table, input),
  updateRow: (table: string, id: string | number, input: Record<string, unknown>) =>
    defaultAdminService().updateRow(table, id, input),
  deleteRow: (table: string, id: string | number) => defaultAdminService().deleteRow(table, id),
  getRow: (table: string, id: unknown) => defaultAdminService().getRow(table, id),
}
