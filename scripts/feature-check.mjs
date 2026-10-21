/**
 * A1—A7 浏览器验收脚本（Chrome DevTools Protocol）。
 *
 * 需要先启动开发服务器：
 *   npm run dev
 *   npm run check:features
 *   node scripts/feature-check.mjs --url=http://127.0.0.1:5173/
 *
 * 检查内容：
 *   A1  Flex / Grid 切换、两种布局数据一致、数字增长动画不因切换重置
 *   A2  5 条地区数据、3 条窗口、连续 6 次一档推进、边缘渐隐、3s 过渡
 *   A3  7 条活动数据、4 行窗口、固定表头、连续循环
 *   A4  5 个渐变图例与扇区动画
 *   A5  4 级极坐标柱状图入场动画
 *   A6  编号 6 的 4 张图片全部加载
 *   A7  月度 12 个月数据、6 个月窗口、跨年循环、平移不重绘
 *
 * 依赖：Node 22+、本机 Chrome / Edge。可通过 CHROME_PATH 指定浏览器。
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const DEFAULT_URL = 'http://127.0.0.1:5173/'
const urlArg = process.argv.find((arg) => arg.startsWith('--url='))
const TARGET_URL = urlArg ? urlArg.slice('--url='.length) : DEFAULT_URL
const CDP_PORT = Number(process.env.CDP_PORT ?? 9335)
const OUT_DIR = resolve('.tmp')
const PROFILE_DIR = join(tmpdir(), `dsh-feature-check-${Date.now()}`)
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

const TARGET_STAT_VALUES = [1286, 486320, 342, 52680, 1842, 9635, 2476, 128]
const REGION_WINDOWS = [
  '城东区 城西区 城南区',
  '城西区 城南区 城北区',
  '城南区 城北区 高新区',
  '城北区 高新区 城东区',
  '高新区 城东区 城西区'
]
const ACTIVITY_WINDOWS = [
  '1 2 3 4',
  '2 3 4 5',
  '3 4 5 6',
  '4 5 6 7',
  '5 6 7 1',
  '6 7 1 2',
  '7 1 2 3'
]
const MONTH_WINDOWS = [
  '1月 — 6月',
  '2月 — 7月',
  '3月 — 8月',
  '4月 — 9月',
  '5月 — 10月',
  '6月 — 11月',
  '7月 — 12月',
  '8月 — 1月'
]

const failures = []
let checks = 0

function check(condition, message, detail = '') {
  checks += 1
  if (condition) {
    console.log(`  ✅ ${message}`)
    return true
  }
  const text = detail ? `${message}（${detail}）` : message
  console.log(`  ❌ ${text}`)
  failures.push(text)
  return false
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean)

  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) throw new Error('未找到 Chrome / Edge，可通过 CHROME_PATH 指定浏览器可执行文件路径')
  return found
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.messageId = 0
    this.pending = new Map()
    this.consoleErrors = []
    this.exceptions = []
  }

  async connect() {
    if (typeof WebSocket === 'undefined') {
      throw new Error('当前 Node 版本缺少内置 WebSocket，请使用 Node 22+')
    }

    this.socket = new WebSocket(this.wsUrl)
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener('open', resolveOpen, { once: true })
      this.socket.addEventListener('error', () => rejectOpen(new Error('CDP 连接失败')), { once: true })
    })

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolveSend, rejectSend } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) rejectSend(new Error(message.error.message))
        else resolveSend(message.result)
        return
      }
      this.handleEvent(message)
    })
  }

  handleEvent(message) {
    if (message.method === 'Runtime.consoleAPICalled') {
      const type = message.params.type
      if (type === 'error' || type === 'warning') {
        const text = message.params.args
          .map((arg) => arg.value ?? arg.description ?? arg.type)
          .join(' ')
        this.consoleErrors.push(`[console.${type}] ${text}`)
      }
    }

    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails
      this.exceptions.push(`[exception] ${detail.exception?.description ?? detail.text}`)
    }

    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      this.consoleErrors.push(`[log.${message.params.entry.source}] ${message.params.entry.text}`)
    }

    if (message.method === 'Page.loadEventFired') {
      this.loaded = true
    }
  }

  send(method, params = {}) {
    const id = ++this.messageId
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolveSend, rejectSend })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (result.exceptionDetails) {
      throw new Error(`页面执行表达式失败: ${result.exceptionDetails.text}`)
    }
    return result.result.value
  }

  async waitForLoad(timeoutMs = 20000) {
    const startedAt = Date.now()
    while (!this.loaded) {
      if (Date.now() - startedAt > timeoutMs) throw new Error('页面加载超时')
      await sleep(100)
    }
  }

  close() {
    this.socket?.close()
  }
}

async function waitForDevtoolsEndpoint(timeoutMs = 20000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // 浏览器尚未启动完成
    }
    await sleep(200)
  }
  throw new Error('未能在规定时间内连接 DevTools 调试端口')
}

const HASH_HELPER = `
  const hashString = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };
  const chartCanvasHash = (title) => {
    const card = [...document.querySelectorAll('.chart-card')].find(
      (item) => item.querySelector('.chart-card__title')?.textContent.trim() === title
    );
    const canvas = card?.querySelector('canvas');
    if (!canvas) return null;
    try {
      return hashString(canvas.toDataURL());
    } catch {
      return 'tainted';
    }
  };
`

const FULL_SNAPSHOT = `(() => {
  ${HASH_HELPER}
  const text = (selector) => document.querySelector(selector)?.textContent.trim().replace(/\\s+/g, ' ') ?? null;
  const texts = (selector) => [...document.querySelectorAll(selector)].map(
    (element) => element.textContent.trim().replace(/\\s+/g, ' ')
  );
  const statNumbers = [...document.querySelectorAll('.stat-card__number')].map((element) =>
    Number(element.textContent.replace(/,/g, ''))
  );
  const statLabels = texts('.stat-card__label');
  const statIcons = [...document.querySelectorAll('.stat-card__icon')].map((element) => element.getAttribute('src'));
  const layoutRows = [...document.querySelectorAll('.stat-group__cards')];
  const region = document.querySelector('.region-scroll');
  const regionViewport = document.querySelector('.region-scroll__viewport');
  const regionTrack = document.querySelector('.region-scroll__track');
  const activity = document.querySelector('.activity-table');
  const activityViewport = document.querySelector('.activity-table__viewport');
  const activityHeader = document.querySelector('.activity-table__header');
  const activityTracks = [...document.querySelectorAll('.activity-table__track')];
  const activityTrack = activityTracks[0];
  const month = document.querySelector('.points-month');
  const monthViewport = document.querySelector('.points-month__viewport');
  const monthTrack = document.querySelector('.points-month__track');
  const rose = document.querySelector('.rose');
  const activeTabs = texts('.segmented__button.is-active');
  const donutGradientDots = [...document.querySelectorAll('.donut .chart-legend__dot')].filter(
    (element) => getComputedStyle(element).backgroundImage.includes('linear-gradient')
  ).length;

  return {
    statNumbers,
    statLabels,
    statIcons,
    layouts: layoutRows.map((element) => getComputedStyle(element).display),
    layoutAttrs: layoutRows.map((element) => element.dataset.layout),
    activeTabs,
    regionWindow: region?.dataset.visibleWindow ?? null,
    regionTotal: Number(region?.dataset.totalRows ?? 0),
    regionVisible: Number(region?.dataset.visibleCount ?? 0),
    regionTransition: regionTrack ? getComputedStyle(regionTrack).transitionDuration : null,
    regionMask: regionViewport ? (getComputedStyle(regionViewport).maskImage || getComputedStyle(regionViewport).webkitMaskImage) : null,
    activityWindow: activity?.dataset.visibleWindow ?? null,
    activityTotal: Number(activity?.dataset.totalRows ?? 0),
    activityVisible: Number(activity?.dataset.visibleCount ?? 0),
    activityTransition: activityTrack ? getComputedStyle(activityTrack).transitionDuration : null,
    activityViewportHeight: activityViewport ? Math.round(activityViewport.getBoundingClientRect().height) : 0,
    activityHeaderHeight: activityHeader ? Math.round(activityHeader.getBoundingClientRect().height) : 0,
    activityFooter: text('.activity-table__footer'),
    monthWindow: month?.dataset.visibleWindow ?? null,
    monthVisible: Number(month?.dataset.visibleCount ?? 0),
    monthTotal: Number(month?.dataset.totalMonths ?? 0),
    monthTransition: monthTrack ? getComputedStyle(monthTrack).transitionDuration : null,
    monthRatio: monthTrack && monthViewport
      ? Number((monthTrack.getBoundingClientRect().width / monthViewport.getBoundingClientRect().width).toFixed(2))
      : 0,
    statCardCount: document.querySelectorAll('.stat-card').length,
    chartCardCount: document.querySelectorAll('.chart-card').length,
    canvasCount: document.querySelectorAll('.base-echart canvas').length,
    legendCounts: [...document.querySelectorAll('.chart-legend')].map((list) => list.children.length),
    donutGradientDots,
    loadedOrgImages: Number(rose?.dataset.loadedImages ?? 0),
    orgImagesReady: rose?.dataset.imagesReady ?? null,
    chartHashes: {
      region: chartCanvasHash('阅读用户地区分布'),
      donut: chartCanvasHash('用户类型'),
      polar: chartCanvasHash('劳模工匠'),
      rose: chartCanvasHash('工会组织'),
      points: chartCanvasHash('积分发放')
    },
    canvasSizes: [...document.querySelectorAll('.base-echart')].map((element) => {
      const canvas = element.querySelector('canvas');
      return {
        clientWidth: element.clientWidth,
        bitmapWidth: canvas ? Math.round(canvas.width / window.devicePixelRatio) : 0
      };
    }),
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    pageHeight: document.documentElement.scrollHeight
  };
})()`

const WINDOW_SNAPSHOT = `(() => {
  const region = document.querySelector('.region-scroll');
  const activity = document.querySelector('.activity-table');
  const month = document.querySelector('.points-month');
  const activeTabs = [...document.querySelectorAll('.segmented__button.is-active')].map(
    (element) => element.textContent.trim().replace(/\\s+/g, ' ')
  );
  return {
    activeTabs,
    regionWindow: region?.dataset.visibleWindow ?? null,
    activityWindow: activity?.dataset.visibleWindow ?? null,
    monthWindow: month?.dataset.visibleWindow ?? null
  };
})()`

function stepWindow(list, startIndex, offset) {
  return list[(startIndex + offset) % list.length]
}

async function waitFor(client, predicate, timeoutMs, intervalMs = 100) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const value = await predicate()
    if (value) return value
    await sleep(intervalMs)
  }
  return null
}

async function clickByText(client, label) {
  return client.evaluate(`(() => {
    const target = [...document.querySelectorAll('button')].find(
      (button) => button.textContent.includes(${JSON.stringify(label)})
    );
    if (!target) return false;
    target.click();
    return true;
  })()`)
}

async function capture(client, name) {
  const shot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const path = join(OUT_DIR, name)
  writeFileSync(path, Buffer.from(shot.data, 'base64'))
  console.log(`  截图: ${path}`)
}

/** 读取月度画布的像素哈希；CSS 平移不会改变该哈希 */
async function readMonthCanvasHash(client) {
  return client.evaluate(`(() => {
    ${HASH_HELPER}
    const card = [...document.querySelectorAll('.chart-card')].find(
      (item) => item.querySelector('.chart-card__title')?.textContent.trim() === '积分发放'
    );
    const canvas = card?.querySelector('.points-month canvas');
    return canvas ? hashString(canvas.toDataURL()) : null;
  })()`)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const browserPath = findBrowser()
  console.log(`使用浏览器: ${browserPath}`)
  console.log(`检查地址: ${TARGET_URL}`)

  const browser = spawn(
    browserPath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--disable-extensions',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      '--window-size=1680,1600',
      TARGET_URL
    ],
    { stdio: 'ignore' }
  )

  let client
  try {
    const wsUrl = await waitForDevtoolsEndpoint()
    client = new CdpClient(wsUrl)
    await client.connect()
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Log.enable')
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1680,
      height: 1600,
      deviceScaleFactor: 1,
      mobile: false
    })

    const navigationStartedAt = Date.now()
    client.loaded = false
    await client.send('Page.navigate', { url: TARGET_URL })
    await client.waitForLoad()
    await sleep(900)

    console.log('\n=== A1 统计卡片双布局与数字动画 ===')
    const initial = await client.evaluate(FULL_SNAPSHOT)
    check(initial.statCardCount === 8, '8 张统计卡片全部渲染', `实际 ${initial.statCardCount}`)
    check(initial.layouts.every((display) => display === 'grid'), '默认使用 Grid 布局', initial.layouts.join('/'))
    check(
      initial.statNumbers.every((value) => value > 0 && value < 1000000),
      '数字入场动画处于连续增长阶段',
      JSON.stringify(initial.statNumbers)
    )
    check(
      initial.statNumbers.every((value, index) => value > 0 && value < TARGET_STAT_VALUES[index]),
      '动画中间值均小于目标值',
      JSON.stringify(initial.statNumbers)
    )
    await capture(client, 'feature-mid-animation.png')

    const clickedFlex = await clickByText(client, 'Flex 布局')
    check(clickedFlex, '找到并点击 Flex 布局按钮')
    await sleep(250)
    const flex = await client.evaluate(FULL_SNAPSHOT)
    check(flex.layouts.every((display) => display === 'flex'), 'Flex 模式计算样式为 display: flex', flex.layouts.join('/'))
    check(arraysEqual(flex.statLabels, initial.statLabels), 'Flex / Grid 指标名称完全一致')
    check(arraysEqual(flex.statIcons, initial.statIcons), 'Flex / Grid 图标完全一致')
    check(
      flex.statNumbers.every((value, index) => value >= initial.statNumbers[index]),
      '切换 Flex 后数字继续增长、未重置',
      JSON.stringify(flex.statNumbers)
    )
    await capture(client, 'feature-layout-flex.png')

    const clickedGrid = await clickByText(client, 'Grid 布局')
    check(clickedGrid, '找到并点击 Grid 布局按钮')
    await sleep(250)
    const grid = await client.evaluate(FULL_SNAPSHOT)
    check(grid.layouts.every((display) => display === 'grid'), 'Grid 模式计算样式为 display: grid', grid.layouts.join('/'))
    check(arraysEqual(grid.statLabels, initial.statLabels), '切回 Grid 后指标名称保持一致')
    check(
      grid.statNumbers.every((value, index) => value >= flex.statNumbers[index]),
      '切回 Grid 后数字继续增长、未重置',
      JSON.stringify(grid.statNumbers)
    )

    console.log('\n=== A2 / A3 首次滚动与动画 ===')
    const firstChange = await waitFor(
      client,
      async () => {
        const windows = await client.evaluate(WINDOW_SNAPSHOT)
        return windows.regionWindow !== REGION_WINDOWS[0] &&
          windows.activityWindow !== ACTIVITY_WINDOWS[0]
          ? windows
          : null
      },
      6000
    )
    const firstChangeElapsed = Date.now() - navigationStartedAt
    check(!!firstChange, '地区图和活动表在初始化后开始首次滚动')
    check(
      firstChangeElapsed >= 2500 && firstChangeElapsed <= 6500,
      '首次滚动发生在初始化后约 3 秒',
      `${firstChangeElapsed}ms`
    )

    const settled = await client.evaluate(FULL_SNAPSHOT)
    check(arraysEqual(settled.statNumbers, TARGET_STAT_VALUES), '数字最终值与数据源一致', JSON.stringify(settled.statNumbers))
    check(settled.regionTotal === 5, '地区基础数据共 5 条', String(settled.regionTotal))
    check(settled.regionVisible === 3, '地区图窗口固定 3 条', String(settled.regionVisible))
    check(settled.regionWindow === REGION_WINDOWS[1], '首次地区窗口推进到 BCD', settled.regionWindow)
    check(settled.activityTotal === 7, '活动基础数据共 7 条', String(settled.activityTotal))
    check(settled.activityVisible === 4, '活动表窗口固定 4 行', String(settled.activityVisible))
    check(settled.activityWindow === ACTIVITY_WINDOWS[1], '首次活动窗口推进到 2—5', settled.activityWindow)
    check(settled.regionTransition === '3s', '地区滚动过渡时长为 3000ms', settled.regionTransition)
    check(settled.activityTransition === '3s', '活动滚动过渡时长为 3000ms', settled.activityTransition)
    check(!!settled.regionMask && settled.regionMask.includes('linear-gradient'), '地区窗口存在上下边缘渐隐')
    check(settled.activityHeaderHeight > 0, '活动表头独立于滚动区域', `${settled.activityHeaderHeight}px`)
    check(settled.activityViewportHeight === 224, '活动可视区高度等于 4 行（4×56px）', `${settled.activityViewportHeight}px`)
    check(settled.activityFooter?.includes('共 7 项活动'), '活动表尾按 7 条真实数据统计', settled.activityFooter ?? '')
    check(settled.canvasCount === 5, '5 个 ECharts 画布正常渲染', String(settled.canvasCount))

    console.log('\n=== A4 / A5 / A6 图表视觉与入场动画 ===')
    check(settled.donutGradientDots === 5, '环形图 5 个图例均使用渐变', String(settled.donutGradientDots))
    check(settled.legendCounts.includes(5), '用户类型图例 5 项完整显示')
    check(settled.legendCounts.includes(4), '劳模工匠 / 工会组织图例 4 项完整显示')
    check(settled.loadedOrgImages === 4, '编号 6 的 4 张图片全部加载', String(settled.loadedOrgImages))
    check(settled.orgImagesReady === 'true', '玫瑰图图片加载完成后才挂载图表', settled.orgImagesReady ?? '')
    for (const [name, label] of [
      ['donut', '用户类型环形图'],
      ['polar', '劳模工匠极坐标图'],
      ['rose', '工会组织玫瑰图']
    ]) {
      const before = initial.chartHashes[name]
      const after = settled.chartHashes[name]
      check(!!before && !!after && before !== after, `${label}画布在 0—3 秒内发生连续变化`, `${before} → ${after}`)
    }
    await capture(client, 'feature-settled.png')

    console.log('\n=== A2 / A3 连续循环（6 次推进） ===')
    const regionObserved = [REGION_WINDOWS[1]]
    const activityObserved = [ACTIVITY_WINDOWS[1]]
    for (let index = 0; index < 6; index += 1) {
      const previousRegion = regionObserved[regionObserved.length - 1]
      const previousActivity = activityObserved[activityObserved.length - 1]
      const changed = await waitFor(
        client,
        async () => {
          const windows = await client.evaluate(WINDOW_SNAPSHOT)
          return windows.regionWindow !== previousRegion &&
            windows.activityWindow !== previousActivity
            ? windows
            : null
        },
        4500
      )
      if (!changed) {
        check(false, `第 ${index + 2} 次滚动在 4.5 秒内发生`)
        break
      }
      regionObserved.push(changed.regionWindow)
      activityObserved.push(changed.activityWindow)
      console.log(
        `  第 ${index + 2} 次窗口: 地区=${changed.regionWindow} / 活动=${changed.activityWindow}`
      )
    }

    const expectedRegion = Array.from({ length: 7 }, (_, index) => stepWindow(REGION_WINDOWS, 1, index))
    const expectedActivity = Array.from({ length: 7 }, (_, index) => stepWindow(ACTIVITY_WINDOWS, 1, index))
    check(arraysEqual(regionObserved, expectedRegion), '地区窗口按 BCD→CDE→DEA→EAB→ABC 循环', regionObserved.join(' | '))
    check(
      arraysEqual(activityObserved, expectedActivity),
      '活动窗口每次上移 1 行并循环',
      activityObserved.join(' | ')
    )

    // 活动表在第 7 个窗口后使用克隆行无感复位，再观察一次确保没有空白/跳回错误行
    const lastActivityWindow = activityObserved[activityObserved.length - 1]
    const afterActivityReset = await waitFor(
      client,
      async () => {
        const windows = await client.evaluate(WINDOW_SNAPSHOT)
        return windows.activityWindow !== lastActivityWindow ? windows : null
      },
      4500
    )
    check(
      afterActivityReset?.activityWindow === ACTIVITY_WINDOWS[1],
      '活动表循环复位后继续单行推进，无空白或跳行',
      afterActivityReset?.activityWindow ?? ''
    )
    await capture(client, 'feature-after-scroll.png')

    console.log('\n=== A7 月度窗口滚动 ===')
    const clickedMonth = await clickByText(client, '月度视图')
    check(clickedMonth, '找到并点击月度视图按钮')
    await sleep(500)
    const monthStart = await client.evaluate(FULL_SNAPSHOT)
    check(monthStart.activeTabs.includes('月度视图'), '月度视图按钮处于激活状态', monthStart.activeTabs.join('/'))
    check(monthStart.monthTotal === 12, '月度数据覆盖 1—12 月', String(monthStart.monthTotal))
    check(monthStart.monthVisible === 6, '月度视图固定显示 6 个月', String(monthStart.monthVisible))
    check(monthStart.monthWindow === MONTH_WINDOWS[0], '月度默认窗口为 1—6 月', monthStart.monthWindow ?? '')
    check(monthStart.monthRatio === 3, '月度轨道宽度为视口的 3 倍（18 个槽位/6 个可视）', String(monthStart.monthRatio))
    check(monthStart.monthTransition === '3s', '月度滚动过渡时长为 3000ms', monthStart.monthTransition)

    const monthObserved = [MONTH_WINDOWS[0]]
    let monthIndex = 0
    let monthScrollCanvasHash = ''
    for (let index = 1; index < MONTH_WINDOWS.length; index += 1) {
      const previous = monthObserved[monthObserved.length - 1]
      const changed = await waitFor(
        client,
        async () => {
          const windows = await client.evaluate(WINDOW_SNAPSHOT)
          return windows.monthWindow !== previous ? windows : null
        },
        4500
      )
      if (!changed) {
        check(false, `月度第 ${index} 次滚动在 4.5 秒内发生`)
        break
      }
      monthIndex = index
      monthObserved.push(changed.monthWindow)
      console.log(`  月度窗口: ${changed.monthWindow}`)
      if (index === 1) monthScrollCanvasHash = await readMonthCanvasHash(client)
      if (index === 2) {
        const nextHash = await readMonthCanvasHash(client)
        check(
          !!monthScrollCanvasHash && monthScrollCanvasHash === nextHash,
          '月度轮播通过平移完成，画布内容没有重绘/重新生长',
          `${monthScrollCanvasHash} → ${nextHash}`
        )
      }
      if (index === 3) await capture(client, 'feature-month-mid.png')
    }
    check(arraysEqual(monthObserved, MONTH_WINDOWS), '月度窗口按 1—6…7—12→8—12+1 连续推进', monthObserved.join(' | '))
    check(monthIndex === 7, '月度窗口完成 8 个连续窗口')
    // 推进到 8月—1月 的过渡结束后再截图，避免截在滚动中间
    await client.evaluate(`document.getAnimations().forEach((animation) => {
      try { animation.finish(); } catch { /* 忽略无法立即结束的动画 */ }
    })`)
    await sleep(120)
    await capture(client, 'feature-month-wrap.png')

    console.log('\n=== A7 视图切换与定时器清理 ===')
    await clickByText(client, '类型视图')
    await sleep(700)
    const typeAfterMonth = await client.evaluate(FULL_SNAPSHOT)
    check(typeAfterMonth.activeTabs.includes('类型视图'), '切回类型视图成功', typeAfterMonth.activeTabs.join('/'))
    check(typeAfterMonth.canvasCount === 5, '切回类型视图后画布数量正常')

    await clickByText(client, '月度视图')
    await sleep(500)
    const monthRestart = await client.evaluate(WINDOW_SNAPSHOT)
    check(monthRestart.monthWindow === MONTH_WINDOWS[0], '重新进入月度视图从 1—6 月开始', monthRestart.monthWindow ?? '')
    const restartStep = await waitFor(
      client,
      async () => {
        const windows = await client.evaluate(WINDOW_SNAPSHOT)
        return windows.monthWindow !== MONTH_WINDOWS[0] ? windows : null
      },
      4500
    )
    check(restartStep?.monthWindow === MONTH_WINDOWS[1], '重新进入后只创建一个轮播定时器，单步推进', restartStep?.monthWindow ?? '')

    console.log('\n=== A1 响应式与 BaseEChart 尺寸同步 ===')
    await clickByText(client, '类型视图')
    await sleep(400)
    await clickByText(client, 'Flex 布局')
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 760,
      height: 1500,
      deviceScaleFactor: 1,
      mobile: false
    })
    await sleep(800)
    const flexNarrow = await client.evaluate(FULL_SNAPSHOT)
    check(flexNarrow.layouts.every((display) => display === 'flex'), '760px 下 Flex 布局仍为 flex', flexNarrow.layouts.join('/'))
    check(flexNarrow.horizontalOverflow <= 1, '760px Flex 布局无横向溢出', `${flexNarrow.horizontalOverflow}px`)
    check(
      flexNarrow.canvasSizes.every((item) => Math.abs(item.clientWidth - item.bitmapWidth) <= 1),
      '窗口缩窄后 ECharts 画布同步 resize、未重建实例',
      JSON.stringify(flexNarrow.canvasSizes)
    )

    await clickByText(client, 'Grid 布局')
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 600,
      height: 1600,
      deviceScaleFactor: 1,
      mobile: false
    })
    await sleep(800)
    const gridMobile = await client.evaluate(FULL_SNAPSHOT)
    check(gridMobile.layouts.every((display) => display === 'grid'), '600px 下 Grid 布局仍为 grid', gridMobile.layouts.join('/'))
    check(gridMobile.horizontalOverflow <= 1, '600px Grid 单列布局无横向溢出', `${gridMobile.horizontalOverflow}px`)
    check(
      gridMobile.canvasSizes.every((item) => Math.abs(item.clientWidth - item.bitmapWidth) <= 1),
      '窄屏下图表画布尺寸与容器一致',
      JSON.stringify(gridMobile.canvasSizes)
    )
    await capture(client, 'feature-mobile-600-grid.png')

    await clickByText(client, 'Flex 布局')
    await sleep(400)
    const flexMobile = await client.evaluate(FULL_SNAPSHOT)
    check(flexMobile.layouts.every((display) => display === 'flex'), '600px 下 Flex 布局仍为 flex', flexMobile.layouts.join('/'))
    check(flexMobile.horizontalOverflow <= 1, '600px Flex 单列布局无横向溢出', `${flexMobile.horizontalOverflow}px`)
    await capture(client, 'feature-mobile-600-flex.png')

    console.log('\n=== 控制台与页面状态 ===')
    if (client.consoleErrors.length || client.exceptions.length) {
      const issues = [...client.consoleErrors, ...client.exceptions]
      console.log(issues.join('\n'))
      check(false, '控制台无错误或警告', `${issues.length} 条`)
    } else {
      check(true, '控制台无错误或警告')
    }
    check(initial.horizontalOverflow <= 1, '桌面端无横向溢出', `${initial.horizontalOverflow}px`)
    check(initial.chartCardCount === 6, '6 个图表模块完整保留', String(initial.chartCardCount))
  } finally {
    client?.close()
    browser.kill()
    await sleep(500)
    try {
      rmSync(PROFILE_DIR, { recursive: true, force: true })
    } catch {
      // 清理失败不影响检查结果
    }
  }

  console.log('\n=== 检查结果 ===')
  if (failures.length === 0) {
    console.log(`✅ ${checks} 项检查全部通过`)
    process.exit(0)
  }
  console.log(`❌ ${failures.length} / ${checks} 项检查失败：`)
  for (const failure of failures) console.log(` - ${failure}`)
  process.exit(1)
}

main().catch((error) => {
  console.error('特性验收脚本执行失败:', error)
  process.exit(1)
})
