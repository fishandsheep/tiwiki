---
name: TI 百科
description: Dota2 TI 历届赛事中文资料库 — 奖杯陈列馆
colors:
  aegis-gold: "#d5974b"
  crimson-signal: "#b23125"
  crimson-bright: "#ec553d"
  ember: "#de5826"
  obsidian-void: "#080706"
  vault-panel: "#151210"
  vault-subtle: "#221d19"
  ink-bright: "#f1eae0"
  ink-mute: "#b4a89a"
  edge-faint: "#41342b"
typography:
  display:
    fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,-apple-system,Segoe UI,sans-serif'
    fontWeight: 900
    letterSpacing: "-0.02em"
    lineHeight: 1.05
  headline:
    fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif'
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif'
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif'
    fontWeight: 500
    letterSpacing: "0.02em"
  mono:
    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'
    fontWeight: 400
  wordmark:
    fontFamily: '"Cormorant Garamond","Times New Roman",serif'
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.aegis-gold}"
    textColor: "{colors.obsidian-void}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-bright}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.vault-panel}"
    textColor: "{colors.ink-bright}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.vault-subtle}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  chip-gold:
    backgroundColor: "{colors.aegis-gold}"
    textColor: "{colors.obsidian-void}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  ti-link-card:
    backgroundColor: "{colors.vault-panel}"
    textColor: "{colors.ink-bright}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: TI 百科

## 1. Overview

**Creative North Star: "The Trophy Vault（奖杯陈列馆）"**

这个系统是一座 Dota 2 官网式黑红铜金语境里的奖杯陈列馆。每一届 TI 的冠军、奖金、排名、中国战绩都是被托住、被照亮、被安静陈述的展品。界面是粗粝暗面、红锈火光与铜金边缘：克制、内行、有判断力。数字本身有分量，系统的职责是把数字托住，而不是替数字呐喊。

审美哲学是**数据即叙事**。奖金池的位数、冠军的名字、中国战队的名次——这些就是故事。所以系统收敛色板（暗色 + 一金 + 一红），克制装饰（几乎不用阴影，靠色阶分层），把视觉重量让给数据排版。中国战队的高光是情感锚点，但表达方式是"冷静地把它放在射灯下"，而非口号或煽动。

明确拒绝：SaaS landing 套路（大渐变 hero、玻璃卡片堆、emoji 当图标、轮播）、普通 wiki 丑（密集蓝链接表格 + 零氛围）、臃肿电竞门户（荧光色 + 闪烁 + 动画乱跳）、商业彩媒（弹窗 + 订阅 + 营销 CTA 喧宾夺主）。一句话：**不套路、不臃肿、不丑、不卖货。**

**Key Characteristics:**
- 暗色为底（obsidian-void），三段暖黑色阶分层（void / panel / subtle），不用默认玻璃感。
- 一铜金（不朽盾金）一 Dota 红双强调，红主氛围、金主荣耀，用得稀才有力。
- 数据排版优先：等宽数字、黑体大字编号、信息密度高于装饰。
- 移动优先单列，桌面 max 1200 分栏，表格横向滚动不拆碎。
- 沉浸但克制：入场/揭示动效允许，但每段服务于"让某事实被看见"，永不闪烁/发光泛滥。

## 2. Colors: The Dota Vault Palette

暗色奖杯陈列馆的色板参考 Dota 2 官网：黑色页面底、炭灰内容面、红锈火光、少量铜金高光。避免旧版青紫霓虹，避免泛电竞荧光感。

### Primary
- **不朽盾金 Aegis Gold** (#d5974b): 冠军、奖金、最高强调。仅用于"值得被托起"的元素：冠军名次、CTA 主按钮、数据高光、奖金条。用得稀才贵重，单屏 ≤10%。

### Secondary
- **Dota Red / Crimson Signal** (#b23125): 官网语境的主氛围色，也是中国战队标识色。用于中国战队 chip、中国专题边框、hero 热区与关键 hover。需要文字时使用更亮的 **Crimson Bright** (#ec553d)。
- **Ember** (#de5826): 火光辅助色，只用于背景热区、渐变末端与少量动态图表温度，不作为文字主色。

### Neutral
- **暗渊黑 Obsidian Void** (#080706): 全站底色。接近官网黑底，最深、最静。
- **展柜面板 Vault Panel** (#151210): 卡片/表面背景。比底色亮一阶，带微暖褐色。
- **暗格 Vault Subtle** (#221d19): chip 背景、hover 态、嵌套表面。三段色阶的最浅档。
- **亮墨 Ink Bright** (#f1eae0): 正文与标题主色。对暗渊黑远超 AA。
- **灰墨 Ink Mute** (#b4a89a): 次要文本、标签、辅助信息。保留暖灰，不用冷蓝灰。
- **边线 Edge Faint** (#41342b): 边框、分割线。低对比铜褐边，只勾勒不抢戏。

### Named Rules
**The One Spotlight Rule.** 不朽盾金是唯一的射灯。任何屏幕金色面积 ≤10%。冠军值得金，亚军以下不得镀金。金色泛滥 = 奖杯贬值。

**The Crimson Meaning Rule.** 红色承担两层语义：大面积时是 Dota 氛围光，小面积 chip/边框时标记"中国战队"。不要把红色用于错误态或普通警告，避免语义污染。

**The Tonal-Only Depth Rule.** 纵深只靠 void→panel→subtle 三段暖黑色阶传达。默认无阴影。卡片是"更亮的暗格"，不是"浮起的物体"。

## 3. Typography

**Display/Body Font:** "PingFang SC", "Microsoft YaHei", system-ui 系统无衬线栈
**Wordmark Font:** "Cormorant Garamond"（仅用于小型 `ti` 标识）
**Mono Font:** ui-monospace, SFMono-Regular, Menlo（奖金/名次数字）

**Character:** 正文与标题使用系统黑体栈，靠字重（400→900）与字号跨度做层级；Cormorant Garamond 只作为两字母 `ti` wordmark，不进入标题/正文层级。中文用系统字保证渲染锐利与零加载。等宽字体只给数字，让奖金位数与名次对齐成"面板感"。

### Hierarchy
- **Display** (900, clamp(1.875rem–3rem), 1.05, -0.02em): TI 编号大字（`TI6`）、页面主标题。奖杯铭牌感。
- **Headline** (700, 1.25–1.5rem, 1.2): 区块标题、卡片冠军名。
- **Body** (400, 0.875rem, 1.65): 简介与正文。mobile 默认 14px 保证密度与可读。
- **Label** (500, 0.75–0.875rem, 0.02em): chip、表头、元信息。次重。
- **Mono** (400, 0.75–0.875rem): 奖金 `$20,770,460`、名次编号。等宽对齐。
- **Wordmark** (700, 0.14em tracking): 仅用于 `ti` 品牌符号，避免扩展成装饰性 serif 标题。

### Named Rules
**The Weight-Not-Family Rule.** 层级靠字重 + 字号跨度（≥1.25 比率），不靠第二个字族。display 900 与 body 400 的跨度就是层级。

**The Numbers-Mono Rule.** 所有奖金、百分比、名次编号用等宽。数字对齐 = 数据面板的专业感。

**The No-Shouting Rule.** Hero clamp max ≤ 3rem（中文方块字本就宽，再大就吼）。正文不全大写；大写仅限 ≤4 词的短标签。

## 4. Elevation

这个系统**默认扁平**。纵深不靠阴影，靠 void→panel→subtle 三段暖黑色阶：底色最暗，卡片面板亮一阶，hover/subtle 再亮一阶。展柜式分层，不是悬浮式投影。

### Shadow Vocabulary
默认无 box-shadow。仅一种状态阴影，且极克制：

- **State Lift** (`box-shadow: 0 4px 16px rgba(0,0,0,0.3)`): 仅用于真正需要"浮起"语义的瞬时态（如未来模态、固定操作栏）。卡片静态与 hover 不加阴影——hover 用边框转金（border-edge → gold/60）传达，不靠投影。

### Named Rules
**The Flat-At-Rest Rule.** 静态表面一律扁平。阴影是状态语言（浮起/固定），不是装饰语言。卡片靠色阶 + 边线分层，绝不靠投影。

**The Border-Not-Shadow Rule.** hover/聚焦反馈用边框色变（→不朽盾金 60% 透明），不用阴影。这避免了"1px 边框 + 宽软投影"的 ghost-card 套路。

## 5. Components

每个组件先一句性格，再列形/色/态。

### Buttons
- **Shape:** 微圆角（10px md），非全圆。
- **Primary:** 不朽盾金底（#d5974b）+ 暗渊黑字（#080706），padding 10px 20px。仅"浏览历届赛事"这类主行动用。hover 降透明度 0.9，不抬升。
- **Ghost:** 透明底 + 边线 + 亮墨字。次要行动。hover 边框转金 60%。
- **Never:** 不配 1px 边框 + 宽投影；不全圆胶囊；不发光。

### Chips
- **Style:** 全圆胶囊（pill），底=暗格 subtle，字=灰墨 mute，padding 2px 10px，0.75rem。
- **chip-gold:** 铜金底/描边 + 暗渊黑或铜金字——仅冠军/顶级高光。
- **chip-red:** Dota 红 10% 透明底 + Crimson Bright 字——仅中国战队标识。
- **State:** 纯标记，非交互（除非做筛选 chip 时加 hover 边框转金）。

### Cards / Containers
- **Corner:** 12px lg。
- **Background:** 展柜面板 #151210，带极轻铜金角光，不做默认玻璃卡。
- **Border:** 1px 边线 #41342b。hover 转金 60%。
- **Padding:** 16px（sm 卡）/ 20px（内容卡）。
- **Shadow:** 无（见 Elevation）。嵌套卡片禁止——用内部分割线（divide-edge）而非套娃卡。

### TI Link Card（签名组件）
- **Character:** 陈列馆的展品标签卡。左上 TI 编号大金字 + 年份，右下中国战绩朱砂 chip。整卡可点进详情。
- **Shape/Color:** 同 card，但冠军名加粗不朽盾金，奖金用 mono 小字。
- **Don't:** 不加侧色条（border-left 彩条是禁的）；不加投影。

### Tables (排名表)
- **Mobile:** 横向滚动（`overflow-x-auto` + `min-w`），不拆列。scrollbar 极细 6px。
- **名次:** 等宽，rank 1 金、2 亮墨、其余灰墨。
- **中国列:** 🇨🇳 emoji + 朱砂 chip 双通道（不只靠颜色）。

### Navigation
- **Top (桌面):** sticky 顶栏，暗渊黑 85% + backdrop-blur。链接 hover 转金，active 金色。
- **Bottom (移动):** 固定底部三栏，仅 lg 以下显示。图标 emoji + 文字。
- **Max width:** 1200px shell 居中。

## 6. Do's and Don'ts

### Do:
- **Do** 把不朽盾金用在冠军、奖金、主 CTA 上，单屏 ≤10%（The One Spotlight Rule）。
- **Do** 用等宽字体排奖金与名次，让数字对齐成面板（The Numbers-Mono Rule）。
- **Do** 用 void/panel/subtle 三段色阶分层，纵深靠亮度差不靠阴影（The Tonal-Only Depth Rule）。
- **Do** hover 反馈用边框转金（gold/60），不用投影（The Border-Not-Shadow Rule）。
- **Do** 中国战队用 🇨🇳 emoji + 朱砂 chip 双通道标识，不仅靠颜色（色盲安全 + AA）。
- **Do** 表格移动端横向滚动，保留完整列结构。
- **Do** 所有动效在 `prefers-reduced-motion: reduce` 下退化为即时/淡入，绝不门控内容可见性。

### Don't:
- **Don't** 滥用金色——亚军及以下不得镀金。金色泛滥 = 奖杯贬值。
- **Don't** 把 Dota 红用于错误/警告/普通强调；小面积红色默认表示中国战队（The Crimson Meaning Rule）。
- **Don't** 给卡片加侧色条（border-left/right >1px 彩条）——禁的模式，用整边框或色阶代替。
- **Don't** 做玻璃卡片堆——backdrop-blur 仅极克制用于顶栏，不当默认装饰泛滥。
- **Don't** 做 SaaS landing 套路：大渐变 hero、emoji 当核心图标、轮播证言、"AI made that"。
- **Don't** 做臃肿电竞门户：荧光色、闪烁文字、动画乱跳、信息被装饰淹没。
- **Don't** 做普通 wiki 丑：密集蓝链接表格 + 零氛围 + 无层次排版。
- **Don't** 做商业彩媒：弹窗广告、订阅 CTA 喧宾夺主。
- **Don't** 配 `1px solid border` + `box-shadow blur ≥16px`（ghost-card 套路）——二选一。
- **Don't** 卡片圆角 ≥24px——封顶 12–16px；全圆只给 chip/按钮。
- **Don't** 用渐变填充文字——单色，靠字重/字号做强调。
- **Don't** 用闪烁/发光泛滥的动效——沉浸但不喧哗，每段动效服务于"让某事实被看见"。
