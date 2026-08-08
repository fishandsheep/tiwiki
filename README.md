# Ti 百科 — Dota2 国际邀请赛中文资料库

中文 Dota2 Ti（The International）历届赛事资料站。Mobile First 自适应，深色电竞风。

## 站点信息

- GitHub 仓库：[fishandsheep/tiwiki](https://github.com/fishandsheep/tiwiki)
- 工信部备案：[鲁ICP备2026035857号-1](https://beian.miit.gov.cn/#/Integrated/index)

## 技术栈

- [Nuxt 4](https://nuxt.com) + Vue 3（`nuxt generate` 静态生成，`crawlLinks` 预渲染全部 `/ti/:id` 详情页）
- [Tailwind CSS](https://tailwindcss.com)（via `@nuxtjs/tailwindcss`）
- [Drizzle ORM](https://orm.drizzle.team) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)，数据存于 `data/ti.db`（随仓库提交，构建可复现）
- [Nitro](https://nitro.unjs.io) server routes（`server/api/*`）：构建期被预渲染调用以取数，结果烘焙进静态 HTML
- Python 爬虫（`scripts/crawler`）：从 Liquipedia 抓事实数据，先写临时库并审计，成功后原子替换 `data/ti.db`
- TypeScript，部署目标：Vercel（见下文「部署 Vercel」）

## 目录

```
app/
├── components/        # layout / Ti/ ranking，扁平命名（<TiCard/> 非 <TiTiCard/>）
├── composables/       # 数据 join 层（useTournaments/useTournament/useRankings/useChinaPerformance/tiData）
├── pages/             # index, ti/index, ti/[id], china, rankings
├── types/ti.ts        # shared 类型兼容导出
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

shared/
└── types/ti.ts        # 前后端共享领域模型
```

## 数据流

```
Liquipedia → 临时 DB → data audit → static generate/verify → data/ti.db（原子替换）
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
npm run data:audit       # 校验事实、实体关系、新鲜度与媒体引用
npm run data:report      # 生成核心字段 diff、revision 与审计报告
npm test                 # server + crawler 测试
npm run typecheck        # Nuxt/Vue TypeScript 检查
npm run verify:static    # 拒绝包含 admin/API/DB 的生产产物
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
- `/search` 赛事 / 战队 / 选手静态搜索
- `/about` 来源、许可与非官方声明

## 部署 Vercel

### 方式 A — 静态生成（推荐，零运行时数据库）

`nuxt generate` 在**构建期**读 `data/ti.db`，把每个详情页渲染成静态 HTML。运行时只发静态文件，**不触碰数据库** —— 规避了 `better-sqlite3` 原生模块在 Vercel serverless（Lambda）上的兼容问题，也规避了只读文件系统下 WAL 写入失败的问题。

1. 在 Vercel 导入仓库 `fishandsheep/ti-wiki`。
2. Project Settings：
   - **Framework Preset**：`Nuxt`（或 `Other`，均可）
   - **Build Command**：覆盖为 `npm run generate`
   - **Output Directory**：`.output/public`
   - **Install Command**：`npm install`（默认即可）
   - **Node Version**：`22.x`（仓库通过 `.nvmrc` 与 `package.json` 固定）
3. Deploy。`.output/public` 即为静态站点。

更新数据的闭环（本地跑爬虫，Vercel 只负责重建静态站）：

```bash
npm run db:refresh        # 本地 Python 爬虫刷新并审计临时库
npm run data:report       # 生成 revision、审计与字段差异报告
git switch -c data/refresh-YYYYMMDD
git add data/ti.db data/refresh-reports
git commit -m "data: propose verified TI refresh"
git push -u origin HEAD  # 提交 PR，审核通过后再合并
```

> `better-sqlite3` 在 Vercel **构建期**（Node + amazonlinux）会 `npm rebuild`，构建镜像自带 `python3 make g++`，可直接编译。**运行时**无数据库访问，故无需关心 Lambda 上的原生二进制。

### 生产安全边界

SSR、Serverless API、线上 SQLite 与远程管理台不受支持。`npm run build` 等同静态生成；部署物只能是通过 `npm run verify:static` 的 `.output/public`。本地 `/admin` 无认证，只能通过绑定 `127.0.0.1` 的 `npm run dev` 使用；生产构建会移除页面并拒绝管理 API。

## 数据说明

- 核心事实按官方来源、Liquipedia、Wikipedia 的顺序核验；字段值、观察值、revision、抓取时间与人工覆盖分开记录。新抓取值若冲突，保留旧已核验值并标记待核验。
- 中国战队判定统一读 `placements.is_china_team`，单源真理，不重复维护。
- 补全/修正数据：运行 `npm run db:refresh` 创建经审计的原子刷新；核心字段变化通过 PR 人工批准。
- 未知数字保存为 `NULL`；进行中显示“待定”，取消赛事显示“不适用”，真实 `0` 不作兜底。
- 第三方媒体须逐文件核验权利；未核验队标与头像不进入公开构建。

## 许可

- 源码：MIT。
- 原创中文内容：CC BY-SA 4.0。
- Liquipedia 衍生内容：CC BY-SA 3.0，须保留来源与 revision。
- 第三方名称、商标与媒体不包含在上述通用许可中。

本站为非商业、非官方项目，未获 Valve 背书。数据契约、运维与许可细节见 `docs/`。

## 内容来源说明

首页“30 秒读懂 Ti”中的赛事特点说明参考 Valve / Dota 2 官方材料：

- 官方 Battle Pass / Compendium 页面说明玩家购买内容会贡献一定比例进入 TI 奖金池。
- Dota 2 官方社区转播公告和 Steam Support 授权页说明非商业社区转播、公播放映等规则。
- Valve 官方 TI 页面与新闻稿将赛事描述为玩家、队伍、创作者和社区共同参与的年度 Dota 聚会。

## 设计 token

深色默认，色值存为 RGB 通道（`app/assets/css/main.css` 的 CSS 变量），供 Tailwind alpha 修饰符使用：
`--bg-main` `--bg-card` `--gold` `--red` `--border` 等。
