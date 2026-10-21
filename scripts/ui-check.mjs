/**
 * 页面验收脚本（Chrome DevTools Protocol）。
 *
 * 用途：在无头 Chrome / Edge 中真实加载看板页面，检查
 *   1. 控制台是否有报错；
 *   2. 7 个模块与 5 张 ECharts 画布是否渲染；
 *   3. 积分发放「类型视图 / 月度视图」切换是否真实生效；
 *   4. 桌面 / 窄屏尺寸下是否存在横向溢出；
 *   5. 输出各尺寸截图到 .tmp/ 便于人工复核。
 *
 * 使用方式（需先启动 dev server 或 preview server）：
 *   npm run dev
 *   node scripts/ui-check.mjs                       # 默认检查 http://127.0.0.1:5173/
 *   node scripts/ui-check.mjs --url=http://127.0.0.1:4173/
 *
 * 依赖：Node 22+（内置 fetch 与 WebSocket）、本机已安装 Chrome 或 Edge。
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const DEFAULT_URL = 'http://127.0.0.1:5173/'
const urlArg = process.argv.find((arg) => arg.startsWith('--url='))
const TARGET_URL = urlArg ? urlArg.slice('--url='.length) : DEFAULT_URL
const CDP_PORT = Number(process.env.CDP_PORT ?? 9222)
const OUT_DIR = resolve('.tmp')
const HEADLESS_PROFILE = join(tmpdir(), `dash-ui-check-${Date.now()}`)

const VIEWPORTS = [
  { name: 'desktop', width: 1680, height: 1280 },
  { name: 'laptop', width: 1366, height: 1200 },
  { name: 'tablet', width: 1024, height: 1500 },
  { name: 'narrow', width: 760, height: 1800 }
]

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

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
  if (!found) {
    throw new Error('未找到 Chrome / Edge，可通过环境变量 CHROME_PATH 指定浏览器可执行文件路径')
  }
  return found
}

/** 极简 CDP 客户端 */
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
        if (message.error) rejectSend(new Error(`${message.error.message}`))
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

    if (message.method === 'Log.entryAdded') {
      const entry = message.params.entry
      if (entry.level === 'error') {
        this.consoleErrors.push(`[log.${entry.source}] ${entry.text}`)
      }
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
      // 浏览器尚未启动完成，继续轮询
    }
    await sleep(200)
  }
  throw new Error('未能在规定时间内连接 DevTools 调试端口')
}

const PAGE_SNAPSHOT_EXPRESSION = `(() => {
  const text = (selector) => {
    const el = document.querySelector(selector)
    return el ? el.textContent.trim().replace(/\\s+/g, ' ') : null
  }
  const texts = (selector) => [...document.querySelectorAll(selector)].map((el) =>
    el.textContent.trim().replace(/\\s+/g, ' ')
  )
  const cards = [...document.querySelectorAll('.chart-card')]
  const pointsCard = cards.find((card) => card.querySelector('.chart-card__title')?.textContent.includes('积分发放'))
  const canvasInfo = [...document.querySelectorAll('.base-echart canvas')].map((canvas) => ({
    width: canvas.width,
    height: canvas.height
  }))

  return {
    title: text('.dashboard-header__title'),
    cardTitles: texts('.chart-card__title'),
    statGroupTitles: texts('.stat-group__title'),
    statCardCount: document.querySelectorAll('.stat-card').length,
    statLabels: texts('.stat-card__label'),
    statValues: texts('.stat-card__number'),
    statLayout: document.querySelector('.stat-group__cards')?.dataset.layout ?? null,
    // 表格包含循环用克隆行，业务行数以组件暴露的基础数据量为准
    activityRowCount: Number(document.querySelector('.activity-table')?.dataset.totalRows ?? 0),
    activityDomRowCount: document.querySelectorAll('.activity-table__track tbody tr').length,
    activityHeaders: texts('.activity-table__header thead th'),
    legendCounts: [...document.querySelectorAll('.chart-legend')].map((list) => list.children.length),
    pointsSubtitle: pointsCard?.querySelector('.chart-card__subtitle')?.textContent.trim() ?? null,
    pointsActiveTab: pointsCard?.querySelector('.segmented__button.is-active')?.textContent.trim() ?? null,
    canvasCount: canvasInfo.length,
    canvasInfo,
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    clippedElements: [...document.querySelectorAll('.chart-card, .chart-card__body, .dashboard-header')]
      .filter((el) => el.scrollWidth - el.clientWidth > 1)
      .map((el) => el.className)
  }
})()`

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
      `--user-data-dir=${HEADLESS_PROFILE}`,
      '--window-size=1680,1280',
      TARGET_URL
    ],
    { stdio: 'ignore' }
  )

  const problems = []
  let client

  try {
    const wsUrl = await waitForDevtoolsEndpoint()
    client = new CdpClient(wsUrl)
    await client.connect()

    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Log.enable')

    // 首次加载可能已完成，重新导航以便捕获全部控制台输出
    client.loaded = false
    await client.send('Page.navigate', { url: TARGET_URL })
    await client.waitForLoad()
    await sleep(1500)

    const snapshot = await client.evaluate(PAGE_SNAPSHOT_EXPRESSION)
    console.log('\n=== 页面结构检查 ===')
    console.log(JSON.stringify(snapshot, null, 2))

    const expectedCards = ['阅读用户地区分布', '工会活动', '用户类型', '劳模工匠', '工会组织', '积分发放']
    const expectedStatGroups = ['思想引领', '就业概况']

    if (!snapshot.title?.includes('工会综合数据看板')) problems.push('页面标题缺失')
    for (const name of expectedStatGroups) {
      if (!snapshot.statGroupTitles.includes(name)) problems.push(`统计组缺失: ${name}`)
    }
    for (const name of expectedCards) {
      if (!snapshot.cardTitles.includes(name)) problems.push(`模块缺失: ${name}`)
    }
    if (snapshot.statCardCount !== 8) problems.push(`统计卡片数量应为 8，实际 ${snapshot.statCardCount}`)
    if (snapshot.canvasCount !== 5) problems.push(`ECharts 画布数量应为 5，实际 ${snapshot.canvasCount}`)
    if (snapshot.activityRowCount !== 7) problems.push(`活动基础数据应为 7 条，实际 ${snapshot.activityRowCount}`)
    if (snapshot.activityDomRowCount !== 11) problems.push(`活动表格应渲染 7 条数据 + 4 条克隆行，实际 ${snapshot.activityDomRowCount}`)
    const emptyCanvas = snapshot.canvasInfo.filter((item) => item.width < 10 || item.height < 10)
    if (emptyCanvas.length) problems.push(`存在尺寸异常的图表画布: ${JSON.stringify(emptyCanvas)}`)
    if (snapshot.horizontalOverflow > 1) problems.push(`桌面尺寸出现横向溢出: ${snapshot.horizontalOverflow}px`)
    if (snapshot.clippedElements.length) problems.push(`存在内容裁剪: ${snapshot.clippedElements.join(', ')}`)

    // ---- 交互检查：切换到月度视图 ----
    console.log('\n=== 积分发放视图切换检查 ===')
    const clickResult = await client.evaluate(`(() => {
      const buttons = [...document.querySelectorAll('.segmented__button')]
      const target = buttons.find((button) => button.textContent.includes('月度'))
      if (!target) return 'not-found'
      target.click()
      return 'clicked'
    })()`)
    if (clickResult !== 'clicked') problems.push('未找到月度视图按钮')

    await sleep(900)
    const monthView = await client.evaluate(PAGE_SNAPSHOT_EXPRESSION)
    console.log(`切换后激活标签: ${monthView.pointsActiveTab}`)
    console.log(`切换后副标题: ${monthView.pointsSubtitle}`)
    if (!monthView.pointsActiveTab?.includes('月度')) problems.push('月度视图按钮点击后未激活')
    if (!monthView.pointsSubtitle?.includes('按月份')) problems.push('月度视图副标题未更新')
    if (monthView.canvasCount !== 5) problems.push('切换视图后图表画布数量异常')

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
      deviceScaleFactor: 1,
      mobile: false
    })
    await sleep(600)
    const monthShot = await client.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT_DIR, 'shot-points-month.png'), Buffer.from(monthShot.data, 'base64'))

    // 切回类型视图
    await client.evaluate(`(() => {
      const buttons = [...document.querySelectorAll('.segmented__button')]
      buttons.find((button) => button.textContent.includes('类型'))?.click()
    })()`)
    await sleep(700)
    const typeView = await client.evaluate(PAGE_SNAPSHOT_EXPRESSION)
    console.log(`切回后激活标签: ${typeView.pointsActiveTab}`)
    console.log(`切回后副标题: ${typeView.pointsSubtitle}`)
    if (!typeView.pointsActiveTab?.includes('类型')) problems.push('切回类型视图失败')
    if (!typeView.pointsSubtitle?.includes('按发放类型')) problems.push('类型视图副标题未恢复')

    // ---- 多尺寸截图与溢出检查 ----
    console.log('\n=== 响应式检查 ===')
    for (const viewport of VIEWPORTS) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: false
      })
      await sleep(900)
      const metrics = await client.evaluate(`(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        canvasCount: document.querySelectorAll('.base-echart canvas').length,
        cardWidths: [...document.querySelectorAll('.chart-card')].map((el) => Math.round(el.getBoundingClientRect().width))
      }))()`)
      console.log(`${viewport.name} ${viewport.width}px → 溢出 ${metrics.overflow}px, 画布 ${metrics.canvasCount}, 卡片宽度 ${metrics.cardWidths.join('/')}`)
      if (metrics.overflow > 1) problems.push(`${viewport.name}(${viewport.width}px) 出现横向溢出 ${metrics.overflow}px`)
      if (metrics.canvasCount !== 5) problems.push(`${viewport.name}(${viewport.width}px) 图表画布数量异常`)

      const shot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      writeFileSync(join(OUT_DIR, `shot-${viewport.name}.png`), Buffer.from(shot.data, 'base64'))
    }

    // ---- 控制台错误汇总 ----
    console.log('\n=== 控制台输出检查 ===')
    const consoleIssues = [...client.consoleErrors, ...client.exceptions]
    if (consoleIssues.length) {
      console.log(consoleIssues.join('\n'))
      problems.push(`控制台存在 ${consoleIssues.length} 条错误/警告`)
    } else {
      console.log('无控制台错误或警告')
    }
  } finally {
    client?.close()
    browser.kill()
    await sleep(500)
    try {
      rmSync(HEADLESS_PROFILE, { recursive: true, force: true })
    } catch {
      // 清理失败不影响检查结果
    }
  }

  console.log('\n=== 检查结果 ===')
  if (problems.length === 0) {
    console.log('✅ 全部检查通过')
    process.exit(0)
  }
  console.log(`❌ 发现 ${problems.length} 个问题:`)
  for (const problem of problems) console.log(` - ${problem}`)
  process.exit(1)
}

main().catch((error) => {
  console.error('检查脚本执行失败:', error)
  process.exit(1)
})
