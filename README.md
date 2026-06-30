# Ti 百科 — Dota2 国际邀请赛中文资料库

中文 Dota2 Ti（The International）历届赛事资料站。Mobile First 自适应，深色电竞风。

## 技术栈

- [Nuxt 4](https://nuxt.com) + Vue 3（`nuxt generate` 静态生成，`crawlLinks` 预渲染全部 `/ti/:id` 详情页）
- [Tailwind CSS](https://tailwindcss.com)（via `@nuxtjs/tailwindcss`）
- [Drizzle ORM](https://orm.drizzle.team) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)，数据存于 `data/ti.db`（随仓库提交，构建可复现）
- [Nitro](https://nitro.unjs.io) server routes（`server/api/*`）：构建期被预渲染调用以取数，结果烘焙进静态 HTML
- Python 爬虫（`scripts/crawler`）：从 Liquipedia 抓事实数据，**仅本地运行**，写回 `data/ti.db`
- TypeScript，部署目标：Vercel（见下文「部署 Vercel」）

## 目录

```
app/
├── components/        # layout / Ti/ ranking，扁平命名（<TiCard/> 非 <TiTiCard/>）
├── composables/       # 数据 join 层（useTournaments/useTournament/useRankings/useChinaPerformance/tiData）
├── pages/             # index, ti/index, ti/[id], china, rankings
├── types/ti.ts        # 数据模型 TS 接口
└── assets/css/main.css # token + 组件类

server/
├── api/               # Nitro 路由：tournaments, rankings, china, stats
├── db/                # Drizzle client + schema
├── services/ti.ts     # 业务查询层
└── tests/             # tsx --test

scripts/
├── crawler/           # Python 抓取/解析/入库（fetch/parse/load/refresh）
└── db/migrate.ts      # Drizzle 迁移：建表

data/
└── ti.db              # SQLite 单文件，随仓库提交（-wal/-shm 已 gitignore）
```

## 数据流

```
Liquipedia → scripts/crawler (Python) → data/ti.db
                                         │
              server/api/*  ←(Drizzle)──┘
                     │  构建期被预渲染调用
                     ▼
              composables → pages → 静态 HTML (.output/public)
```

爬虫写「事实字段」（队伍、名次、奖金、阵容、参赛队伍等）；`summaryZh` / `chinaSummary` 为人工中文原创，爬虫不覆写。

当前数据约定：

- 页面中赛事缩写统一显示为 `Ti`，如 `Ti6`、`Ti15`
- 站内“收录届数”只统计实际举办的 Ti，2020 年取消届不计入正式届数
- `/ti` 仍保留 2020 取消届入口作资料存档，但以置灰和删除线区别于正常赛事
- `Ti15` 预选赛已结束，详情页会展示全部参赛战队与选手
- `Ti15` 最终排名未定，排名位先显示 `-`，并按赛区罗列

## 命令

```bash
npm install              # 装依赖（postinstall 自动 nuxt prepare）
npm run dev              # 开发 http://localhost:3000
npm run generate         # SSG → .output/public（读 ti.db 烘焙静态页）
npm run preview          # 本地预览生产构建

npm run db:migrate       # Drizzle 建表/迁移（首次或 schema 变更后）
npm run db:refresh       # 跑 Python 爬虫刷新 ti.db（需 .venv）
npm test                 # server + crawler 测试
```

Python 依赖（仅爬虫需要）：

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/crawler/requirements.txt
```

## 路由

- `/` 首页
- `/ti` 历届赛事列表
- `/ti/:tiNo` Ti 详情（如 `/ti/6`）
- `/china` 中国战队专题
- `/rankings` 榜单（冠军 / 奖金池 / 中国战队 / 选手冠军）

## 部署 Vercel

### 方式 A — 静态生成（推荐，零运行时数据库）

`nuxt generate` 在**构建期**读 `data/ti.db`，把每个详情页渲染成静态 HTML。运行时只发静态文件，**不触碰数据库** —— 规避了 `better-sqlite3` 原生模块在 Vercel serverless（Lambda）上的兼容问题，也规避了只读文件系统下 WAL 写入失败的问题。

1. 在 Vercel 导入仓库 `fishandsheep/ti-wiki`。
2. Project Settings：
   - **Framework Preset**：`Nuxt`（或 `Other`，均可）
   - **Build Command**：覆盖为 `npm run generate`
   - **Output Directory**：`.output/public`
   - **Install Command**：`npm install`（默认即可）
   - **Node Version**：`20.x` 或 `22.x`
3. Deploy。`.output/public` 即为静态站点。

更新数据的闭环（本地跑爬虫，Vercel 只负责重建静态站）：

```bash
npm run db:refresh        # 本地 Python 爬虫刷新 data/ti.db
git add data/ti.db
git commit -m "data: refresh ti.db"
git push                  # Vercel 自动触发 generate 重建
```

> `better-sqlite3` 在 Vercel **构建期**（Node + amazonlinux）会 `npm rebuild`，构建镜像自带 `python3 make g++`，可直接编译。**运行时**无数据库访问，故无需关心 Lambda 上的原生二进制。

### 方式 B — Nitro SSR（高级，一般无需）

若需运行时 API（如服务端鉴权、动态查询），改用 Nitro Vercel preset：

- **Framework Preset**：`Nuxt`，**Build Command**：`npm run build`（非 generate）
- 此时 `server/api/*` 作为 serverless function 部署，`better-sqlite3` 在 Lambda 运行时被加载 —— 需确保 `.output/server` 内的 prebuilt 二进制匹配 Lambda runtime（`node:22`、x86_64）。常见坑：版本不匹配 → `Error: Cannot find module .../node_sqlite3.node`。
- Lambda 文件系统**只读**，`data/ti.db` 可读但 `journal_mode=WAL`（见 `server/db/client.ts`）会尝试写 `-wal/-shm` 失败。若走此路需改成只读连接，或把 DB 拷到 `/tmp`。

绝大多数展示型场景，**方式 A 足够**。

## 数据说明

- 爬虫抓取的事实字段来自 Liquipedia；**人工中文摘要需校对**（headline：冠军、亚军、奖金池、日期、场馆为权威来源；部分低名次奖金为近似）。
- 中国战队判定统一读 `placements.is_china_team`，单源真理，不重复维护。
- 补全/修正数据：本地 `npm run db:refresh` 重抓，或直接改 `ti.db` 后提交。

## 内容来源说明

首页“30 秒读懂 Ti”中的赛事特点说明参考 Valve / Dota 2 官方材料：

- 官方 Battle Pass / Compendium 页面说明玩家购买内容会贡献一定比例进入 TI 奖金池。
- Dota 2 官方社区转播公告和 Steam Support 授权页说明非商业社区转播、公播放映等规则。
- Valve 官方 TI 页面与新闻稿将赛事描述为玩家、队伍、创作者和社区共同参与的年度 Dota 聚会。

## 设计 token

深色默认，色值存为 RGB 通道（`app/assets/css/main.css` 的 CSS 变量），供 Tailwind alpha 修饰符使用：
`--bg-main` `--bg-card` `--gold` `--red` `--border` 等。
