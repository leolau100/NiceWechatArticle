<template>
  <!-- 主题选择弹窗：遮罩完全透明，不影响背景视觉 -->
  <transition name="modal-fade">
    <div v-if="visible" class="theme-overlay" @click.self="$emit('close')">
      <div class="theme-dialog">
      <!-- 抽屉顶部 -->
      <div class="drawer-header">
        <div class="header-left">
          <span class="header-icon">🎨</span>
          <span class="header-title">主题风格</span>
          <span class="header-count">{{ totalCount }} 款</span>
        </div>
        <button class="close-btn" @click="$emit('close')" title="关闭">✕</button>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          placeholder="搜索主题名称..."
          class="search-input"
        />
        <span v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</span>
      </div>

      <!-- 分类 Tab（搜索时隐藏） -->
      <div v-if="!searchQuery" class="tab-bar">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="tab-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
          :title="cat.name"
        >
          <span>{{ cat.icon }}</span>
          <span class="tab-name">{{ cat.name }}</span>
        </button>
      </div>
      <div v-else class="search-label">搜索结果 · {{ filteredThemes.length }} 款</div>

      <!-- 主题列表 -->
      <div class="drawer-body">
        <div class="theme-grid">
          <div
            v-for="theme in displayThemes"
            :key="theme.id"
            class="theme-card"
            :class="{ active: theme.id === currentTheme }"
            @click="handleSelect(theme)"
            :title="theme.name + ' · ' + theme.desc"
          >
            <!-- 预览区 -->
            <div class="preview-area" :style="{ background: theme.previewBg }">
              <div class="sim-page">
                <div class="sim-h1" :style="{ background: theme.accent, color: theme.accentText || '#fff' }">
                  {{ theme.emoji }} {{ theme.name }}
                </div>
                <div class="sim-h2" :style="{ borderColor: theme.accent, color: theme.accent, background: alpha(theme.accent, .08) }">副标题</div>
                <div class="sim-lines">
                  <div class="sim-line w90" :style="{ background: theme.lineColor || alpha(theme.accent, .2) }"></div>
                  <div class="sim-line w70" :style="{ background: theme.lineColor || alpha(theme.accent, .2) }"></div>
                </div>
                <div class="sim-quote" :style="{ borderColor: theme.accent, background: alpha(theme.accent, .07), color: theme.quoteText || theme.accent }">引用块示例</div>
              </div>
              <div v-if="theme.id === currentTheme" class="active-badge" :style="{ background: theme.accent }">✓</div>
            </div>
            <!-- 卡片信息 -->
            <div class="card-info" :style="{ background: theme.cardBg || '#fff' }">
              <div class="card-name" :style="theme.id === currentTheme ? { color: theme.accent } : {}">{{ theme.name }}</div>
              <div class="card-desc">{{ theme.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前主题状态栏 -->
      <div class="drawer-footer">
        <span class="footer-current">
          当前：<strong>{{ currentThemeObj?.name || '默认' }}</strong>
        </span>
        <span class="footer-hint">点击即时切换</span>
      </div>
      </div><!-- /theme-dialog -->
    </div><!-- /theme-overlay -->
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  currentTheme: { type: String, default: 'blue' }
})
const emit = defineEmits(['close', 'select'])

const activeCategory = ref('natural')
const searchQuery = ref('')

// ============================================================
// 全部主题定义（共 6 分类 × ~10 款 = 60+）
// ============================================================
const allThemes = {
  natural: [
    { id:'blue',      name:'蓝调星河',   desc:'清雅蓝紫，科技感十足',   emoji:'💙', accent:'#4f46e5', previewBg:'linear-gradient(135deg,#f0f4ff,#e0e7ff)', quoteText:'#4338ca', lineColor:'rgba(79,70,229,.18)' },
    { id:'ocean',     name:'深海蓝调',   desc:'辽阔深邃，宁静沉稳',     emoji:'🌊', accent:'#0077b6', previewBg:'linear-gradient(135deg,#f0f8ff,#d0eaff)', quoteText:'#023e8a', lineColor:'rgba(0,119,182,.18)' },
    { id:'sky',       name:'晴空万里',   desc:'轻盈通透，天高气爽',     emoji:'☀️', accent:'#0284c7', previewBg:'linear-gradient(135deg,#f0f9ff,#dbeefe)', quoteText:'#034a6e', lineColor:'rgba(2,132,199,.18)' },
    { id:'breeze',    name:'海风微醺',   desc:'清爽宜人，碧海蓝天',     emoji:'🌬️', accent:'#2980b9', previewBg:'linear-gradient(135deg,#f8fcff,#deeffe)', quoteText:'#0d3a58', lineColor:'rgba(41,128,185,.18)' },
    { id:'teal-fresh',name:'碧玉清流',   desc:'清澈明亮，活力充沛',     emoji:'🩵', accent:'#0d7377', previewBg:'linear-gradient(135deg,#f0fafa,#d0f0f0)', quoteText:'#0d4040', lineColor:'rgba(13,115,119,.18)' },
    { id:'green',     name:'翠竹清风',   desc:'葱郁清新，生机无限',     emoji:'🌿', accent:'#16a34a', previewBg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', quoteText:'#15803d', lineColor:'rgba(22,163,74,.18)' },
    { id:'forest',    name:'深林晨雾',   desc:'苍翠茂密，大自然气息',   emoji:'🌲', accent:'#2d7a4a', previewBg:'linear-gradient(135deg,#f0f7f2,#daf0e4)', quoteText:'#1a4a2a', lineColor:'rgba(45,122,74,.18)' },
    { id:'mint',      name:'薄荷微风',   desc:'清凉舒爽，沁人心脾',     emoji:'🌱', accent:'#00c9a7', previewBg:'linear-gradient(135deg,#f0fdf6,#c8f8ef)', quoteText:'#004a40', lineColor:'rgba(0,201,167,.18)' },
    { id:'spring',    name:'春日百花',   desc:'百花盛开，春意盎然',     emoji:'🌸', accent:'#56ab2f', previewBg:'linear-gradient(135deg,#fffef8,#ecf8dc)', quoteText:'#1d5a0a', lineColor:'rgba(86,171,47,.18)' },
    { id:'aurora',    name:'极光幻彩',   desc:'绚丽多姿，梦幻北极光',   emoji:'🌌', accent:'#00c896', previewBg:'linear-gradient(135deg,#f0fff8,#d0fff0)', quoteText:'#0a4a30', lineColor:'rgba(0,200,150,.18)' },
  ],
  elegant: [
    { id:'rose-gold',     name:'玫瑰金华', desc:'浪漫精致，气质出众',   emoji:'🌹', accent:'#c8748c', previewBg:'linear-gradient(135deg,#fffaf9,#ffe8ee)', quoteText:'#6b2040', lineColor:'rgba(200,116,140,.18)' },
    { id:'lavender',      name:'薰衣草田', desc:'淡雅芬芳，治愈系',     emoji:'💜', accent:'#7c5cbf', previewBg:'linear-gradient(135deg,#f8f4ff,#ede0ff)', quoteText:'#4a3272', lineColor:'rgba(124,92,191,.18)' },
    { id:'sakura',        name:'樱花飞舞', desc:'粉嫩梦幻，温柔浪漫',   emoji:'🌸', accent:'#c2185b', previewBg:'linear-gradient(135deg,#fff5f8,#ffe0ec)', quoteText:'#7a1040', lineColor:'rgba(194,24,91,.15)' },
    { id:'candy',         name:'糖果梦境', desc:'甜蜜多彩，俏皮可爱',   emoji:'🍭', accent:'#a78bfa', previewBg:'linear-gradient(135deg,#fef9ff,#f0e8ff)', quoteText:'#6b21a8', lineColor:'rgba(167,139,250,.18)' },
    { id:'blush',         name:'腮红少女', desc:'少女心爆棚，甜蜜粉嫩', emoji:'🎀', accent:'#f48fb1', previewBg:'linear-gradient(135deg,#fff7fb,#ffe0ee)', quoteText:'#8a1040', lineColor:'rgba(244,143,177,.18)' },
    { id:'cute-yellow',   name:'小猫咪咪', desc:'俏皮可爱，萌趣十足',   emoji:'🐱', accent:'#d97706', previewBg:'linear-gradient(135deg,#fffbeb,#fef3c7)', quoteText:'#b45309', lineColor:'rgba(217,119,6,.18)' },
    { id:'peach',         name:'蜜桃奶昔', desc:'香甜水润，夏日少女',   emoji:'🍑', accent:'#ff8a65', previewBg:'linear-gradient(135deg,#fff8f5,#ffe0d0)', quoteText:'#7a3520', lineColor:'rgba(255,138,101,.18)' },
    { id:'elegant-purple',name:'幽兰雅韵', desc:'高贵典雅，气质不凡',   emoji:'🔮', accent:'#8b5cf6', previewBg:'linear-gradient(135deg,#faf5ff,#ede9fe)', quoteText:'#7c3aed', lineColor:'rgba(139,92,246,.18)' },
    { id:'grape',         name:'紫醉金迷', desc:'丰盈饱满，深邃迷人',   emoji:'🍇', accent:'#9b59b6', previewBg:'linear-gradient(135deg,#f8f4ff,#ead8ff)', quoteText:'#4a0e6e', lineColor:'rgba(155,89,182,.18)' },
    { id:'dusk',          name:'暮色流光', desc:'浪漫暮色，梦幻渐变',   emoji:'🌇', accent:'#e8a0c8', previewBg:'linear-gradient(135deg,#1a1028,#28143a)', quoteText:'#b898d0', lineColor:'rgba(232,160,200,.2)', cardBg:'#231535' },
  ],
  tech: [
    { id:'dark-pro',    name:'深空黑钻',  desc:'沉稳低调，高端专业',   emoji:'🌌', accent:'#89b4fa', accentText:'#1e1e2e', previewBg:'linear-gradient(135deg,#1e1e2e,#2a2a3e)', quoteText:'#bac2de', lineColor:'rgba(137,180,250,.25)', cardBg:'#252535' },
    { id:'midnight',    name:'午夜星辰',  desc:'星光闪烁，深邃神秘',   emoji:'🌠', accent:'#a78bfa', accentText:'#0d0d1a', previewBg:'linear-gradient(135deg,#0d0d1a,#1a1a2e)', quoteText:'#a8a8c0', lineColor:'rgba(167,139,250,.25)', cardBg:'#1a1a2e' },
    { id:'obsidian',    name:'黑曜石光',  desc:'沉静如石，光芒内敛',   emoji:'🪨', accent:'#6c63ff', accentText:'#13131a', previewBg:'linear-gradient(135deg,#13131a,#1c1c28)', quoteText:'#9898c8', lineColor:'rgba(108,99,255,.25)', cardBg:'#1c1c28' },
    { id:'tech-dark',   name:'终端绿光',  desc:'黑客风格，代码美学',   emoji:'⌨️', accent:'#00ff41', accentText:'#0a0f0a', previewBg:'linear-gradient(135deg,#0a0f0a,#0f150f)', quoteText:'#7fffb2', lineColor:'rgba(0,255,65,.25)', cardBg:'#0f150f' },
    { id:'matrix',      name:'数字雨幕',  desc:'矩阵降临，数字风暴',   emoji:'💊', accent:'#00cc44', accentText:'#000d00', previewBg:'linear-gradient(135deg,#000d00,#001400)', quoteText:'#00aa33', lineColor:'rgba(0,204,68,.22)', cardBg:'#001400' },
    { id:'cyber',       name:'赛博霓虹',  desc:'未来都市，电光幻彩',   emoji:'⚡', accent:'#00f0ff', accentText:'#0a0014', previewBg:'linear-gradient(135deg,#0a0014,#140028)', quoteText:'#c8b8f0', lineColor:'rgba(0,240,255,.22)', cardBg:'#140028' },
    { id:'vapor',       name:'蒸汽波动',  desc:'复古未来，赛博美学',   emoji:'🎮', accent:'#b967ff', accentText:'#0d0520', previewBg:'linear-gradient(135deg,#0d0520,#180a30)', quoteText:'#dab8f0', lineColor:'rgba(185,103,255,.22)', cardBg:'#180a30' },
    { id:'tech-purple', name:'量子紫域',  desc:'简约现代，极客质感',   emoji:'💻', accent:'#7c3aed', previewBg:'linear-gradient(135deg,#faf5ff,#f3e8ff)', quoteText:'#6d28d9', lineColor:'rgba(124,58,237,.18)' },
    { id:'neon',        name:'霓虹闪耀',  desc:'炫酷霓虹，夜店灵感',   emoji:'✨', accent:'#ff0055', previewBg:'linear-gradient(135deg,#fff8fb,#fff0f8)', quoteText:'#d4006e', lineColor:'rgba(255,0,85,.15)' },
    { id:'indigo',      name:'靛青深海',  desc:'沉静如渊，智慧无边',   emoji:'🫐', accent:'#4f46e5', previewBg:'linear-gradient(135deg,#f5f7ff,#e8ecff)', quoteText:'#3730a3', lineColor:'rgba(79,70,229,.18)' },
  ],
  business: [
    { id:'minimal-blue',  name:'极简海岸',  desc:'干净利落，专注内容',     emoji:'🌀', accent:'#1a6dfc', previewBg:'#ffffff', quoteText:'#1a6dfc', lineColor:'rgba(26,109,252,.15)' },
    { id:'bw-minimal',    name:'黑白极简',  desc:'极简主义，永恒经典',     emoji:'◼️', accent:'#111111', previewBg:'#fafafa', quoteText:'#333', lineColor:'rgba(0,0,0,.12)' },
    { id:'business',      name:'商界精英',  desc:'严谨稳重，气度不凡',     emoji:'💼', accent:'#1e3a5f', previewBg:'#ffffff', quoteText:'#374151', lineColor:'rgba(30,58,95,.15)' },
    { id:'nordic',        name:'北欧风情',  desc:'冷峻简约，斯堪风格',     emoji:'❄️', accent:'#2c6e9e', previewBg:'linear-gradient(135deg,#f7f5f2,#ede8e0)', quoteText:'#3c3c3c', lineColor:'rgba(44,110,158,.15)' },
    { id:'github-light',  name:'代码仓库',  desc:'开发者必备，清晰规范',   emoji:'🐙', accent:'#0969da', previewBg:'#ffffff', quoteText:'#636c76', lineColor:'rgba(1,4,9,.15)' },
    { id:'geek-tech',     name:'极客 Docs', desc:'文档风格，结构清晰',     emoji:'📘', accent:'#0969da', previewBg:'#ffffff', quoteText:'#0969da', lineColor:'rgba(9,105,218,.15)' },
    { id:'magazine',      name:'封面大字',  desc:'杂志感强，视觉冲击',     emoji:'📰', accent:'#e63946', previewBg:'#ffffff', quoteText:'#333', lineColor:'rgba(0,0,0,.12)' },
    { id:'newsprint',     name:'铅字时代',  desc:'报纸印刷，厚重质感',     emoji:'🗞️', accent:'#333', accentText:'#f9f7f2', previewBg:'linear-gradient(135deg,#f9f7f2,#ece8e0)', quoteText:'#333', lineColor:'rgba(0,0,0,.18)' },
    { id:'slate',         name:'岩石灰调',  desc:'沉稳中性，专业感强',     emoji:'🪨', accent:'#636e72', previewBg:'linear-gradient(135deg,#f8f9fa,#ecf0f1)', quoteText:'#495057', lineColor:'rgba(99,110,114,.15)' },
    { id:'charcoal',      name:'暗夜简约',  desc:'深色简约，专注模式',     emoji:'🖤', accent:'#636366', accentText:'#1c1c1e', previewBg:'linear-gradient(135deg,#1c1c1e,#2c2c2e)', quoteText:'#aeaeb2', lineColor:'rgba(99,99,102,.3)', cardBg:'#2c2c2e' },
  ],
  creative: [
    { id:'warm-orange',   name:'暖橙活力',  desc:'热情洋溢，元气满满',     emoji:'🔥', accent:'#f97316', previewBg:'linear-gradient(135deg,#fff7ed,#ffedd5)', quoteText:'#ea580c', lineColor:'rgba(249,115,22,.18)' },
    { id:'sunset',        name:'落日熔金',  desc:'绚烂余晖，诗意黄昏',     emoji:'🌅', accent:'#f7931e', previewBg:'linear-gradient(135deg,#fff8f3,#ffe8d6)', quoteText:'#8c3a10', lineColor:'rgba(247,147,30,.18)' },
    { id:'autumn',        name:'枫叶如火',  desc:'金秋时节，层林尽染',     emoji:'🍁', accent:'#d4720a', previewBg:'linear-gradient(135deg,#fdf6ee,#f8ead8)', quoteText:'#5a2a08', lineColor:'rgba(212,114,10,.18)' },
    { id:'crimson',       name:'绯红学府',  desc:'深沉热烈，学院气质',     emoji:'🎓', accent:'#c0392b', accentText:'#fff', previewBg:'linear-gradient(135deg,#fff8f6,#ffe8e4)', quoteText:'#5a1010', lineColor:'rgba(192,57,43,.18)' },
    { id:'coral',         name:'珊瑚礁色',  desc:'活力跳跃，海岸风情',     emoji:'🪸', accent:'#ff6b6b', previewBg:'linear-gradient(135deg,#fff9f7,#ffe8e4)', quoteText:'#8a2515', lineColor:'rgba(255,107,107,.18)' },
    { id:'vibrant',       name:'彩虹渐变',  desc:'大胆配色，视觉盛宴',     emoji:'🌈', accent:'#667eea', previewBg:'#ffffff', quoteText:'#4a3a7a', lineColor:'rgba(102,126,234,.15)' },
    { id:'pop-art',       name:'波普艺术',  desc:'撞色大胆，艺术感强',     emoji:'🎭', accent:'#000000', previewBg:'#ffffff', quoteText:'#000', lineColor:'rgba(0,0,0,.15)' },
    { id:'retro',         name:'打字机情',  desc:'怀旧文艺，岁月流金',     emoji:'🎞️', accent:'#a08060', previewBg:'linear-gradient(135deg,#f4f0e8,#ece4d4)', quoteText:'#4a3828', lineColor:'rgba(160,128,96,.22)' },
    { id:'mono-red',      name:'朱砂极简',  desc:'简洁有力，一点朱红',     emoji:'🔴', accent:'#e63946', previewBg:'#fff', quoteText:'#333', lineColor:'rgba(230,57,70,.15)' },
    { id:'lemon',         name:'柠檬气泡',  desc:'清新酸甜，夏日气息',     emoji:'🍋', accent:'#c8c000', previewBg:'linear-gradient(135deg,#fffef0,#fffff0)', quoteText:'#4a4a00', lineColor:'rgba(200,192,0,.22)' },
  ],
  special: [
    { id:'wechat-classic',name:'绿野仙踪',  desc:'微信绿调，和谐统一',     emoji:'💚', accent:'#07c160', previewBg:'#ffffff', quoteText:'#1a4a2a', lineColor:'rgba(7,193,96,.15)' },
    { id:'red-festive',   name:'中华喜庆',  desc:'红色喜庆，节日盛典',     emoji:'🎉', accent:'#e53935', previewBg:'linear-gradient(135deg,#fff9f9,#ffe8e8)', quoteText:'#7a1a1a', lineColor:'rgba(229,57,53,.15)' },
    { id:'gold-luxury',   name:'黄金盛世',  desc:'金碧辉煌，尊贵奢华',     emoji:'👑', accent:'#f0c030', accentText:'#0f0c08', previewBg:'linear-gradient(135deg,#1a1408,#221a08)', quoteText:'#a88050', lineColor:'rgba(200,150,10,.25)', cardBg:'#1a1408' },
    { id:'ink-wash',      name:'水墨丹青',  desc:'笔墨淋漓，意境深远',     emoji:'🖌️', accent:'#c8860a', previewBg:'linear-gradient(135deg,#faf8f3,#f5f0e8)', quoteText:'#8b4513', lineColor:'rgba(139,69,19,.15)' },
    { id:'mist',          name:'烟雨江南',  desc:'烟雨朦胧，江南意境',     emoji:'🌧️', accent:'#6a9aaa', previewBg:'linear-gradient(135deg,#f7f9fa,#e8f2f5)', quoteText:'#3a6070', lineColor:'rgba(106,154,170,.18)' },
    { id:'wabi',          name:'侘寂物语',  desc:'残缺之美，日式禅意',     emoji:'🍵', accent:'#a09070', previewBg:'linear-gradient(135deg,#f2ede6,#e8e0d4)', quoteText:'#4a3a28', lineColor:'rgba(160,144,112,.22)' },
    { id:'paper',         name:'书卷余香',  desc:'纸质温润，书香萦绕',     emoji:'📄', accent:'#c8a87a', accentText:'#1a1208', previewBg:'linear-gradient(135deg,#f5f0e8,#ede8d8)', quoteText:'#4a3820', lineColor:'rgba(200,168,122,.22)' },
    { id:'ivory',         name:'象牙书页',  desc:'温润如玉，古雅沉静',     emoji:'📜', accent:'#c0b080', accentText:'#1a1a10', previewBg:'linear-gradient(135deg,#fffff8,#f5f0e0)', quoteText:'#4a4030', lineColor:'rgba(192,176,128,.22)' },
    { id:'sand',          name:'沙漠玫瑰',  desc:'暖沙质感，神秘浪漫',     emoji:'🌵', accent:'#c4956a', previewBg:'linear-gradient(135deg,#fdf8f2,#f0e8d8)', quoteText:'#5a3a1a', lineColor:'rgba(196,149,106,.22)' },
    { id:'earth',         name:'大地棕调',  desc:'醇厚大地，根植自然',     emoji:'🌍', accent:'#a0713a', previewBg:'linear-gradient(135deg,#f7f2ec,#ede4d4)', quoteText:'#4a3018', lineColor:'rgba(160,113,58,.18)' },
    { id:'copper',        name:'铜锈工坊',  desc:'金属质感，工业美学',     emoji:'⚙️', accent:'#d4a840', accentText:'#1a1208', previewBg:'linear-gradient(135deg,#1a1208,#221a08)', quoteText:'#a88840', lineColor:'rgba(212,168,64,.22)', cardBg:'#221a08' },
    { id:'orange',        name:'橘暖人间',  desc:'橙色温暖，甜蜜舒适',     emoji:'🍊', accent:'#ea580c', previewBg:'linear-gradient(135deg,#fff7ed,#ffedd5)', quoteText:'#c2410c', lineColor:'rgba(234,88,12,.18)' },
    { id:'classic-yellow',name:'经典金黄',  desc:'明亮活泼，视觉醒目',     emoji:'⭐', accent:'#f6c629', accentText:'#111', previewBg:'linear-gradient(135deg,#fffef0,#fffde7)', quoteText:'#92640a', lineColor:'rgba(246,198,41,.3)' },
    { id:'nordic-dark',   name:'北欧暗夜',  desc:'克制冷峻，北境风格',     emoji:'🌑', accent:'#88c0d0', accentText:'#2e3440', previewBg:'linear-gradient(135deg,#2e3440,#3b4252)', quoteText:'#b0bec5', lineColor:'rgba(136,192,208,.25)', cardBg:'#3b4252' },
    { id:'sky',           name:'晴空万里',  desc:'轻盈通透，天高气爽',     emoji:'☀️', accent:'#0284c7', previewBg:'linear-gradient(135deg,#f0f9ff,#dbeefe)', quoteText:'#034a6e', lineColor:'rgba(2,132,199,.18)' },
  ],
  plain: [
    { id:'plain',         name:'朴素现代',   desc:'白底无背景，现代无衬线', emoji:'📝', accent:'#0969da', previewBg:'#ffffff', quoteText:'#57606a', lineColor:'rgba(36,41,47,.15)' },
    { id:'plain-doc',     name:'朴素文档',   desc:'白底长文，宽松行高',     emoji:'📄', accent:'#475569', previewBg:'#ffffff', quoteText:'#64748b', lineColor:'rgba(71,85,105,.15)' },
    { id:'plain-serif',   name:'朴素衬线',   desc:'白底宋体，沉静阅读',     emoji:'📖', accent:'#7c2d12', previewBg:'#ffffff', quoteText:'#57534e', lineColor:'rgba(120,113,108,.15)' },
    { id:'plain-news',    name:'朴素报纸',   desc:'白底报纸风，标题居中',   emoji:'🗞️', accent:'#000000', previewBg:'#ffffff', quoteText:'#444444', lineColor:'rgba(0,0,0,.18)' },
    { id:'plain-minimal', name:'极简灰阶',   desc:'完全无背景，仅留边框',   emoji:'⚪️', accent:'#666666', previewBg:'#ffffff', quoteText:'#555555', lineColor:'rgba(0,0,0,.12)' },
    { id:'line',          name:'蓝竖线',     desc:'白底无背景，标题左竖线', emoji:'🔵', accent:'#2563eb', previewBg:'#ffffff', quoteText:'#57606a', lineColor:'rgba(37,99,235,.18)' },
    { id:'line-serif',    name:'衬线竖线',   desc:'白底宋体，标题左竖线',   emoji:'📕', accent:'#333333', previewBg:'#ffffff', quoteText:'#444444', lineColor:'rgba(51,51,51,.18)' },
    { id:'line-warm',     name:'暖橙竖线',   desc:'白底暖调，标题左竖线',   emoji:'🟠', accent:'#d97706', previewBg:'#ffffff', quoteText:'#6b5d4a', lineColor:'rgba(217,119,6,.18)' },
    { id:'deepsea',       name:'静海蓝调',   desc:'白底无背景，深海蓝竖线', emoji:'🌊', accent:'#0a4d8c', previewBg:'#ffffff', quoteText:'#46586e', lineColor:'rgba(10,77,140,.18)' },
  ],
}

const categories = [
  { id:'natural',  icon:'🌿', name:'自然清新', themes: allThemes.natural  },
  { id:'elegant',  icon:'✨', name:'优雅精致', themes: allThemes.elegant  },
  { id:'tech',     icon:'💻', name:'科技暗黑', themes: allThemes.tech     },
  { id:'business', icon:'💼', name:'商务专业', themes: allThemes.business },
  { id:'creative', icon:'🎨', name:'个性创意', themes: allThemes.creative },
  { id:'special',  icon:'🏮', name:'特色风格', themes: allThemes.special  },
  { id:'plain',    icon:'⚪️', name:'极简白底', themes: allThemes.plain    },
]

const totalCount = computed(() =>
  Object.values(allThemes).reduce((s, a) => s + a.length, 0)
)

const flatThemes = computed(() =>
  Object.values(allThemes).flat()
)

const filteredThemes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return flatThemes.value.filter(t =>
    t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  )
})

const displayThemes = computed(() => {
  if (searchQuery.value.trim()) return filteredThemes.value
  return categories.find(c => c.id === activeCategory.value)?.themes || []
})

const currentThemeObj = computed(() =>
  flatThemes.value.find(t => t.id === props.currentTheme)
)

function alpha(hex, a) {
  if (!hex || !hex.startsWith('#')) return `rgba(100,100,100,${a})`
  let h = hex.replace('#','')
  if (h.length === 3) h = h.split('').map(x=>x+x).join('')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}

function handleSelect(theme) {
  emit('select', theme.id)
}
</script>

<style scoped>
/* ===== 遮罩：完全透明，仅作点击关闭捕获层 ===== */
.theme-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none; /* 遮罩本身不拦截鼠标 */
}

/* 弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-8px);
}

/* ===== 弹窗主体 ===== */
.theme-dialog {
  width: 100%;
  max-width: 940px;
  max-height: 82vh;
  background: #f4f5f7;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);
  pointer-events: auto; /* 弹窗本身正常响应鼠标 */
}

/* ===== 顶部 ===== */
.drawer-header {
  display: flex; align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg,#1a1a2e,#16213e);
  color: #fff; flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 7px; }
.header-icon { font-size: 18px; }
.header-title { font-size: 15px; font-weight: 700; letter-spacing: .3px; }
.header-count {
  font-size: 10px; color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.1);
  padding: 1px 7px; border-radius: 8px;
}
.close-btn {
  margin-left: auto; width: 26px; height: 26px; border-radius: 50%;
  background: rgba(255,255,255,.12); border: none; color: #fff;
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.close-btn:hover { background: rgba(255,255,255,.25); }

/* ===== 搜索 ===== */
.search-bar {
  position: relative; padding: 8px 14px; background: #fff;
  border-bottom: 1px solid #ebebeb; flex-shrink: 0;
}
.search-input {
  width: 100%; padding: 6px 28px 6px 10px; border-radius: 6px;
  border: 1.5px solid #e0e0e0; font-size: 12px; outline: none;
  background: #f8f8f8; box-sizing: border-box;
  transition: border-color .15s;
}
.search-input:focus { border-color: #4f46e5; background: #fff; }
.search-clear {
  position: absolute; right: 22px; top: 50%; transform: translateY(-50%);
  color: #aaa; cursor: pointer; font-size: 11px; padding: 3px;
}
.search-label {
  padding: 7px 16px; font-size: 11px; color: #888;
  background: #fff; border-bottom: 1px solid #ebebeb; flex-shrink: 0;
}

/* ===== 分类 Tab ===== */
.tab-bar {
  display: flex; padding: 8px 14px 0; gap: 4px;
  background: #fff; border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.tab-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: none; background: none;
  font-size: 12px; color: #666; cursor: pointer;
  border-radius: 6px 6px 0 0; transition: all .15s; white-space: nowrap;
  border-bottom: 3px solid transparent; margin-bottom: -1px;
}
.tab-btn:hover { background: #f5f5f5; color: #333; }
.tab-btn.active {
  color: #4f46e5; font-weight: 700;
  border-bottom-color: #4f46e5;
  background: #f8f8ff;
}
.tab-name { font-size: 12px; }

/* ===== 主体滚动区 ===== */
.drawer-body {
  flex: 1; overflow-y: auto; padding: 14px;
  min-height: 0;
}
.drawer-body::-webkit-scrollbar { width: 5px; }
.drawer-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

/* 5 列网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

/* ===== 主题卡片 ===== */
.theme-card {
  cursor: pointer; border-radius: 10px; overflow: hidden;
  border: 2px solid #e4e6ea; background: #fff;
  transition: all .18s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.theme-card:hover {
  transform: translateY(-2px);
  border-color: #a0a0f0;
  box-shadow: 0 6px 18px rgba(0,0,0,.12);
}
.theme-card.active {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79,70,229,.18), 0 4px 14px rgba(0,0,0,.1);
}

/* 预览区 */
.preview-area {
  height: 100px; position: relative; overflow: hidden; padding: 8px;
}
.sim-page { display: flex; flex-direction: column; gap: 4px; height: 100%; }
.sim-h1 {
  padding: 3px 6px; border-radius: 4px; font-size: 8.5px;
  font-weight: 700; flex-shrink: 0; overflow: hidden;
  white-space: nowrap; text-overflow: ellipsis;
}
.sim-h2 {
  padding: 2px 5px; border-left: 3px solid; border-radius: 0 3px 3px 0;
  font-size: 8px; font-weight: 600; flex-shrink: 0;
}
.sim-lines { display: flex; flex-direction: column; gap: 3px; }
.sim-line { height: 3.5px; border-radius: 2px; opacity: .5; }
.sim-line.w90 { width: 90%; }
.sim-line.w70 { width: 70%; }
.sim-quote {
  padding: 2px 5px; border-left: 2px solid; border-radius: 0 3px 3px 0;
  font-size: 7.5px; flex-shrink: 0; opacity: .9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.active-badge {
  position: absolute; top: 6px; right: 6px;
  width: 16px; height: 16px; border-radius: 50%;
  color: #fff; font-size: 9px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,.3);
}

/* 卡片信息 */
.card-info {
  padding: 5px 7px 6px;
  border-top: 1px solid rgba(0,0,0,.05);
}
.card-name { font-size: 11px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
.card-desc { font-size: 9.5px; color: #aaa; line-height: 1.35; margin-top: 1px; }

/* ===== 底部栏 ===== */
.drawer-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 18px; background: #fff; border-top: 1px solid #ebebeb;
  flex-shrink: 0;
}
.footer-current { font-size: 12px; color: #555; }
.footer-current strong { color: #4f46e5; }
.footer-hint { font-size: 11px; color: #bbb; }
</style>
