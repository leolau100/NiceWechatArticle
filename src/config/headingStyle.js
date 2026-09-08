/**
 * 标题（h1–h6）字号 / 字重 / 颜色 统一配置
 *
 * 优先级（逐字段回退）：
 *   ① 用户在「主题设置」里为该主题配的值（localStorage）
 *   ② 常量 THEME_HEADING_STYLE[theme]（本文件）
 *   ③ 用户在「全局设置」里配的系统默认（localStorage）
 *   ④ 常量 DEFAULT_HEADING_STYLE（本文件，系统默认值）
 *
 * 说明：这些值在渲染 / 预览阶段以「内联样式」写入 h1–h6，
 *      优先级高于主题 CSS，保证导出微信与编辑器预览一致。
 */

/** 系统默认：h1–h6 默认 20px / 700；color 留空表示不改颜色（沿用主题色） */
export const DEFAULT_HEADING_STYLE = {
  h1: { fontSize: '20px', fontWeight: '700', color: '' },
  h2: { fontSize: '20px', fontWeight: '700', color: '' },
  h3: { fontSize: '20px', fontWeight: '700', color: '' },
  h4: { fontSize: '20px', fontWeight: '700', color: '' },
  h5: { fontSize: '20px', fontWeight: '700', color: '' },
  h6: { fontSize: '20px', fontWeight: '700', color: '' }
}

/** 主题级常量配置（可在此写死，用户也可在界面上覆盖） */
export const THEME_HEADING_STYLE = {
  qbitai: {
    h1: { fontSize: '20px', fontWeight: '700' },
    h2: { fontSize: '20px', fontWeight: '700' },
    h3: { fontSize: '18px', fontWeight: '700' },
    h4: { fontSize: '17px', fontWeight: '700' },
    h5: { fontSize: '14px', fontWeight: '300' },
    h6: { fontSize: '15px', fontWeight: '700' }
  },
  jiqizhixin: {
    h1: { fontSize: '19px', fontWeight: '700' },
    h2: { fontSize: '17px', fontWeight: '700' },
    h3: { fontSize: '16px', fontWeight: '700' },
    h4: { fontSize: '15px', fontWeight: '700' },
    h5: { fontSize: '15px', fontWeight: '700' },
    h6: { fontSize: '14px', fontWeight: '700' }
  },
  wavy: {
    h1: { fontSize: '21px', fontWeight: '700', color: '#0a4d8c' },
    h2: { fontSize: '19px', fontWeight: '700', color: '#0a4d8c' },
    h3: { fontSize: '17px', fontWeight: '700', color: '#0a4d8c' },
    h4: { fontSize: '16px', fontWeight: '700', color: '#0a4d8c' },
    h5: { fontSize: '15px', fontWeight: '700', color: '#0a4d8c' },
    h6: { fontSize: '15px', fontWeight: '700', color: '#5a5a5a' }
  },
  'wavy-serif': {
    h1: { fontSize: '21px', fontWeight: '700', color: '#1a1a1a' },
    h2: { fontSize: '19px', fontWeight: '700', color: '#1a1a1a' },
    h3: { fontSize: '17px', fontWeight: '700', color: '#1a1a1a' },
    h4: { fontSize: '16px', fontWeight: '700', color: '#1a1a1a' },
    h5: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
    h6: { fontSize: '15px', fontWeight: '700', color: '#5a5a5a' }
  }
}

/** 启用「标题自动序号」的主题（序号用 JS 注入，CSS 计数器在微信会因移除 class 失效） */
export const NUMBERED_THEMES = ['wavy', 'wavy-serif']

export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

// ── 用户在界面上的设置（localStorage） ───────────────────────────────
const LS_GLOBAL = 'nwf.heading.style.global'
const LS_THEME = 'nwf.heading.style.theme'

function readLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') || {} } catch (e) { return {} }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) {}
}

export function getGlobalUserStyle() { return readLS(LS_GLOBAL) }
export function setGlobalUserStyle(obj) { writeLS(LS_GLOBAL, obj || {}) }
export function getThemeUserStyle(theme) { return readLS(LS_THEME)[theme] || {} }
export function setThemeUserStyle(theme, obj) {
  const all = readLS(LS_THEME)
  all[theme] = obj || {}
  writeLS(LS_THEME, all)
}
export function clearThemeUserStyle(theme) {
  const all = readLS(LS_THEME)
  delete all[theme]
  writeLS(LS_THEME, all)
}
export function resetAllUserStyle() {
  try { localStorage.removeItem(LS_GLOBAL); localStorage.removeItem(LS_THEME) } catch (e) {}
}

/** 判断某主题是否在界面上被单独设置过 */
export function hasThemeUserStyle(theme) {
  return Object.keys(getThemeUserStyle(theme)).length > 0
}

/**
 * 取某主题、某级标题的最终样式（逐字段按优先级回退）
 * @returns {{fontSize:string, fontWeight:string, color:string}}
 */
export function getHeadingStyle(theme, tag) {
  const tk = String(tag || '').toLowerCase()
  const themeUser = getThemeUserStyle(theme)
  const themeConst = THEME_HEADING_STYLE[String(theme || '').toLowerCase()] || {}
  const globalUser = getGlobalUserStyle()
  const def = DEFAULT_HEADING_STYLE[tk] || {}
  const pick = field =>
    (themeUser[tk] && themeUser[tk][field]) ||
    (themeConst[tk] && themeConst[tk][field]) ||
    (globalUser[tk] && globalUser[tk][field]) ||
    def[field] || ''
  return { fontSize: pick('fontSize'), fontWeight: pick('fontWeight'), color: pick('color') }
}

/** 把标题样式应用到文档中的 h1–h6（内联样式） */
export function applyHeadingStyle(doc, theme) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return
  HEADING_TAGS.forEach(tag => {
    const { fontSize, fontWeight, color } = getHeadingStyle(theme, tag)
    doc.querySelectorAll(tag).forEach(el => {
      if (fontSize) el.style.setProperty('font-size', fontSize)
      if (fontWeight) el.style.setProperty('font-weight', fontWeight)
      if (color) el.style.setProperty('color', color)
    })
  })
}

/**
 * 为启用序号的主题注入标题序号（1. 2. 3. …），按文档顺序递增
 */
export function applyHeadingNumber(doc, theme) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return
  if (!NUMBERED_THEMES.includes(String(theme || '').toLowerCase())) return
  const { color } = getHeadingStyle(theme, 'h2')
  let n = 0
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(el => {
    n++
    const span = doc.createElement('span')
    span.setAttribute('style', `margin-right:8px;font-weight:700;color:${color || 'inherit'};`)
    span.textContent = `${n}.`
    el.insertBefore(span, el.firstChild)
  })
}
