<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="hs-overlay" @click.self="close">
        <div class="hs-panel">
          <div class="hs-header">
            <span class="hs-title">
              {{ scope === 'theme' ? `⚙ 「${themeName}」标题设置` : '⚙ 全局标题设置（系统默认）' }}
            </span>
            <button class="hs-close" @click="close">✕</button>
          </div>

          <div class="hs-body">
            <div class="hs-tip">
              留空 = 继承上级（主题设置 → 全局设置 → 系统默认）。<br>
              输入框里的灰色文字是当前实际生效的值。
            </div>

            <div class="hs-row hs-row-head">
              <span>层级</span><span>字号</span><span>颜色</span><span>字重</span>
            </div>

            <div v-for="tag in tags" :key="tag" class="hs-row">
              <span class="hs-tag">{{ tag.toUpperCase() }}</span>
              <input
                type="number" min="10" max="48" class="hs-input"
                :placeholder="ph(tag, 'fontSize') || '继承'"
                v-model="form[tag].fontSize"
              >
              <span class="hs-color">
                <input type="color" class="hs-color-pick" v-model="colorPick[tag]" @change="onColor(tag)">
                <input
                  type="text" class="hs-input hs-color-text"
                  :placeholder="ph(tag, 'color') || '继承'"
                  v-model="form[tag].color"
                >
              </span>
              <select class="hs-input" v-model="form[tag].fontWeight">
                <option value="">继承</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
              </select>
            </div>
          </div>

          <div class="hs-footer">
            <button class="hs-btn" @click="reset">恢复默认</button>
            <span class="hs-spacer"></span>
            <button class="hs-btn" @click="close">取消</button>
            <button class="hs-btn hs-btn-primary" @click="save">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  HEADING_TAGS,
  getHeadingStyle,
  getGlobalUserStyle,
  setGlobalUserStyle,
  getThemeUserStyle,
  setThemeUserStyle,
  clearThemeUserStyle
} from '@/config/headingStyle'

const props = defineProps({
  open: { type: Boolean, default: false },
  scope: { type: String, default: 'global' }, // 'global' | 'theme'
  theme: { type: String, default: '' },
  themeName: { type: String, default: '' }
})
const emit = defineEmits(['update:open', 'saved'])

const tags = HEADING_TAGS
const form = ref({})
const colorPick = ref({})

function emptyForm() {
  const o = {}
  tags.forEach(t => { o[t] = { fontSize: '', fontWeight: '', color: '' } })
  return o
}

function load() {
  const src = props.scope === 'theme' ? getThemeUserStyle(props.theme) : getGlobalUserStyle()
  const f = emptyForm()
  const cp = {}
  tags.forEach(t => {
    const v = src[t] || {}
    f[t] = {
      fontSize: (v.fontSize || '').replace('px', ''),
      fontWeight: v.fontWeight || '',
      color: v.color || ''
    }
    cp[t] = v.color || '#000000'
  })
  form.value = f
  colorPick.value = cp
}

watch(() => props.open, v => { if (v) load() }, { immediate: true })

function ph(tag, field) {
  const themeKey = props.scope === 'theme' ? props.theme : ''
  return getHeadingStyle(themeKey, tag)[field] || ''
}

function onColor(tag) { form.value[tag].color = colorPick.value[tag] }

function close() { emit('update:open', false) }

function save() {
  const out = {}
  tags.forEach(t => {
    const v = form.value[t]
    const o = {}
    if (v.fontSize) o.fontSize = /px$/.test(String(v.fontSize)) ? String(v.fontSize) : `${v.fontSize}px`
    if (v.fontWeight) o.fontWeight = v.fontWeight
    if (v.color) o.color = v.color
    if (Object.keys(o).length) out[t] = o
  })
  if (props.scope === 'theme') setThemeUserStyle(props.theme, out)
  else setGlobalUserStyle(out)
  emit('saved')
  close()
}

function reset() {
  if (props.scope === 'theme') clearThemeUserStyle(props.theme)
  else setGlobalUserStyle({})
  emit('saved')
  close()
}
</script>

<style scoped>
.hs-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 3000;
}
.hs-panel {
  width: 520px; max-width: 92vw; max-height: 86vh; overflow: auto;
  background: #fff; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.2);
  display: flex; flex-direction: column;
}
.hs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid #eee;
}
.hs-title { font-size: 15px; font-weight: 700; color: #222; }
.hs-close { border: none; background: transparent; font-size: 16px; cursor: pointer; color: #888; }
.hs-body { padding: 14px 16px; }
.hs-tip {
  font-size: 12px; color: #888; line-height: 1.7; margin-bottom: 12px;
  background: #f7f8fa; padding: 8px 10px; border-radius: 6px;
}
.hs-row {
  display: grid; grid-template-columns: 46px 1fr 150px 84px;
  gap: 8px; align-items: center; margin-bottom: 8px;
}
.hs-row-head { font-size: 12px; color: #999; margin-bottom: 4px; }
.hs-tag { font-size: 13px; font-weight: 700; color: #444; }
.hs-input {
  width: 100%; padding: 6px 8px; border: 1px solid #ddd;
  border-radius: 6px; font-size: 13px; box-sizing: border-box;
}
.hs-color { display: flex; align-items: center; gap: 6px; }
.hs-color-pick { width: 30px; height: 30px; border: 1px solid #ddd; border-radius: 6px; padding: 0; }
.hs-color-text { flex: 1; }
.hs-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-top: 1px solid #eee;
}
.hs-spacer { flex: 1; }
.hs-btn {
  padding: 7px 14px; border: 1px solid #ddd; background: #fff;
  border-radius: 6px; font-size: 13px; cursor: pointer; color: #444;
}
.hs-btn:hover { background: #f5f5f5; }
.hs-btn-primary { background: #07c160; border-color: #07c160; color: #fff; }
.hs-btn-primary:hover { background: #06ad56; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .18s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
