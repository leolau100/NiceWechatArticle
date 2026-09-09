<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <div class="header-logo">✍️</div>
        <h1>微信文章编辑器</h1>
        <div class="header-divider"></div>
        <span class="header-subtitle">Markdown → 微信公众号</span>
      </div>
      <div class="header-actions">
        <a
          href="#"
          @click.prevent="showDonateModal = true"
          class="btn btn-donate"
          title="请我喝杯咖啡"
        >
          <span class="donate-icon">☕</span>
        </a>
        <button class="btn btn-ghost" @click="showSvgEffectsModal = true">✦ SVG动效</button>
        <button class="btn btn-ghost" @click="showThemeModal = true">🎨 主题</button>
        <button class="btn btn-ghost" @click="showHeadingModal = true" title="全局标题字号 / 颜色 / 字重设置">⚙ 标题</button>
        <button class="btn btn-ghost" @click="handleReset" title="重置所有缓存">↺</button>
        <button class="btn btn-primary" @click="handleCopy">📋 一键复制</button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-container">
      <!-- Editor Panel -->
      <div class="editor-panel">
        <div class="panel-header">
          <span class="panel-label">编辑器</span>
          <span class="word-count">{{ wordCount }} 字</span>
        </div>
        <textarea
          ref="mdEditorRef"
          v-model="mdContent"
          class="editor-textarea"
          placeholder="在这里输入 Markdown 内容..."
          @input="handleInput"
          @scroll="handleEditorScroll"
        ></textarea>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="panel-header">
          <span class="panel-label">预览</span>
          <span class="preview-hint">自适应宽度 · 所见即所得</span>
        </div>

        <!-- 顶部 bar 滚出后吸附在顶部的提示条 -->
        <Transition name="pill-slide-down">
          <div v-if="headerPillVisible" class="tpl-pill tpl-pill-top" @click="showHeaderTplModal = true">
            <span class="tpl-pill-dot" :class="{ active: activeHeaderId }"></span>
            {{ activeHeaderId ? '顶部模版已启用' : '未启用顶部模版' }} · 点击管理
          </div>
        </Transition>

        <div class="preview-wrapper" ref="previewWrapperRef" @scroll="handlePreviewScroll">
          <!-- 顶部模版选择条 -->
          <div class="tpl-bar tpl-bar-top" :class="{ 'tpl-bar-active': activeHeaderId }" ref="headerBarRef">
            <div class="tpl-bar-inner">
              <span class="tpl-bar-label">顶部模版</span>
              <div class="tpl-bar-select-wrap">
                <select class="tpl-bar-select" :value="activeHeaderId || ''" @change="handleActiveHeaderChange($event.target.value || null)">
                  <option value="">不使用顶部模版</option>
                  <option v-for="tpl in headerTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                </select>
              </div>
              <button class="tpl-bar-btn" @click="showHeaderTplModal = true">✎ 管理</button>
            </div>
          </div>

          <!-- 预览框 -->
          <div class="preview-frame-wrap" ref="previewFrameWrapRef">
            <div class="preview-frame">
              <iframe ref="previewIframeRef" class="preview-iframe"></iframe>
            </div>
          </div>

          <!-- 底部模版选择条 -->
          <div class="tpl-bar tpl-bar-bottom" :class="{ 'tpl-bar-active': activeFooterId }" ref="footerBarRef">            <div class="tpl-bar-inner">
              <span class="tpl-bar-label">底部模版</span>
              <div class="tpl-bar-select-wrap">
                <select class="tpl-bar-select" :value="activeFooterId || ''" @change="handleActiveFooterChange($event.target.value || null)">
                  <option value="">不使用底部模版</option>
                  <option v-for="tpl in footerTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                </select>
              </div>
              <button class="tpl-bar-btn" @click="showFooterTplModal = true">✎ 管理</button>
            </div>
          </div>

        </div>

        <!-- 底部 bar 滚出视口后，吸附在 preview-panel 底部边缘 -->
        <Transition name="pill-slide-up">
          <div v-if="footerPillVisible" class="tpl-pill tpl-pill-bottom" @click="showFooterTplModal = true">
            <span class="tpl-pill-dot" :class="{ active: activeFooterId, purple: true }"></span>
            {{ activeFooterId ? '底部模版已启用' : '底部可添加模版' }} · 点击管理
          </div>
        </Transition>
      </div>
    </div>

    <!-- Status Bar -->
    <footer class="statusbar">
      <span>实时预览 · 点击「一键复制」后直接粘贴到微信公众号编辑器</span>
      <div class="statusbar-right">
        <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" class="statusbar-link" title="GitHub">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <span class="statusbar-sep">·</span>
        <a href="#" @click.prevent="showDonateModal = true" class="statusbar-link statusbar-link-donate" title="请我喝咖啡">☕ 赞赏</a>
        <span class="statusbar-sep">·</span>
        <span>v2.0</span>
      </div>
    </footer>

    <!-- Toast -->
    <div class="toast" :class="{ show: toast.show }">{{ toast.message }}</div>

    <!-- Theme Drawer -->
    <ThemeSelector
      :visible="showThemeModal"
      :current-theme="currentTheme"
      @close="showThemeModal = false"
      @select="handleThemeChange"
      @settings-saved="updatePreview"
    />

    <!-- 全局标题设置（系统默认） -->
    <HeadingSettingsModal
      v-model:open="showHeadingModal"
      scope="global"
      @saved="updatePreview"
    />

    <!-- Header Template Modal -->
    <TemplateModal
      v-if="showHeaderTplModal"
      title="顶部模版管理"
      type="header"
      :templates="headerTemplates"
      :active-id="activeHeaderId"
      :current-theme="currentTheme"
      :get-theme-css="getThemeCss"
      :render-template="renderTemplate"
      :inline-theme="inlineThemeToSection"
      @close="showHeaderTplModal = false"
      @update="updateHeaderTemplates"
      @active-change="handleActiveHeaderChange"
    />

    <!-- Footer Template Modal -->
    <TemplateModal
      v-if="showFooterTplModal"
      title="底部模版管理"
      type="footer"
      :templates="footerTemplates"
      :active-id="activeFooterId"
      :current-theme="currentTheme"
      :get-theme-css="getThemeCss"
      :render-template="renderTemplate"
      :inline-theme="inlineThemeToSection"
      @close="showFooterTplModal = false"
      @update="updateFooterTemplates"
      @active-change="handleActiveFooterChange"
    />

    <!-- SVG Effects Modal -->
    <SvgEffectsModal
      v-if="showSvgEffectsModal"
      @close="showSvgEffectsModal = false"
      @insert="handleSvgInsert"
    />

    <!-- Donate Modal -->
    <DonateModal :visible="showDonateModal" @close="showDonateModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
// 硬换行保留为 <br>，让每一行 > 引用都成为独立的新行
marked.setOptions({ breaks: true, gfm: true })

// 代码块不使用 <pre> 标签，改为 <div class="code-block"><code>...</code></div>
// ASCII 尖括号替换为全角 ＞＜（U+FF1C / U+FF1E），避免粘进微信时被清洗器吞掉
// 兼容 marked v4（字符串参数）与较新版本（token 对象）
function getCodeText(arg) {
  if (typeof arg === 'string') return arg
  if (arg && typeof arg.text === 'string') return arg.text
  return ''
}
function escapeHtmlForCode(s) {
  return String(s)
    .replace(/&lt;/g, '＜')
    .replace(/&gt;/g, '＞')
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
}
marked.use({
  renderer: {
    code(token) {
      const text = getCodeText(token)
      return `<div class="code-block"><code>${escapeHtmlForCode(text)}</code></div>\n`
    },
    codespan(token) {
      const text = getCodeText(token)
      return `<code>${escapeHtmlForCode(text)}</code>`
    }
  }
})
import ThemeSelector from '../components/ThemeSelector.vue'
import TemplateModal from '../components/TemplateModal.vue'
import SvgEffectsModal from '../components/SvgEffectsModal.vue'
import DonateModal from '../components/DonateModal.vue'
// 与「一键复制」/接口共用同一套渲染逻辑，保证预览与输出同源
// 仅引入 wechatifyDoc（本文件已有的 inlineThemeToSection / getThemeCss 同源复用，避免重名）
import { wechatifyDoc, normalizeBlockquoteSpacing } from '@/render'
import { applyHeadingStyle, applyHeadingNumber } from '@/config/headingStyle'
import HeadingSettingsModal from '../components/HeadingSettingsModal.vue'

const showHeadingModal = ref(false)

// Storage Keys
const STORAGE_KEYS = {
  CONTENT: 'wechat_md_content',
  THEME: 'wechat_md_theme',
  HEADER_TPLS: 'wechat_md_header_tpls',
  FOOTER_TPLS: 'wechat_md_footer_tpls',
  ACTIVE_HEADER: 'wechat_md_active_header',
  ACTIVE_FOOTER: 'wechat_md_active_footer'
}

// GitHub
const GITHUB_URL = 'https://github.com/leolau100/WeChatFile'
const showDonateModal = ref(false)

// Environment Detection
const IS_EXTENSION = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL

// Refs
const mdEditorRef = ref(null)
const previewIframeRef = ref(null)
const previewWrapperRef = ref(null)
const previewFrameWrapRef = ref(null)
const headerBarRef = ref(null)
const footerBarRef = ref(null)
const headerLineRef = ref(null)
const footerLineRef = ref(null)

// State
const mdContent = ref('')
const currentTheme = ref('blue')
const headerTemplates = ref([])
const footerTemplates = ref([])
const activeHeaderId = ref(null)
const activeFooterId = ref(null)
const showThemeModal = ref(false)
const showHeaderTplModal = ref(false)
const showFooterTplModal = ref(false)
const showSvgEffectsModal = ref(false)

// 区域标注样式：1=虚线框(Figma), 2=左边框(Notion), 3=横带(VSCode)
const zoneStyle = ref(1)

// 竖线高度（对应 iframe 内顶部/底部模版区域高度）
const headerZoneHeight = ref(0)
const footerZoneHeight = ref(0)

// Pill visibility
const headerPillVisible = ref(false)
const footerPillVisible = ref(true)

// Toast State
const toast = ref({
  show: false,
  message: ''
})

// Theme File Mapping
const themeFileMap = {
  'aurora':'themes/aurora.css','autumn':'themes/autumn.css','blue':'themes/blue.css',
  'blush':'themes/blush.css','breeze':'themes/breeze.css','business':'themes/business.css',
  'bw-minimal':'themes/bw-minimal.css','candy':'themes/candy.css','charcoal':'themes/charcoal.css',
  'classic-yellow':'themes/classic-yellow.css','copper':'themes/copper.css',
  'coral':'themes/coral.css','crimson':'themes/crimson.css','cute-yellow':'themes/cute-yellow.css',
  'cyber':'themes/cyber.css','dark-pro':'themes/dark-pro.css','dusk':'themes/dusk.css',
  'earth':'themes/earth.css','elegant-purple':'themes/elegant-purple.css',
  'forest':'themes/forest.css','geek-tech':'themes/geek-tech.css',
  'github-light':'themes/github-light.css','gold-luxury':'themes/gold-luxury.css',
  'grape':'themes/grape.css','green':'themes/green.css','indigo':'themes/indigo.css',
  'ink-wash':'themes/ink-wash.css','ivory':'themes/ivory.css','lavender':'themes/lavender.css',
  'lemon':'themes/lemon.css','magazine':'themes/magazine.css','matrix':'themes/matrix.css',
  'midnight':'themes/midnight.css','minimal-blue':'themes/minimal-blue.css',
  'mint':'themes/mint.css','mist':'themes/mist.css','mono-red':'themes/mono-red.css',
  'neon':'themes/neon.css','newsprint':'themes/newsprint.css','nordic':'themes/nordic.css',
  'nordic-dark':'themes/nordic-dark.css','obsidian':'themes/obsidian.css',
  'ocean':'themes/ocean.css','orange':'themes/orange.css','paper':'themes/paper.css',
  'peach':'themes/peach.css','pop-art':'themes/pop-art.css','red-festive':'themes/red-festive.css',
  'retro':'themes/retro.css','rose-gold':'themes/rose-gold.css','sakura':'themes/sakura.css',
  'sand':'themes/sand.css','sky':'themes/sky.css','slate':'themes/slate.css',
  'spring':'themes/spring.css','sunset':'themes/sunset.css','teal-fresh':'themes/teal-fresh.css',
  'tech-dark':'themes/tech-dark.css','tech-purple':'themes/tech-purple.css',
  'vapor':'themes/vapor.css','vibrant':'themes/vibrant.css','wabi':'themes/wabi.css',
  'warm-orange':'themes/warm-orange.css','wechat-classic':'themes/wechat-classic.css',
  'plain':'themes/plain.css','plain-doc':'themes/plain-doc.css','plain-minimal':'themes/plain-minimal.css','plain-news':'themes/plain-news.css','plain-serif':'themes/plain-serif.css',
  'line':'themes/line.css','line-serif':'themes/line-serif.css','line-warm':'themes/line-warm.css',
  'deepsea':'themes/deepsea.css',
  'qbitai':'themes/qbitai.css',
  'jiqizhixin':'themes/jiqizhixin.css',
  'wavy':'themes/wavy.css','wavy-serif':'themes/wavy-serif.css',
  'blue-center':'themes/blue-center.css','ocean-center':'themes/ocean-center.css','rose-gold-center':'themes/rose-gold-center.css','lavender-center':'themes/lavender-center.css','dark-pro-center':'themes/dark-pro-center.css','obsidian-center':'themes/obsidian-center.css','business-center':'themes/business-center.css','github-light-center':'themes/github-light-center.css','warm-orange-center':'themes/warm-orange-center.css','vibrant-center':'themes/vibrant-center.css','wechat-classic-center':'themes/wechat-classic-center.css','ink-wash-center':'themes/ink-wash-center.css','plain-center':'themes/plain-center.css','plain-serif-center':'themes/plain-serif-center.css',
}

// Theme CSS Cache
const themeCssCache = ref({})

// Computed
const wordCount = computed(() => {
  return mdContent.value ? mdContent.value.replace(/\s/g, '').length : 0
})

// Storage Helpers
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch (e) {
    console.warn('Storage save failed:', e)
  }
}

function loadFromStorage(key, defaultVal = '') {
  try {
    return localStorage.getItem(key) ?? defaultVal
  } catch (e) {
    return defaultVal
  }
}

function loadJsonFromStorage(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultVal
  } catch (e) {
    return defaultVal
  }
}

// Resource URL Helper
function getResourceUrl(path) {
  if (IS_EXTENSION) {
    return chrome.runtime.getURL(path)
  }
  return path
}

// Show Toast
function showToast(message) {
  toast.value = { show: true, message }
  setTimeout(() => {
    toast.value.show = false
  }, 2000)
}

// Generate ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Theme CSS Loading
async function getThemeCss(theme) {
  const file = themeFileMap[theme]
  if (!file) return ''
  if (themeCssCache.value[theme] !== undefined) {
    return themeCssCache.value[theme]
  }
  try {
    const url = getResourceUrl(file)
    const resp = await fetch(url)
    if (resp.ok) {
      const cssText = await resp.text()
      themeCssCache.value[theme] = cssText
      return cssText
    }
  } catch (e) {
    console.warn('Load theme CSS failed:', e)
  }
  return ''
}

// Check if content is HTML
function isHtml(content) {
  return content.trimStart().startsWith('<')
}

// Render Template
function renderTemplate(content, theme) {
  if (!content || !content.trim()) return ''
  if (isHtml(content)) {
    return content
  }
  const parsed = marked.parse(content)
  return `<div class="theme-${theme}">${parsed}</div>`
}

// Get Active Template Content
function getActiveHeaderContent() {
  if (!activeHeaderId.value) return ''
  const tpl = headerTemplates.value.find(t => t.id === activeHeaderId.value)
  return tpl ? tpl.content : ''
}

function getActiveFooterContent() {
  if (!activeFooterId.value) return ''
  const tpl = footerTemplates.value.find(t => t.id === activeFooterId.value)
  return tpl ? tpl.content : ''
}

// CSS Rule Parser
function parseThemeCssRules(cssText) {
  const rules = {}
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const ruleRe = /([^{]+)\{([^}]*)\}/g
  let m
  while ((m = ruleRe.exec(cleaned)) !== null) {
    const selector = m[1].trim()
    const body = m[2].trim()
    if (!body) continue

    const props = {}
    body.split(';').forEach(decl => {
      const idx = decl.indexOf(':')
      if (idx < 0) return
      const prop = decl.slice(0, idx).trim()
      const val = decl.slice(idx + 1).trim()
      if (prop && val) props[prop] = val
    })
    if (Object.keys(props).length === 0) continue

    const themeRe = /\.theme-[\w-]+\s*(.*)/
    const sm = selector.match(themeRe)
    if (!sm) continue

    const rest = sm[1].trim()
    const key = rest === '' ? '__root__' : rest
    rules[key] = Object.assign(rules[key] || {}, props)
  }
  return rules
}

// Apply Props to Element
function applyProps(el, props) {
  Object.entries(props).forEach(([prop, val]) => {
    if (['position', 'z-index', 'content', 'counter-reset', 'counter-increment',
         'transition', 'animation', 'clip-path', 'transform'].includes(prop)) return
    try {
      el.style.setProperty(prop, val)
    } catch (e) {}
  })
}

// Make Pseudo Element Span
function makePseudoSpan(pseudoRules, doc, isBefore = true) {
  let text = pseudoRules['content'] || ''
  text = text.replace(/^['"]|['"]$/g, '')
  const span = doc.createElement('span')
  span.setAttribute('aria-hidden', 'true')
  span.setAttribute('data-pseudo-icon', isBefore ? 'before' : 'after')
  if (text && text !== 'none' && text !== '') {
    text = text.replace(/\\([0-9a-fA-F]{4,6})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    span.textContent = text
  }
  const styleProps = Object.assign({}, pseudoRules)
  delete styleProps['content']
  // 默认 inline 显示，避免绝对定位导致微信编辑器把图标和文字拆成两行
  if (!styleProps['display']) styleProps['display'] = 'inline'
  // 去掉会造成换行的绝对定位属性（icon 只做行内前缀）
  delete styleProps['position']
  delete styleProps['left']
  delete styleProps['top']
  delete styleProps['right']
  delete styleProps['bottom']
  applyProps(span, styleProps)
  const hasVisual = text || styleProps['background'] || styleProps['background-color']
    || styleProps['border'] || styleProps['width']
  return hasVisual ? span : null
}

// Apply Theme Rules to DOM
function applyThemeRulesToDom(container, rules, doc) {
  const TAG_KEYS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'strong', 'em', 'a',
    'ul', 'ol', 'li', 'hr', 'table', 'th', 'td', 'img', 'del', 'section', 'div', 'span']

  // 列表（* / - 等）在主题里大多只设了 color/line-height，缺少 font-size/font-family，
  // 内联到微信后会回退到默认 17px。这里从根容器 / 正文 p 继承字体属性做兜底补全。
  const _root = rules['__root__'] || {}
  const _p = rules['p'] || {}
  const _inheritFont = {
    'font-family': _root['font-family'] || _p['font-family'] || '',
    'font-size': _root['font-size'] || _p['font-size'] || '',
    'color': _root['color'] || _p['color'] || '',
    'line-height': _root['line-height'] || _p['line-height'] || '',
  }
  const LIST_TAGS = ['ul', 'ol', 'li']
  function ensureFontProps(el) {
    for (const [prop, val] of Object.entries(_inheritFont)) {
      if (!val) continue
      if (!el.style.getPropertyValue(prop)) el.style.setProperty(prop, val)
    }
  }

  if (rules['__root__']) {
    applyProps(container, rules['__root__'])
  }

  // 根据标签匹配「可能的」伪元素规则键名（主题写法多样：ul::before / ul>li::before / li::before）
  function findPseudoRules(tag, pseudo) {
    const candidates = [
      `${tag} > li${pseudo}`,
      `${tag} li${pseudo}`,
      `${tag}${pseudo}`,
      `li${pseudo}`,
    ]
    for (const c of candidates) {
      if (rules[c]) return rules[c]
    }
    // 兜底：扫描所有包含该标签与伪元素的键
    const fallbackKey = Object.keys(rules).find(k =>
      k.includes(tag) && k.includes(pseudo.replace('::', '::')))
    return fallbackKey ? rules[fallbackKey] : undefined
  }

  TAG_KEYS.forEach(tag => {
    const elRules = rules[tag]
    const beforeRules = findPseudoRules(tag, '::before')
    const afterRules = findPseudoRules(tag, '::after')

    container.querySelectorAll(tag).forEach(el => {
      if (tag === 'code' && el.closest('.code-block')) {
        const preCodeRules = rules['.code-block code']
        if (preCodeRules) applyProps(el, preCodeRules)
        return
      }

      if (elRules) applyProps(el, elRules)
      if (LIST_TAGS.includes(tag)) ensureFontProps(el)

      // 列表兜底：很多主题用 `list-style:none + ul>li::before` 来自定义图标，
      // 但 class 最终会被剥离，伪元素图标随之丢失，只剩缩进看起来像空格。
      // 因此无论主题是否写了 ::before，只要最终 list-style 为 none，就注入真实 span 兜底。
      const hasListStyle = elRules && (elRules['list-style'] || elRules['list-style-type'])
      const listStyleIsNone = el.style.listStyle === 'none'

      // 取主题强调色（用于列表标记着色）：优先 before 图标的颜色/背景，
      // 其次 h2/strong/a 的强调色，再次正文/根色，最后兜底灰。
      const _accent =
        (beforeRules && (beforeRules['color'] || beforeRules['background'] || beforeRules['background-color'])) ||
        rules['h2'] && (rules['h2']['color']) ||
        rules['strong'] && (rules['strong']['color']) ||
        rules['a'] && (rules['a']['color']) ||
        _root['color'] || _p['color'] || '#333'

      // 列表兜底：ul / ol 走同一套处理逻辑，仅标记内容不同（圆点 vs 编号）
      if (LIST_TAGS.includes(tag)) {
        const isOrdered = tag === 'ol'
        // 主题未提供可见列表标记（list-style:none 或无 list-style 且无 ::before 图标）时注入兜底
        if (listStyleIsNone || (!beforeRules && !hasListStyle)) {
          el.style.position = 'relative'
          el.style.listStyle = 'none'
          el.querySelectorAll(':scope > li').forEach((li, idx) => {
            if (!li.querySelector(':scope > span[data-bullet]')) {
              const marker = doc.createElement('span')
              marker.setAttribute('aria-hidden', 'true')
              marker.setAttribute('data-bullet', 'true')
              marker.textContent = isOrdered ? `${idx + 1}.` : '•'
              // 圆点与编号共用同一套配色/间距逻辑，采用 inline（与复制到微信的结构一致）
              marker.style.display = 'inline'
              marker.style.color = _accent || _root['color'] || _p['color'] || '#333'
              marker.style.fontSize = '1em'
              marker.style.marginRight = isOrdered ? '6px' : '4px'
              marker.style.lineHeight = (elRules && elRules['line-height']) || '1.7'
              li.style.position = 'relative'
              li.insertBefore(marker, li.firstChild)
            }
          })
        }
      }

      // 列表标签的伪元素图标统一由上方列表兜底处理，避免这里再插一个 span 导致重复标记
      if (!LIST_TAGS.includes(tag)) {
        if (beforeRules && beforeRules['content']) {
          const span = makePseudoSpan(beforeRules, doc, true)
          if (span) {
            // 把 before 图标放到第一个块级子元素开头，和文字同处一行
            const firstBlock = el.querySelector(':scope > p, :scope > section, :scope > div')
            if (firstBlock) firstBlock.insertBefore(span, firstBlock.firstChild)
            else el.insertBefore(span, el.firstChild)
          }
        }

        if (afterRules && afterRules['content']) {
          const span = makePseudoSpan(afterRules, doc, false)
          if (span) el.appendChild(span)
        }
      }
    })
  })

  Object.keys(rules).forEach(key => {
    if (key === '__root__' || !key.includes(' ')) return
    if (key.includes('::')) return
    try {
      container.querySelectorAll(key).forEach(el => {
        applyProps(el, rules[key])
      })
    } catch (e) {}
  })
}

// 列表归一化：把 ul/ol/li 转成 <section> 段落序列（微信对 section 兼容性好），
// 并把每个列表项收敛为单一 <p> 段落（编号 + 内容同处一段），预览与复制共用同一结构。
function normalizeLists(root, doc) {
  root.querySelectorAll('ul, ol').forEach(listEl => {
    const wrapper = doc.createElement('div')
    // 继承 ul/ol 自身的内联布局样式（margin/padding），去掉 list-style 与 padding-left
    Array.from(listEl.attributes).forEach(a => {
      if (a.name === 'style') return
      wrapper.setAttribute(a.name, a.value)
    })
    const listStyle = (listEl.getAttribute('style') || '')
      .replace(/list-style[^;]*;?/gi, '')
      .replace(/padding-left[^;]*;?/gi, '')
      .trim()
    if (listStyle) wrapper.setAttribute('style', listStyle)
    else wrapper.removeAttribute('style')

    Array.from(listEl.children).forEach(li => {
      if (li.tagName !== 'LI') {
        wrapper.appendChild(li)
        return
      }
      const item = doc.createElement('div')
      Array.from(li.attributes).forEach(a => {
        if (a.name === 'class') return
        item.setAttribute(a.name, a.value)
      })
      item.style.position = 'relative'
      const pl = item.style.paddingLeft
      if (!pl || parseFloat(pl) < 0.5) item.style.paddingLeft = '10px'
      while (li.firstChild) item.appendChild(li.firstChild)

      wrapper.appendChild(item)

      // 把列表项整体收敛为一个 <p> 段落（编号 + 内容同处一段），
      // 避免微信编辑器把 marker 与内容拆成两行，同时保证预览与复制一致。
      const marker = item.querySelector(':scope > span[data-bullet]')
      if (marker) {
        marker.style.display = 'inline'
        marker.style.marginRight = listEl.tagName === 'OL' ? '6px' : '4px'
        marker.style.lineHeight = 'inherit'
      }

      // 找第一个块级子元素；没有则新建 <p> 把全部子内容包进去
      let block = item.querySelector(':scope > p, :scope > section, :scope > div')
      if (!block) {
        block = doc.createElement('p')
        while (item.firstChild) block.appendChild(item.firstChild)
        item.appendChild(block)
      } else if (block !== marker) {
        // 把 marker 插入该块级元素最前面，其余子节点依次并入，成为同段内容
        block.insertBefore(marker, block.firstChild)
        const rest = []
        Array.from(item.childNodes).forEach(n => { if (n !== block && n !== marker) rest.push(n) })
        rest.forEach(n => block.appendChild(n))
      }
    })

    if (listEl.parentNode) listEl.parentNode.replaceChild(wrapper, listEl)
  })
}

// Inline Theme to Section
function inlineThemeToSection(doc, themeCssText) {
  const section = doc.body.querySelector('section')
  if (!section) return doc.body.innerHTML

  const rules = parseThemeCssRules(themeCssText)
  const clone = section.cloneNode(true)
  doc.body.appendChild(clone)

  function inlineContainer(container) {
    applyThemeRulesToDom(container, rules, doc)
    container.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'))
    container.removeAttribute('class')
  }

  const bodyDiv = clone.querySelector('[data-tpl="body"]')
  if (bodyDiv) {
    inlineContainer(bodyDiv)
    // 保留 data-tpl，由 buildInlinedHtml 统一清理
  }

  ['header', 'footer'].forEach(tplType => {
    const tplDiv = clone.querySelector(`[data-tpl="${tplType}"]`)
    if (!tplDiv) return
    const themeChild = tplDiv.querySelector('[class^="theme-"]')
    if (themeChild) {
      inlineContainer(tplDiv)
    }
    // 保留 data-tpl，由 buildInlinedHtml 统一清理
  })

  clone.removeAttribute('class')
  clone.style.setProperty('width', '100%')
  clone.style.setProperty('box-sizing', 'border-box')

  // 列表转 div（预览，与复制共用同一结构）
  normalizeLists(clone, doc)

  const result = clone.outerHTML
  doc.body.removeChild(clone)
  return result
}

// Update Preview
async function updatePreview() {
  const themeCssText = await getThemeCss(currentTheme.value)
  const bodyHtml = marked.parse(mdContent.value)
  const headerHtml = renderTemplate(getActiveHeaderContent(), currentTheme.value)
  const footerHtml = renderTemplate(getActiveFooterContent(), currentTheme.value)

  const headerTag = ``
  const footerTag = ``
  const headerStripe = ``
  const footerStripe = ``
  const headerBadge = ``
  const footerBadge = ``

  // 顶部/底部区域分隔标注（仅预览用）
  // 虚线框方案（动态蚂蚁线）
  const hColor = activeHeaderId.value ? '#07c160' : '#bbb'
  const fColor = activeFooterId.value ? '#667eea' : '#bbb'
  const hBg = activeHeaderId.value ? 'rgba(7,193,96,0.03)' : 'transparent'
  const fBg = activeFooterId.value ? 'rgba(102,126,234,0.03)' : 'transparent'
  const hText = activeHeaderId.value ? '▼ 顶部模版' : '▼ 顶部模版（未启用）'
  const fText = activeFooterId.value ? '▲ 底部模版' : '▲ 底部模版（未启用）'

  const headerWrapStyle = `position:relative;outline:1px dashed ${hColor};outline-offset:2px;background:${hBg};padding-top:12px;`
  const footerWrapStyle = `position:relative;outline:1px dashed ${fColor};outline-offset:2px;background:${fBg};padding-top:12px;`
  const headerLabel = `<div data-preview-only="1" style="position:absolute;top:0;left:15px;transform:translateY(-50%);background:${hColor};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:1px;font-family:sans-serif;pointer-events:none;white-space:nowrap;">${hText}</div>`
  const footerLabel = `<div data-preview-only="1" style="position:absolute;top:0;left:15px;transform:translateY(-50%);background:${fColor};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:1px;font-family:sans-serif;pointer-events:none;white-space:nowrap;">${activeFooterId.value ? '▼ 底部模版' : '▼ 底部模版（未启用）'}</div>`

  // 虚线框标注（仅预览用）
  const zoneAnimCss = ``
  const headerSvg = ``
  const footerSvg = ``

  const rawHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;overflow-x:hidden;word-wrap:break-word;word-break:break-word;box-sizing:border-box}
  ${zoneAnimCss}
  ${themeCssText}
</style>
</head>
<body>
  <section style="margin:0;padding:0;width:100%;box-sizing:border-box;">
    <div data-tpl="header" class="tpl-header-box" style="${headerWrapStyle}">${headerLabel}${headerHtml}</div>
    <div data-tpl="body" class="theme-${currentTheme.value}" style="padding:0 15px;overflow-wrap:break-word;">${bodyHtml}</div>
    <div data-tpl="footer" class="tpl-footer-box" style="${footerWrapStyle}">${footerLabel}${footerHtml}</div>
  </section>
</body></html>`

  const doc = previewIframeRef.value.contentDocument || previewIframeRef.value.contentWindow.document
  doc.open()
  doc.write(rawHtml)
  doc.close()

  await new Promise(r => setTimeout(r, 30))
  const inlined = inlineThemeToSection(doc, themeCssText)

  const finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8">
<style>
  ::-webkit-scrollbar{display:none}
  html,body{margin:0;padding:0;overflow:hidden;}
  body{padding:15px;word-wrap:break-word;word-break:break-word;box-sizing:border-box}
</style>
</head>
<body>${inlined}</body></html>`

  doc.open()
  doc.write(finalHtml)
  doc.close()

  // 应用标题（h1–h6）字号 / 字重：主题级配置 > 系统默认配置
  applyHeadingStyle(doc, currentTheme.value)

  // 引用块内容垂直居中（首尾元素上下外边距清零）
  normalizeBlockquoteSpacing(doc)

  // 标题自动序号（仅对启用序号的主题生效）
  applyHeadingNumber(doc, currentTheme.value)

  // 用 ResizeObserver 持续监听 iframe body 高度变化，确保完全撑开
  const iframe = previewIframeRef.value
  let roTimer = null
  let ro = null

  // 清理预览 DOM：去掉 data-tpl / class / 预览专用样式，让预览和微信实际效果一致
  // 必须在高度测量完成后才能清理（applyHeight 依赖 data-tpl 选择器）
  function cleanPreviewDom(iframeDoc) {
    try {
      iframeDoc.querySelectorAll('[data-preview-only]').forEach(el => el.remove())
      iframeDoc.querySelectorAll('[data-tpl]').forEach(el => {
        const tplType = el.getAttribute('data-tpl')
        if (tplType === 'header' || tplType === 'footer') {
          const hasContent = el.children.length > 0 || el.textContent.trim() !== ''
          if (!hasContent) { el.remove(); return }
          el.style.removeProperty('outline')
          el.style.removeProperty('outline-offset')
          el.style.removeProperty('position')
          el.style.removeProperty('padding-top')
          if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
            el.removeAttribute('style')
          }
        }
        el.removeAttribute('class')
        el.removeAttribute('data-tpl')
      })
    } catch (e) {}
  }

  let previewCleaned = false

  const applyHeight = () => {
    try {
      const iframeDoc = iframe.contentDocument
      const body = iframeDoc?.body
      if (!body) return
      let maxBottom = 0
      for (const child of body.children) {
        const rect = child.getBoundingClientRect()
        const bodyRect = body.getBoundingClientRect()
        const bottom = rect.bottom - bodyRect.top
        if (bottom > maxBottom) maxBottom = bottom
      }
      const h = maxBottom + 15
      iframe.style.height = h + 'px'

      // 高度变化后，保证预览跟随左侧编辑滚动位置
      nextTick(syncPreviewScroll)

      // 更新顶部/底部竖线高度（对应 iframe 内 data-tpl 节点高度，需在清理前测量）
      const section = body.querySelector('section')
      if (section) {
        const headerDiv = section.querySelector('[data-tpl="header"]')
        const footerDiv = section.querySelector('[data-tpl="footer"]')

        if (headerDiv) {
          const r = headerDiv.getBoundingClientRect()
          const zoneEl = previewFrameWrapRef.value?.querySelector('.preview-zone-header')
          const zoneH = zoneEl ? zoneEl.offsetHeight : 0
          headerZoneHeight.value = Math.round(r.height * (iframe.offsetWidth / (r.width || iframe.offsetWidth))) + zoneH
        }
        if (footerDiv) {
          const r = footerDiv.getBoundingClientRect()
          const zoneEl = previewFrameWrapRef.value?.querySelector('.preview-zone-footer')
          const zoneH = zoneEl ? zoneEl.offsetHeight : 0
          footerZoneHeight.value = Math.round(r.height * (iframe.offsetWidth / (r.width || iframe.offsetWidth))) + zoneH
        }
      }

      // 高度测量完毕后，做一次 DOM 清理（只做一次，避免重复）
      if (!previewCleaned) {
        previewCleaned = true
        cleanPreviewDom(iframeDoc)
      }
    } catch (e) {}
  }

  // 首次立即测量
  setTimeout(applyHeight, 30)

  // 监听 iframe 内 body 尺寸变化（字体加载、图片渲染等）
  setTimeout(() => {
    try {
      const iframeBody = iframe.contentDocument?.body
      if (!iframeBody) return
      ro = new ResizeObserver(() => {
        clearTimeout(roTimer)
        roTimer = setTimeout(applyHeight, 16)
      })
      ro.observe(iframeBody)
      // 2 秒后停止观察，避免永久占用资源
      setTimeout(() => ro?.disconnect(), 2000)
    } catch (e) {}
  }, 60)

  saveToStorage(STORAGE_KEYS.CONTENT, mdContent.value)
}

// Build Inlined HTML for Copy
// 复用 src/render 的完整序列：inlineThemeToSection → 重新解析 → wechatifyDoc
// 与 renderWechatFragment / 接口输出完全同源（避免对未内联的预览 doc 直接兼容化导致丢样式）
async function buildInlinedHtml() {
  const doc = previewIframeRef.value.contentDocument || previewIframeRef.value.contentWindow.document
  if (!doc) return ''
  // 克隆当前预览渲染结果到独立 doc，避免操作 iframe 文档
  const workDoc = document.implementation.createHTMLDocument('')
  workDoc.body.innerHTML = doc.body.innerHTML
  const themeCssText = await getThemeCss(currentTheme.value)
  const inlined = inlineThemeToSection(workDoc, themeCssText)
  const outDoc = document.implementation.createHTMLDocument('')
  outDoc.body.innerHTML = inlined
  return wechatifyDoc(outDoc)
}

// Event Handlers
function handleInput() {
  updatePreview()
}

// 左侧编辑区 / 右侧预览 双向滚动联动
let isSyncing = false

function setScrollRatio(srcEl, dstEl, ratio) {
  const srcMax = srcEl.scrollHeight - srcEl.clientHeight
  const dstMax = dstEl.scrollHeight - dstEl.clientHeight
  if (srcMax <= 0 || dstMax <= 0) return
  dstEl.scrollTop = ratio * dstMax
}

function syncPreviewScroll() {
  const editor = mdEditorRef.value
  const wrapper = previewWrapperRef.value
  if (!editor || !wrapper || isSyncing) return
  const edMax = editor.scrollHeight - editor.clientHeight
  if (edMax <= 0) return
  const ratio = editor.scrollTop / edMax
  const wrapMax = wrapper.scrollHeight - wrapper.clientHeight
  if (wrapMax <= 0) return
  isSyncing = true
  wrapper.scrollTop = ratio * wrapMax
  requestAnimationFrame(() => { isSyncing = false })
}

function syncEditorScroll() {
  const editor = mdEditorRef.value
  const wrapper = previewWrapperRef.value
  if (!editor || !wrapper || isSyncing) return
  const wrapMax = wrapper.scrollHeight - wrapper.clientHeight
  if (wrapMax <= 0) return
  const ratio = wrapper.scrollTop / wrapMax
  const edMax = editor.scrollHeight - editor.clientHeight
  if (edMax <= 0) return
  isSyncing = true
  editor.scrollTop = ratio * edMax
  requestAnimationFrame(() => { isSyncing = false })
}

function handleEditorScroll() {
  syncPreviewScroll()
}

function handlePreviewScroll() {
  syncEditorScroll()
}

async function handleCopy() {
  const html = await buildInlinedHtml()
  try {
    const blob = new Blob([html], { type: 'text/html' })
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': blob,
      'text/plain': new Blob([html], { type: 'text/plain' })
    })])
    showToast('复制成功！可直接粘贴到微信公众号编辑器')
  } catch (e) {
    try {
      await navigator.clipboard.writeText(html)
      showToast('复制成功！(纯文本模式)')
    } catch (e2) {
      showToast('复制失败，请手动复制')
    }
  }
}

function handleThemeChange(theme) {
  currentTheme.value = theme
  saveToStorage(STORAGE_KEYS.THEME, theme)
  updatePreview()
}

// Insert SVG effect HTML into markdown editor
function handleSvgInsert(htmlCode) {
  const editor = mdEditorRef.value
  if (!editor) return
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const before = mdContent.value.substring(0, start)
  const after = mdContent.value.substring(end)
  mdContent.value = before + '\n' + htmlCode + '\n' + after
  // Restore cursor position after the inserted code
  setTimeout(() => {
    editor.focus()
    const newPos = start + htmlCode.length + 2
    editor.setSelectionRange(newPos, newPos)
  }, 50)
}

function updateHeaderTemplates(tpls) {
  headerTemplates.value = tpls
  saveToStorage(STORAGE_KEYS.HEADER_TPLS, tpls)
  updatePreview()
}

function updateFooterTemplates(tpls) {
  footerTemplates.value = tpls
  saveToStorage(STORAGE_KEYS.FOOTER_TPLS, tpls)
  updatePreview()
}

function handleActiveHeaderChange(id) {
  activeHeaderId.value = id
  saveToStorage(STORAGE_KEYS.ACTIVE_HEADER, id || '')
  updatePreview()
}

function handleActiveFooterChange(id) {
  activeFooterId.value = id
  saveToStorage(STORAGE_KEYS.ACTIVE_FOOTER, id || '')
  updatePreview()
}

async function handleReset() {
  if (confirm('确定要重置所有缓存吗？这将清除所有保存的内容、模版和主题设置。')) {
    localStorage.clear()
    await init()
    showToast('缓存已重置！')
  }
}

// ===== 默认顶部模板集 =====
const DEFAULT_HEADER_TEMPLATES = [
  {
    name: '渐变封面标题',
    content: `<section style="margin:0 0 8px;padding:0;">
<div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:32px 24px 28px;text-align:center;margin-bottom:4px;">
  <p style="margin:0 0 10px;font-size:11px;color:rgba(255,255,255,.7);letter-spacing:3px;text-transform:uppercase;">INSIGHT · 深度观察</p>
  <h1 style="margin:0 0 14px;font-size:24px;font-weight:900;color:#ffffff;line-height:1.3;letter-spacing:-.5px;">公众号文章标题<br/>写在这里</h1>
  <p style="margin:0;font-size:13px;color:rgba(255,255,255,.8);line-height:1.6;">一句话副标题，用来补充说明文章的核心观点</p>
</div>
<p style="margin:8px 0 0;text-align:right;font-size:11px;color:#aaa;">作者：你的名字 &nbsp;|&nbsp; 2024.12</p>
</section>`
  },
  {
    name: '极简大字标题',
    content: `<section style="margin:0 0 8px;padding:0;">
<div style="border-top:4px solid #1a1a1a;padding:24px 0 20px;">
  <p style="margin:0 0 8px;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;">FEATURE STORY</p>
  <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#111;line-height:1.2;letter-spacing:-1px;">文章主标题<br/>大字冲击力</h1>
  <div style="display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #e5e5e5;">
    <div style="width:36px;height:36px;background:#1a1a1a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;">✍</div>
    <div>
      <p style="margin:0;font-size:13px;font-weight:600;color:#111;">作者名字</p>
      <p style="margin:2px 0 0;font-size:11px;color:#888;">发布于 2024年12月</p>
    </div>
  </div>
</div>
</section>`
  },
  {
    name: '科技风封面',
    content: `<section style="margin:0 0 8px;padding:0;">
<div style="background:#0f0f1a;border-radius:10px;padding:28px 24px;position:relative;overflow:hidden;">
  <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;background:radial-gradient(circle,rgba(79,70,229,.3),transparent);border-radius:50%;"></div>
  <p style="margin:0 0 12px;font-size:10px;color:#6366f1;letter-spacing:3px;font-weight:600;text-transform:uppercase;">AI · TECH · FUTURE</p>
  <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.35;letter-spacing:-.3px;">科技文章大标题<br/>一行或两行均可</h1>
  <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.6);line-height:1.7;">副标题一行描述，点明文章核心议题与价值主张。</p>
  <div style="display:inline-block;background:#4f46e5;color:#fff;font-size:11px;font-weight:600;padding:5px 14px;border-radius:20px;letter-spacing:.5px;">深度报告</div>
</div>
</section>`
  },
  {
    name: '金色杂志风',
    content: `<section style="margin:0 0 8px;padding:0;">
<div style="border-bottom:3px solid #f0c030;padding-bottom:20px;margin-bottom:4px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
    <span style="font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;font-weight:600;">VOL.12 · 2024</span>
    <span style="background:#f0c030;color:#111;font-size:10px;font-weight:700;padding:3px 10px;border-radius:2px;letter-spacing:1px;">封面故事</span>
  </div>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#1a1a1a;line-height:1.2;letter-spacing:-.5px;">文章标题<br/>杂志感排版</h1>
  <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.7;border-left:3px solid #f0c030;padding-left:12px;">精选副标题，讲述这篇文章的故事背景和核心价值，吸引读者继续阅读。</p>
  <p style="margin:0;font-size:11px;color:#999;">BY 作者名字 &nbsp;·&nbsp; 预计阅读 8 分钟</p>
</div>
</section>`
  },
  {
    name: 'Markdown 简洁标题',
    content: `# 📌 本期主题

> 一句话概括本文核心观点，让读者一眼知道值不值得读。

**作者**：你的名字 | **发布**：2024.12`
  },
]

// ===== 默认底部模板集 =====
const DEFAULT_FOOTER_TEMPLATES = [
  {
    name: '关于作者·关于本号（原版）',
    content: `<section style="margin:0;padding:0;">
<p style="margin:30px 0 20px 0;border-top:1px solid #eeeeee;font-size:1px;line-height:1px;">&nbsp;</p>
<p style="margin:0 0 12px 0;padding:6px 10px;border-left:4px solid #f7b500;font-size:14px;font-weight:bold;color:#333333;line-height:1.5;background:transparent;">关于作者</p>
<p style="margin:0 0 0 12px;font-size:13px;color:#555555;line-height:1.6;text-align:justify;">常驻硅谷与前沿技术一线的科技评论员，前硬核科技媒体主笔。深耕 AI 行业、智能硬件与数字化转型领域，致力于用剥离滤镜的客观视角，拆解科技演进背后的真实商业逻辑与技术真相。</p>
<p style="margin:25px 0 12px 0;padding:6px 10px;border-left:4px solid #f7b500;font-size:14px;font-weight:bold;color:#333333;line-height:1.5;background:transparent;">关于本号</p>
<p style="margin:0 0 0 12px;font-size:13px;color:#555555;line-height:1.6;text-align:justify;">不跟风，不造神。我们是一家专注科技趋势深度复盘、硬核产业拆解的原创内容基地。每周为您奉上最硬核的行业内幕观察与通俗易懂的技术底层剖析。</p>
<table style="width:100%;border:1px solid #eeeeee;background-color:#fafafa;border-radius:12px;margin:25px 0 0 0;border-collapse:separate;">
  <tr>
    <td style="padding:18px;vertical-align:top;">
      <p style="margin:0 0 6px 0;font-size:16px;color:#222222;font-weight:600;line-height:1.4;">欢迎关注 "公众"</p>
      <p style="margin:0 0 4px 0;font-size:12px;color:#666666;line-height:1.4;">在这里，换个姿势看懂科技未来。</p>
      <p style="margin:0;font-size:11px;color:#999999;line-height:1.4;">💡 长按右侧二维码，识别并关注本号</p>
    </td>
    <td style="width:92px;padding:18px;vertical-align:middle;">
      <div style="width:84px;height:84px;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:8px;padding:4px;">
        <img src="" alt="二维码" style="width:100%;height:100%;object-fit:contain;display:block;" />
      </div>
    </td>
  </tr>
</table>
</section>`
  },
  {
    name: '经典关注卡片',
    content: `<section style="margin:0;padding:0;">
<p style="margin:32px 0 0;border-top:1px solid #eeeeee;padding-top:24px;font-size:1px;line-height:0;">&nbsp;</p>
<p style="margin:0 0 10px;padding:6px 12px;border-left:4px solid #f7b500;font-size:14px;font-weight:700;color:#333;line-height:1.5;">关于作者</p>
<p style="margin:0 0 20px 12px;font-size:13px;color:#555;line-height:1.75;text-align:justify;">这里是作者简介，介绍你的专业背景、研究方向和写作初衷。可以写 2-3 句话，让读者更好地了解你。</p>
<p style="margin:0 0 10px;padding:6px 12px;border-left:4px solid #f7b500;font-size:14px;font-weight:700;color:#333;line-height:1.5;">关于本号</p>
<p style="margin:0 0 24px 12px;font-size:13px;color:#555;line-height:1.75;text-align:justify;">这里是公众号定位介绍，告诉读者你的号主要聊什么、有什么独特价值。简洁有力，让人记住。</p>
<table style="width:100%;background:#f8f9fa;border-radius:10px;border-collapse:separate;overflow:hidden;">
  <tr>
    <td style="padding:18px 16px;vertical-align:middle;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#222;">关注「公众号名称」</p>
      <p style="margin:0 0 6px;font-size:12px;color:#888;line-height:1.5;">一句话描述公众号价值主张</p>
      <p style="margin:0;font-size:11px;color:#aaa;">👆 长按右侧二维码关注</p>
    </td>
    <td style="width:88px;padding:18px 16px 18px 0;vertical-align:middle;text-align:center;">
      <div style="width:80px;height:80px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#ccc;">二维码</div>
    </td>
  </tr>
</table>
</section>`
  },
  {
    name: '深色渐变结尾',
    content: `<section style="margin:0;padding:0;">
<div style="margin-top:32px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:28px 24px;text-align:center;">
  <p style="margin:0 0 8px;font-size:22px;">✍️</p>
  <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#ffffff;">感谢阅读</p>
  <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.6);line-height:1.7;">如果本文对你有帮助，欢迎<strong style="color:#fff;">转发分享</strong>给更多朋友<br/>你的每一次转发，都是对我最大的支持</p>
  <div style="display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center;">
    <span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);font-size:12px;padding:6px 16px;border-radius:20px;">👍 点赞</span>
    <span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);font-size:12px;padding:6px 16px;border-radius:20px;">⭐ 收藏</span>
    <span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);font-size:12px;padding:6px 16px;border-radius:20px;">🔁 转发</span>
  </div>
</div>
<p style="margin:16px 0 0;text-align:center;font-size:11px;color:#bbb;">本文由「公众号名称」原创 · 转载请注明出处</p>
</section>`
  },
  {
    name: '极简签名档',
    content: `<section style="margin:0;padding:0;">
<div style="margin-top:32px;padding-top:20px;border-top:2px solid #1a1a1a;">
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
    <div>
      <p style="margin:0 0 3px;font-size:15px;font-weight:800;color:#111;letter-spacing:-.3px;">公众号名称</p>
      <p style="margin:0;font-size:12px;color:#888;">深度 · 独立 · 有观点</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0 0 2px;font-size:11px;color:#ccc;">© 2024 版权所有</p>
      <p style="margin:0;font-size:11px;color:#aaa;">原创内容 · 欢迎转发</p>
    </div>
  </div>
</div>
</section>`
  },
  {
    name: '彩条互动结尾',
    content: `<section style="margin:0;padding:0;">
<div style="margin-top:32px;">
  <div style="height:4px;background:linear-gradient(90deg,#667eea,#f093fb,#f5576c,#ffa31a,#07c160);border-radius:2px;margin-bottom:24px;"></div>
  <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1a1a1a;text-align:center;">如果有收获，就支持一下吧 👇</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:33%;text-align:center;padding:12px 6px;">
        <div style="background:#fff7ed;border-radius:8px;padding:14px 8px;">
          <p style="margin:0 0 4px;font-size:20px;">👍</p>
          <p style="margin:0;font-size:12px;font-weight:600;color:#333;">点个赞</p>
          <p style="margin:2px 0 0;font-size:10px;color:#999;">让我知道你来过</p>
        </div>
      </td>
      <td style="width:33%;text-align:center;padding:12px 6px;">
        <div style="background:#f0fdf4;border-radius:8px;padding:14px 8px;">
          <p style="margin:0 0 4px;font-size:20px;">⭐</p>
          <p style="margin:0;font-size:12px;font-weight:600;color:#333;">加入收藏</p>
          <p style="margin:2px 0 0;font-size:10px;color:#999;">下次更容易找到</p>
        </div>
      </td>
      <td style="width:33%;text-align:center;padding:12px 6px;">
        <div style="background:#f0f4ff;border-radius:8px;padding:14px 8px;">
          <p style="margin:0 0 4px;font-size:20px;">🔔</p>
          <p style="margin:0;font-size:12px;font-weight:600;color:#333;">设为星标</p>
          <p style="margin:2px 0 0;font-size:10px;color:#999;">不错过每篇推送</p>
        </div>
      </td>
    </tr>
  </table>
</div>
</section>`
  },
  {
    name: '作者名片卡',
    content: `<section style="margin:0;padding:0;">
<div style="margin-top:32px;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#f093fb,#f5576c);height:60px;"></div>
  <div style="padding:0 20px 20px;">
    <div style="width:56px;height:56px;background:#fff;border:3px solid #fff;border-radius:50%;margin:-28px 0 12px;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>
    <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#1a1a1a;">作者名字</p>
    <p style="margin:0 0 12px;font-size:12px;color:#888;">科技评论员 · 内容创作者</p>
    <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.7;">这里是一两句自我介绍，简短有力，让读者快速记住你是谁、做什么。</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="background:#f0f0f0;color:#555;font-size:11px;padding:4px 10px;border-radius:4px;"># 科技</span>
      <span style="background:#f0f0f0;color:#555;font-size:11px;padding:4px 10px;border-radius:4px;"># AI</span>
      <span style="background:#f0f0f0;color:#555;font-size:11px;padding:4px 10px;border-radius:4px;"># 深度分析</span>
    </div>
  </div>
</div>
</section>`
  },
  {
    name: 'Markdown 简洁结尾',
    content: `---

🙏 **感谢阅读**，如果对你有启发，欢迎转发给朋友。

**关注「公众号名称」**，每周更新职场认知与 AI 工具实践。`
  },
]

// Init
async function init() {
  // Load Theme
  const savedTheme = loadFromStorage(STORAGE_KEYS.THEME)
  currentTheme.value = savedTheme || 'blue'

  // Load Active Template IDs
  const savedActiveHeader = loadFromStorage(STORAGE_KEYS.ACTIVE_HEADER)
  const savedActiveFooter = loadFromStorage(STORAGE_KEYS.ACTIVE_FOOTER)
  activeHeaderId.value = savedActiveHeader || null
  activeFooterId.value = savedActiveFooter || null

  // Load Templates
  headerTemplates.value = loadJsonFromStorage(STORAGE_KEYS.HEADER_TPLS, [])
  footerTemplates.value = loadJsonFromStorage(STORAGE_KEYS.FOOTER_TPLS, [])

  // Seed default header templates if none exist
  if (headerTemplates.value.length === 0) {
    const seeded = DEFAULT_HEADER_TEMPLATES.map(t => ({ id: genId(), ...t }))
    headerTemplates.value = seeded
    saveToStorage(STORAGE_KEYS.HEADER_TPLS, seeded)
  }

  // Seed default footer templates if none exist
  if (footerTemplates.value.length === 0) {
    const seeded = DEFAULT_FOOTER_TEMPLATES.map(t => ({ id: genId(), ...t }))
    footerTemplates.value = seeded
    saveToStorage(STORAGE_KEYS.FOOTER_TPLS, seeded)
  }

  // Load Content
  const savedContent = loadFromStorage(STORAGE_KEYS.CONTENT)
  const defaultContent = `# AI 正在重塑每一个行业——你准备好了吗？

2024 年，生成式 AI 的浪潮已经从硅谷的实验室涌入了每一个普通人的工作桌面。这场变革的速度，远比大多数人预想的更快、更彻底。

## 一、这不是工具升级，是范式转移

过去我们使用工具，是"人驱动机器"——我们输入指令，机器执行。但大语言模型出现之后，这条边界开始模糊。

> **工具在替代的，从来不是"体力"，而是"判断力"。** 这才是真正让人感到不安的地方。

当 AI 能在几秒钟内完成一份商业分析报告、写出一段可以运行的代码、甚至模拟出一位心理咨询师的对话风格时，我们不得不重新思考：**人的不可替代性究竟在哪里？**

## 二、三类人的不同命运

根据麦肯锡全球研究院的预测，到 2030 年，全球约有 **3 亿个全职岗位**会受到 AI 的直接冲击。但影响并非均一分布，大致可以分为三类人：

### 🔴 高风险群体

从事高度重复性、规则明确工作的人群，例如：

- 基础数据录入与核对
- 标准化客服与电话销售
- 简单的文案撰写与翻译
- 初级代码审查与测试

### 🟡 中等影响群体

工作内容有一定复杂度，但部分环节可被 AI 辅助加速：

- 内容创作者（需要更强的选题与洞察力）
- 程序员（需要从"写代码"转向"设计系统"）
- 分析师（数据处理交给 AI，解读与决策仍属于人）

### 🟢 低风险 / 受益群体

强依赖人际关系、创造力、复杂判断的职业反而会因 AI 而**效率倍增**：

- 创业者与产品经理
- 心理咨询师、教练与教育者
- 战略顾问与管理者
- 艺术家与创意总监

## 三、数据不会说谎

来自 GitHub 的统计数据显示，使用 Copilot 的开发者完成任务的速度平均**提升了 55%**，而代码审查时间缩短了近三分之一。

| 职能领域 | AI 渗透程度 | 人力替代风险 | 增效潜力 |
|---------|-----------|------------|--------|
| 内容生产 | ★★★★★ | 中高 | 极高 |
| 软件开发 | ★★★★☆ | 中 | 极高 |
| 金融分析 | ★★★★☆ | 中高 | 高 |
| 法律服务 | ★★★☆☆ | 低中 | 高 |
| 医疗诊断 | ★★★☆☆ | 低 | 极高 |
| 教育培训 | ★★☆☆☆ | 低 | 高 |

## 四、真正的护城河是什么？

一个反直觉的结论正在被越来越多的研究者认可：

> 在 AI 时代，**"学习能力"本身才是最重要的技能**——不是学某门具体的技术，而是保持对新事物的开放性、快速建立心智模型的能力。

具体来说，以下几个方向值得投入：

1. **提示工程（Prompt Engineering）**：学会与 AI 高效协作，本质上是一种新的沟通能力
2. **系统思维**：AI 擅长局部优化，人需要掌握全局设计
3. **跨领域整合**：AI 知识广但缺乏真实经验，跨领域的人类经验仍是稀缺资产
4. **情绪与关系**：这是目前 AI 最难触及的维度

## 五、一个小测试

你可以用下面这段代码快速测试你的 AI 工具是否配置正确：

\`\`\`python
import openai

client = openai.OpenAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一位专业的内容顾问"},
        {"role": "user", "content": "帮我分析一下 AI 对内容创作行业的影响"}
    ]
)

print(response.choices[0].message.content)
\`\`\`

## 结语

技术从不等人。但真正的威胁从来不是 AI 本身，而是**那些已经学会使用 AI 的人**。

与其焦虑，不如行动。从今天开始，找一个你最常做的重复性工作，试着用 AI 来帮你完成它。

**你会发现，效率不是提升了一点点，而是一个量级。**

---

*本文使用「微信文章编辑器」排版 · 支持 Markdown 一键转微信格式*`
  mdContent.value = savedContent || defaultContent

  updatePreview()
}

// Watch for theme changes
watch(currentTheme, () => {
  updatePreview()
})

// Mounted
onMounted(() => {
  init()

  // 用 scroll 监听 preview-wrapper，判断顶部/底部 bar 是否可见
  setTimeout(() => {
    const wrapper = previewWrapperRef.value
    if (!wrapper) return

    function checkVisibility() {
      const wrapperRect = wrapper.getBoundingClientRect()

      // 顶部 bar
      if (headerBarRef.value) {
        const rect = headerBarRef.value.getBoundingClientRect()
        headerPillVisible.value = rect.bottom < wrapperRect.top + 10
      }

      // 底部 bar
      if (footerBarRef.value) {
        const rect = footerBarRef.value.getBoundingClientRect()
        footerPillVisible.value = rect.top > wrapperRect.bottom - 10
      }
    }

    wrapper.addEventListener('scroll', checkVisibility, { passive: true })
    checkVisibility() // 初始执行一次
  }, 300)
})
</script>

<style>
/* ===== App Container ===== */
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  color: #1a1a1a;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }

/* ===== Top Bar ===== */
.header {
  height: 52px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-logo {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #07c160, #05a050);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.header h1 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.2px;
}
.header-divider {
  width: 1px;
  height: 18px;
  background: #e0e0e0;
  margin: 0 4px;
}
.header-subtitle {
  font-size: 12px;
  color: #bbb;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== Buttons ===== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-primary {
  background: #07c160;
  color: #fff;
  box-shadow: 0 1px 4px rgba(7,193,96,0.35);
}
.btn-primary:hover { background: #06ad56; box-shadow: 0 2px 8px rgba(7,193,96,0.4); }
.btn-ghost {
  background: transparent;
  color: #555;
  border: 1px solid #e0e0e0;
}
.btn-ghost:hover { background: #f5f5f5; border-color: #ccc; color: #222; }
.btn-donate {
  background: transparent;
  border: 1px solid #fed7aa;
  color: #c2410c;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 8px;
  height: 32px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-donate:hover {
  background: #fff7ed;
  border-color: #fb923c;
}
.donate-icon {
  display: inline-block;
  animation: coffee-bounce 1.8s ease-in-out infinite;
  font-size: 15px;
}
@keyframes coffee-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  20%       { transform: translateY(-4px) rotate(-8deg); }
  40%       { transform: translateY(0) rotate(0deg); }
  60%       { transform: translateY(-2px) rotate(5deg); }
  80%       { transform: translateY(0) rotate(0deg); }
}
.btn-danger { background: #ff4d4f; color: #fff; }
.btn-danger:hover { background: #e03e40; }
.btn-secondary { background: #f0f0f0; color: #444; border: 1px solid #e0e0e0; }
.btn-secondary:hover { background: #e8e8e8; }

/* Zone style switcher */
.zone-style-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f0f0f0;
  border-radius: 7px;
  padding: 2px;
}
.zone-style-label {
  font-size: 11px;
  color: #999;
  padding: 0 6px 0 4px;
  white-space: nowrap;
}
.btn-zone {
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
  border-radius: 5px;
  background: transparent;
  color: #666;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-zone:hover { background: #e0e0e0; color: #333; }
.btn-zone.active { background: #fff; color: #1a1a1a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* ===== Main Layout ===== */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 0;
}

/* ===== Editor Panel ===== */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 320px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  min-height: 0;
}
.panel-header {
  padding: 0 16px;
  height: 38px;
  background: #fafafa;
  border-bottom: 1px solid #efefef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.word-count {
  font-size: 12px;
  color: #bbb;
}

.editor-textarea {
  flex: 1;
  background: #fff;
  color: #2d2d2d;
  border: none;
  padding: 20px 24px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.75;
  resize: none;
  outline: none;
  tab-size: 2;
  overflow-y: auto;
  overflow-x: hidden;
}
.editor-textarea::placeholder { color: #ccc; }

/* ===== Preview Panel ===== */
.preview-panel {
  flex: 0 0 440px;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.preview-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 16px 36px 16px 16px;
  min-height: 0;
  box-sizing: border-box;
}
.preview-wrapper::-webkit-scrollbar { width: 6px; }
.preview-wrapper::-webkit-scrollbar-track { background: transparent; }
.preview-wrapper::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 6px; }
.preview-wrapper::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }
.preview-frame {
  width: 100%;
  background: #fff;
  overflow: visible;
}
.preview-iframe {
  width: 100%;
  height: 0;
  border: none;
  display: block;
  background: #fff;
  border-radius: 8px;
}
.preview-hint {
  font-size: 11px;
  color: #ccc;
}

/* ===== Template Bars ===== */
.tpl-bar {
  max-width: 480px;
  margin: 0 auto;
  padding: 0;
}
.tpl-bar-top { margin-bottom: 6px; }
.tpl-bar-bottom { margin-top: 6px; }

.tpl-bar-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  padding: 6px 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tpl-bar-inner:hover {
  border-color: #07c160;
  box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.08);
}
.tpl-bar-top.tpl-bar-active .tpl-bar-inner {
  border-color: #07c160;
  background: #f0fdf6;
}
.tpl-bar-bottom.tpl-bar-active .tpl-bar-inner {
  border-color: #667eea;
  background: #f0effe;
}

.tpl-bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.tpl-bar-top.tpl-bar-active .tpl-bar-label { color: #07c160; }
.tpl-bar-bottom.tpl-bar-active .tpl-bar-label { color: #667eea; }

.tpl-bar-select-wrap {
  flex: 1;
  position: relative;
}
.tpl-bar-select {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 16px;
}
.tpl-bar-select-wrap::after {
  content: '▾';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #aaa;
  pointer-events: none;
}
.tpl-bar-top.tpl-bar-active .tpl-bar-select { color: #1a7a44; font-weight: 500; }
.tpl-bar-bottom.tpl-bar-active .tpl-bar-select { color: #4a3a9a; font-weight: 500; }

.tpl-bar-btn {
  background: none;
  border: none;
  font-size: 11px;
  color: #aaa;
  cursor: pointer;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.12s, color 0.12s;
}
.tpl-bar-btn:hover {
  background: #e8f5ee;
  color: #07c160;
}

/* ===== Preview Frame Wrap ===== */
.preview-frame-wrap {
  max-width: 480px;
  margin: 0 auto;
  overflow: visible;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  background: #fff;
  position: relative;
}

/* 顶部模版竖线：贴在 preview-frame-wrap 左侧，从顶部圆角延伸到顶部区域底部 */
.preview-frame-wrap .preview-zone-header-line {
  position: absolute;
  left: -3px;
  top: 0;
  width: 3px;
  border-radius: 8px 0 0 0;
  background: #07c160;
  pointer-events: none;
  z-index: 5;
  transition: background 0.2s, height 0.2s;
}
.preview-frame-wrap .preview-zone-footer-line {
  position: absolute;
  left: -3px;
  bottom: 0;
  width: 3px;
  border-radius: 0 0 0 8px;
  background: #667eea;
  pointer-events: none;
  z-index: 5;
  transition: background 0.2s, height 0.2s;
}

/* ===== 区域标注 Zone：外层便签 ===== */
.preview-zone {
  height: 0;
  position: relative;
  pointer-events: none;
}

.preview-zone-tag {
  position: absolute;
  left: -15px; /* 贴 iframe 左边框 */
  transform: translateX(-100%);
  top: 10px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 8px 5px;
  border-radius: 4px 0 0 4px;
  letter-spacing: 1px;
  white-space: nowrap;
  box-shadow: -2px 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
  pointer-events: all;
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}
.preview-zone-footer .preview-zone-tag {
  top: auto;
  bottom: 10px;
}
.preview-zone-tag:hover {
  transform: translateX(calc(-100% - 2px));
  box-shadow: -3px 3px 12px rgba(0,0,0,0.2);
}

/* ===== 吸附 Pill 提示（preview-panel 边缘）===== */
.tpl-pill {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(26, 26, 26, 0.82);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  z-index: 20;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  transition: background 0.15s;
}
.tpl-pill:hover { background: rgba(7, 193, 96, 0.9); }
.tpl-pill-top { top: 48px; }
.tpl-pill-bottom { bottom: 32px; }
.tpl-pill-bottom:hover { background: rgba(102, 126, 234, 0.9); }

.tpl-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aaa;
  flex-shrink: 0;
}
.tpl-pill-dot.active { background: #07c160; }
.tpl-pill-dot.active.purple { background: #667eea; }
.tpl-pill:hover .tpl-pill-dot { background: #fff; }

/* inline pill：放在 wrapper 内底部，随内容滚动 */
.tpl-pill-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 8px auto 0;
  max-width: 480px;
  background: linear-gradient(135deg, #f0fdf6, #e6f7f0);
  border: 1.5px dashed #07c160;
  border-radius: 10px;
  color: #07c160;
  font-size: 12px;
  font-weight: 500;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.tpl-pill-inline:hover { background: #e0faee; border-color: #05a050; }
.tpl-pill-inline .tpl-pill-dot { background: #07c160; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* ===== Transitions ===== */
.pill-slide-down-enter-active, .pill-slide-down-leave-active { transition: opacity 0.2s, transform 0.2s; }
.pill-slide-down-enter-from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
.pill-slide-down-leave-to  { opacity: 0; transform: translateX(-50%) translateY(-8px); }

.pill-slide-up-enter-active, .pill-slide-up-leave-active { transition: opacity 0.2s, transform 0.2s; }
.pill-slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.pill-slide-up-leave-to  { opacity: 0; transform: translateY(8px); }

.tag-fade-enter-active, .tag-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.tag-fade-enter-from { opacity: 0; transform: translateX(6px); }
.tag-fade-leave-to  { opacity: 0; transform: translateX(6px); }

/* ===== Status Bar ===== */
.statusbar {
  height: 28px;
  padding: 0 20px;
  background: #fafafa;
  border-top: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.statusbar span {
  font-size: 11px;
  color: #bbb;
}
.statusbar-right {
  display: flex;
  align-items: center;
  gap: 5px;
}
.statusbar-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #bbb;
  text-decoration: none;
  transition: color 0.15s;
}
.statusbar-link:hover {
  color: #555;
}
.statusbar-link-donate:hover {
  color: #c2410c;
}
.statusbar-sep {
  font-size: 11px;
  color: #ddd;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  background: rgba(30,30,30,0.88);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: none;
  z-index: 9999;
  backdrop-filter: blur(6px);
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ===== Modal Base ===== */
.modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 2000;
  justify-content: center;
  align-items: center;
}
.modal.show { display: flex; }
</style>
