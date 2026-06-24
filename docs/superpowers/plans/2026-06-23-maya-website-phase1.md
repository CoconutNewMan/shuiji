# Maya Website Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js 14 web app with Maya totem calculator, trilingual support (ZH/EN/BM), Supabase lead storage, and deploy to Vercel.

**Architecture:** Next.js App Router with `[locale]` dynamic segment for i18n via next-intl. Maya calculation logic lives in pure TypeScript functions under `lib/maya/`. Supabase stores leads. WhatsApp CTA links to +601168270881.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, next-intl, Supabase JS v2, Jest + ts-jest, Vercel

## Global Constraints

- Node.js ≥ 18
- Next.js 14.x (`next@14`)
- Tailwind CSS v3
- next-intl v3
- Supabase JS `@supabase/supabase-js@^2`
- WhatsApp number: `601168270881`
- Locales: `zh` (default), `en`, `bm`
- Color palette: bg `#0a0a12`, gold `#d9b15a`, text `#ece6d9` (match existing HTML)
- Seal colors: Red `#d8504e`, White `#e9e4d6`, Blue `#4f7bd4`, Yellow `#e0b13a`

---

## File Map

```
maya-website/                         ← new repo root (NOT inside BaoKuan)
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                ← locale layout + nav + lang switcher
│   │   ├── page.tsx                  ← homepage
│   │   └── query/
│   │       └── page.tsx              ← calculator page
│   └── layout.tsx                    ← root layout (html/body, fonts)
├── components/
│   ├── Navigation.tsx                ← top nav + language switcher
│   ├── QueryForm.tsx                 ← name/phone/birthday inputs
│   ├── ResultCard.tsx                ← KIN result + oracle cross
│   ├── OracleCross.tsx               ← 3x3 grid of 5 glyphs
│   ├── ToneGlyph.tsx                 ← dot/bar glyph renderer
│   ├── GlyphIcon.tsx                 ← SVG seal icon
│   └── WhatsAppButton.tsx            ← sticky WA CTA
├── lib/
│   ├── maya/
│   │   ├── types.ts                  ← shared TypeScript types
│   │   ├── calculator.ts             ← pure KIN calculation functions
│   │   └── data.ts                   ← 20 seals + 13 tones data (trilingual)
│   └── supabase/
│       ├── client.ts                 ← browser Supabase client
│       └── server.ts                 ← server Supabase client (service key)
├── messages/
│   ├── zh.json                       ← Chinese UI strings
│   ├── en.json                       ← English UI strings
│   └── bm.json                       ← Bahasa Malaysia UI strings
├── middleware.ts                     ← next-intl locale detection
├── i18n.ts                           ← next-intl config
├── supabase/
│   └── schema.sql                    ← DB schema to run in Supabase dashboard
├── __tests__/
│   └── maya/
│       └── calculator.test.ts        ← Jest tests for pure functions
├── jest.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── .env.local                        ← SUPABASE_URL, SUPABASE_ANON_KEY (gitignored)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `maya-website/` (entire project root)
- Create: `jest.config.ts`
- Create: `tailwind.config.ts`
- Create: `i18n.ts`
- Create: `middleware.ts`

**Interfaces:**
- Produces: working `npm run dev`, `npm test`, `npm run build`

- [ ] **Step 1: Create Next.js project**

Run in `C:\Users\hawki\OneDrive\Desktop\File\`:
```bash
npx create-next-app@14 maya-website --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
cd maya-website
```
Expected: project created, `npm run dev` starts on localhost:3000.

- [ ] **Step 2: Install dependencies**

```bash
npm install next-intl @supabase/supabase-js
npm install -D jest ts-jest @types/jest jest-environment-jsdom
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Create i18n.ts**

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}))
```

- [ ] **Step 6: Create middleware.ts**

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['zh', 'en', 'bm'],
  defaultLocale: 'zh',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 7: Create placeholder message files**

`messages/zh.json`:
```json
{
  "nav": {
    "home": "首页",
    "query": "查询图腾",
    "learn": "学习中心",
    "blog": "文章",
    "login": "登录",
    "dashboard": "我的记录"
  },
  "hero": {
    "kicker": "Maya Galactic Signature",
    "title": "找到你天生的能量图腾",
    "subtitle": "玛雅历法把每个人出生那天的能量，记录成一个专属图腾。帮你看清——你天生擅长什么。",
    "cta": "查询我的图腾"
  },
  "query": {
    "title": "查询你的玛雅图腾",
    "subtitle": "填写资料，立即看见你天生的能量",
    "name": "姓名 / 称呼",
    "namePlaceholder": "你的名字",
    "phone": "电话 / WhatsApp",
    "phonePlaceholder": "例：012-3456789",
    "birthday": "阳历（公历）出生日期",
    "year": "年",
    "month": "月",
    "day": "日",
    "submit": "✦ 查询我的图腾 ✦",
    "consent": "提交即表示你同意一号能量馆保存你的资料并与你联系。",
    "errorName": "请填写你的姓名 / 称呼 ✦",
    "errorPhone": "请填写电话 / WhatsApp ✦",
    "errorDate": "请把出生的年、月、日都选好哦 ✦",
    "kinLabel": "Your Galactic Signature",
    "kin": "KIN",
    "wavespell": "波符 · 第",
    "wavespellDay": "天",
    "toneLabel": "银河调性 · 第",
    "toneNum": "号音",
    "oracleTitle": "你的五大神谕图",
    "oracleSub": "每个主图腾都被四股能量环绕",
    "roleGuide": "引导",
    "roleSupport": "支持",
    "roleChallenge": "挑战",
    "roleHidden": "隐藏推动",
    "roleMain": "主印记",
    "sectionSeal": "你的主图腾",
    "sectionTone": "你的调性",
    "sectionOracle": "神谕伙伴",
    "sectionMoon": "13 月亮历生日",
    "sectionGoddess": "内在女神力",
    "sectionPsi": "PSI 行星记忆库",
    "psiComing": "PSI 对照行星记忆库表（即将开放）",
    "unlockTitle": "这张神谕图，是你天赋地图的起点。",
    "unlockBody": "图腾告诉你「天生有什么」，但怎么把它用在工作、转行、面试和人生方向上，需要一份完整解读。我们用玛雅图腾能量 · 脉轮能量 · 心理模型三个角度，帮你把天赋落到现实。",
    "bookBtn": "预约我的完整天赋解码 →",
    "bookNote": "一对一私密解读 · 21 天陪跑 · 每天只接 3 位",
    "waMessage": "你好！我查询了我的玛雅图腾，KIN"
  },
  "colors": {
    "R": "红 · 启动",
    "W": "白 · 净化",
    "B": "蓝 · 蜕变",
    "Y": "黄 · 成熟"
  },
  "footer": {
    "brand": "一号能量馆 · 亿点心学系统",
    "tagline": "天赋识别 · 优势定位 · 21 天一对一陪跑",
    "disclaimer": "本查询基于玛雅 13 月亮历（卓尔金历）星系印记计算，仅供自我认识参考。"
  }
}
```

`messages/en.json`:
```json
{
  "nav": {
    "home": "Home",
    "query": "Find Your Totem",
    "learn": "Learn",
    "blog": "Blog",
    "login": "Login",
    "dashboard": "My Readings"
  },
  "hero": {
    "kicker": "Maya Galactic Signature",
    "title": "Discover Your Innate Energy Totem",
    "subtitle": "The Maya calendar records the energy of the day you were born as a unique totem — helping you see what you're naturally gifted at.",
    "cta": "Find My Totem"
  },
  "query": {
    "title": "Query Your Maya Totem",
    "subtitle": "Enter your details to see your innate energy",
    "name": "Name / Nickname",
    "namePlaceholder": "Your name",
    "phone": "Phone / WhatsApp",
    "phonePlaceholder": "e.g. 012-3456789",
    "birthday": "Date of Birth (Gregorian)",
    "year": "Year",
    "month": "Month",
    "day": "Day",
    "submit": "✦ Find My Totem ✦",
    "consent": "By submitting you agree that No.1 Energy Studio may save your details and contact you.",
    "errorName": "Please enter your name ✦",
    "errorPhone": "Please enter your phone / WhatsApp ✦",
    "errorDate": "Please select your full birth date ✦",
    "kinLabel": "Your Galactic Signature",
    "kin": "KIN",
    "wavespell": "Wavespell · Day",
    "wavespellDay": "",
    "toneLabel": "Galactic Tone ·",
    "toneNum": "",
    "oracleTitle": "Your Oracle Cross",
    "oracleSub": "Your main totem is surrounded by four supporting energies",
    "roleGuide": "Guide",
    "roleSupport": "Support",
    "roleChallenge": "Challenge",
    "roleHidden": "Hidden Power",
    "roleMain": "Main Seal",
    "sectionSeal": "Your Main Seal",
    "sectionTone": "Your Tone",
    "sectionOracle": "Oracle Partners",
    "sectionMoon": "13 Moon Birthday",
    "sectionGoddess": "Inner Goddess",
    "sectionPsi": "PSI Planetary Memory",
    "psiComing": "PSI Planetary Memory Table (coming soon)",
    "unlockTitle": "This oracle is the starting point of your gift map.",
    "unlockBody": "The totem shows what you were born with — but how to apply it to your career, life direction, and relationships takes a full reading. We decode your gifts through Maya energy, chakra system, and psychological models.",
    "bookBtn": "Book My Full Gift Reading →",
    "bookNote": "1-on-1 private reading · 21-day coaching · 3 slots per day only",
    "waMessage": "Hi! I just looked up my Maya totem, KIN"
  },
  "colors": {
    "R": "Red · Initiator",
    "W": "White · Refiner",
    "B": "Blue · Transformer",
    "Y": "Yellow · Ripener"
  },
  "footer": {
    "brand": "No.1 Energy Studio · Heart Learning System",
    "tagline": "Gift Identification · Strength Positioning · 21-Day 1-on-1 Coaching",
    "disclaimer": "This reading is based on the Maya 13-Moon Calendar (Tzolkin). For self-awareness reference only."
  }
}
```

`messages/bm.json`:
```json
{
  "nav": {
    "home": "Laman Utama",
    "query": "Cari Totem",
    "learn": "Belajar",
    "blog": "Artikel",
    "login": "Log Masuk",
    "dashboard": "Rekod Saya"
  },
  "hero": {
    "kicker": "Maya Galactic Signature",
    "title": "Temui Totem Tenaga Semula Jadi Anda",
    "subtitle": "Kalendar Maya merekodkan tenaga hari kelahiran anda sebagai totem unik — membantu anda mengenal bakat semula jadi anda.",
    "cta": "Cari Totem Saya"
  },
  "query": {
    "title": "Semak Totem Maya Anda",
    "subtitle": "Masukkan maklumat anda untuk melihat tenaga semula jadi anda",
    "name": "Nama / Panggilan",
    "namePlaceholder": "Nama anda",
    "phone": "Telefon / WhatsApp",
    "phonePlaceholder": "cth: 012-3456789",
    "birthday": "Tarikh Lahir (Gregorian)",
    "year": "Tahun",
    "month": "Bulan",
    "day": "Hari",
    "submit": "✦ Cari Totem Saya ✦",
    "consent": "Dengan menghantar, anda bersetuju Studio Tenaga No.1 menyimpan maklumat anda untuk dihubungi.",
    "errorName": "Sila masukkan nama anda ✦",
    "errorPhone": "Sila masukkan telefon / WhatsApp anda ✦",
    "errorDate": "Sila pilih tarikh lahir penuh anda ✦",
    "kinLabel": "Your Galactic Signature",
    "kin": "KIN",
    "wavespell": "Wavespell · Hari",
    "wavespellDay": "",
    "toneLabel": "Nada Galaksi ·",
    "toneNum": "",
    "oracleTitle": "Silang Oracle Anda",
    "oracleSub": "Totem utama anda dikelilingi empat tenaga sokongan",
    "roleGuide": "Panduan",
    "roleSupport": "Sokongan",
    "roleChallenge": "Cabaran",
    "roleHidden": "Kuasa Tersembunyi",
    "roleMain": "Meterai Utama",
    "sectionSeal": "Meterai Utama Anda",
    "sectionTone": "Nada Anda",
    "sectionOracle": "Rakan Oracle",
    "sectionMoon": "Hari Lahir 13 Bulan",
    "sectionGoddess": "Dewi Dalaman",
    "sectionPsi": "Memori Planetary PSI",
    "psiComing": "Jadual Memori Planetary PSI (akan datang)",
    "unlockTitle": "Oracle ini adalah titik permulaan peta bakat anda.",
    "unlockBody": "Totem menunjukkan apa yang anda lahirkan — tetapi cara mengaplikasikannya dalam kerjaya dan kehidupan memerlukan bacaan penuh. Kami mendekod bakat anda melalui tenaga Maya, sistem cakra, dan model psikologi.",
    "bookBtn": "Tempah Bacaan Bakat Penuh Saya →",
    "bookNote": "Bacaan 1-on-1 peribadi · Bimbingan 21 hari · 3 slot sehari sahaja",
    "waMessage": "Hai! Saya baru semak totem Maya saya, KIN"
  },
  "colors": {
    "R": "Merah · Pemula",
    "W": "Putih · Pemurni",
    "B": "Biru · Pengubah",
    "Y": "Kuning · Pematang"
  },
  "footer": {
    "brand": "Studio Tenaga No.1 · Sistem Pembelajaran Hati",
    "tagline": "Pengenalpastian Bakat · Kedudukan Kekuatan · Bimbingan 21 Hari",
    "disclaimer": "Bacaan ini berdasarkan Kalendar 13 Bulan Maya (Tzolkin). Untuk rujukan kesedaran diri sahaja."
  }
}
```

- [ ] **Step 8: Commit scaffold**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 + Tailwind + next-intl + Jest"
```

---

## Task 2: Maya Calculation Engine

**Files:**
- Create: `lib/maya/types.ts`
- Create: `lib/maya/calculator.ts`
- Create: `lib/maya/data.ts`
- Create: `__tests__/maya/calculator.test.ts`

**Interfaces:**
- Produces:
  - `calcKin(y: number, m: number, d: number): number` — returns 1-260
  - `sealOf(kin: number): number` — returns 1-20
  - `toneOf(kin: number): number` — returns 1-13
  - `getOracle(kin: number): OracleResult`
  - `getMoonDate(y: number, m: number, d: number): MoonDate`
  - `SEALS: Seal[]` — array of 20 seal objects
  - `TONES: Tone[]` — array of 13 tone objects

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/maya/calculator.test.ts
import { calcKin, sealOf, toneOf, getOracle, getMoonDate } from '@/lib/maya/calculator'

describe('calcKin', () => {
  it('returns correct KIN for 1987-01-17 (known: KIN 113)', () => {
    expect(calcKin(1987, 1, 17)).toBe(113)
  })
  it('returns correct KIN for 2000-07-26 (known: KIN 1 — year bearer)', () => {
    expect(calcKin(2000, 7, 26)).toBe(1)
  })
  it('returns correct KIN for 1990-05-15 (known: KIN 189)', () => {
    expect(calcKin(1990, 5, 15)).toBe(189)
  })
  it('always returns value between 1 and 260', () => {
    for (let y = 1950; y <= 2010; y += 13) {
      for (let m = 1; m <= 12; m += 3) {
        const k = calcKin(y, m, 15)
        expect(k).toBeGreaterThanOrEqual(1)
        expect(k).toBeLessThanOrEqual(260)
      }
    }
  })
})

describe('sealOf', () => {
  it('KIN 1 → seal 1', () => expect(sealOf(1)).toBe(1))
  it('KIN 20 → seal 20', () => expect(sealOf(20)).toBe(20))
  it('KIN 21 → seal 1', () => expect(sealOf(21)).toBe(1))
  it('KIN 260 → seal 20', () => expect(sealOf(260)).toBe(20))
})

describe('toneOf', () => {
  it('KIN 1 → tone 1', () => expect(toneOf(1)).toBe(1))
  it('KIN 13 → tone 13', () => expect(toneOf(13)).toBe(13))
  it('KIN 14 → tone 1', () => expect(toneOf(14)).toBe(1))
  it('KIN 260 → tone 13', () => expect(toneOf(260)).toBe(13))
})

describe('getOracle', () => {
  it('returns all 5 oracle roles for KIN 113', () => {
    const o = getOracle(113)
    expect(o.main).toBe(113)
    expect(typeof o.guide).toBe('number')
    expect(typeof o.support).toBe('number')
    expect(typeof o.challenge).toBe('number')
    expect(typeof o.hidden).toBe('number')
    expect(o.guide).toBeGreaterThanOrEqual(1)
    expect(o.hidden).toBeLessThanOrEqual(260)
  })
  it('hidden = 261 - main (kin arithmetic)', () => {
    expect(getOracle(100).hidden).toBe(161)
    expect(getOracle(1).hidden).toBe(260)
    expect(getOracle(260).hidden).toBe(1)
  })
})

describe('getMoonDate', () => {
  it('returns moon number 1-13 and day 1-28', () => {
    const md = getMoonDate(1990, 3, 10)
    if (!md.isNoTimeDay) {
      expect(md.moon).toBeGreaterThanOrEqual(1)
      expect(md.moon).toBeLessThanOrEqual(13)
      expect(md.day).toBeGreaterThanOrEqual(1)
      expect(md.day).toBeLessThanOrEqual(28)
    }
  })
  it('July 25 is the No-Time Day', () => {
    const md = getMoonDate(2000, 7, 25)
    expect(md.isNoTimeDay).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```
Expected: FAIL — "Cannot find module '@/lib/maya/calculator'"

- [ ] **Step 3: Create types.ts**

```typescript
// lib/maya/types.ts
export interface OracleResult {
  main: number       // kin
  guide: number      // kin
  support: number    // kin
  challenge: number  // kin
  hidden: number     // kin
  wavespellLeadSeal: number  // seal index 1-20
  wavespellPosition: number  // tone 1-13
  innerGoddess: number       // kin
}

export interface MoonDate {
  isNoTimeDay: boolean
  moon?: number       // 1-13
  day?: number        // 1-28
  moonName?: string
  yearBearerKin?: number
}

export type SealColor = 'R' | 'W' | 'B' | 'Y'

export interface Seal {
  id: number          // 1-20
  slug: string
  color: SealColor
  nameZh: string
  nameEn: string
  nameBm: string
  keywordsZh: string[]
  keywordsEn: string[]
  keywordsBm: string[]
  descZh: string
  descEn: string
  descBm: string
  svgPath: string     // raw SVG path data (currentColor)
}

export interface Tone {
  id: number          // 1-13
  nameZh: string
  nameEn: string
  nameBm: string
  questionZh: string
  questionEn: string
  questionBm: string
  descZh: string
  descEn: string
  descBm: string
}
```

- [ ] **Step 4: Create calculator.ts**

```typescript
// lib/maya/calculator.ts
import type { OracleResult, MoonDate } from './types'

const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

const MOON_NAMES = [
  '磁性蝙蝠月', '月亮蝎子月', '电力鹿月', '自我存在猫头鹰月',
  '超频孔雀月', '韵律蜥蜴月', '共振猴子月', '银河星系鹰月',
  '太阳美洲豹月', '行星狗月', '光谱蛇月', '水晶兔月', '宇宙乌龟月',
]

export function calcKin(y: number, m: number, d: number): number {
  const N = 365 * y + CUM[m - 1] + (d - 1)
  return (((N - 725461 + 33) % 260) + 260) % 260 + 1
}

export function sealOf(kin: number): number {
  return ((kin - 1) % 20) + 1
}

export function toneOf(kin: number): number {
  return ((kin - 1) % 13) + 1
}

function kinFromSealTone(seal: number, tone: number): number {
  for (let k = 1; k <= 260; k++) {
    if (sealOf(k) === seal && toneOf(k) === tone) return k
  }
  return 1
}

function antiSeal(s: number): number {
  return ((s + 9) % 20) + 1
}

function analSeal(s: number): number {
  let a = 19 - s
  if (a <= 0) a += 20
  return a
}

function guideSeal(s: number, t: number): number {
  const offsets = [0, 12, 4, 16, 8]
  return ((s - 1 + offsets[(t - 1) % 5]) % 20) + 1
}

export function getOracle(kin: number): OracleResult {
  const s = sealOf(kin)
  const t = toneOf(kin)
  const gSeal = guideSeal(s, t)
  const aSeal = antiSeal(s)
  const spSeal = analSeal(s)

  const guideKin = kinFromSealTone(gSeal, t)
  const challengeKin = kinFromSealTone(aSeal, t)
  const supportKin = kinFromSealTone(spSeal, t)
  const hiddenKin = 261 - kin

  const wsLeadSeal = sealOf(Math.floor((kin - 1) / 13) * 13 + 1)

  // Inner goddess: sum of 5 oracle kins mod 260
  const igSum = kin + guideKin + challengeKin + supportKin + hiddenKin
  const innerGoddess = ((igSum - 1) % 260) + 1

  return {
    main: kin,
    guide: guideKin,
    support: supportKin,
    challenge: challengeKin,
    hidden: hiddenKin,
    wavespellLeadSeal: wsLeadSeal,
    wavespellPosition: t,
    innerGoddess,
  }
}

export function getMoonDate(y: number, m: number, d: number): MoonDate {
  const doy = CUM[m - 1] + d
  if (m === 7 && d === 25) return { isNoTimeDay: true }

  const n = (((doy - 207) % 365) + 365) % 365 + 1
  if (n === 365) return { isNoTimeDay: true }

  const startY = doy >= 207 ? y : y - 1
  const moon = Math.floor((n - 1) / 28) + 1
  const day = ((n - 1) % 28) + 1
  const yearBearerKin = calcKin(startY, 7, 26)

  return {
    isNoTimeDay: false,
    moon,
    day,
    moonName: MOON_NAMES[moon - 1],
    yearBearerKin,
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 6: Create data.ts** (20 seals + 13 tones, trilingual)

```typescript
// lib/maya/data.ts
import type { Seal, Tone } from './types'

export const SEALS: Seal[] = [
  {
    id: 1, slug: 'red-dragon', color: 'R',
    nameZh: '红龙', nameEn: 'Red Dragon', nameBm: 'Naga Merah',
    keywordsZh: ['信任', '开创', '母性力量'],
    keywordsEn: ['Trust', 'Nurturing', 'Birth'],
    keywordsBm: ['Kepercayaan', 'Penjagaan', 'Kelahiran'],
    descZh: '你天生有照顾人、把新事启动起来的能量，是大家愿意跟随的源头。',
    descEn: 'You carry a natural energy of nurturing and initiating — the source others naturally follow.',
    descBm: 'Anda mempunyai tenaga semula jadi untuk menjaga dan memulakan — sumber yang diikuti orang lain.',
    svgPath: 'M14 42c-3-5-1-13 6-16 8-3 17 1 19 8M40 32l4-7 4 6 5-6 3 7 5-5M22 33a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 0 0-5.2 0M18 45c5 5 14 5 20-1',
  },
  {
    id: 2, slug: 'white-wind', color: 'W',
    nameZh: '白风', nameEn: 'White Wind', nameBm: 'Angin Putih',
    keywordsZh: ['沟通', '灵感', '真诚表达'],
    keywordsEn: ['Communication', 'Inspiration', 'Spirit'],
    keywordsBm: ['Komunikasi', 'Inspirasi', 'Semangat'],
    descZh: '你的话语和心意能影响别人，擅长把灵感说成别人听得懂的话。',
    descEn: 'Your words and intentions influence others — you transform inspiration into language everyone understands.',
    descBm: 'Kata-kata dan niat anda mempengaruhi orang lain — anda mengubah inspirasi menjadi bahasa yang semua orang fahami.',
    svgPath: 'M14 26c8-6 18-6 26 0M16 36c10-6 23-6 33 0M20 46c8-4 16-4 22 0M44 22c5 0 7 3 4 7',
  },
  {
    id: 3, slug: 'blue-night', color: 'B',
    nameZh: '蓝夜', nameEn: 'Blue Night', nameBm: 'Malam Biru',
    keywordsZh: ['直觉', '梦想', '内在丰盛'],
    keywordsEn: ['Intuition', 'Dreams', 'Abundance'],
    keywordsBm: ['Intuisi', 'Impian', 'Kelimpahan'],
    descZh: '你能在安静里看见可能，把心里的梦想一点点变成现实。',
    descEn: 'In stillness, you see possibility — slowly turning inner dreams into reality.',
    descBm: 'Dalam ketenangan, anda melihat kemungkinan — perlahan-lahan mengubah impian dalaman menjadi kenyataan.',
    svgPath: 'M41 16a18 18 0 1 0 5 31 14 14 0 0 1-5-31zM21 19l1.6 3.4 3.4 1-3.4 1L21 29l-1.6-3.6-3.4-1 3.4-1z',
  },
  {
    id: 4, slug: 'yellow-seed', color: 'Y',
    nameZh: '黄种子', nameEn: 'Yellow Seed', nameBm: 'Benih Kuning',
    keywordsZh: ['目标', '耐心', '开花结果'],
    keywordsEn: ['Targeting', 'Awareness', 'Flowering'],
    keywordsBm: ['Matlamat', 'Kesedaran', 'Mekar'],
    descZh: '你看得见别人的潜力，也有耐心把一个想法种成果实。',
    descEn: 'You see the potential in others and have the patience to grow an idea into fruit.',
    descBm: 'Anda melihat potensi dalam diri orang lain dan mempunyai kesabaran untuk menumbuhkan idea menjadi buah.',
    svgPath: 'M32 12c8 8 8 32 0 40-8-8-8-32 0-40zM32 16v32M24 34a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 0 0-4.4 0M38 34a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 0 0-4.4 0',
  },
  {
    id: 5, slug: 'red-serpent', color: 'R',
    nameZh: '红蛇', nameEn: 'Red Serpent', nameBm: 'Ular Merah',
    keywordsZh: ['热情', '本能', '生命力'],
    keywordsEn: ['Passion', 'Instinct', 'Life Force'],
    keywordsBm: ['Semangat', 'Naluri', 'Tenaga Hidup'],
    descZh: '你对身体、真实和热情有敏锐感知，活得很有生命力。',
    descEn: 'You have keen awareness of body, truth, and passion — living with vibrant life force.',
    descBm: 'Anda mempunyai kesedaran tajam tentang tubuh, kebenaran, dan semangat — hidup dengan tenaga yang bersemangat.',
    svgPath: 'M16 18c11 0 11 9 0 11s-11 9 0 11 13 8 5 12M20 19a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 0 0-4.4 0M12 17h4',
  },
  {
    id: 6, slug: 'white-world-bridger', color: 'W',
    nameZh: '白世界桥', nameEn: 'White World-Bridger', nameBm: 'Jambatan Dunia Putih',
    keywordsZh: ['连接', '机会', '断舍离'],
    keywordsEn: ['Equality', 'Death & Rebirth', 'Opportunity'],
    keywordsBm: ['Kesaksamaan', 'Kematian & Kelahiran Semula', 'Peluang'],
    descZh: '你能搭起人与人之间的桥，也懂得在对的时候放手。',
    descEn: 'You bridge worlds and people — and know when to let go at the right moment.',
    descBm: 'Anda menghubungkan dunia dan orang — dan tahu bila masa untuk melepaskan pada waktu yang tepat.',
    svgPath: 'M12 32a20 20 0 0 1 40 0M21 32v12M32 32v12M43 32v12M12 50c4-3 7-3 11 0s7 3 11 0 7-3 11 0',
  },
  {
    id: 7, slug: 'blue-hand', color: 'B',
    nameZh: '蓝手', nameEn: 'Blue Hand', nameBm: 'Tangan Biru',
    keywordsZh: ['实践', '疗愈', '完成'],
    keywordsEn: ['Accomplishment', 'Healing', 'Knowing'],
    keywordsBm: ['Pencapaian', 'Penyembuhan', 'Pengetahuan'],
    descZh: '你用双手把事做成，也能抚平别人心里的伤。',
    descEn: 'You accomplish with your hands and have the power to heal others\' inner wounds.',
    descBm: 'Anda mencapai dengan tangan anda dan mempunyai kuasa untuk menyembuhkan luka dalaman orang lain.',
    svgPath: 'M23 50V31m0 0v-6a3 3 0 0 1 6 0v4m0 0v-7a3 3 0 0 1 6 0v7m0 0v-4a3 3 0 0 1 6 0v15c0 8-4 11-11 11-4 0-6-1-9-5l-5-7a3 3 0 0 1 5-3l3 3',
  },
  {
    id: 8, slug: 'yellow-star', color: 'Y',
    nameZh: '黄星星', nameEn: 'Yellow Star', nameBm: 'Bintang Kuning',
    keywordsZh: ['艺术', '优雅', '卓越'],
    keywordsEn: ['Art', 'Elegance', 'Beautify'],
    keywordsBm: ['Seni', 'Keanggunan', 'Memperindah'],
    descZh: '你对美和和谐有天生的眼光，做事讲究、追求优雅。',
    descEn: 'You have a natural eye for beauty and harmony — you pursue elegance in everything you do.',
    descBm: 'Anda mempunyai mata semula jadi untuk keindahan dan keharmonian — anda mengejar keanggunan dalam segala yang anda lakukan.',
    svgPath: 'M32 12l6 14 15 1-11 10 4 15-14-8-14 8 4-15-11-10 15-1z',
  },
  {
    id: 9, slug: 'red-moon', color: 'R',
    nameZh: '红月', nameEn: 'Red Moon', nameBm: 'Bulan Merah',
    keywordsZh: ['情感', '流动', '净化'],
    keywordsEn: ['Purification', 'Flow', 'Universal Water'],
    keywordsBm: ['Penyucian', 'Aliran', 'Air Semesta'],
    descZh: '你情感丰富，像水一样能流动、能净化身边的氛围。',
    descEn: 'You are emotionally rich — like water, you flow and purify the atmosphere around you.',
    descBm: 'Anda kaya dengan emosi — seperti air, anda mengalir dan menyucikan suasana di sekeliling anda.',
    svgPath: 'M32 14c8 10 14 18 14 25a14 14 0 0 1-28 0c0-7 6-15 14-25z',
  },
  {
    id: 10, slug: 'white-dog', color: 'W',
    nameZh: '白狗', nameEn: 'White Dog', nameBm: 'Anjing Putih',
    keywordsZh: ['忠诚', '爱', '心的力量'],
    keywordsEn: ['Love', 'Loyalty', 'Heart'],
    keywordsBm: ['Cinta', 'Kesetiaan', 'Hati'],
    descZh: '你重情重义，把爱与信任放在第一位，是最可靠的伙伴。',
    descEn: 'You value love and loyalty above all — you are the most trustworthy companion.',
    descBm: 'Anda menghargai cinta dan kesetiaan melebihi segalanya — anda adalah teman yang paling boleh dipercayai.',
    svgPath: 'M32 42a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM19 32a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM32 27a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM45 32a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    id: 11, slug: 'blue-monkey', color: 'B',
    nameZh: '蓝猴', nameEn: 'Blue Monkey', nameBm: 'Monyet Biru',
    keywordsZh: ['游戏', '灵巧', '看透'],
    keywordsEn: ['Magic', 'Play', 'Illusion'],
    keywordsBm: ['Sihir', 'Permainan', 'Ilusi'],
    descZh: '你聪明幽默，能一眼看穿规则和假象，带着玩心做事。',
    descEn: 'You are clever and playful — you see through rules and illusions with a mischievous spirit.',
    descBm: 'Anda bijak dan suka bermain — anda melihat melalui peraturan dan ilusi dengan semangat yang nakal.',
    svgPath: 'M32 35a15 15 0 1 0 0-30 15 15 0 0 0 0 30zM20 30a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM44 30a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM26 35a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM38 35a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM26 43c4 3 8 3 12 0',
  },
  {
    id: 12, slug: 'yellow-human', color: 'Y',
    nameZh: '黄人', nameEn: 'Yellow Human', nameBm: 'Manusia Kuning',
    keywordsZh: ['自由意志', '智慧', '影响力'],
    keywordsEn: ['Free Will', 'Wisdom', 'Influence'],
    keywordsBm: ['Kehendak Bebas', 'Kebijaksanaan', 'Pengaruh'],
    descZh: '你有独立的判断，懂得尊重自己的选择，也能影响别人。',
    descEn: 'You have independent judgment and know how to honor your own choices while influencing others.',
    descBm: 'Anda mempunyai pertimbangan bebas dan tahu cara menghormati pilihan anda sendiri sambil mempengaruhi orang lain.',
    svgPath: 'M32 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM32 26v16M32 32l-12 6M32 32l12 6M32 42l-7 10M32 42l7 10',
  },
  {
    id: 13, slug: 'red-skywalker', color: 'R',
    nameZh: '红天行者', nameEn: 'Red Skywalker', nameBm: 'Pejalan Langit Merah',
    keywordsZh: ['探索', '空间', '勇敢前行'],
    keywordsEn: ['Explore', 'Wakefulness', 'Space'],
    keywordsBm: ['Terokai', 'Kesedaran', 'Ruang'],
    descZh: '你不安于现状，敢走进更大的世界，去探索没去过的地方。',
    descEn: 'You never settle — you dare to enter bigger worlds and explore uncharted territory.',
    descBm: 'Anda tidak pernah berpuas hati — anda berani memasuki dunia yang lebih besar dan meneroka wilayah yang belum dijelajahi.',
    svgPath: 'M22 13h20a3 3 0 0 1 3 3v38H19V16a3 3 0 0 1 3-3zM32 17v9M32 26l-6 8M32 26l6 8M32 34v9',
  },
  {
    id: 14, slug: 'white-wizard', color: 'W',
    nameZh: '白巫师', nameEn: 'White Wizard', nameBm: 'Ahli Sihir Putih',
    keywordsZh: ['觉察', '永恒', '定力'],
    keywordsEn: ['Timelessness', 'Receptivity', 'Enchantment'],
    keywordsBm: ['Keabadian', 'Penerimaan', 'Pesona'],
    descZh: '你内心安定、有定力，能感知别人感知不到的东西。',
    descEn: 'Your inner stillness gives you the power to perceive what others cannot.',
    descBm: 'Ketenangan dalaman anda memberi anda kuasa untuk merasakan apa yang orang lain tidak dapat.',
    svgPath: 'M13 34c8-13 30-13 38 0-8 13-30 13-38 0zM32 34a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM32 34a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    id: 15, slug: 'blue-eagle', color: 'B',
    nameZh: '蓝鹰', nameEn: 'Blue Eagle', nameBm: 'Helang Biru',
    keywordsZh: ['愿景', '格局', '清晰'],
    keywordsEn: ['Vision', 'Mind', 'Creativity'],
    keywordsBm: ['Visi', 'Minda', 'Kreativiti'],
    descZh: '你站得高、看得远，擅长全局思考，心里有清晰的愿景。',
    descEn: 'You stand high and see far — you excel at big-picture thinking with a clear inner vision.',
    descBm: 'Anda berdiri tinggi dan melihat jauh — anda cemerlang dalam pemikiran gambaran besar dengan visi dalaman yang jelas.',
    svgPath: 'M32 23C26 14 16 13 11 19c8 2 12 8 12 15M32 23c6-9 16-10 21-4-8 2-12 8-12 15M32 21v23M27 47h10',
  },
  {
    id: 16, slug: 'yellow-warrior', color: 'Y',
    nameZh: '黄战士', nameEn: 'Yellow Warrior', nameBm: 'Pahlawan Kuning',
    keywordsZh: ['智慧', '勇气', '无惧'],
    keywordsEn: ['Intelligence', 'Fearlessness', 'Questioning'],
    keywordsBm: ['Kecerdasan', 'Keberanian', 'Persoalan'],
    descZh: '你不怕问问题，也敢为答案去行动，用勇气开路。',
    descEn: 'You dare to question and act on the answers — you pave the way with courage.',
    descBm: 'Anda berani mempersoalkan dan bertindak berdasarkan jawapan — anda membuka jalan dengan keberanian.',
    svgPath: 'M32 12l18 6v13c0 13-8 19-18 23-10-4-18-10-18-23V18zM32 24v18M24 33h16',
  },
  {
    id: 17, slug: 'red-earth', color: 'R',
    nameZh: '红地球', nameEn: 'Red Earth', nameBm: 'Bumi Merah',
    keywordsZh: ['共时', '进化', '导航'],
    keywordsEn: ['Synchronicity', 'Navigation', 'Evolution'],
    keywordsBm: ['Sinkronisiti', 'Navigasi', 'Evolusi'],
    descZh: '你对时机敏感，懂得顺势而为，跟着心流走。',
    descEn: 'You are sensitive to timing — you flow with synchronicity and follow the current of the heart.',
    descBm: 'Anda peka terhadap masa — anda mengalir dengan sinkronisiti dan mengikuti arus hati.',
    svgPath: 'M32 32a18 18 0 1 0 0-36 18 18 0 0 0 0 36zM14 32h36M32 14c9 6 9 30 0 36-9-6-9-30 0-36z',
  },
  {
    id: 18, slug: 'white-mirror', color: 'W',
    nameZh: '白镜', nameEn: 'White Mirror', nameBm: 'Cermin Putih',
    keywordsZh: ['真实', '秩序', '映照'],
    keywordsEn: ['Reflection', 'Order', 'Endlessness'],
    keywordsBm: ['Refleksi', 'Perintah', 'Ketidakberakhiran'],
    descZh: '你看得清真相，也照得出别人真实的样子，做事有秩序。',
    descEn: 'You see truth clearly and reflect others\' authentic selves — you bring order to chaos.',
    descBm: 'Anda melihat kebenaran dengan jelas dan mencerminkan diri orang lain yang sebenar — anda membawa perintah kepada kekacauan.',
    svgPath: 'M32 12l17 20-17 20-17-20zM24 32h16',
  },
  {
    id: 19, slug: 'blue-storm', color: 'B',
    nameZh: '蓝风暴', nameEn: 'Blue Storm', nameBm: 'Ribut Biru',
    keywordsZh: ['催化', '蜕变', '重生'],
    keywordsEn: ['Self-Generation', 'Catalyze', 'Energy'],
    keywordsBm: ['Jana Diri', 'Memangkin', 'Tenaga'],
    descZh: '你是带来转变的人，敢于打破旧的、重新开始。',
    descEn: 'You are the agent of change — daring to break the old and begin again.',
    descBm: 'Anda adalah ejen perubahan — berani memecahkan yang lama dan memulakan semula.',
    svgPath: 'M22 31a9 9 0 0 1 18-2 7 7 0 0 1 1 14H23a8 8 0 0 1-1-16M33 40l-6 9h7l-5 9',
  },
  {
    id: 20, slug: 'yellow-sun', color: 'Y',
    nameZh: '黄太阳', nameEn: 'Yellow Sun', nameBm: 'Matahari Kuning',
    keywordsZh: ['光', '生命', '无条件的爱'],
    keywordsEn: ['Enlightenment', 'Life', 'Universal Fire'],
    keywordsBm: ['Pencerahan', 'Kehidupan', 'Api Semesta'],
    descZh: '你像太阳，能照亮、能成全，把人带向完整与圆满。',
    descEn: 'Like the sun, you illuminate and fulfill — you lead others toward wholeness.',
    descBm: 'Seperti matahari, anda menerangi dan memenuhi — anda memimpin orang lain menuju keutuhan.',
    svgPath: 'M32 32a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6',
  },
]

export const TONES: Tone[] = [
  {
    id: 1, nameZh: '磁性', nameEn: 'Magnetic', nameBm: 'Magnetik',
    questionZh: '我的目的是什么？', questionEn: 'What is my purpose?', questionBm: 'Apakah tujuan saya?',
    descZh: '你有把人事物聚到一起、锁定目标的力量。',
    descEn: 'You have the power to attract and unify — to lock onto a purpose.',
    descBm: 'Anda mempunyai kuasa untuk menarik dan menyatukan — untuk mengunci pada satu tujuan.',
  },
  {
    id: 2, nameZh: '月亮', nameEn: 'Lunar', nameBm: 'Lunar',
    questionZh: '我的挑战是什么？', questionEn: 'What is my challenge?', questionBm: 'Apakah cabaran saya?',
    descZh: '你能在两难和挑战里，慢慢找到平衡。',
    descEn: 'In difficulty and challenge, you find balance — slowly and surely.',
    descBm: 'Dalam kesukaran dan cabaran, anda menemui keseimbangan — perlahan dan pasti.',
  },
  {
    id: 3, nameZh: '电力', nameEn: 'Electric', nameBm: 'Elektrik',
    questionZh: '我该如何给予最佳的服务？', questionEn: 'How can I best serve?', questionBm: 'Bagaimana saya boleh berkhidmat dengan terbaik?',
    descZh: '你靠行动把想法启动，乐于服务和连接。',
    descEn: 'You activate ideas through action — joyfully serving and connecting.',
    descBm: 'Anda mengaktifkan idea melalui tindakan — dengan gembira berkhidmat dan menghubungkan.',
  },
  {
    id: 4, nameZh: '自我存在', nameEn: 'Self-Existing', nameBm: 'Wujud Sendiri',
    questionZh: '我该以什么样的形式来服务他人？', questionEn: 'What form will my service take?', questionBm: 'Apakah bentuk khidmat saya?',
    descZh: '你擅长把模糊的事想清楚、定下形状与步骤。',
    descEn: 'You excel at clarifying the vague — defining shape and steps.',
    descBm: 'Anda cemerlang dalam menjelaskan yang kabur — menentukan bentuk dan langkah.',
  },
  {
    id: 5, nameZh: '超频', nameEn: 'Overtone', nameBm: 'Nada Tinggi',
    questionZh: '我该如何让自己获得最大力量？', questionEn: 'How do I best empower myself?', questionBm: 'Bagaimana saya memperkasakan diri terbaik?',
    descZh: '你天生能发光，带动和赋能一群人。',
    descEn: 'You naturally radiate — energizing and empowering those around you.',
    descBm: 'Anda secara semula jadi bersinar — memberi tenaga dan memperkasakan orang di sekeliling anda.',
  },
  {
    id: 6, nameZh: '韵律', nameEn: 'Rhythmic', nameBm: 'Berirama',
    questionZh: '我该如何在人际中扩展与他人的平衡？', questionEn: 'How can I extend my equality to others?', questionBm: 'Bagaimana saya boleh memperluas kesaksamaan kepada orang lain?',
    descZh: '你能把生活和工作安排得有节奏、有秩序。',
    descEn: 'You organize life and work with rhythm and order.',
    descBm: 'Anda mengatur kehidupan dan kerja dengan irama dan perintah.',
  },
  {
    id: 7, nameZh: '共振', nameEn: 'Resonant', nameBm: 'Bergema',
    questionZh: '我该如何归于中心与他人协调？', questionEn: 'How can I attune my service to others?', questionBm: 'Bagaimana saya boleh menyelaraskan khidmat saya kepada orang lain?',
    descZh: '你的状态会感染身边的人，懂得调频。',
    descEn: 'Your energy is contagious — you know how to tune into others.',
    descBm: 'Tenaga anda berjangkit — anda tahu cara menyelaraskan dengan orang lain.',
  },
  {
    id: 8, nameZh: '银河星系', nameEn: 'Galactic', nameBm: 'Galaktik',
    questionZh: '我是否忠于我的信念生活？', questionEn: 'Do I live what I believe?', questionBm: 'Adakah saya menghayati kepercayaan saya?',
    descZh: '你说到做到、言行一致，是别人的示范。',
    descEn: 'You walk your talk — your integrity makes you a living example.',
    descBm: 'Anda menepati janji — integriti anda menjadikan anda contoh hidup.',
  },
  {
    id: 9, nameZh: '太阳', nameEn: 'Solar', nameBm: 'Suria',
    questionZh: '我该如何完成我的人生目的？', questionEn: 'How do I attain my purpose?', questionBm: 'Bagaimana saya mencapai tujuan saya?',
    descZh: '你有把意念变成现实的执行力。',
    descEn: 'You have the drive to turn intentions into reality.',
    descBm: 'Anda mempunyai semangat untuk mengubah niat menjadi kenyataan.',
  },
  {
    id: 10, nameZh: '行星', nameEn: 'Planetary', nameBm: 'Planeta',
    questionZh: '我在人世间的显化是什么？', questionEn: 'How do I perfect what I do?', questionBm: 'Bagaimana saya menyempurnakan apa yang saya lakukan?',
    descZh: '你擅长把计划真正落地、做出来。',
    descEn: 'You excel at manifesting plans into tangible results.',
    descBm: 'Anda cemerlang dalam merealisasikan rancangan menjadi hasil ketara.',
  },
  {
    id: 11, nameZh: '光谱', nameEn: 'Spectral', nameBm: 'Spektral',
    questionZh: '我该如何释放与放下？', questionEn: 'How do I release and let go?', questionBm: 'Bagaimana saya melepaskan dan membiarkan pergi?',
    descZh: '你敢释放掉不需要的，给自己腾出空间。',
    descEn: 'You dare to release what is unnecessary — creating space for what matters.',
    descBm: 'Anda berani melepaskan yang tidak perlu — mencipta ruang untuk apa yang penting.',
  },
  {
    id: 12, nameZh: '水晶', nameEn: 'Crystal', nameBm: 'Kristal',
    questionZh: '我该如何将自己奉献给所有生命？', questionEn: 'How can I dedicate myself to all that lives?', questionBm: 'Bagaimana saya boleh mengabdikan diri kepada semua yang hidup?',
    descZh: '你头脑清澈，也懂得与人合作。',
    descEn: 'You have a clear mind and know how to collaborate.',
    descBm: 'Anda mempunyai minda yang jernih dan tahu cara bekerjasama.',
  },
  {
    id: 13, nameZh: '宇宙', nameEn: 'Cosmic', nameBm: 'Kosmik',
    questionZh: '我该如何回到当下，扩大分享爱与喜乐？', questionEn: 'How do I expand my joy and love?', questionBm: 'Bagaimana saya mengembangkan kegembiraan dan kasih sayang saya?',
    descZh: '你能放下小我，回到更大的整体里。',
    descEn: 'You transcend the ego — returning to the greater whole.',
    descBm: 'Anda mengatasi ego — kembali kepada keseluruhan yang lebih besar.',
  },
]

export const WAVESPELL_QUESTIONS = [
  { zh: '我的目的是什么？', en: 'What is my purpose?', bm: 'Apakah tujuan saya?' },
  { zh: '我的挑战是什么？', en: 'What is my challenge?', bm: 'Apakah cabaran saya?' },
  { zh: '我该如何给予最佳的服务？', en: 'How can I best serve?', bm: 'Bagaimana saya boleh berkhidmat dengan terbaik?' },
  { zh: '我该以什么样的形式来服务他人？', en: 'What form will my service take?', bm: 'Apakah bentuk khidmat saya?' },
  { zh: '我该如何让自己获得最大力量？', en: 'How do I best empower myself?', bm: 'Bagaimana saya memperkasakan diri terbaik?' },
  { zh: '我该如何在人际中扩展与他人的平衡？', en: 'How can I extend my equality to others?', bm: 'Bagaimana saya boleh memperluas kesaksamaan kepada orang lain?' },
  { zh: '我该如何归于中心与他人协调？', en: 'How can I attune my service to others?', bm: 'Bagaimana saya boleh menyelaraskan khidmat saya kepada orang lain?' },
  { zh: '我是否忠于我的信念生活？', en: 'Do I live what I believe?', bm: 'Adakah saya menghayati kepercayaan saya?' },
  { zh: '我该如何完成我的人生目的？', en: 'How do I attain my purpose?', bm: 'Bagaimana saya mencapai tujuan saya?' },
  { zh: '我在人世间的显化是什么？', en: 'How do I perfect what I do?', bm: 'Bagaimana saya menyempurnakan apa yang saya lakukan?' },
  { zh: '我该如何释放与放下？', en: 'How do I release and let go?', bm: 'Bagaimana saya melepaskan dan membiarkan pergi?' },
  { zh: '我该如何将自己奉献给所有生命？', en: 'How can I dedicate myself to all that lives?', bm: 'Bagaimana saya boleh mengabdikan diri kepada semua yang hidup?' },
  { zh: '我该如何回到当下，扩大分享爱与喜乐？', en: 'How do I expand my joy and love?', bm: 'Bagaimana saya mengembangkan kegembiraan dan kasih sayang saya?' },
]
```

- [ ] **Step 7: Run tests again — expect PASS**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Maya calculation engine with full trilingual data"
```

---

## Task 3: Supabase Setup

**Files:**
- Create: `supabase/schema.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local` (gitignored)

**Interfaces:**
- Produces: `createBrowserClient()` and `createServerClient()` Supabase instances
- Produces: `leads` table in Supabase

- [ ] **Step 1: Create a Supabase project**

1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `maya-website`
3. Copy **Project URL** and **anon public key** from Settings → API

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Add to `.gitignore`:
```
.env.local
```

- [ ] **Step 3: Create schema.sql**

```sql
-- supabase/schema.sql
-- Run this in Supabase Dashboard → SQL Editor

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  phone text not null,
  birthday date not null,
  kin integer not null,
  signature text not null,
  locale text default 'zh'
);

-- Enable Row Level Security
alter table leads enable row level security;

-- Only service role can read leads (admin backend)
create policy "service role only" on leads
  for all using (auth.role() = 'service_role');

-- Anyone can insert (public query form)
create policy "public insert" on leads
  for insert with check (true);
```

Run this SQL in Supabase Dashboard → SQL Editor → New Query.

- [ ] **Step 4: Create lib/supabase/client.ts**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Install Supabase SSR package**

```bash
npm install @supabase/ssr
```

- [ ] **Step 6: Create lib/supabase/server.ts**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema and client setup"
```

---

## Task 4: Global Layout + Navigation

**Files:**
- Create: `app/layout.tsx`
- Create: `app/[locale]/layout.tsx`
- Create: `components/Navigation.tsx`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: locale-aware layout wrapping all pages; nav with ZH/EN/BM switcher

- [ ] **Step 1: Update tailwind.config.ts** with custom colors

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a12',
        bg2: '#11101d',
        panel: '#15131f',
        gold: '#d9b15a',
        'gold-d': '#a8843a',
        dim: '#9a93a8',
        dim2: '#6b6478',
        'seal-red': '#d8504e',
        'seal-white': '#e9e4d6',
        'seal-blue': '#4f7bd4',
        'seal-yellow': '#e0b13a',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        serif: ['Noto Serif SC', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Create app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Noto_Sans_SC, Noto_Serif_SC, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans_SC({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-sans' })
const notoSerif = Noto_Serif_SC({ subsets: ['latin'], weight: ['400', '500', '600', '700', '900'], variable: '--font-serif' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant' })

export const metadata: Metadata = {
  title: '一号能量馆 · 玛雅图腾查询',
  description: '找到你天生的能量图腾 — Maya Galactic Signature',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={`${notoSans.variable} ${notoSerif.variable} ${cormorant.variable} bg-bg text-[#ece6d9] antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: var(--font-sans), sans-serif;
    overflow-x: hidden;
  }
}
```

- [ ] **Step 4: Create components/Navigation.tsx**

```tsx
// components/Navigation.tsx
'use client'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

const LOCALES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'bm', label: 'BM' },
]

export default function Navigation() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(newLocale: string) {
    // Replace the current locale prefix
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <nav className="relative z-10 flex items-center justify-between px-5 py-4 max-w-4xl mx-auto">
      <Link href={`/${locale}`} className="font-serif font-bold text-gold text-lg tracking-wide">
        一号能量馆
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href={`/${locale}/query`} className="text-[#ece6d9] hover:text-gold transition-colors hidden sm:block">
          {t('query')}
        </Link>
        <Link href={`/${locale}/learn`} className="text-[#ece6d9] hover:text-gold transition-colors hidden sm:block">
          {t('learn')}
        </Link>
        <div className="flex gap-1 border border-gold/30 rounded-full px-2 py-1">
          {LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                locale === l.code ? 'bg-gold text-[#1a1408]' : 'text-gold hover:bg-gold/20'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Create app/[locale]/layout.tsx**

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Navigation from '@/components/Navigation'
import { notFound } from 'next/navigation'

const locales = ['zh', 'en', 'bm']

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Navigation />
      <main>{children}</main>
      <Footer locale={locale} messages={messages} />
    </NextIntlClientProvider>
  )
}

function Footer({ locale, messages }: { locale: string; messages: any }) {
  const f = messages.footer
  return (
    <footer className="text-center text-dim2 text-xs leading-loose py-10 mt-8 border-t border-gold/10 px-4">
      <div className="font-serif font-semibold text-gold text-sm mb-1">{f.brand}</div>
      {f.tagline}<br />
      {f.disclaimer}
    </footer>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add trilingual navigation and locale layout"
```

---

## Task 5: Homepage

**Files:**
- Create: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `useTranslations('hero')`, locale routing

- [ ] **Step 1: Create app/[locale]/page.tsx**

```tsx
// app/[locale]/page.tsx
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' })
  return { title: `${t('title')} · 一号能量馆` }
}

export default function HomePage() {
  const t = useTranslations('hero')
  const tColors = useTranslations('colors')

  const colors = [
    { key: 'R', color: '#d8504e', role: '红 · 启动者', roleEn: 'Initiator', desc: '开创、行动、点燃。每段旅程，由你开始。' },
    { key: 'W', color: '#e9e4d6', role: '白 · 净化者', roleEn: 'Refiner', desc: '精炼、觉察、提纯。你让混乱变清晰。' },
    { key: 'B', color: '#4f7bd4', role: '蓝 · 蜕变者', roleEn: 'Transformer', desc: '转化、改变、重生。你让旧的变成新的。' },
    { key: 'Y', color: '#e0b13a', role: '黄 · 成熟者', roleEn: 'Ripener', desc: '收获、智慧、圆满。你让一切走向成果。' },
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-gold/10 blur-[110px] opacity-50" />
        <div className="absolute -bottom-36 -right-24 w-[460px] h-[460px] rounded-full bg-seal-blue/10 blur-[110px] opacity-40" />
      </div>

      <div className="relative z-1 max-w-2xl mx-auto px-5 text-center">
        {/* Hero */}
        <section className="pt-10 pb-12">
          <div className="font-cormorant italic text-gold tracking-[0.18em] text-base uppercase mb-4">
            {t('kicker')}
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-5xl text-white leading-tight mb-5">
            {t('title')}
          </h1>
          <p className="text-dim text-base leading-relaxed mb-8 max-w-md mx-auto">
            {t('subtitle')}
          </p>
          <Link
            href="query"
            className="inline-block bg-gradient-to-r from-gold-d to-gold text-[#1a1408] font-serif font-bold text-lg px-10 py-4 rounded-full shadow-[0_0_26px_rgba(217,177,90,0.4)] hover:shadow-[0_0_40px_rgba(217,177,90,0.6)] hover:-translate-y-0.5 transition-all"
          >
            {t('cta')}
          </Link>
        </section>

        {/* Color families */}
        <section className="pb-16">
          <h2 className="font-serif text-white text-lg font-semibold mb-1">四种能量颜色，四种天生角色</h2>
          <p className="text-dim2 text-sm mb-6">每个图腾都属于其中一种颜色</p>
          <div className="grid grid-cols-2 gap-3">
            {colors.map(c => (
              <div key={c.key} className="bg-panel border border-gold/15 rounded-xl p-4 flex gap-3 items-start text-left">
                <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0 shadow-[0_0_10px_currentColor]" style={{ background: c.color, color: c.color }} />
                <div>
                  <h5 className="font-serif text-white font-bold text-sm mb-1">{c.role}</h5>
                  <p className="text-dim text-xs leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify homepage renders**

```bash
npm run dev
```
Open http://localhost:3000 — should show hero section with gold CTA button and color families grid.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add trilingual homepage with hero and color families"
```

---

## Task 6: Query Page (Calculator)

**Files:**
- Create: `app/[locale]/query/page.tsx`
- Create: `components/QueryForm.tsx`
- Create: `components/ResultCard.tsx`
- Create: `components/OracleCross.tsx`
- Create: `components/ToneGlyph.tsx`
- Create: `components/GlyphIcon.tsx`
- Create: `components/WhatsAppButton.tsx`
- Create: `app/api/leads/route.ts`

**Interfaces:**
- Consumes: `calcKin`, `getOracle`, `getMoonDate`, `SEALS`, `TONES` from `lib/maya/`
- Produces: lead saved to Supabase `leads` table via `/api/leads` POST

- [ ] **Step 1: Create components/GlyphIcon.tsx**

```tsx
// components/GlyphIcon.tsx
import { SEALS } from '@/lib/maya/data'

const COLOR_CLASS: Record<string, string> = {
  R: 'border-seal-red text-seal-red',
  W: 'border-seal-white text-seal-white',
  B: 'border-seal-blue text-seal-blue',
  Y: 'border-seal-yellow text-seal-yellow',
}

interface Props {
  sealIndex: number  // 0-19
  size?: 'sm' | 'md' | 'lg'
  main?: boolean
}

export default function GlyphIcon({ sealIndex, size = 'md', main = false }: Props) {
  const seal = SEALS[sealIndex]
  const sz = size === 'lg' ? 74 : size === 'sm' ? 48 : 62
  const glow = main ? ' shadow-[0_0_22px_rgba(217,177,90,0.4)]' : ''

  return (
    <div
      className={`rounded-[14px] border-2 bg-black/30 flex items-center justify-center ${COLOR_CLASS[seal.color]}${glow}`}
      style={{ width: sz, height: sz }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '62%', height: '62%' }}
        dangerouslySetInnerHTML={{ __html: seal.svgPath }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create components/ToneGlyph.tsx**

```tsx
// components/ToneGlyph.tsx
interface Props { tone: number }  // 1-13

export default function ToneGlyph({ tone }: Props) {
  const bars = Math.floor(tone / 5)
  const dots = tone % 5

  return (
    <div className="inline-flex flex-col items-center gap-1 my-2 px-4 py-3 border border-gold rounded-xl bg-black/25">
      {dots > 0 && (
        <div className="flex gap-1.5 h-3 items-center">
          {Array.from({ length: dots }).map((_, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_8px_rgba(217,177,90,0.6)]" />
          ))}
        </div>
      )}
      {bars > 0 && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: bars }).map((_, i) => (
            <span key={i} className="block w-10 h-2 rounded bg-gold shadow-[0_0_8px_rgba(217,177,90,0.6)]" />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create components/OracleCross.tsx**

```tsx
// components/OracleCross.tsx
import GlyphIcon from './GlyphIcon'
import { sealOf } from '@/lib/maya/calculator'
import { SEALS } from '@/lib/maya/data'
import type { OracleResult } from '@/lib/maya/types'

interface Props {
  oracle: OracleResult
  roleLabels: { guide: string; support: string; challenge: string; hidden: string; main: string }
}

export default function OracleCross({ oracle, roleLabels }: Props) {
  const mainIdx = sealOf(oracle.main) - 1
  const guideIdx = sealOf(oracle.guide) - 1
  const supportIdx = sealOf(oracle.support) - 1
  const challengeIdx = sealOf(oracle.challenge) - 1
  const hiddenIdx = sealOf(oracle.hidden) - 1

  function Cell({ sealIdx, role, main }: { sealIdx: number; role: string; main?: boolean }) {
    return (
      <div className="flex flex-col items-center gap-1">
        <GlyphIcon sealIndex={sealIdx} size={main ? 'lg' : 'md'} main={main} />
        <span className="text-[10px] text-dim">{role}</span>
        <span className={`text-xs font-semibold font-serif ${main ? 'text-gold' : 'text-white'}`}>
          {SEALS[sealIdx].nameZh}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
      <div />
      <Cell sealIdx={guideIdx} role={roleLabels.guide} />
      <div />
      <Cell sealIdx={challengeIdx} role={roleLabels.challenge} />
      <Cell sealIdx={mainIdx} role={roleLabels.main} main />
      <Cell sealIdx={supportIdx} role={roleLabels.support} />
      <div />
      <Cell sealIdx={hiddenIdx} role={roleLabels.hidden} />
      <div />
    </div>
  )
}
```

- [ ] **Step 4: Create components/WhatsAppButton.tsx**

```tsx
// components/WhatsAppButton.tsx
'use client'

interface Props {
  kin: number
  signatureName: string
  label: string
  noteLabel: string
  messagePrefix: string
}

export default function WhatsAppButton({ kin, signatureName, label, noteLabel, messagePrefix }: Props) {
  const message = encodeURIComponent(`${messagePrefix} ${kin}（${signatureName}），想预约完整天赋解读！`)
  const url = `https://wa.me/601168270881?text=${message}`

  return (
    <div className="text-center mt-6">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-gradient-to-r from-gold-d to-gold text-[#1a1408] font-serif font-bold text-base px-8 py-4 rounded-full shadow-[0_0_26px_rgba(217,177,90,0.4)] hover:shadow-[0_0_40px_rgba(217,177,90,0.6)] hover:-translate-y-0.5 transition-all"
      >
        {label}
      </a>
      <p className="text-dim2 text-xs mt-3">{noteLabel}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create app/api/leads/route.ts**

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, birthday, kin, signature, locale } = body

    if (!name || !phone || !birthday || !kin || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('leads').insert({
      name, phone, birthday, kin, signature, locale: locale || 'zh'
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Lead save error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Create components/QueryForm.tsx**

```tsx
// components/QueryForm.tsx
'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { calcKin, getOracle, getMoonDate, sealOf, toneOf } from '@/lib/maya/calculator'
import { SEALS, TONES } from '@/lib/maya/data'
import ResultCard from './ResultCard'

export default function QueryForm() {
  const t = useTranslations('query')
  const locale = useLocale()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<null | ReturnType<typeof buildResult>>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const daysInMonth = year && month ? new Date(+year, +month, 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function buildResult(y: number, m: number, d: number) {
    const kin = calcKin(y, m, d)
    const oracle = getOracle(kin)
    const moonDate = getMoonDate(y, m, d)
    const seal = SEALS[sealOf(kin) - 1]
    const tone = TONES[toneOf(kin) - 1]
    const wsSeal = SEALS[oracle.wavespellLeadSeal - 1]
    const igSeal = SEALS[sealOf(oracle.innerGoddess) - 1]
    const igTone = TONES[toneOf(oracle.innerGoddess) - 1]
    return { kin, oracle, moonDate, seal, tone, wsSeal, igSeal, igTone, name }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError(t('errorName')); return }
    if (!phone.trim()) { setError(t('errorPhone')); return }
    if (!year || !month || !day) { setError(t('errorDate')); return }

    const y = +year, m = +month, d = +day
    const data = buildResult(y, m, d)
    setResult(data)

    // Save lead (fire and forget)
    const bday = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const sealName = locale === 'en' ? data.seal.nameEn : locale === 'bm' ? data.seal.nameBm : data.seal.nameZh
    const toneName = locale === 'en' ? data.tone.nameEn : locale === 'bm' ? data.tone.nameBm : data.tone.nameZh
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), birthday: bday, kin: data.kin, signature: `${toneName}的${sealName}`, locale }),
    }).catch(() => {})

    setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const inputClass = "w-full bg-bg text-[#ece6d9] border border-gold/20 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/15 transition-all"
  const labelClass = "block text-[11px] tracking-[0.12em] text-gold font-medium mb-1.5"
  const selectClass = inputClass + " cursor-pointer appearance-none text-center"

  return (
    <>
      <div className="bg-gradient-to-br from-panel to-bg2 border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-[0_18px_50px_rgba(0,0,0,0.45)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <h3 className="font-serif font-bold text-white text-center text-lg mb-1">{t('title')}</h3>
        <p className="text-dim2 text-sm text-center mb-6">{t('subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t('name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} type="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('birthday')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: year, setter: setYear, placeholder: t('year'), options: years },
                { value: month, setter: setMonth, placeholder: t('month'), options: months },
                { value: day, setter: setDay, placeholder: t('day'), options: days },
              ].map(({ value, setter, placeholder, options }, idx) => (
                <div key={idx} className="relative">
                  <select value={value} onChange={e => setter(e.target.value)} className={selectClass}>
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="absolute right-3 bottom-3.5 text-gold text-xs pointer-events-none">▾</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-dim2 text-xs leading-relaxed">{t('consent')}</p>
          <button type="submit" className="w-full bg-gradient-to-r from-gold-d to-gold text-[#1a1408] font-serif font-bold text-lg py-4 rounded-full shadow-[0_0_26px_rgba(217,177,90,0.35)] hover:shadow-[0_0_40px_rgba(217,177,90,0.55)] hover:-translate-y-0.5 transition-all">
            {t('submit')}
          </button>
          {error && <p className="text-seal-red text-sm text-center">{error}</p>}
        </form>
      </div>

      {result && (
        <div id="result-section" className="mt-6">
          <ResultCard result={result} locale={locale} />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 7: Create components/ResultCard.tsx**

```tsx
// components/ResultCard.tsx
'use client'
import { useTranslations } from 'next-intl'
import ToneGlyph from './ToneGlyph'
import OracleCross from './OracleCross'
import WhatsAppButton from './WhatsAppButton'
import { SEALS, TONES, WAVESPELL_QUESTIONS } from '@/lib/maya/data'
import { sealOf, toneOf } from '@/lib/maya/calculator'
import type { OracleResult, MoonDate } from '@/lib/maya/types'

const COLOR_VAR: Record<string, string> = {
  R: '#d8504e', W: '#e9e4d6', B: '#4f7bd4', Y: '#e0b13a'
}

interface ResultData {
  kin: number
  oracle: OracleResult
  moonDate: MoonDate
  seal: (typeof SEALS)[0]
  tone: (typeof TONES)[0]
  wsSeal: (typeof SEALS)[0]
  igSeal: (typeof SEALS)[0]
  igTone: (typeof TONES)[0]
  name: string
}

function localName(obj: any, locale: string, field: string): string {
  if (locale === 'en') return obj[`${field}En`]
  if (locale === 'bm') return obj[`${field}Bm`]
  return obj[`${field}Zh`]
}

export default function ResultCard({ result, locale }: { result: ResultData; locale: string }) {
  const t = useTranslations('query')
  const { kin, oracle, moonDate, seal, tone, wsSeal, igSeal, igTone, name } = result
  const accentColor = COLOR_VAR[seal.color]
  const sealName = localName(seal, locale, 'name')
  const toneName = localName(tone, locale, 'name')
  const wsName = localName(wsSeal, locale, 'name')

  return (
    <div
      className="rounded-2xl border p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      style={{
        background: `linear-gradient(170deg, ${accentColor}22, #11101d 70%)`,
        borderColor: accentColor,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${accentColor}44`,
      }}
    >
      {/* Ring glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}66, transparent 68%)` }} />

      <p className="relative text-sm mb-2" style={{ color: '#ece6d9' }}>
        嗨 <b style={{ color: accentColor }}>{name}</b>，这是你天生的能量 —
      </p>
      <div className="font-cormorant italic tracking-[0.2em] text-sm uppercase mb-1" style={{ color: accentColor }}>
        {t('kinLabel')}
      </div>
      <div className="font-serif font-black text-5xl text-white mb-1" style={{ textShadow: `0 0 30px ${accentColor}66` }}>
        <small className="text-base font-medium" style={{ color: accentColor }}>{t('kin')} </small>
        {kin}
      </div>
      <div className="font-serif font-black text-2xl text-white mb-1">{toneName}的{sealName}</div>
      <div className="font-cormorant italic mb-1" style={{ color: accentColor }}>{tone.nameEn} {seal.nameEn}</div>
      <div className="text-dim text-xs tracking-wide mb-2">{wsName}{t('wavespell')} {oracle.wavespellPosition} {t('wavespellDay')}</div>

      <ToneGlyph tone={oracle.wavespellPosition} />
      <div className="text-xs text-dim mb-6">
        {t('toneLabel')} <b style={{ color: accentColor }}>{oracle.wavespellPosition}</b> {t('toneNum')}
      </div>

      <h3 className="font-serif text-white font-semibold text-base mb-1">{t('oracleTitle')}</h3>
      <p className="text-dim2 text-xs mb-4">{t('oracleSub')}</p>
      <OracleCross oracle={oracle} roleLabels={{
        guide: t('roleGuide'), support: t('roleSupport'),
        challenge: t('roleChallenge'), hidden: t('roleHidden'), main: t('roleMain'),
      }} />

      {/* Seal description */}
      <Section label={t('sectionSeal')} accentColor={accentColor}>
        <h4 className="font-serif text-white font-bold text-lg mb-1">{sealName}</h4>
        <p className="text-dim text-sm leading-relaxed">{localName(seal, locale, 'desc')}</p>
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {(locale === 'en' ? seal.keywordsEn : locale === 'bm' ? seal.keywordsBm : seal.keywordsZh).map(kw => (
            <span key={kw} className="text-xs px-3 py-1 rounded-full border" style={{ color: accentColor, borderColor: accentColor, background: `${accentColor}22` }}>{kw}</span>
          ))}
        </div>
      </Section>

      {/* Tone description */}
      <Section label={t('sectionTone')} accentColor={accentColor}>
        <h4 className="font-serif text-white font-bold text-base mb-1">{toneName} · 第 {oracle.wavespellPosition} 号音</h4>
        <p className="text-dim text-sm leading-relaxed">{localName(tone, locale, 'desc')}</p>
      </Section>

      {/* 13 Moon Birthday */}
      <Section label={t('sectionMoon')} accentColor={accentColor}>
        {moonDate.isNoTimeDay ? (
          <p className="text-dim text-sm">无时间日（7月25日）· 不属于任何月份</p>
        ) : (
          <>
            <div className="font-serif text-white font-semibold">{moonDate.moonName} · 第 {moonDate.day} 天</div>
            <div className="text-dim text-xs mt-1">
              {moonDate.yearBearerKin && `${TONES[toneOf(moonDate.yearBearerKin) - 1].nameZh}${SEALS[sealOf(moonDate.yearBearerKin) - 1].nameZh}年`} · 你出生那年的能量主题
            </div>
          </>
        )}
      </Section>

      {/* Inner Goddess */}
      <Section label={t('sectionGoddess')} accentColor={accentColor}>
        <div className="font-serif text-white font-semibold">
          KIN.{oracle.innerGoddess} {localName(igTone, locale, 'name')}的{localName(igSeal, locale, 'name')}
        </div>
        <div className="text-dim text-xs mt-1">五大神谕合一后，你内在的阴性／灵性力量</div>
      </Section>

      {/* Unlock CTA */}
      <div className="border border-dashed border-gold/30 rounded-2xl p-6 mt-4 text-center bg-gold/5">
        <h3 className="font-serif text-white font-bold text-lg mb-3 leading-snug">
          这张神谕图，是你天赋地图的<span style={{ color: accentColor }}>起点</span>。
        </h3>
        <p className="text-dim text-sm leading-relaxed mb-5 max-w-sm mx-auto">
          图腾告诉你「天生有什么」，但怎么把它用在工作、转行、面试和人生方向上，需要一份完整解读。
        </p>
        <WhatsAppButton
          kin={kin}
          signatureName={`${toneName}的${sealName}`}
          label={t('bookBtn')}
          noteLabel={t('bookNote')}
          messagePrefix={t('waMessage')}
        />
      </div>
    </div>
  )
}

function Section({ label, accentColor, children }: { label: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div className="text-left bg-black/20 border border-white/5 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-4 h-px" style={{ background: accentColor }} />
        <span className="text-[10px] tracking-[0.16em] font-semibold" style={{ color: accentColor }}>{label}</span>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Create app/[locale]/query/page.tsx**

```tsx
// app/[locale]/query/page.tsx
import { getTranslations } from 'next-intl/server'
import QueryForm from '@/components/QueryForm'
import type { Metadata } from 'next'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'query' })
  return { title: `${t('title')} · 一号能量馆` }
}

export default function QueryPage() {
  return (
    <div className="relative max-w-xl mx-auto px-4 py-6">
      <QueryForm />
    </div>
  )
}
```

- [ ] **Step 9: Test the calculator manually**

```bash
npm run dev
```
1. Go to http://localhost:3000/zh/query
2. Enter any name, phone, birthday 1987-01-17
3. Click submit → result should show KIN 113, 自我存在的蓝夜
4. Switch language to EN → UI should update
5. WhatsApp button should open wa.me/601168270881 in new tab

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Maya query form, result card, oracle cross, WhatsApp CTA"
```

---

## Task 7: Deploy to Vercel

**Files:**
- Create: `.env.local` (already done, gitignored)
- Vercel env vars set via dashboard

- [ ] **Step 1: Push to GitHub**

1. Create new repo on github.com (e.g. `maya-website`)
2. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/maya-website.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to [vercel.com](https://vercel.com) → Add New Project → Import from GitHub
2. Select `maya-website` repo
3. Framework: Next.js (auto-detected)
4. Click **Deploy**

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel Dashboard → Project Settings → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL        = (your supabase project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY   = (your supabase anon key)
SUPABASE_SERVICE_ROLE_KEY       = (your supabase service role key)
```
Then: **Redeploy**

- [ ] **Step 4: Verify live site**

1. Open the Vercel-generated URL (e.g. `maya-website.vercel.app`)
2. Test the calculator with a real birthday
3. Check Supabase Dashboard → Table Editor → leads → verify a row was inserted

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 complete — calculator live on Vercel"
git push
```

---

## Phase 2 Preview (Next Plans)

After Phase 1 is live and working, the following phases follow:

| Phase | Scope |
|-------|-------|
| **Phase 2** | Learning hub: 20 seal pages, 13 tone pages, wavespell + 13 moons explainers, blog |
| **Phase 3** | User auth (Supabase Auth) + dashboard (saved readings) |
| **Phase 4** | Admin panel: leads table, content editor for seals/tones, article CMS |

Each phase has its own plan document.
