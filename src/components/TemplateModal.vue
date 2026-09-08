<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="tpl-overlay" @click.self="$emit('close')">
        <div class="tpl-panel" :class="{ 'tpl-panel-wide': editingId !== null }">

          <!-- Header -->
          <div class="tpl-panel-header">
            <div class="tpl-panel-title">
              <span class="tpl-panel-icon">{{ type === 'header' ? '⬆' : '⬇' }}</span>
              {{ title }}
            </div>
            <div class="tpl-panel-actions">
              <button class="btn btn-primary" @click="handleAdd">+ 新建</button>
              <button class="btn-close" @click="$emit('close')">✕</button>
            </div>
          </div>

          <!-- Body -->
          <div class="tpl-panel-body">
            <Transition name="slide-fade" mode="out-in">

              <!-- 列表 -->
              <div v-if="editingId === null" key="list" class="tpl-list-wrap">
                <div v-if="templates.length === 0" class="empty-state">
                  <div class="empty-icon">📄</div>
                  <p>暂无模版，点击「+ 新建」创建第一个</p>
                </div>
                <div v-else class="tpl-list">
                  <div v-for="tpl in templates" :key="tpl.id" class="tpl-item" :class="{ active: tpl.id === activeId }">
                    <div class="tpl-item-left">
                      <span class="tpl-active-dot" v-if="tpl.id === activeId">●</span>
                      <span class="tpl-item-name" :title="tpl.name">{{ tpl.name }}</span>
                      <span :class="['tpl-item-badge', isHtml(tpl.content) ? 'html' : 'md']">
                        {{ isHtml(tpl.content) ? 'HTML' : 'MD' }}
                      </span>
                    </div>
                    <div class="tpl-item-actions">
                      <button class="btn-action" :class="tpl.id === activeId ? 'btn-action-on' : 'btn-action-use'" @click="handleToggleActive(tpl.id)">
                        {{ tpl.id === activeId ? '已启用' : '启用' }}
                      </button>
                      <button class="btn-action btn-action-edit" @click="handleEdit(tpl)">编辑</button>
                      <button class="btn-action btn-action-del" @click="handleDelete(tpl)">删除</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 编辑器 -->
              <div v-else key="editor" class="tpl-editor-wrap">
                <!-- 顶部导航 -->
                <div class="tpl-editor-nav">
                  <button class="btn-back" @click="handleCancel">← 返回列表</button>
                  <span class="tpl-editor-title">{{ editingId === '__new__' ? '新建模版' : '编辑模版' }}</span>
                  <div class="tpl-editor-nav-right">
                    <button class="btn btn-primary" @click="handleSave">保存模版</button>
                    <button class="btn btn-secondary" @click="handleCancel">取消</button>
                  </div>
                </div>

                <!-- 名称栏 -->
                <div class="tpl-editor-name-bar">
                  <label>模版名称</label>
                  <input type="text" v-model="editName" placeholder="例如：科技风封面、品牌关注卡片..." @keydown.enter="handleSave" />
                </div>

                <!-- class 属性警告条 -->
                <div v-if="hasClassAttr" class="tpl-class-warning">
                  <span class="tpl-class-warning-icon">⚠️</span>
                  <span>检测到 <code>class</code> 属性——微信公众号会过滤外部 class，相关样式将失效。请改用内联 <code>style</code> 属性。</span>
                  <button class="btn-strip-class" @click="handleStripClass">一键去除 class</button>
                </div>

                <!-- 左右分栏 -->
                <div class="tpl-editor-columns">
                  <!-- 左：CodeMirror 编辑器 -->
                  <div class="tpl-editor-left">
                    <div class="tpl-col-header">
                      <span class="tpl-col-label">代码</span>
                      <span class="tpl-col-hint">以 &lt; 开头视为 HTML，否则按 Markdown 解析</span>
                      <button v-if="isHtml(editContent)" class="btn-format" @click="handleFormat">⚡ 格式化</button>
                    </div>
                    <div class="tpl-cm-wrap" ref="cmWrapRef"></div>
                  </div>

                  <!-- 右：实时预览 -->
                  <div class="tpl-editor-right">
                    <div class="tpl-col-header">
                      <span class="tpl-col-label">预览</span>
                      <span class="tpl-col-hint">{{ isHtml(editContent) ? 'HTML · 模拟微信实际效果' : 'Markdown · 应用当前主题' }}</span>
                    </div>
                    <div class="tpl-preview-wrap">
                      <iframe ref="previewIframeRef" class="tpl-preview-iframe" frameborder="0"></iframe>
                    </div>
                  </div>
                </div>
              </div>

            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import { applyHeadingStyle } from '@/config/headingStyle'
// 硬换行保留为 <br>，让每一行 > 引用都成为独立的新行
marked.setOptions({ breaks: true, gfm: true })
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { foldGutter, foldKeymap, bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'

// 自定义深色主题
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#282c34',
    color: '#abb2bf',
    height: '100%',
    fontSize: '12.5px',
  },
  '.cm-content': {
    caretColor: '#61afef',
    fontFamily: "'Consolas', 'Monaco', 'Fira Code', monospace",
    padding: '12px 0',
    color: '#abb2bf',
  },
  '.cm-line': { color: '#abb2bf' },
  '.cm-gutters': {
    backgroundColor: '#21252b',
    color: '#636d83',
    border: 'none',
    borderRight: '1px solid #3e4451',
  },
  '.cm-activeLineGutter': { backgroundColor: '#2c313a' },
  '.cm-activeLine': { backgroundColor: '#2c313a' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#3e4451 !important' },
  '.cm-cursor': { borderLeftColor: '#61afef' },
  '.cm-foldPlaceholder': { backgroundColor: '#3e4451', color: '#abb2bf', border: 'none' },
  '.cm-scroller': { overflow: 'auto' },
}, { dark: true })

const props = defineProps({
  title: { type: String, required: true },
  type: { type: String, required: true },
  templates: { type: Array, default: () => [] },
  activeId: { type: String, default: null },
  currentTheme: { type: String, default: 'blue' },
  getThemeCss: { type: Function, default: null },
  renderTemplate: { type: Function, default: null },
  inlineTheme: { type: Function, default: null }
})

const emit = defineEmits(['close', 'update', 'active-change'])

const editingId = ref(null)
const editName = ref('')
const editContent = ref('')
const cmWrapRef = ref(null)
const previewIframeRef = ref(null)

let cmView = null

// ===== class 属性检测 =====
const hasClassAttr = computed(() => {
  if (!isHtml(editContent.value)) return false
  return /class\s*=/.test(editContent.value)
})

// 去除所有 class 属性
function handleStripClass() {
  const stripped = editContent.value.replace(/\s+class\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/g, '')
  editContent.value = stripped
  nextTick(() => syncToCm(stripped))
}

// ===== CodeMirror 初始化 =====
function initCodeMirror() {
  if (cmView) { cmView.destroy(); cmView = null }
  if (!cmWrapRef.value) return

  const updateListener = EditorView.updateListener.of(update => {
    if (update.docChanged) {
      editContent.value = update.state.doc.toString()
    }
  })

  const state = EditorState.create({
    doc: editContent.value,
    extensions: [
      darkTheme,
      syntaxHighlighting(defaultHighlightStyle),
      html(),
      lineNumbers(),
      foldGutter(),
      history(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      updateListener,
    ]
  })

  cmView = new EditorView({ state, parent: cmWrapRef.value })
}

function destroyCodeMirror() {
  if (cmView) { cmView.destroy(); cmView = null }
}

// 当 editContent 从外部改变时同步到 CM（如格式化）
function syncToCm(content) {
  if (!cmView) return
  const cur = cmView.state.doc.toString()
  if (cur === content) return
  cmView.dispatch({
    changes: { from: 0, to: cur.length, insert: content }
  })
}

// ===== 预览 =====
// ===== 预览 =====
async function updatePreview() {
  const iframe = previewIframeRef.value
  if (!iframe) { setTimeout(updatePreview, 60); return }

  const content = editContent.value

  if (!content.trim()) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open(); doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><p style="color:#ccc;font-size:12px;text-align:center;padding:20px;">暂无内容</p></body></html>`); doc.close()
      iframe.style.height = '80px'
    } catch(e) {}
    return
  }

  if (isHtml(content)) {
    // HTML：剥离 class 属性后渲染，模拟微信粘贴后的实际效果
    const strippedContent = content.replace(/\s+class\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/g, '')
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open()
      doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;font-size:14px;line-height:1.6;color:#333;overflow-x:hidden;word-break:break-word;}img{max-width:100%;}*{box-sizing:border-box;}</style></head><body>${strippedContent}</body></html>`)
      doc.close()
      setTimeout(() => { try { iframe.style.height = (doc.body.scrollHeight + 24) + 'px' } catch(e) {} }, 60)
    } catch(e) {}
  } else {
    // Markdown：用 renderTemplate + 主题 CSS 内联
    if (!props.renderTemplate || !props.getThemeCss) return
    const renderedHtml = props.renderTemplate(content, props.currentTheme)
    const themeCss = await props.getThemeCss(props.currentTheme)

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document
      // 第一次写入，带主题 CSS + class
      doc.open()
      doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:12px;overflow-x:hidden;word-break:break-word;box-sizing:border-box;}img{max-width:100%;}${themeCss}</style></head><body><section style="margin:0;padding:0;width:100%;box-sizing:border-box;"><div data-tpl="body" class="theme-${props.currentTheme}">${marked.parse(content)}</div></section></body></html>`)
      doc.close()

      // 等 DOM 渲染完，再用 inlineTheme 把 class 转成内联 style
      await new Promise(r => setTimeout(r, 40))
      if (props.inlineTheme) {
        const inlined = props.inlineTheme(doc, themeCss)
        console.log('[TemplateModal] inlined length:', inlined?.length)
        doc.open()
        doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:12px;overflow-x:hidden;word-break:break-word;box-sizing:border-box;}img{max-width:100%;}</style></head><body>${inlined}</body></html>`)
        doc.close()

        // 应用标题（h1–h6）字号 / 字重：主题级配置 > 系统默认配置
        applyHeadingStyle(doc, props.currentTheme)
      } else {
        console.warn('[TemplateModal] inlineTheme prop missing')
      }
      setTimeout(() => { try { iframe.style.height = (doc.body.scrollHeight + 24) + 'px' } catch(e) {} }, 80)
    } catch(e) { console.error(e) }
  }
}

watch(editContent, () => nextTick(updatePreview))

// ===== 进入/退出编辑 =====
// 监听 cmWrapRef，一旦挂载就初始化 CodeMirror
watch(cmWrapRef, (el) => {
  if (el) {
    initCodeMirror()
    setTimeout(updatePreview, 100)
  }
})

function handleAdd() {
  editingId.value = '__new__'
  editName.value = ''
  editContent.value = ''
}

function handleEdit(tpl) {
  editingId.value = tpl.id
  editName.value = tpl.name
  editContent.value = tpl.content
}

function handleCancel() {
  destroyCodeMirror()
  editingId.value = null
  editName.value = ''
  editContent.value = ''
}

// ===== 保存 =====
function handleSave() {
  const name = editName.value.trim()
  const content = editContent.value
  if (!name) { alert('请输入模版名称'); return }
  if (!content.trim()) { alert('内容不能为空'); return }

  let newTemplates = [...props.templates]
  let savedId = editingId.value

  if (editingId.value && editingId.value !== '__new__') {
    const idx = newTemplates.findIndex(t => t.id === editingId.value)
    if (idx >= 0) newTemplates[idx] = { ...newTemplates[idx], name, content }
  } else {
    const newId = genId()
    savedId = newId
    newTemplates.push({ id: newId, name, content })
  }

  emit('update', newTemplates)
  if (editingId.value === '__new__') emit('active-change', savedId)
  destroyCodeMirror()
  editingId.value = null
  editName.value = ''
  editContent.value = ''
}

// ===== 格式化 =====
function handleFormat() {
  const content = editContent.value.trim()
  if (!content || !isHtml(content)) return
  const formatted = formatHtml(content)
  editContent.value = formatted
  nextTick(() => syncToCm(formatted))
}

function formatHtml(html) {
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
  let indent = 0
  let result = ''
  const tokens = html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []
  for (let token of tokens) {
    token = token.trim()
    if (!token) continue
    if (token.startsWith('<!--')) {
      result += '  '.repeat(indent) + token + '\n'
    } else if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1)
      result += '  '.repeat(indent) + token + '\n'
    } else if (token.startsWith('<')) {
      const tagName = (token.match(/^<([\w-]+)/) || [])[1] || ''
      const isSelfClose = token.endsWith('/>') || voidTags.has(tagName.toLowerCase())
      result += '  '.repeat(indent) + token + '\n'
      if (!isSelfClose) indent++
    } else {
      result += '  '.repeat(indent) + token + '\n'
    }
  }
  return result.trimEnd()
}

// ===== 列表操作 =====
function isHtml(content) {
  return (content || '').trimStart().startsWith('<')
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function handleToggleActive(id) {
  emit('active-change', id === props.activeId ? null : id)
}

function handleDelete(tpl) {
  if (!confirm(`确定删除「${tpl.name}」？`)) return
  const newTemplates = props.templates.filter(t => t.id !== tpl.id)
  emit('update', newTemplates)
  if (props.activeId === tpl.id) emit('active-change', null)
}

onBeforeUnmount(() => destroyCodeMirror())
</script>

<style scoped>
.tpl-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(3px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.tpl-panel {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 620px;
  height: 86vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: max-width 0.25s ease;
}
.tpl-panel-wide { max-width: 980px; }

.tpl-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.tpl-panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #1a1a1a; }
.tpl-panel-icon { width: 28px; height: 28px; background: #f0fdf6; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.tpl-panel-actions { display: flex; align-items: center; gap: 8px; }
.btn-close { width: 28px; height: 28px; border: none; background: #f5f5f5; border-radius: 7px; cursor: pointer; font-size: 13px; color: #888; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
.btn-close:hover { background: #fee; color: #e53e3e; }

.tpl-panel-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }

/* 列表 */
.tpl-list-wrap { flex: 1; overflow-y: auto; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 10px; color: #aaa; }
.empty-icon { font-size: 32px; }
.empty-state p { font-size: 13px; margin: 0; }
.tpl-list { display: flex; flex-direction: column; }
.tpl-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #f5f5f5; transition: background 0.12s; }
.tpl-item:last-child { border-bottom: none; }
.tpl-item:hover { background: #fafafa; }
.tpl-item.active { background: #f0fdf6; }
.tpl-item-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.tpl-active-dot { font-size: 8px; color: #07c160; flex-shrink: 0; }
.tpl-item-name { font-size: 14px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tpl-item.active .tpl-item-name { color: #07c160; font-weight: 600; }
.tpl-item-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; font-weight: 600; }
.tpl-item-badge.md { background: #eff6ff; color: #3b82f6; }
.tpl-item-badge.html { background: #fff7ed; color: #f97316; }
.tpl-item-actions { display: flex; gap: 5px; flex-shrink: 0; }
.btn-action { padding: 4px 10px; font-size: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: 500; transition: opacity 0.15s; }
.btn-action:hover { opacity: 0.85; }
.btn-action-use { background: #07c160; color: #fff; }
.btn-action-on { background: #e8e8e8; color: #666; }
.btn-action-edit { background: #eff6ff; color: #3b82f6; }
.btn-action-del { background: #fff0f0; color: #e53e3e; }

/* 编辑器 */
.tpl-editor-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.tpl-editor-nav { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f0f0f0; background: #fafafa; flex-shrink: 0; }
.tpl-editor-nav-right { display: flex; gap: 8px; margin-left: auto; }
.btn-back { background: none; border: none; font-size: 13px; color: #07c160; cursor: pointer; padding: 0; font-weight: 500; }
.btn-back:hover { text-decoration: underline; }
.tpl-editor-title { font-size: 13px; color: #888; }

.tpl-editor-name-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.tpl-editor-name-bar label { font-size: 12px; font-weight: 600; color: #555; white-space: nowrap; }
.tpl-editor-name-bar input { flex: 1; border: 1.5px solid #e8e8e8; border-radius: 7px; padding: 6px 12px; font-size: 13px; color: #333; outline: none; transition: border-color 0.15s; }
.tpl-editor-name-bar input:focus { border-color: #07c160; }

/* class 属性警告条 */
.tpl-class-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  font-size: 12px;
  color: #92400e;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.tpl-class-warning-icon { font-size: 13px; flex-shrink: 0; }
.tpl-class-warning span { flex: 1; min-width: 0; line-height: 1.5; }
.tpl-class-warning code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Consolas', monospace;
}
.btn-strip-class {
  flex-shrink: 0;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-strip-class:hover { background: #d97706; }

/* 分栏 */
.tpl-editor-columns { flex: 1; display: flex; overflow: hidden; min-height: 0; }
.tpl-editor-left { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #f0f0f0; min-width: 0; }
.tpl-editor-right { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.tpl-col-header { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #f8f8f8; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.tpl-col-label { font-size: 11px; font-weight: 600; color: #888; letter-spacing: 0.5px; }
.tpl-col-hint { font-size: 10px; color: #bbb; }
.btn-format { margin-left: auto; background: #282c34; border: none; color: #98c379; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; cursor: pointer; transition: background 0.15s; }
.btn-format:hover { background: #3e4451; }

/* CodeMirror 容器 */
.tpl-cm-wrap {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  background: #282c34;
}
.tpl-cm-wrap :deep(.cm-editor) {
  height: 100%;
  background: #282c34;
}
.tpl-cm-wrap :deep(.cm-scroller) { overflow: auto; }
.tpl-cm-wrap :deep(.cm-content) { color: #abb2bf; }
.tpl-cm-wrap :deep(.cm-gutters) { background: #282c34; border-right: 1px solid #3e4451; color: #636d83; }

/* 预览 */
.tpl-preview-wrap { flex: 1; overflow-y: auto; background: #f5f5f5; padding: 12px; }
.tpl-preview-iframe { width: 100%; min-height: 100px; border: none; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); display: block; }

/* 按钮 */
.btn { display: inline-flex; align-items: center; height: 30px; padding: 0 14px; border: none; border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.15s; }
.btn-primary { background: #07c160; color: #fff; }
.btn-primary:hover { background: #06ad56; }
.btn-secondary { background: #f0f0f0; color: #555; border: 1px solid #e0e0e0; }
.btn-secondary:hover { background: #e8e8e8; }

/* 动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-active .tpl-panel, .modal-fade-leave-active .tpl-panel { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .tpl-panel, .modal-fade-leave-to .tpl-panel { transform: translateY(12px); opacity: 0; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(10px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-10px); }
</style>
