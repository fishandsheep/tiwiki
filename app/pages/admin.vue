<template>
  <div class="min-h-screen bg-bg-main text-ink-main">
    <header class="border-b border-edge bg-bg-main/95">
      <div class="mx-auto flex min-h-14 max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
        <NuxtLink to="/" class="flex min-h-10 items-center gap-2">
          <span class="ti-wordmark grid h-8 w-8 place-items-center rounded-md bg-gold text-sm text-bg-main">ti</span>
          <span class="font-bold text-ink-main">数据管理台</span>
        </NuxtLink>
        <span class="chip">本地 data/ti.db</span>
        <div class="ml-auto flex items-center gap-2">
          <button class="admin-button admin-button-ghost" type="button" :disabled="pending" @click="refreshAll">
            刷新
          </button>
          <button class="admin-button admin-button-primary" type="button" @click="startCreate">
            新增记录
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)_390px]">
      <aside class="admin-panel self-start">
        <div class="mb-3 text-xs font-medium text-ink-muted">数据表</div>
        <div class="space-y-1">
          <button
            v-for="table in meta?.tables || []"
            :key="table.name"
            type="button"
            class="admin-table-button"
            :class="table.name === selectedTableName ? 'admin-table-button-active' : ''"
            @click="selectTable(table.name)"
          >
            <span>{{ table.label }}</span>
            <span class="font-mono text-xs text-ink-muted">{{ table.rowCount }}</span>
          </button>
        </div>
      </aside>

      <section class="min-w-0 space-y-3">
        <div class="admin-panel">
          <div class="flex flex-wrap items-end gap-3">
            <label class="min-w-0 flex-1">
              <span class="admin-label">搜索</span>
              <input
                v-model="searchInput"
                class="admin-input"
                type="search"
                placeholder="按 ID、名称、赛区或关联字段搜索"
                @keyup.enter="applySearch"
              >
            </label>
            <label class="w-28">
              <span class="admin-label">每页</span>
              <select v-model.number="pageSize" class="admin-input" @change="goPage(1)">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
            <button class="admin-button admin-button-ghost" type="button" @click="applySearch">查询</button>
          </div>
        </div>

        <div class="admin-panel min-w-0 p-0">
          <div class="flex min-h-12 items-center justify-between border-b border-edge px-3">
            <div>
              <h1 class="text-base font-bold">{{ selectedTable?.label || '数据表' }}</h1>
              <p class="text-xs text-ink-muted">共 {{ listData?.total || 0 }} 条</p>
            </div>
            <p v-if="statusMessage" class="text-sm text-gold">{{ statusMessage }}</p>
          </div>

          <div v-if="pending" class="space-y-2 p-3">
            <div v-for="i in 8" :key="i" class="h-9 rounded-md bg-bg-subtle/70" />
          </div>
          <div v-else-if="errorText" class="p-4 text-sm text-[rgb(var(--red-bright))]">{{ errorText }}</div>
          <div v-else-if="!(listData?.rows || []).length" class="p-8 text-center text-sm text-ink-muted">
            没有匹配记录
          </div>
          <div v-else class="scroll-x overflow-x-auto">
            <table class="admin-grid-table">
              <thead>
                <tr>
                  <th v-for="field in tableColumns" :key="field.name">
                    <button class="inline-flex items-center gap-1" type="button" @click="toggleSort(field.name)">
                      {{ field.label }}
                      <span class="font-mono text-[10px] text-ink-muted">{{ sortMark(field.name) }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in listData?.rows || []"
                  :key="rowKey(row)"
                  :class="rowKey(row) === selectedRowKey ? 'bg-gold/10' : ''"
                  @click="selectRow(row)"
                >
                  <td v-for="field in tableColumns" :key="field.name">
                    <span :class="field.type === 'integer' || field.type === 'boolean' ? 'font-mono' : ''">
                      {{ formatCell(row[field.name], field) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-edge px-3 py-3">
            <p class="text-xs text-ink-muted">第 {{ page }} / {{ totalPages }} 页</p>
            <div class="flex gap-2">
              <button class="admin-button admin-button-ghost" type="button" :disabled="page <= 1" @click="goPage(page - 1)">
                上一页
              </button>
              <button class="admin-button admin-button-ghost" type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">
                下一页
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside class="admin-panel self-start">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold">{{ formMode === 'create' ? '新增记录' : '编辑记录' }}</h2>
            <p class="text-xs text-ink-muted">{{ selectedTable?.label }}</p>
          </div>
          <button class="admin-button admin-button-ghost" type="button" @click="startCreate">清空</button>
        </div>

        <form class="space-y-3" @submit.prevent="saveForm">
          <label v-for="field in selectedTable?.fields || []" :key="field.name" class="block">
            <span class="admin-label">
              {{ field.label }}
              <span v-if="field.required" class="text-gold">*</span>
            </span>

            <select
              v-if="field.name === 'status'"
              v-model="form[field.name]"
              class="admin-input"
              :disabled="isFieldReadonly(field)"
            >
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
            <select
              v-else-if="field.references"
              v-model="form[field.name]"
              class="admin-input"
              :disabled="isFieldReadonly(field)"
            >
              <option value="">未设置</option>
              <option v-for="option in meta?.options[field.references] || []" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="form[field.name]"
              class="admin-input min-h-28 resize-y"
              :disabled="isFieldReadonly(field)"
            />
            <label v-else-if="field.type === 'boolean'" class="inline-flex min-h-10 items-center gap-2 text-sm text-ink-main">
              <input v-model="form[field.name]" class="h-4 w-4 accent-gold" type="checkbox" :disabled="isFieldReadonly(field)">
              是
            </label>
            <input
              v-else
              v-model="form[field.name]"
              class="admin-input"
              :type="field.type === 'integer' ? 'number' : field.type === 'url' ? 'url' : 'text'"
              :disabled="isFieldReadonly(field)"
            >
          </label>

          <div v-if="formError" class="rounded-md border border-red/50 bg-red/10 px-3 py-2 text-sm text-[rgb(var(--red-bright))]">
            {{ formError }}
          </div>

          <div class="flex gap-2 pt-2">
            <button class="admin-button admin-button-primary flex-1" type="submit" :disabled="saving">
              {{ saving ? '保存中' : '保存' }}
            </button>
            <button class="admin-button admin-button-ghost" type="button" :disabled="saving" @click="resetFormFromSelected">
              还原
            </button>
          </div>
        </form>

        <div v-if="formMode === 'edit'" class="mt-5 border-t border-edge pt-4">
          <div v-if="confirmDelete" class="space-y-2">
            <p class="text-sm text-ink-muted">再次点击确认删除。有关联引用时数据库会拒绝删除。</p>
            <div class="flex gap-2">
              <button class="admin-button admin-button-danger flex-1" type="button" :disabled="saving" @click="deleteSelected">
                确认删除
              </button>
              <button class="admin-button admin-button-ghost" type="button" @click="confirmDelete = false">取消</button>
            </div>
          </div>
          <button v-else class="admin-button admin-button-danger w-full" type="button" @click="confirmDelete = true">
            删除记录
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdminField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'integer' | 'boolean' | 'url' | 'select'
  required?: boolean
  readonly?: boolean
  nullable?: boolean
  defaultValue?: string | number | boolean | null
  references?: 'tournaments' | 'teams' | 'players'
}

interface AdminTable {
  name: string
  label: string
  primaryKey: string
  primaryKeyType: 'text' | 'integer'
  fields: AdminField[]
  rowCount: number
}

interface AdminMeta {
  tables: AdminTable[]
  options: Record<string, Array<{ value: string; label: string }>>
}

interface AdminList {
  rows: Array<Record<string, unknown>>
  total: number
  page: number
  pageSize: number
}

const { data: meta, refresh: refreshMeta } = await useFetch<AdminMeta>('/api/admin/meta')

const selectedTableName = ref(meta.value?.tables[0]?.name || 'tournaments')
const page = ref(1)
const pageSize = ref(25)
const search = ref('')
const searchInput = ref('')
const sort = ref('')
const dir = ref<'asc' | 'desc'>('desc')
const selectedRow = ref<Record<string, unknown> | null>(null)
const form = reactive<Record<string, unknown>>({})
const formMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const formError = ref('')
const statusMessage = ref('')
const confirmDelete = ref(false)

const selectedTable = computed(() => meta.value?.tables.find((table) => table.name === selectedTableName.value) || null)
const tableColumns = computed(() => (selectedTable.value?.fields || []).slice(0, 7))
const selectedRowKey = computed(() => (selectedRow.value ? rowKey(selectedRow.value) : ''))

const {
  data: listData,
  pending,
  error,
  refresh: refreshRows,
} = await useAsyncData<AdminList>(
  'admin-table-data',
  () => $fetch(`/api/admin/${selectedTableName.value}`, {
    query: {
      page: page.value,
      pageSize: pageSize.value,
      search: search.value,
      sort: sort.value || undefined,
      dir: dir.value,
    },
  }),
  { watch: [selectedTableName, page, pageSize, search, sort, dir] },
)

const totalPages = computed(() => Math.max(1, Math.ceil((listData.value?.total || 0) / pageSize.value)))
const errorText = computed(() => error.value?.statusMessage || error.value?.message || '')

watch(selectedTable, () => {
  startCreate()
  sort.value = selectedTable.value?.primaryKey || ''
  dir.value = selectedTable.value?.primaryKeyType === 'integer' ? 'desc' : 'asc'
}, { immediate: true })

function rowKey(row: Record<string, unknown>) {
  const key = selectedTable.value?.primaryKey || 'id'
  return String(row[key] ?? '')
}

function selectTable(name: string) {
  selectedTableName.value = name
  page.value = 1
  search.value = ''
  searchInput.value = ''
}

function emptyValue(field: AdminField) {
  if (field.type === 'boolean') return Boolean(field.defaultValue)
  if (field.type === 'integer') return field.defaultValue ?? ''
  return field.defaultValue ?? ''
}

function startCreate() {
  selectedRow.value = null
  formMode.value = 'create'
  formError.value = ''
  confirmDelete.value = false
  for (const key of Object.keys(form)) delete form[key]
  for (const field of selectedTable.value?.fields || []) {
    form[field.name] = emptyValue(field)
  }
}

function selectRow(row: Record<string, unknown>) {
  selectedRow.value = { ...row }
  formMode.value = 'edit'
  formError.value = ''
  confirmDelete.value = false
  resetFormFromSelected()
}

function resetFormFromSelected() {
  for (const key of Object.keys(form)) delete form[key]
  const source = selectedRow.value || {}
  for (const field of selectedTable.value?.fields || []) {
    if (field.type === 'boolean') {
      form[field.name] = source[field.name] === 1 || source[field.name] === true
    } else {
      form[field.name] = source[field.name] ?? emptyValue(field)
    }
  }
}

function isFieldReadonly(field: AdminField) {
  return formMode.value === 'edit' && !!field.readonly
}

function formatCell(value: unknown, field: AdminField) {
  if (field.type === 'boolean') return value ? '是' : '否'
  if (value == null || value === '') return '—'
  return String(value)
}

function sortMark(fieldName: string) {
  if (sort.value !== fieldName) return ''
  return dir.value === 'asc' ? '↑' : '↓'
}

function toggleSort(fieldName: string) {
  if (sort.value === fieldName) {
    dir.value = dir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value = fieldName
    dir.value = 'asc'
  }
}

function applySearch() {
  search.value = searchInput.value.trim()
  page.value = 1
}

function goPage(nextPage: number) {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value)
}

async function refreshAll() {
  await Promise.all([refreshMeta(), refreshRows()])
}

function payloadForSave() {
  const payload: Record<string, unknown> = {}
  for (const field of selectedTable.value?.fields || []) {
    if (formMode.value === 'edit' && field.readonly) continue
    payload[field.name] = form[field.name]
  }
  return payload
}

async function saveForm() {
  if (!selectedTable.value) return
  saving.value = true
  formError.value = ''
  statusMessage.value = ''
  try {
    if (formMode.value === 'create') {
      const row = await $fetch<Record<string, unknown>>(`/api/admin/${selectedTable.value.name}`, {
        method: 'POST',
        body: payloadForSave(),
      })
      selectedRow.value = row
      formMode.value = 'edit'
      statusMessage.value = '已新增'
    } else if (selectedRow.value) {
      const row = await $fetch<Record<string, unknown>>(
        `/api/admin/${selectedTable.value.name}/${encodeURIComponent(rowKey(selectedRow.value))}`,
        { method: 'PATCH', body: payloadForSave() },
      )
      selectedRow.value = row
      statusMessage.value = '已保存'
    }
    await refreshAll()
    resetFormFromSelected()
  } catch (error) {
    formError.value = readableError(error)
  } finally {
    saving.value = false
  }
}

async function deleteSelected() {
  if (!selectedTable.value || !selectedRow.value) return
  saving.value = true
  formError.value = ''
  try {
    await $fetch(`/api/admin/${selectedTable.value.name}/${encodeURIComponent(rowKey(selectedRow.value))}`, {
      method: 'DELETE',
    })
    statusMessage.value = '已删除'
    await refreshAll()
    startCreate()
  } catch (error) {
    formError.value = readableError(error)
  } finally {
    saving.value = false
    confirmDelete.value = false
  }
}

function readableError(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    return data?.statusMessage || data?.message || '操作失败'
  }
  return error instanceof Error ? error.message : '操作失败'
}

useHead({ title: '数据管理台 — TI 百科' })
</script>
