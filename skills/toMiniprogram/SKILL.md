---
name: toMiniprogram
description: >
  This skill converts Vue/Web syntax to uni-app mini-program compatible syntax.
  It should be used when the user asks to convert web syntax to mini-program syntax,
  mentions "小程序语法", "小程序", "uni-app", or requests migrating web components to
  mini-program. Triggers include phrases like "兼容小程序", "改为小程序语法",
  "转为小程序写法", "uni-app 语法".
---

# toMiniprogram - Web to Mini-Program Syntax Conversion

This skill provides a systematic approach to converting Vue Web components to uni-app
WeChat mini-program compatible syntax. Use this skill whenever converting `.vue` files
from web (Nuxt/Vue) to uni-app mini-program.

## Core Conversion Rules

### 1. HTML Tags → uni-app Components

| Web Tag | uni-app Replacement |
|---------|-------------------|
| `<div>` | `<view>` |
| `<span>` | `<text>` (inline text only: `fw-bold`, `c-red`, etc.) |
| `<aside>` | `<view>` |
| `<section>` | `<view>` |
| `<h1>` / `<h2>` / `<h3>` | `<view>` |
| `<b>` / `<strong>` / `<i>` / `<em>` | `<text>` |
| `<img>` | `<image mode="widthFix">` |
| `<ol>` / `<ul>` / `<li>` | `<view>` |
| `<br>` | Use `<view>` for line breaks or `<text>` with `\n` |
| `<button>` (non-form) | `<view>` with click handler; `<button open-type="share">` for share |

### 2. Vue Directives & Features

| Web Feature | Mini-Program Handling |
|-------------|---------------------|
| `v-html` | Replace with `<rich-text :nodes="value" />` |
| `<Teleport>` | Remove entirely; use `onPageScroll` + `position: fixed` or modal |
| `<Transition>` | Remove (unsupported in mini-program) |
| `v-bind="$attrs"` | Use explicit props like `className`, `customStyle` |
| `class` / `style` on custom component | Cannot be transmitted; use explicit `className` / `customStyle` props instead |
| `useTemplateRef` | Use plain `ref()` |
| `useState` (Nuxt) | Use `ref()` / `reactive()` |
| `defineModel` | Works in Vue 3.4+, keep as-is |

**Class/style transmission rule:** In WeChat mini-program, `class` and `style` attributes on custom components are NOT automatically forwarded to the component's root element. When a parent component writes `<MyComponent class="xxx" style="yyy" />`, the child does not receive these. Workaround:

1. Define explicit `className` and `customStyle` props in the child component
2. Bind them manually on the root element: `<view :class="className" :style="customStyle">`
3. Parent passes them as props: `<MyComponent :className="'xxx'" :customStyle="{...}" />`

### 3. Component Replacements

| Vant Component | uni-ui / Custom Replacement |
|---------------|---------------------------|
| `VanIcon` | `<uni-icons type="iconName" />` |
| `VanPopup` | `<uni-popup>` |
| `VanTextEllipsis` | Use `computed` property to truncate text |
| `VanButton` | `<view>` styled as button, or `<button>` for native features |
| `NuxtLink` | `uni.navigateTo({ url: '...' })` or `@click` handler |
| `XpEmpty` | `<Empty>` (import from `@comp/common/empty.vue`) |
| `XpNav` | `<Options>` (import from `@comp/common/options.vue`), remove `item-tag` prop |
| `XsPopupTips` | `<PopupTips>` (import from `@comp/product/popup-tips.vue`) |

**XpNav → Options prop mapping:**

| XpNav prop | Options prop | Note |
|-----------|-------------|------|
| `class` | `className` | kebab → camelCase |
| `key-name` | `keyName` | kebab → camelCase |
| `display-key-name` | `displayKeyName` | kebab → camelCase |
| `v-model` | `v-model` | same |
| `:list` | `:list` | same |
| `item-tag="button"` | remove | unsupported, Options always renders `<view>` |
| — | `display-key-name="name"` | **MUST always add** when converting to Options |

### 4. Events & Lifecycle

| Web API | Mini-Program Replacement |
|---------|------------------------|
| `document.addEventListener('scroll', ...)` | `onPageScroll((e) => { ... })` in page component |
| `showNotify(...)` | `uni.showToast({ title: '...', icon: 'none' })` |
| `window.*` | Remove all window globals, use `uni.*` APIs instead |
| `document.querySelector` | `uni.createSelectorQuery()` |

### 5. DOM Manipulation

| Web | Mini-Program |
|-----|-------------|
| `document.querySelector` | `uni.createSelectorQuery().select('.cls').boundingClientRect((rect) => {...}).exec()` |
| In template refs for DOM measurement | `uni.createSelectorQuery().in(getCurrentInstance())` |
| `el.getBoundingClientRect()` | Via `createSelectorQuery` |

### 6. Charts (ECharts)

**Do NOT use raw `<canvas>` with `echarts.init(canvas)` directly.** Use the `ec-canvas`
wxcomponent pattern:

```vue
<script setup>
import { getEcharts } from '@/utils/getSubpackageSource.js'

let echarts: any = null
let chartInstance: any = null
const chartReady = ref(false)
const ec = ref({ onInit: initChart })

function initChart(canvas: any, width: number, height: number, dpr: number) {
  // MUST be synchronous, return chart instance
  chartInstance = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr })
  canvas.setChart(chartInstance)
  setOption()
  return chartInstance
}

onMounted(async () => {
  echarts = await getEcharts()
  chartReady.value = true
})
</script>

<template>
  <view class="w-full h-400">
    <ec-canvas v-if="chartReady" :ec="ec" />
  </view>
</template>

<style scoped lang="scss">
ec-canvas {
  width: 100%;
  height: 100%;
}
</style>
```

Key rules:
- `initChart` must be **synchronous** (ec-canvas assigns its return value to `this.chart`)
- Use `v-if="chartReady"` to ensure `ec-canvas` renders only after `getEcharts()` resolves
- Remove `echarts/core`, `echarts/charts`, `echarts/components` imports — the full build at `pages/echarts/echarts.js` has everything
- Remove `echarts.use([...])` registration
- Remove `import SvgWatermark from './img/xxx.svg'` if the chart uses graphic watermark — use a PNG/remote URL instead

### 7. CSS / Style Rules

| Issue | Solution |
|-------|----------|
| `& ~ &` sibling selector in scoped styles | Use `&:not(:first-child)` |
| `--uno: content-empty` | Change to `content: ''` |
| `var(--some-var)` in style | Works in mini-program, keep |
| `@include mixinName()` (SCSS) | Replace with inline styles or standard CSS |
| `transform` / opacity transitions via `vueTrans` | Write `transition` CSS directly |
| `rpx` units | 750rpx = screen width; 1rpx ≈ 0.5px on iPhone 6 |
| `class` prop forwarding | `class` is a Vue reserved attribute, use `className` prop instead |
| `font-DIN` class | Replace with `DIN` in mini-program |

### 8. TypeScript / Utility Simplifications

| Pattern | Replacement |
|---------|------------|
| `dayjs` import | Use native `Date` methods |
| Complex generics (`DeepReadonly<T>`, `MaybeRef<T>`) | Use `any` or simple types |
| `@uni-helper/uni-app-types` | Remove from tsconfig if causing type errors |
| `@uni-helper/uni-ui-types` | Remove from tsconfig if causing type errors |
| `experimentalRfc436: true` | Set to `false` in tsconfig |
| `defineModel(...)` | Replace with explicit `defineProps` + `defineEmits` |

**`defineModel` replacement pattern:** uni-app's bundled Vue runtime does not export
`mergeModels`, which is what `@vue-macros/reactivity-transform` compiles `defineModel`
into. Using `defineModel` causes: `mergeModels is not exported by .../uni-app-vue/dist/vue.runtime.esm.js`.

Migration:

```ts
// Before (Web / Vue 3.4+)
const modelValue = defineModel<{ period: SN }>()

// After (uni-app compatible)
const props = defineProps<{ modelValue: { period: SN } }>()
const emit = defineEmits<{ 'update:modelValue': [value: { period: SN }] }>()

// reads:    props.modelValue
// writes:   emit('update:modelValue', newValue)
// watchers: watchImmediate(() => props.modelValue, (v) => { ... })
```

### 9. Naming Convention Migration

Functions/utilities prefixed with `uXp` or `uXs` are web-specific and must be renamed
for the mini-program codebase:

| Web Prefix | Step 1 Replacement | Step 2 Fallback |
|-----------|-------------------|-----------------|
| `uXp` | `uWM` | `u` |
| `uXs` | `uWM` | `u` |
| `uXp` (utility) | `uWM` or `uGen` | check existing utils |
| `Xp` (component/variable) | `uWM` | remove prefix |

Special mappings:
- `uXpIsEmpty` → `uGenIsEmpty`
- `uXpEmpty` → `uGenIsEmpty`
- `uXsRoutes` → `uRouteTo`

**Migration workflow:**

1. Replace all `uXp*` and `uXs*` function calls with `uWM*` (e.g. `uXpFundIs` → `uWMFundIs`)
2. After replacement, run `read_lints` to verify
3. If errors remain (function not found), fall back to `u*` prefix (e.g. `uWMFundIs` → `uFundIs`)

**Example:**

```
uXpChartPickRange  →  uWMChartPickRange  (step 1)
uWMFundIs          →  uFundIs            (step 2, if 报错)
uXsVantShowDialog  →  uWMShowDialog      (step 1, or replace with uni.showModal)
```

### 10. Page Config

- Share functionality: use `<button open-type="share">` in page, define `onShareAppMessage` in page script
- Navigation: use `uni.navigateTo`, `uni.redirectTo`, `uni.switchTab` etc.
- Page scroll: `onPageScroll` lifecycle hook

## Conversion Workflow

When asked to convert a `.vue` file:

1. Read the file first to understand its structure
2. Rename `uXp*` / `uXs*` / `Xp*` functions per section 9
3. Replace HTML tags per the table in section 1
4. Handle unsupported features (Teleport, Transition, v-html)
5. Replace Vant components with uni-ui equivalents
6. Convert DOM APIs to `uni.*` alternatives
7. Fix CSS/scoped style issues
8. If ECharts is involved, use the `ec-canvas` pattern from section 6
9. Simplify TypeScript types as needed
10. Run `read_lints` after changes; fall back `uWM` → `u` if errors remain

## Common Pitfalls

- **`class` / `style` won't transmit to custom components**: Mini-program doesn't forward these automatically; define `className` and `customStyle` props, bind them manually on the root element
- **`fw-bold` / `fw-700` only on `<text>`**: Font-weight applies to text nodes, use `<text>` for styled text
- **ECharts `addEventListener` error**: Never pass raw canvas node to `echarts.init()` directly; always use `ec-canvas` wxcomponent
- **SVG in mini-program**: Avoid `import xxx from './img.svg'`; use remote URLs or base64
- **Empty `<view>`**: Mini-program allows empty `<view>`, but prefers content
- **`v-bind="$attrs"` doesn't work**: Mini-program component boundary is stricter; use explicit props
- **`@touchend` on ec-canvas**: Use `chartInstance.on('mouseup', handler)` inside `initChart` instead
- **`<script lang="tsx">` not supported**: uni-app mini-program cannot compile JSX in `.vue` files; use `lang="ts"` and rewrite JSX as templates or `h()` render functions
- **`<component :is="vnode.type">` may fail**: In mini-program templates, dynamic component rendering is unreliable. Either use explicit component references with `v-bind` to forward props, or use `h()` render functions
- **VNode `item.type?.name` matching unreliable**: When filtering slot VNodes by component name (`item.type?.name === COL_NAME`), name may not match in mini-program. Use prop-based heuristics instead: check if characteristic props exist (`'header' in props`, `'field' in props`, etc.)
- **Slot content in `item.children`, not `item.props`**: When extracting col definitions from slot VNodes, the slot template is in `item.children` while explicit props are in `item.props`. Pass props via `v-bind` and slots are passed automatically by Vue's runtime slot system
- **`useSlots()` returns `true` (not function) in mini-program**: `slots.default` is just `true` (slot exists marker), not a callable function. Cannot extract child VNodes at runtime. **Use prop-based APIs instead of slot-based APIs** (e.g., pass `columns: ColumnDef[]` as a prop, each col uses `body: (data) => h(...)` render functions)

**Slot-based to prop-based migration pattern** (e.g., for table columns):

```ts
// Web version (slot-based) — won't work in mini-program
<TableBlock>
  <TableCol header="name" field="name" />
  <TableCol header="value" :body="(d) => <text class={...}>{d.value}</text>" />
</TableBlock>

// Mini-program version (prop-based)
const columns = [
  { header: 'name', field: 'name' },
  { header: 'value', body: (data) => h('text', { class: ... }, data.value) }
]
<TableBlock :columns="columns" :value="rows" />
```
