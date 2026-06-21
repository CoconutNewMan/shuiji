# 买水机三代分成平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修改 SmartCloud 代码，改造为买水机月租 + 三代佣金分成平台，支持中文/英文/马来文三语言。

**Architecture:** 保留现有 Node.js + Express + MySQL + Curlec 全栈架构，只修改内容层（品牌、产品、语言）和补强组织图功能。不重写任何已有逻辑，最小化改动。

**Tech Stack:** Node.js 18+, Express 4, MySQL 8.0, Tailwind CSS (CDN), Vanilla JS, Curlec Payment API, JWT

## Global Constraints

- 品牌名用占位符 `[BRAND]`，上线前全局替换
- 月租金额用占位符 `RM_MONTHLY_PRICE`，上线前填入
- 佣金比例固定：直推 40%，第2代 3%，第3代 2%
- 货币只支持 MYR
- 三语言：`zh`（中文默认）、`en`（English）、`ms`（Bahasa Malaysia）
- 所有文件修改均在现有项目目录内，不新增框架

---

## File Map

| 文件 | 动作 | 说明 |
|------|------|------|
| `index.html` | Modify | 品牌、产品内容、三语言 |
| `server.js` | Modify | 补强 team-tree 第3代查询 |
| `.env.example` | Modify | 更新占位符说明 |
| `migrations/schema.sql` | Modify | 更新产品 seed 数据 |
| `docs/superpowers/specs/2026-06-22-water-machine-mlm-design.md` | Reference | 设计文档 |

---

## Task 1: 更新后端 team-tree API（补强第3代）

**Files:**
- Modify: `server.js` (team-tree endpoint, 约第310-350行)

**Interfaces:**
- Produces: `GET /api/agents/:agentId/team-tree` 返回完整3代数据，含 level3 成员列表

- [ ] **Step 1: 找到现有 team-tree endpoint**

打开 `server.js`，找到 `app.get('/api/agents/:agentId/team-tree'`（约第310行）。现有代码只查了 level1 和 level2 的 count，没有 level3。

- [ ] **Step 2: 替换 team-tree endpoint 实现**

将整个 team-tree handler 替换为以下代码：

```javascript
app.get('/api/agents/:agentId/team-tree', authenticateToken, async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const connection = await pool.getConnection();

    // Level 1: 直接下线
    const [level1] = await connection.query(
      `SELECT a.id, u.name, u.email, a.status, a.created_at, a.wallet_balance
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.referrer_id = ?
       ORDER BY a.created_at DESC`,
      [agentId]
    );

    // Level 2: level1 的下线
    let level2Members = [];
    if (level1.length > 0) {
      const level1Ids = level1.map(a => a.id);
      const placeholders = level1Ids.map(() => '?').join(',');
      const [l2] = await connection.query(
        `SELECT a.id, u.name, u.email, a.status, a.created_at, a.referrer_id
         FROM agents a
         JOIN users u ON a.user_id = u.id
         WHERE a.referrer_id IN (${placeholders})
         ORDER BY a.created_at DESC`,
        level1Ids
      );
      level2Members = l2;
    }

    // Level 3: level2 的下线
    let level3Members = [];
    if (level2Members.length > 0) {
      const level2Ids = level2Members.map(a => a.id);
      const placeholders = level2Ids.map(() => '?').join(',');
      const [l3] = await connection.query(
        `SELECT a.id, u.name, u.email, a.status, a.created_at, a.referrer_id
         FROM agents a
         JOIN users u ON a.user_id = u.id
         WHERE a.referrer_id IN (${placeholders})
         ORDER BY a.created_at DESC`,
        level2Ids
      );
      level3Members = l3;
    }

    connection.release();

    res.json({
      success: true,
      data: {
        agentId,
        level1: { count: level1.length, members: level1 },
        level2: { count: level2Members.length, members: level2Members },
        level3: { count: level3Members.length, members: level3Members }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 3: 手动测试 API**

启动服务器：
```bash
node server.js
```

用 curl 测试（替换 TOKEN 和 AGENT_ID）：
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/agents/AGENT_ID/team-tree
```

预期输出：
```json
{
  "success": true,
  "data": {
    "agentId": "1",
    "level1": { "count": 0, "members": [] },
    "level2": { "count": 0, "members": [] },
    "level3": { "count": 0, "members": [] }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: enhance team-tree API to return full 3-level member lists"
```

---

## Task 2: 更新产品 Seed 数据（水机）

**Files:**
- Modify: `migrations/schema.sql` 或直接在 `server.js` 的 mockProducts

**Interfaces:**
- Produces: 产品列表只含水机型号，价格用占位符

- [ ] **Step 1: 找到 server.js 中的 mock 产品数据**

在 `index.html` 约第 792 行找到 `const mockProducts = [...]`。

- [ ] **Step 2: 替换产品数据为水机型号**

将 `mockProducts` 数组替换为：

```javascript
const mockProducts = [
  {
    id: 1,
    name: { zh: '净水机 Pro 标准版', en: 'Water Purifier Pro Standard', ms: 'Penapis Air Pro Standard' },
    category: { zh: '净水机', en: 'Water Purifier', ms: 'Penapis Air' },
    monthlyPrice: 'RM_MONTHLY_PRICE',
    image: 'https://via.placeholder.com/400x400?text=Water+Purifier+Pro',
    features: { zh: ['RO 反渗透过滤', '冷热双温', '免费安装'], en: ['RO Filtration', 'Hot & Cold', 'Free Installation'], ms: ['Penapisan RO', 'Panas & Sejuk', 'Pasang Percuma'] }
  },
  {
    id: 2,
    name: { zh: '净水机 Plus 豪华版', en: 'Water Purifier Plus Deluxe', ms: 'Penapis Air Plus Deluxe' },
    category: { zh: '净水机', en: 'Water Purifier', ms: 'Penapis Air' },
    monthlyPrice: 'RM_MONTHLY_PRICE',
    image: 'https://via.placeholder.com/400x400?text=Water+Purifier+Plus',
    features: { zh: ['8级过滤系统', '冷热温三温', '智能水质检测', '免费安装'], en: ['8-Stage Filter', 'Hot/Warm/Cold', 'Smart Water Quality', 'Free Installation'], ms: ['Penapis 8 Peringkat', 'Panas/Suam/Sejuk', 'Kualiti Air Pintar', 'Pasang Percuma'] }
  },
  {
    id: 3,
    name: { zh: '净水机 Lite 入门版', en: 'Water Purifier Lite Basic', ms: 'Penapis Air Lite Asas' },
    category: { zh: '净水机', en: 'Water Purifier', ms: 'Penapis Air' },
    monthlyPrice: 'RM_MONTHLY_PRICE',
    image: 'https://via.placeholder.com/400x400?text=Water+Purifier+Lite',
    features: { zh: ['5级过滤系统', '常温出水', '免费安装'], en: ['5-Stage Filter', 'Room Temperature', 'Free Installation'], ms: ['Penapis 5 Peringkat', 'Suhu Bilik', 'Pasang Percuma'] }
  }
];
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: replace product data with water machine models"
```

---

## Task 3: 添加三语言支持系统

**Files:**
- Modify: `index.html` — 在 `<script>` 块顶部添加 i18n 对象和切换函数

**Interfaces:**
- Produces: `window.i18n` 对象，`setLanguage(lang)` 函数，`t(key)` 翻译函数

- [ ] **Step 1: 在 index.html script 块顶部添加翻译数据**

在 `<script>` 标签开头（`const mockProducts` 之前）插入：

```javascript
// =====================
// 三语言系统
// =====================
const translations = {
  zh: {
    nav_home: '首页',
    nav_products: '产品',
    nav_agent_center: '代理中心',
    nav_agent_login: '登录',
    nav_agent_dashboard: '我的仪表板',
    nav_agent_register: '成为代理',
    nav_admin: '管理员',
    hero_title: '[BRAND] 净水机',
    hero_subtitle: '优质净水，健康生活。加入我们的代理网络，开始赚取被动收入。',
    hero_browse: '浏览产品',
    hero_join: '成为代理赚佣金',
    products_title: '我们的净水机',
    products_subtitle: '选择适合你的型号，每月轻松租用',
    monthly_rental: '月租',
    join_agent: '成为代理',
    commission_title: '代理佣金制度',
    commission_level1: '直推佣金 40%',
    commission_level2: '第二代 3%',
    commission_level3: '第三代 2%',
    commission_desc: '每当你的下线支付月租，你自动获得佣金入账。',
    agent_login_title: '代理登录',
    agent_login_subtitle: '访问你的仪表板和佣金',
    label_email: '邮箱',
    label_password: '密码',
    btn_login: '登录',
    btn_register: '立即注册',
    no_account: '还没有账户？',
    become_agent: '成为代理',
    forgot_password: '忘记密码？',
    register_title: '成为代理',
    register_subtitle: '开始你的被动收入之旅',
    label_name: '姓名',
    label_phone: '电话',
    label_ic: '身份证号',
    label_referrer: '推荐人ID（如有）',
    label_referrer_placeholder: '留空则为独立代理',
    terms_agree: '我同意',
    terms_link: '服务条款',
    and: '和',
    privacy_link: '隐私政策',
    already_have_account: '已有账户？',
    login_now: '立即登录',
    dashboard_welcome: '欢迎回来',
    dashboard_monthly_rental: '月租状态',
    dashboard_status_active: '已激活',
    dashboard_status_inactive: '未激活',
    dashboard_commission: '本月佣金',
    dashboard_wallet: '钱包余额',
    dashboard_team: '团队规模',
    dashboard_team_sub: '下3代成员',
    org_title: '我的组织图',
    org_level1: '第一代（直推）',
    org_level2: '第二代',
    org_level3: '第三代',
    org_you: '你',
    org_members: '人',
    org_empty: '暂无下线',
    commission_record_title: '佣金记录',
    withdraw_title: '申请提现',
    logout: '退出登录',
    footer_rights: '版权所有',
    admin_login_title: '管理员登录',
    admin_login_subtitle: '限管理员访问',
    admin_label_account: '管理员账户',
  },
  en: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_agent_center: 'Agent Center',
    nav_agent_login: 'Login',
    nav_agent_dashboard: 'My Dashboard',
    nav_agent_register: 'Become an Agent',
    nav_admin: 'Admin',
    hero_title: '[BRAND] Water Purifier',
    hero_subtitle: 'Pure water, healthy life. Join our agent network and start earning passive income.',
    hero_browse: 'Browse Products',
    hero_join: 'Become an Agent',
    products_title: 'Our Water Purifiers',
    products_subtitle: 'Choose your model, easy monthly rental',
    monthly_rental: 'Monthly Rental',
    join_agent: 'Become Agent',
    commission_title: 'Agent Commission Plan',
    commission_level1: 'Direct Referral 40%',
    commission_level2: '2nd Generation 3%',
    commission_level3: '3rd Generation 2%',
    commission_desc: 'Every time your downline pays their monthly rental, you automatically earn commission.',
    agent_login_title: 'Agent Login',
    agent_login_subtitle: 'Access your dashboard and commissions',
    label_email: 'Email',
    label_password: 'Password',
    btn_login: 'Login',
    btn_register: 'Register Now',
    no_account: "Don't have an account?",
    become_agent: 'Become an Agent',
    forgot_password: 'Forgot password?',
    register_title: 'Become an Agent',
    register_subtitle: 'Start your passive income journey',
    label_name: 'Full Name',
    label_phone: 'Phone',
    label_ic: 'IC Number',
    label_referrer: 'Referrer ID (optional)',
    label_referrer_placeholder: 'Leave blank if no referrer',
    terms_agree: 'I agree to the',
    terms_link: 'Terms of Service',
    and: 'and',
    privacy_link: 'Privacy Policy',
    already_have_account: 'Already have an account?',
    login_now: 'Login now',
    dashboard_welcome: 'Welcome back',
    dashboard_monthly_rental: 'Monthly Rental',
    dashboard_status_active: 'Active',
    dashboard_status_inactive: 'Inactive',
    dashboard_commission: 'This Month Commission',
    dashboard_wallet: 'Wallet Balance',
    dashboard_team: 'Team Size',
    dashboard_team_sub: 'Next 3 generations',
    org_title: 'My Organisation Chart',
    org_level1: '1st Generation (Direct)',
    org_level2: '2nd Generation',
    org_level3: '3rd Generation',
    org_you: 'You',
    org_members: 'members',
    org_empty: 'No downlines yet',
    commission_record_title: 'Commission Records',
    withdraw_title: 'Request Withdrawal',
    logout: 'Logout',
    footer_rights: 'All rights reserved',
    admin_login_title: 'Admin Login',
    admin_login_subtitle: 'Restricted access',
    admin_label_account: 'Admin Account',
  },
  ms: {
    nav_home: 'Utama',
    nav_products: 'Produk',
    nav_agent_center: 'Pusat Ejen',
    nav_agent_login: 'Log Masuk',
    nav_agent_dashboard: 'Papan Pemuka',
    nav_agent_register: 'Jadi Ejen',
    nav_admin: 'Admin',
    hero_title: '[BRAND] Penapis Air',
    hero_subtitle: 'Air tulen, hidup sihat. Sertai rangkaian ejen kami dan mula menjana pendapatan pasif.',
    hero_browse: 'Lihat Produk',
    hero_join: 'Jadi Ejen & Jana Komisen',
    products_title: 'Penapis Air Kami',
    products_subtitle: 'Pilih model anda, sewa bulanan yang mudah',
    monthly_rental: 'Sewa Bulanan',
    join_agent: 'Jadi Ejen',
    commission_title: 'Pelan Komisen Ejen',
    commission_level1: 'Rujukan Terus 40%',
    commission_level2: 'Generasi ke-2 3%',
    commission_level3: 'Generasi ke-3 2%',
    commission_desc: 'Setiap kali downline anda membayar sewa bulanan, anda secara automatik mendapat komisen.',
    agent_login_title: 'Log Masuk Ejen',
    agent_login_subtitle: 'Akses papan pemuka dan komisen anda',
    label_email: 'E-mel',
    label_password: 'Kata Laluan',
    btn_login: 'Log Masuk',
    btn_register: 'Daftar Sekarang',
    no_account: 'Tiada akaun?',
    become_agent: 'Jadi Ejen',
    forgot_password: 'Lupa kata laluan?',
    register_title: 'Jadi Ejen',
    register_subtitle: 'Mulakan perjalanan pendapatan pasif anda',
    label_name: 'Nama Penuh',
    label_phone: 'Telefon',
    label_ic: 'No. Kad Pengenalan',
    label_referrer: 'ID Perujuk (jika ada)',
    label_referrer_placeholder: 'Kosongkan jika tiada perujuk',
    terms_agree: 'Saya bersetuju dengan',
    terms_link: 'Terma Perkhidmatan',
    and: 'dan',
    privacy_link: 'Dasar Privasi',
    already_have_account: 'Sudah ada akaun?',
    login_now: 'Log masuk sekarang',
    dashboard_welcome: 'Selamat kembali',
    dashboard_monthly_rental: 'Sewa Bulanan',
    dashboard_status_active: 'Aktif',
    dashboard_status_inactive: 'Tidak Aktif',
    dashboard_commission: 'Komisen Bulan Ini',
    dashboard_wallet: 'Baki Dompet',
    dashboard_team: 'Saiz Pasukan',
    dashboard_team_sub: '3 generasi bawah',
    org_title: 'Carta Organisasi Saya',
    org_level1: 'Generasi ke-1 (Terus)',
    org_level2: 'Generasi ke-2',
    org_level3: 'Generasi ke-3',
    org_you: 'Anda',
    org_members: 'ahli',
    org_empty: 'Tiada downline lagi',
    commission_record_title: 'Rekod Komisen',
    withdraw_title: 'Mohon Pengeluaran',
    logout: 'Log Keluar',
    footer_rights: 'Hak cipta terpelihara',
    admin_login_title: 'Log Masuk Admin',
    admin_login_subtitle: 'Akses terhad',
    admin_label_account: 'Akaun Admin',
  }
};

let currentLang = 'zh';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations['zh'][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  // Update active language button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('text-sky-600', btn.getAttribute('data-lang') === lang);
    btn.classList.toggle('font-bold', btn.getAttribute('data-lang') === lang);
  });
  localStorage.setItem('lang', lang);
}
```

- [ ] **Step 2: 更新语言切换按钮 HTML**

找到 header 中的语言选择器部分（约第175-184行），替换为：

```html
<!-- Language Selector -->
<div class="flex items-center gap-2 text-sm">
  <button class="lang-btn text-sky-600 font-bold" data-lang="zh" onclick="setLanguage('zh')">中文</button>
  <span class="text-gray-300">|</span>
  <button class="lang-btn text-gray-600" data-lang="en" onclick="setLanguage('en')">EN</button>
  <span class="text-gray-300">|</span>
  <button class="lang-btn text-gray-600" data-lang="ms" onclick="setLanguage('ms')">BM</button>
</div>
```

- [ ] **Step 3: 在 DOMContentLoaded 中初始化语言**

找到 `document.addEventListener('DOMContentLoaded', () => {` 这一行，在 `updateCartUI();` 后添加：

```javascript
const savedLang = localStorage.getItem('lang') || 'zh';
setLanguage(savedLang);
```

- [ ] **Step 4: 在浏览器测试语言切换**

```bash
# 用 python 快速启动
python -m http.server 8080
# 访问 http://localhost:8080
```

点击 EN → 所有带 `data-i18n` 属性的文字应切换为英文。点击 BM → 马来文。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add 3-language support (zh/en/ms) with localStorage persistence"
```

---

## Task 4: 改造首页内容（品牌 + 水机 + 佣金介绍）

**Files:**
- Modify: `index.html` — 首页 section 内容

**Interfaces:**
- Consumes: `t(key)` 翻译函数（Task 3 产出）

- [ ] **Step 1: 替换 Hero Section**

找到 `<div id="home" class="page-content active">` 内的 hero section，替换 h1 和 p 标签为带 `data-i18n` 的版本：

```html
<section class="hero-gradient text-white section-padding">
  <div class="max-w-7xl mx-auto px-4">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-block px-4 py-2 bg-sky-400/20 rounded-full text-sky-200 text-sm font-semibold mb-6 border border-sky-400/30">
          💧 Pure Water, Healthy Life
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6" data-i18n="hero_title">[BRAND] 净水机</h1>
        <p class="text-lg text-gray-200 mb-8 leading-relaxed" data-i18n="hero_subtitle">优质净水，健康生活。加入我们的代理网络，开始赚取被动收入。</p>
        <div class="flex flex-col sm:flex-row gap-4">
          <button onclick="navigate('products')" class="btn-primary bg-white text-sky-700 hover:bg-gray-100">
            💧 <span data-i18n="hero_browse">浏览产品</span>
          </button>
          <button onclick="navigate('agent-register')" class="btn-primary">
            🚀 <span data-i18n="hero_join">成为代理赚佣金</span>
          </button>
        </div>
      </div>
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-sky-400/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
        <div class="relative bg-gradient-to-br from-sky-300 to-blue-600 rounded-3xl p-8 text-center">
          <div class="text-8xl mb-4">💧</div>
          <div class="text-white">
            <p class="font-bold text-lg mb-2" data-i18n="hero_title">[BRAND] 净水机</p>
            <p class="text-sm text-gray-100" data-i18n="hero_subtitle">优质净水，健康生活</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: 替换 Key Features Section 为佣金介绍**

找到 Key Features section（`<!-- Key Features -->`），替换为佣金三代介绍：

```html
<!-- Commission Plan Section -->
<section class="section-padding bg-gray-50">
  <div class="max-w-7xl mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-black mb-4 gradient-text" data-i18n="commission_title">代理佣金制度</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto" data-i18n="commission_desc">每当你的下线支付月租，你自动获得佣金入账。</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-3xl shadow-sm border-2 border-sky-400 text-center">
        <div class="text-5xl font-black gradient-text mb-2">40%</div>
        <h3 class="text-xl font-bold mb-3" data-i18n="commission_level1">直推佣金</h3>
        <p class="text-gray-600 text-sm">你直接推荐的会员每月付租，你得 40% 佣金</p>
      </div>
      <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center">
        <div class="text-5xl font-black gradient-text mb-2">3%</div>
        <h3 class="text-xl font-bold mb-3" data-i18n="commission_level2">第二代佣金</h3>
        <p class="text-gray-600 text-sm">你的下线推荐的会员付租，你得 3%</p>
      </div>
      <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center">
        <div class="text-5xl font-black gradient-text mb-2">2%</div>
        <h3 class="text-xl font-bold mb-3" data-i18n="commission_level3">第三代佣金</h3>
        <p class="text-gray-600 text-sm">三层推荐的会员付租，你得 2%</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: 删除购物车图标和购物车页面**

水机是月租模式，不需要购物车。在 header 找到购物车 button，删除：
```html
<!-- 删除这整个 button -->
<button onclick="navigate('cart')" class="relative hover:text-sky-600 transition">
  <i class="fas fa-shopping-bag text-xl"></i>
  <span ...>0</span>
</button>
```

同时删除 `<div id="cart" class="page-content">` 整个 section。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: update homepage with water machine branding and commission plan display"
```

---

## Task 5: 改造产品展示页面

**Files:**
- Modify: `index.html` — products section 和 loadProducts 函数

**Interfaces:**
- Consumes: `mockProducts`（Task 2），`t(key)`（Task 3）

- [ ] **Step 1: 替换 products section HTML**

找到 `<div id="products" class="page-content">` section，替换内容为：

```html
<div id="products" class="page-content">
  <section class="section-padding">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-black mb-2 gradient-text" data-i18n="products_title">我们的净水机</h1>
        <p class="text-lg text-gray-600" data-i18n="products_subtitle">选择适合你的型号，每月轻松租用</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8" id="products-grid"></div>
    </div>
  </section>
</div>
```

- [ ] **Step 2: 替换 loadProducts 函数**

找到 `function loadProducts()` 函数，替换为：

```javascript
function loadProducts() {
  const grid = document.getElementById('products-grid');
  const lang = currentLang;
  grid.innerHTML = mockProducts.map(product => `
    <div class="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div class="aspect-square bg-gradient-to-br from-sky-50 to-blue-100 overflow-hidden flex items-center justify-center">
        <img src="${product.image}" alt="${product.name[lang]}" class="w-3/4 h-3/4 object-contain">
      </div>
      <div class="p-6">
        <p class="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-2">${product.category[lang]}</p>
        <h3 class="font-bold text-xl mb-4">${product.name[lang]}</h3>
        <ul class="space-y-1 mb-6">
          ${product.features[lang].map(f => `<li class="text-sm text-gray-600 flex items-center gap-2"><span class="text-sky-500">✓</span>${f}</li>`).join('')}
        </ul>
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs text-gray-500 mb-1" data-i18n="monthly_rental">${t('monthly_rental')}</p>
            <p class="text-2xl font-black gradient-text">${product.monthlyPrice}</p>
          </div>
          <div class="text-right">
            <div class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">40% ${t('commission_level1').split(' ')[0]}</div>
          </div>
        </div>
        <button onclick="navigate('agent-register')" class="w-full px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all transform hover:scale-105 text-sm">
          💧 ${t('join_agent')}
        </button>
      </div>
    </div>
  `).join('');
}
```

- [ ] **Step 3: 在浏览器验证产品页**

```bash
python -m http.server 8080
```

点击「产品」导航，确认显示3个水机卡片，包含功能列表和月租价格占位符。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: update products page for water machine rental display"
```

---

## Task 6: 改造会员仪表板 + 组织图

**Files:**
- Modify: `index.html` — agent-dashboard section

**Interfaces:**
- Consumes: `GET /api/agents/:id/team-tree`（Task 1 产出）

- [ ] **Step 1: 替换仪表板统计卡片**

找到 `<div id="agent-dashboard" class="page-content">` 内的 Key Stats 部分（4个统计卡片），替换为：

```html
<!-- Key Stats -->
<div class="grid md:grid-cols-4 gap-6 mb-8">
  <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <p class="text-gray-600 text-sm font-semibold mb-2" data-i18n="dashboard_monthly_rental">月租状态</p>
    <div class="text-2xl font-black text-emerald-600 mb-1" data-i18n="dashboard_status_active">已激活</div>
    <p class="text-xs text-gray-500">Curlec Auto-Debit</p>
  </div>
  <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <p class="text-gray-600 text-sm font-semibold mb-2" data-i18n="dashboard_commission">本月佣金</p>
    <div class="text-3xl font-black gradient-text mb-1" id="dash-commission">RM 0</div>
    <p class="text-xs text-green-600">已自动入账钱包</p>
  </div>
  <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <p class="text-gray-600 text-sm font-semibold mb-2" data-i18n="dashboard_wallet">钱包余额</p>
    <div class="text-3xl font-black gradient-text mb-1" id="dash-wallet">RM 0</div>
    <p class="text-xs text-blue-600"><a href="#" class="font-semibold" data-i18n="withdraw_title">申请提现</a></p>
  </div>
  <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <p class="text-gray-600 text-sm font-semibold mb-2" data-i18n="dashboard_team">团队规模</p>
    <div class="text-3xl font-black gradient-text mb-1" id="dash-team">0</div>
    <p class="text-xs text-gray-600" data-i18n="dashboard_team_sub">下3代成员总计</p>
  </div>
</div>
```

- [ ] **Step 2: 替换组织图 section**

找到 `<!-- Team Tree -->` 注释所在的 div，替换整个组织图卡片为：

```html
<!-- Organisation Chart -->
<div class="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
  <h3 class="text-2xl font-bold mb-6" data-i18n="org_title">我的组织图</h3>
  
  <!-- You (root) -->
  <div class="flex flex-col items-center mb-6">
    <div class="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">你</div>
    <div class="text-sm font-semibold text-sky-600" id="org-agent-id">Agent ID: -</div>
  </div>

  <!-- Level 1 -->
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-3 h-3 rounded-full bg-sky-500"></div>
      <h4 class="font-bold text-gray-700" data-i18n="org_level1">第一代（直推）</h4>
      <span class="ml-auto bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full font-semibold" id="org-l1-count">0</span>
    </div>
    <div id="org-level1-list" class="space-y-2 pl-5"></div>
  </div>

  <!-- Level 2 -->
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
      <h4 class="font-bold text-gray-700" data-i18n="org_level2">第二代</h4>
      <span class="ml-auto bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-semibold" id="org-l2-count">0</span>
    </div>
    <div id="org-level2-list" class="space-y-2 pl-5"></div>
  </div>

  <!-- Level 3 -->
  <div>
    <div class="flex items-center gap-2 mb-3">
      <div class="w-3 h-3 rounded-full bg-orange-500"></div>
      <h4 class="font-bold text-gray-700" data-i18n="org_level3">第三代</h4>
      <span class="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold" id="org-l3-count">0</span>
    </div>
    <div id="org-level3-list" class="space-y-2 pl-5"></div>
  </div>
</div>
```

- [ ] **Step 3: 添加 loadDashboard 函数**

在 `loginAgent` 函数之前添加：

```javascript
async function loadDashboard(agentId) {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    // 加载仪表板数据
    const dashRes = await fetch(`/api/agents/${agentId}/dashboard`, { headers });
    const dash = await dashRes.json();
    document.getElementById('dash-commission').textContent = `RM ${(dash.monthlyCommission || 0).toFixed(2)}`;
    document.getElementById('dash-wallet').textContent = `RM ${(dash.walletBalance || 0).toFixed(2)}`;

    // 加载组织图
    const treeRes = await fetch(`/api/agents/${agentId}/team-tree`, { headers });
    const tree = await treeRes.json();

    if (tree.success) {
      const { level1, level2, level3 } = tree.data;
      const totalTeam = level1.count + level2.count + level3.count;
      document.getElementById('dash-team').textContent = totalTeam;
      document.getElementById('org-agent-id').textContent = `Agent ID: A${agentId}`;

      // Level 1 members
      document.getElementById('org-l1-count').textContent = level1.count;
      document.getElementById('org-level1-list').innerHTML = level1.members.length
        ? level1.members.map(m => `
            <div class="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
              <div class="w-8 h-8 bg-sky-200 rounded-full flex items-center justify-center text-sky-700 font-bold text-xs">${m.name.charAt(0)}</div>
              <div>
                <p class="font-semibold text-sm">${m.name}</p>
                <p class="text-xs text-gray-500">${m.email}</p>
              </div>
              <div class="ml-auto">
                <span class="text-xs px-2 py-1 rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">${m.status === 'active' ? t('dashboard_status_active') : t('dashboard_status_inactive')}</span>
              </div>
            </div>`).join('')
        : `<p class="text-gray-400 text-sm pl-2" data-i18n="org_empty">${t('org_empty')}</p>`;

      // Level 2 members
      document.getElementById('org-l2-count').textContent = level2.count;
      document.getElementById('org-level2-list').innerHTML = level2.members.length
        ? level2.members.map(m => `
            <div class="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg">
              <div class="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">${m.name.charAt(0)}</div>
              <div>
                <p class="font-semibold text-sm">${m.name}</p>
                <p class="text-xs text-gray-500">${m.email}</p>
              </div>
            </div>`).join('')
        : `<p class="text-gray-400 text-sm pl-2">${t('org_empty')}</p>`;

      // Level 3 members
      document.getElementById('org-l3-count').textContent = level3.count;
      document.getElementById('org-level3-list').innerHTML = level3.members.length
        ? level3.members.map(m => `
            <div class="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
              <div class="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs">${m.name.charAt(0)}</div>
              <div>
                <p class="font-semibold text-sm">${m.name}</p>
                <p class="text-xs text-gray-500">${m.email}</p>
              </div>
            </div>`).join('')
        : `<p class="text-gray-400 text-sm pl-2">${t('org_empty')}</p>`;
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}
```

- [ ] **Step 4: 更新 loginAgent 函数调用 loadDashboard**

找到 `function loginAgent(e)` 函数，替换为：

```javascript
async function loginAgent(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="text"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!data.success) {
      showNotification(data.error || 'Login failed');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('agentId', data.userId);
    localStorage.setItem('agentName', data.name);

    currentUser = { role: data.role, name: data.name, id: data.userId };

    document.querySelector('#agent-dashboard h1').textContent = `${t('dashboard_welcome')}，${data.name}`;

    showNotification(t('btn_login') + ' ✓');
    navigate('agent-dashboard');
    loadDashboard(data.userId);
  } catch (err) {
    showNotification('Network error');
  }
}
```

- [ ] **Step 5: 在浏览器验证仪表板**

登录后确认：
- 统计卡片显示正确
- 组织图显示3个层级（空时显示「暂无下线」）
- 语言切换后组织图标签也更新

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: update member dashboard with monthly rental status and 3-level org chart"
```

---

## Task 7: 更新 .env 和品牌占位符

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: 更新 .env.example**

在 `.env.example` 的 `# 应用配置` 部分，添加：

```env
# 品牌配置
BRAND_NAME=[BRAND]
MONTHLY_PRICE=RM_MONTHLY_PRICE

# 佣金比例（不要改这里）
COMMISSION_LEVEL1=0.40
COMMISSION_LEVEL2=0.03
COMMISSION_LEVEL3=0.02
```

- [ ] **Step 2: 全局搜索确认占位符**

```bash
grep -n "电智云\|SmartCloud\|smartcloud" index.html
```

逐一将找到的品牌字样替换为 `[BRAND]`。

- [ ] **Step 3: 全局搜索确认价格占位符**

```bash
grep -n "RM_MONTHLY_PRICE" index.html
```

确认所有价格都用了占位符，没有硬编码数字。

- [ ] **Step 4: Commit**

```bash
git add .env.example index.html
git commit -m "chore: replace SmartCloud branding with [BRAND] placeholder, add monthly price placeholder"
```

---

## Task 8: 端对端测试 + 整理

**Files:**
- No new files — test only

- [ ] **Step 1: 启动完整服务**

```bash
# Terminal 1: 后端
node server.js

# Terminal 2: 前端（或直接用 server.js serve 静态文件）
# 在 server.js 末尾添加：
# app.use(express.static(__dirname));
```

- [ ] **Step 2: 手动测试清单**

```
[ ] 首页加载 — 看到水机品牌 + 佣金三格
[ ] 切换语言 EN → 所有文字切换
[ ] 切换语言 BM → 所有文字切换
[ ] 产品页 — 看到3个水机卡片
[ ] 代理注册 → 提交表单 → 跳转登录
[ ] 代理登录 → 进仪表板 → 看到组织图
[ ] 组织图 — 3层级都显示（空时显示「暂无下线」）
[ ] 提现链接存在
[ ] 管理员登录页正常显示
```

- [ ] **Step 3: 最终 commit**

```bash
git add -A
git commit -m "chore: final cleanup and end-to-end verification"
```

---

## 上线前 Checklist（待用户确认）

| 项目 | 动作 |
|------|------|
| 品牌名确定 | 全局替换 `[BRAND]` |
| 月租金额确定 | 全局替换 `RM_MONTHLY_PRICE` |
| Curlec API 密钥 | 填入 `.env` |
| 域名设置 | 更新 `APP_URL` in `.env` |
| Logo 图片 | 替换 header 中的 emoji 💧 为 img 标签 |
| SSL 证书 | 配置 Let's Encrypt |
