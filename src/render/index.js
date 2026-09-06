/**
 * 公众号文章渲染公共方法
 *
 * 传入 markdown 内容、主题、头部/底部模板，返回渲染后的 HTML。
 * 转换逻辑与编辑器「一键复制」完全一致（同一套 DOM 处理链路）。
 *
 * 用法：
 *   import { renderWechatHtml, renderWechatFragment } from '@/render'
 *
 *   // 完整 HTML 页面（含 <head> 主题样式，可独立打开预览）
 *   const html = await renderWechatHtml({
 *     markdown: '# 标题\n正文',
 *     theme: 'blue',
 *     header: '> 欢迎关注',
 *     footer: '*本文由 NiceWeChatFile 排版*'
 *   })
 *
 *   // 微信兼容片段（可直接粘贴到公众号编辑器）
 *   const fragment = await renderWechatFragment({ markdown, theme, header, footer })
 */

import { marked } from 'marked'

// 硬换行保留为 <br>，与编辑器保持一致
marked.setOptions({ breaks: true, gfm: true })

// 代码块不使用 <pre> 标签（微信对 pre 支持差，且用户不希望使用 pre），
// 改为 <div class="code-block"><code>...</code></div>
function escapeHtmlForCode(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
marked.use({
  renderer: {
    code(token) {
      const text = (token && token.text) || ''
      return `<div class="code-block"><code>${escapeHtmlForCode(text)}</code></div>\n`
    }
  }
})

// ── 主题文件映射（与 Editor.vue 中的 themeFileMap 一致）──────────────────────
export const THEME_FILE_MAP = {
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
}

// 主题 CSS 缓存（模块级，避免重复请求）
const themeCssCache = Object.create(null)

/**
 * 加载主题 CSS 文本
 * @param {string} theme 主题名
 * @param {string} [basePath] 主题目录前缀，默认 'themes/'
 * @returns {Promise<string>}
 */
export async function getThemeCss(theme, basePath) {
  const file = THEME_FILE_MAP[theme]
  if (!file) return ''
  if (themeCssCache[theme] !== undefined) return themeCssCache[theme]
  try {
    const url = basePath ? basePath + file.replace(/^themes\//, '') : file
    const resp = await fetch(url)
    if (resp.ok) {
      const cssText = await resp.text()
      themeCssCache[theme] = cssText
      return cssText
    }
  } catch (e) {
    console.warn('[render] Load theme CSS failed:', e)
  }
  return ''
}

// ── 模板渲染 ────────────────────────────────────────────────────────────────
export function isHtml(content) {
  return content.trimStart().startsWith('<')
}

/**
 * 渲染头部/底部模板（HTML 原样输出，Markdown 用 marked 解析并套主题类）
 */
export function renderTemplate(content, theme) {
  if (!content || !content.trim()) return ''
  if (isHtml(content)) return content
  return `<div class="theme-${theme}">${marked.parse(content)}</div>`
}

// ── CSS 规则解析 ────────────────────────────────────────────────────────────
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

function applyProps(el, props) {
  Object.entries(props).forEach(([prop, val]) => {
    if (['position', 'z-index', 'content', 'counter-reset', 'counter-increment',
         'transition', 'animation', 'clip-path', 'transform'].includes(prop)) return
    try {
      el.style.setProperty(prop, val)
    } catch (e) {}
  })
}

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
  if (!styleProps['display']) styleProps['display'] = 'inline'
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

function applyThemeRulesToDom(container, rules, doc) {
  const TAG_KEYS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'strong', 'em', 'a',
    'ul', 'ol', 'li', 'hr', 'table', 'th', 'td', 'img', 'del', 'section', 'div', 'span']

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

      const hasListStyle = elRules && (elRules['list-style'] || elRules['list-style-type'])
      const listStyleIsNone = el.style.listStyle === 'none'

      const _accent =
        (beforeRules && (beforeRules['color'] || beforeRules['background'] || beforeRules['background-color'])) ||
        rules['h2'] && (rules['h2']['color']) ||
        rules['strong'] && (rules['strong']['color']) ||
        rules['a'] && (rules['a']['color']) ||
        _root['color'] || _p['color'] || '#333'

      if (LIST_TAGS.includes(tag)) {
        const isOrdered = tag === 'ol'
        if (listStyleIsNone || (!beforeRules && !hasListStyle)) {
          el.style.position = 'relative'
          el.style.listStyle = 'none'
          el.querySelectorAll(':scope > li').forEach((li, idx) => {
            if (!li.querySelector(':scope > span[data-bullet]')) {
              const marker = doc.createElement('span')
              marker.setAttribute('aria-hidden', 'true')
              marker.setAttribute('data-bullet', 'true')
              marker.textContent = isOrdered ? `${idx + 1}.` : '•'
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

      if (!LIST_TAGS.includes(tag)) {
        if (beforeRules && beforeRules['content']) {
          const span = makePseudoSpan(beforeRules, doc, true)
          if (span) {
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

// 列表归一化：把列表项收敛为单一 <p> 段落（编号 + 内容同处一段），
// 避免微信编辑器把 marker 与内容拆成两行。
function normalizeLists(root, doc) {
  root.querySelectorAll('ul, ol').forEach(listEl => {
    const wrapper = doc.createElement('div')
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

      const marker = item.querySelector(':scope > span[data-bullet]')
      if (marker) {
        marker.style.display = 'inline'
        marker.style.marginRight = listEl.tagName === 'OL' ? '6px' : '4px'
        marker.style.lineHeight = 'inherit'
      }

      let block = item.querySelector(':scope > p, :scope > section, :scope > div')
      if (!block) {
        block = doc.createElement('p')
        while (item.firstChild) block.appendChild(item.firstChild)
        item.appendChild(block)
      } else if (block !== marker) {
        block.insertBefore(marker, block.firstChild)
        const rest = []
        Array.from(item.childNodes).forEach(n => { if (n !== block && n !== marker) rest.push(n) })
        rest.forEach(n => block.appendChild(n))
      }
    })

    if (listEl.parentNode) listEl.parentNode.replaceChild(wrapper, listEl)
  })
}

// 把主题 CSS 内联到 section（含 header / body / footer）
export function inlineThemeToSection(doc, themeCssText) {
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
  if (bodyDiv) inlineContainer(bodyDiv)

  ;['header', 'footer'].forEach(tplType => {
    const tplDiv = clone.querySelector(`[data-tpl="${tplType}"]`)
    if (!tplDiv) return
    const themeChild = tplDiv.querySelector('[class^="theme-"]')
    if (themeChild) inlineContainer(tplDiv)
  })

  clone.removeAttribute('class')
  clone.style.setProperty('width', '100%')
  clone.style.setProperty('box-sizing', 'border-box')

  normalizeLists(clone, doc)

  const result = clone.outerHTML
  doc.body.removeChild(clone)
  return result
}

// 微信兼容化处理（对应 Editor.vue 中 buildInlinedHtml 的第 1~8 步）
function wechatifySection(doc, section) {
  // 1. 克隆，删除预览专用元素
  const clone = section.cloneNode(true)
  clone.querySelectorAll('[data-preview-only]').forEach(el => el.remove())

  normalizeLists(clone, doc)

  // 2. 清理内部容器 div（data-tpl 标记的脚手架层）
  clone.querySelectorAll('[data-tpl]').forEach(el => {
    const tplType = el.getAttribute('data-tpl')
    if (tplType === 'header' || tplType === 'footer') {
      const hasContent = el.children.length > 0 || el.textContent.trim() !== ''
      if (!hasContent) { el.remove(); return }
      el.style.removeProperty('outline')
      el.style.removeProperty('outline-offset')
      el.style.removeProperty('position')
      el.style.removeProperty('padding-top')
      if (!el.getAttribute('style') || !el.getAttribute('style').trim()) {
        el.removeAttribute('style')
      }
    }
    el.removeAttribute('class')
    el.removeAttribute('data-tpl')
  })

  // 3. 继承属性下沉（微信会过滤含 font-family 的 div，需下沉到内容元素）
  const INHERIT_PROPS = ['font-family', 'color', 'font-size', 'line-height', 'letter-spacing', 'text-align']
  const CONTENT_TAGS = ['p', 'li', 'div', 'td', 'th', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span']
  clone.querySelectorAll('div, section').forEach(container => {
    const styleStr = container.getAttribute('style') || ''
    if (!styleStr.includes('padding') && !styleStr.includes('font-family')) return
    const inherited = {}
    INHERIT_PROPS.forEach(prop => {
      const val = container.style.getPropertyValue(prop)
      if (val) inherited[prop] = val
    })
    if (!Object.keys(inherited).length) return
    CONTENT_TAGS.forEach(tag => {
      container.querySelectorAll(tag).forEach(el => {
        Object.entries(inherited).forEach(([prop, val]) => {
          if (!el.style.getPropertyValue(prop)) el.style.setProperty(prop, val)
        })
      })
    })
    INHERIT_PROPS.forEach(prop => container.style.removeProperty(prop))
  })

  // 4. div → section（微信支持 section，不支持 div）
  clone.querySelectorAll('div').forEach(div => {
    const sec = doc.createElement('section')
    Array.from(div.attributes).forEach(attr => sec.setAttribute(attr.name, attr.value))
    while (div.firstChild) sec.appendChild(div.firstChild)
    div.parentNode.replaceChild(sec, div)
  })

  // 5. 解包微信不支持的其他块级标签
  const UNWRAP_TAGS = ['header', 'footer', 'nav', 'article', 'aside', 'figure', 'figcaption', 'main', 'details', 'summary']
  UNWRAP_TAGS.forEach(tag => {
    clone.querySelectorAll(tag).forEach(el => {
      const parent = el.parentNode
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    })
  })

  // 6. style 属性规范化（微信兼容性修复）
  clone.querySelectorAll('[style]').forEach(el => {
    let s = el.getAttribute('style')
    if (!s) return

    s = s.replace(/font-family\s*:[^;]*/gi, m => m.replace(/"/g, "'"))

    s = s.replace(/(?<![a-z-])background\s*:\s*([^;]+)/gi, (match, val) => {
      const v = val.trim()
      if (/^(linear-gradient|radial-gradient|conic-gradient|url)/i.test(v)) return match
      return `background-color: ${v}`
    })

    const UNSUPPORTED = ['outline', 'outline-offset', 'box-shadow', 'transition', 'animation',
      'transform', 'clip-path', 'filter', 'z-index', 'position', 'overflow',
      'cursor', 'pointer-events', 'user-select', '-webkit-user-select']
    UNSUPPORTED.forEach(prop => {
      s = s.replace(new RegExp(`(?<![a-z-])${prop}\\s*:[^;]*(;|$)`, 'gi'), '')
    })

    s = s.replace(/;+/g, ';').replace(/^\s*;|;\s*$/g, '').trim()

    if (s) el.setAttribute('style', s)
    else el.removeAttribute('style')
  })

  // 7. 去掉所有残留 class 属性
  clone.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'))

  // 8. 去掉所有 data-* 属性
  clone.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes)
      .filter(a => a.name.startsWith('data-'))
      .forEach(a => el.removeAttribute(a.name))
  })

  return clone.outerHTML
}

/**
 * 把已渲染（含 <section> 容器）的文档做微信兼容化处理
 *
 * 供 Editor.vue 复用：预览 iframe 的 contentDocument 已是完整渲染结果，
 * 只需执行兼容化即可，避免重复 markdown 解析导致的不一致。
 *
 * @param {Document} doc 已包含 <body><section>...</section></body> 的文档
 * @returns {string} 微信兼容 HTML 片段（<section>...</section>）
 */
export function wechatifyDoc(doc) {
  const section = doc.body.querySelector('section')
  if (!section) return doc.body.innerHTML
  return wechatifySection(doc, section)
}

/**
 * 核心渲染：把 markdown + 模板 + 主题 渲染为微信兼容的 HTML 片段
 *
 * @param {Object} options
 * @param {string} options.markdown  正文 markdown 内容
 * @param {string} options.theme     主题名（见 THEME_FILE_MAP），默认 'blue'
 * @param {string} options.header    头部模板内容（Markdown 或 HTML）
 * @param {string} options.footer    底部模板内容（Markdown 或 HTML）
 * @param {string} [options.basePath] 主题 CSS 目录前缀，默认 'themes/'
 * @param {Document} [options.doc]   自定义 document（默认新建临时文档）
 * @returns {Promise<string>} 微信兼容 HTML 片段（<section>...</section>）
 */
export async function renderWechatFragment(options = {}) {
  const {
    markdown = '',
    theme = 'blue',
    header = '',
    footer = '',
    basePath = '',
    doc = null
  } = options

  const themeCssText = await getThemeCss(theme, basePath)
  const bodyHtml = marked.parse(markdown || '')
  const headerHtml = renderTemplate(header, theme)
  const footerHtml = renderTemplate(footer, theme)

  const rawHtml = `<section style="margin:0;padding:0;width:100%;box-sizing:border-box;">` +
    `<div data-tpl="header" class="tpl-header-box">${headerHtml}</div>` +
    `<div data-tpl="body" class="theme-${theme}" style="padding:0 15px;overflow-wrap:break-word;">${bodyHtml}</div>` +
    `<div data-tpl="footer" class="tpl-footer-box">${footerHtml}</div>` +
    `</section>`

  const workDoc = doc || document.implementation.createHTMLDocument('')
  workDoc.body.innerHTML = rawHtml

  const inlined = inlineThemeToSection(workDoc, themeCssText)

  // 把内联后的结果放回文档，继续做微信兼容化
  const outDoc = document.implementation.createHTMLDocument('')
  outDoc.body.innerHTML = inlined
  const section = outDoc.body.querySelector('section')
  if (!section) return inlined

  return wechatifyDoc(outDoc)
}

/**
 * 渲染为完整 HTML 页面（含 <head> 与主题样式，可直接在浏览器打开预览）
 *
 * @param {Object} options 同 renderWechatFragment
 * @param {string} [options.title] 页面标题，默认 '微信文章预览'
 * @returns {Promise<string>} 完整 HTML 文档字符串
 */
export async function renderWechatHtml(options = {}) {
  const { title = '微信文章预览', ...rest } = options
  const fragment = await renderWechatFragment(rest)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  html,body{margin:0;padding:0;overflow-x:hidden;}
  body{padding:15px;word-wrap:break-word;word-break:break-word;box-sizing:border-box;}
  img{max-width:100%;}
</style>
</head>
<body>
${fragment}
</body>
</html>`
}
