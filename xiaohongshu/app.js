const allowedViews = new Set(["overview", "themes", "points", "notes", "audit", "docs"]);
const requestedView = new URLSearchParams(location.search).get("view");
const state = { data: null, view: allowedViews.has(requestedView) ? requestedView : "overview", filters: { q: "", status: "全部", type: "全部", theme: "全部" } };
const app = document.querySelector("#app");

const money = (v) => `¥${Math.round(v || 0).toLocaleString("zh-CN")}`;
const num = (v) => Math.round(v || 0).toLocaleString("zh-CN");
const pct = (v, digits = 1) => `${((v || 0) * 100).toFixed(digits)}%`;
const roi = (v) => Number(v || 0).toFixed(2);
const esc = (v = "") => String(v).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const analyzedNotes = () => state.data.notes.filter((n) => n.analysisStatus === "已分析");
const noteByRank = (rank) => state.data.notes.find((n) => n.rank === rank);

function statusClass(status) {
  return status === "已分析" ? "status-ok" : status === "链接错配" ? "status-bad" : "status-pending";
}

function qualityBanner() {
  const q = state.data.quality;
  return `<section class="quality-banner">
    <div class="quality-copy">
      <h2>先看数据可用范围</h2>
      <p>内容分析仅使用内容ID与链接一致且页面可读取的101篇。41篇链接错配、4篇待验证均不进入主题和卖点统计；评论区按刷量处理，完全排除。</p>
    </div>
    <div class="quality-stat"><span>已分析</span><strong>${q.analyzedNotes}</strong><small>消耗覆盖 ${pct(q.spendCoverage)}</small></div>
    <div class="quality-stat bad"><span>链接错配</span><strong>${q.mismatchedLinks}</strong><small>不能用错链内容代替</small></div>
    <div class="quality-stat pending"><span>待验证</span><strong>${q.pendingLogin}</strong><small>暂不做内容判断</small></div>
  </section>`;
}

function kpis() {
  const q = state.data.quality;
  return `<section class="section kpi-grid">
    <div class="kpi"><div class="kpi-label">全量投放消耗</div><div class="kpi-value">${money(q.totalSpend)}</div><div class="kpi-note">146篇投放笔记</div></div>
    <div class="kpi"><div class="kpi-label">全量转化金额</div><div class="kpi-value">${money(q.totalRevenue)}</div><div class="kpi-note">全量ROI ${roi(q.totalRevenue / q.totalSpend)}</div></div>
    <div class="kpi"><div class="kpi-label">内容分析消耗</div><div class="kpi-value">${money(q.analyzedSpend)}</div><div class="kpi-note">覆盖全量消耗 ${pct(q.spendCoverage)}</div></div>
    <div class="kpi"><div class="kpi-label">内容分析转化金额</div><div class="kpi-value">${money(q.analyzedRevenue)}</div><div class="kpi-note">覆盖全量成交 ${pct(q.revenueCoverage)}</div></div>
  </section>`;
}

function typeCards() {
  const items = state.data.typeSummary;
  return `<div class="type-grid">${items.map((x) => `<div class="type-block">
    <div class="type-title"><span>${esc(x.label)}笔记</span><span>${x.noteCount}篇</span></div>
    <div class="type-roi">ROI ${roi(x.roi)}</div>
    <div class="metric-line"><span>消耗</span><strong>${money(x.spend)}</strong></div>
    <div class="metric-line"><span>CTR</span><strong>${pct(x.ctr, 2)}</strong></div>
    <div class="metric-line"><span>收藏</span><strong>${num(x.collects)}</strong></div>
  </div>`).join("")}</div>`;
}

function themeTable(limit = 20) {
  const rows = state.data.themeSummary.slice(0, limit);
  const maxSpend = Math.max(...rows.map((x) => x.spend), 1);
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>笔记主题</th><th>篇数</th><th>消耗</th><th>CTR</th><th>成交金额</th><th>聚合ROI</th><th>中位ROI</th><th>头部成交占比</th></tr></thead><tbody>
    ${rows.map((x) => `<tr><td class="bar-cell"><strong>${esc(x.label)}</strong><div class="bar-track"><div class="bar-fill" style="width:${(x.spend / maxSpend * 100).toFixed(1)}%"></div></div></td><td>${x.noteCount}</td><td>${money(x.spend)}</td><td>${pct(x.ctr, 2)}</td><td>${money(x.revenue)}</td><td class="roi">${roi(x.roi)}</td><td>${roi(x.medianRoi)}</td><td class="${x.topRevenueShare > .45 ? "concentration-high" : ""}">${pct(x.topRevenueShare)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function overview() {
  const image = state.data.typeSummary.find((x) => x.label === "图文");
  const video = state.data.typeSummary.find((x) => x.label === "视频");
  return `${qualityBanner()}${kpis()}
    <section class="section two-col">
      <div class="panel"><div class="panel-head"><h3>图文与视频表现</h3><p>只统计101篇可确认笔记；互动仅保留点赞与收藏作为辅助信号</p></div><div class="panel-body">${typeCards()}</div></div>
      <div class="panel"><div class="panel-head"><h3>复盘结论</h3><p>先看稳定性，再看聚合高值</p></div><div class="panel-body"><ul class="insights">
        <li><strong>图文是当前主力。</strong>图文ROI ${roi(image?.roi)}，视频ROI ${roi(video?.roi)}；图文同时承担了94%的可分析消耗。</li>
        <li><strong>选购内容效率高，但爆款集中。</strong>机型对比、差异解释能直接承接购买决策，聚合ROI需结合中位ROI与头部成交占比判断。</li>
        <li><strong>稳定承接来自具体问题。</strong>教程答疑、私处/手毛/腋毛等部位困扰，以及明确使用效果，比泛体毛焦虑和纯剧情更接近成交。</li>
        <li><strong>不要只复制高ROI标题。</strong>价格优惠、强能量技术等聚合ROI被少数笔记明显拉高，应先小预算复测，再决定放量。</li>
      </ul></div></div>
    </section>
    <section class="section panel"><div class="panel-head"><h3>主题效率总览</h3><p>聚合ROI看整体产出，中位ROI看典型单篇，头部成交占比判断是否依赖爆款</p></div>${themeTable()}</section>`;
}

function accordion(group, kind) {
  const ranks = group.ranks || [];
  const relatedSmall = kind === "point" ? state.data.smallPointSummary.filter((s) => state.data.bigPointMap[s.label] === group.label) : [];
  const content = kind === "theme"
    ? `<div class="notes-list">${ranks.map((r) => noteRow(noteByRank(r), true)).join("")}</div>`
    : `<div class="table-wrap"><table class="data-table"><thead><tr><th>小卖点</th><th>篇数</th><th>消耗</th><th>CTR</th><th>成交金额</th><th>ROI</th><th>对应笔记</th></tr></thead><tbody>${relatedSmall.map((s) => {
        const shared = s.ranks.filter((r) => ranks.includes(r));
        const rows = analyzedNotes().filter((n) => shared.includes(n.rank));
        const spend = rows.reduce((a, n) => a + n.spend, 0);
        const revenue = rows.reduce((a, n) => a + n.revenue, 0);
        const impressions = rows.reduce((a, n) => a + n.impressions, 0);
        const clicks = rows.reduce((a, n) => a + n.clicks, 0);
        return `<tr><td><strong>${esc(s.label)}</strong></td><td>${rows.length}</td><td>${money(spend)}</td><td>${pct(clicks / impressions, 2)}</td><td>${money(revenue)}</td><td class="roi">${roi(revenue / spend)}</td><td><div class="note-links">${shared.map((r) => `<a class="rank-link" href="#note-${r}" data-open-note="${r}" title="查看第${r}篇">${r}</a>`).join("")}</div></td></tr>`;
      }).join("")}</tbody></table></div>`;
  return `<article class="accordion"><button class="accordion-toggle" aria-expanded="false">
    <div class="accordion-title"><strong>${esc(group.label)}</strong><span>${kind === "theme" ? "主题" : "大卖点"} · ${group.noteCount}篇覆盖</span></div>
    <div class="acc-metric"><strong>${money(group.spend)}</strong><span>消耗</span></div>
    <div class="acc-metric"><strong>${pct(group.ctr, 2)}</strong><span>CTR</span></div>
    <div class="acc-metric"><strong>${money(group.revenue)}</strong><span>成交金额</span></div>
    <div class="acc-metric"><strong>${roi(group.roi)}</strong><span>聚合ROI</span></div>
    <div class="acc-metric"><strong>${roi(group.medianRoi)}</strong><span>中位ROI</span></div>
    <div class="chevron">⌄</div>
  </button><div class="accordion-content">${content}</div></article>`;
}

function groupsView(kind) {
  const items = kind === "theme" ? state.data.themeSummary : state.data.bigPointSummary;
  return `<section class="section-head"><div><h2>${kind === "theme" ? "笔记主题 → 单篇内容" : "大卖点 → 小卖点 → 单篇笔记"}</h2><p>${kind === "theme" ? "主题是整篇笔记主要在讲什么" : "大卖点是购买理由，小卖点是可汇总的具体证据或利益点"}</p></div><button class="secondary-action" id="toggle-all">全部展开</button></section>
    ${kind === "point" ? `<div class="quality-banner"><div class="quality-copy"><h2>卖点统计口径</h2><p>一篇笔记可覆盖多个卖点，因此各卖点消耗不可相加。教程、打卡、答疑属于内容主题，不直接当作产品卖点。</p></div><div class="quality-stat"><span>大卖点</span><strong>${items.length}</strong><small>沿用抖音逻辑并补充选购与附加护理</small></div><div class="quality-stat"><span>小卖点</span><strong>${state.data.smallPointSummary.length}</strong><small>4-10字可汇总标签</small></div><div class="quality-stat"><span>评论口径</span><strong>排除</strong><small>不参与任何判断</small></div></div>` : ""}
    <section class="section">${items.map((x) => accordion(x, kind)).join("")}</section>`;
}

function noteRow(n, compact = false) {
  if (!n) return "";
  const canOpen = n.analysisStatus === "已分析";
  return `<article class="note-row" id="note-${n.rank}">
    <div class="rank-badge">${n.rank}</div>
    <div class="note-main">${canOpen ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title || `笔记 ${n.rank}`)}</a>` : `<strong>${esc(n.title || `笔记 ${n.rank}`)}</strong>`}
      <p>${esc(n.topicSummary || (n.analysisStatus === "链接错配" ? "内容ID与链接指向不同笔记，禁止代入分析" : "页面暂未可靠读取"))} · ${esc(n.noteType || "类型待确认")}</p>
      ${canOpen ? `<div class="tags"><span class="tag">${esc(n.theme)}</span>${n.smallPoints.map((p) => `<span class="tag point">${esc(p)}</span>`).join("")}</div>` : `<div class="tags"><span class="status ${statusClass(n.analysisStatus)}">${esc(n.analysisStatus)}</span></div>`}
    </div>
    <div class="note-points">${canOpen ? `<div class="muted">覆盖大卖点</div><div class="tags">${n.bigPoints.map((p) => `<span class="tag">${esc(p)}</span>`).join("")}</div>` : `<div class="audit-id">内容ID ${esc(n.contentId)}</div>`}</div>
    <div class="note-metric"><span>消耗</span><strong>${money(n.spend)}</strong></div>
    <div class="note-metric"><span>CTR</span><strong>${pct(n.ctr, 2)}</strong></div>
    <div class="note-metric"><span>成交金额</span><strong>${money(n.revenue)}</strong></div>
    <div class="note-metric"><span>ROI</span><strong class="roi">${roi(n.roi)}</strong></div>
  </article>`;
}

function notesView() {
  const themes = state.data.themeSummary.map((x) => x.label);
  let rows = state.data.notes;
  const f = state.filters;
  if (f.status !== "全部") rows = rows.filter((n) => n.analysisStatus === f.status);
  if (f.type !== "全部") rows = rows.filter((n) => n.noteType === f.type);
  if (f.theme !== "全部") rows = rows.filter((n) => n.theme === f.theme);
  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((n) => `${n.rank} ${n.title || ""} ${n.topicSummary || ""} ${(n.smallPoints || []).join(" ")}`.toLowerCase().includes(q));
  }
  return `<section class="section-head"><div><h2>单篇笔记</h2><p>点击标题打开原始笔记；错配与待验证笔记不展示内容标签</p></div></section>
    <div class="filters"><input id="q-filter" value="${esc(f.q)}" placeholder="搜索排名、标题、主题或卖点" /><select id="status-filter"><option>全部</option>${["已分析","链接错配","待登录验证"].map((x) => `<option ${f.status === x ? "selected" : ""}>${x}</option>`).join("")}</select><select id="type-filter"><option>全部</option>${["图文","视频"].map((x) => `<option ${f.type === x ? "selected" : ""}>${x}</option>`).join("")}</select><select id="theme-filter"><option>全部</option>${themes.map((x) => `<option ${f.theme === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
    <p class="result-count">当前显示 ${rows.length} 篇</p><div class="notes-list">${rows.length ? rows.map((n) => noteRow(n)).join("") : document.querySelector("#empty-template").innerHTML}</div>`;
}

function auditView() {
  const bad = state.data.notes.filter((n) => n.analysisStatus === "链接错配");
  const pending = state.data.notes.filter((n) => n.analysisStatus === "待登录验证");
  const renderRows = (rows) => rows.map((n) => `<div class="audit-row"><strong>#${n.rank}</strong><div><span class="status ${statusClass(n.analysisStatus)}">${n.analysisStatus}</span><div class="audit-id">表内ID ${esc(n.contentId)}</div></div><div><strong>${esc(n.title || "未取得正确内容")}</strong><div class="audit-id">链接ID ${esc((n.finalUrl || n.url).match(/explore\/([0-9a-f]{24})/i)?.[1] || "无法提取")}</div></div><div><strong>${money(n.spend)}</strong><div class="muted">ROI ${roi(n.roi)}</div></div></div>`).join("");
  return `${qualityBanner()}<section class="audit-group"><div class="audit-head"><h3>链接错配 · ${bad.length}篇</h3><p>Excel内容ID与链接中的笔记ID不一致，页面标题只用于证明错配，不用于该行内容分析。</p></div>${renderRows(bad)}</section>
    <section class="audit-group"><div class="audit-head"><h3>待登录验证 · ${pending.length}篇</h3><p>内容ID与链接一致，但页面未能稳定读取；在补齐内容前保持空标签。</p></div>${renderRows(pending)}</section>`;
}

function docsView() {
  const viewRows = [
    ["复盘总览", "整体投放结果、图文/视频差异、各主题效率", "快速判断当前主力形式、有效内容方向和主要风险"],
    ["主题 → 笔记", "每篇笔记主要在讲什么，如选购测评、教程答疑、效果打卡", "比较不同内容方向的消耗承接和成交效率，并下钻到单篇"],
    ["卖点 → 笔记", "用户为什么愿意购买，按大卖点、小卖点和对应笔记展开", "判断哪些购买理由值得复制，哪些只靠少数爆款拉高"],
    ["单篇笔记", "每篇笔记的主题、卖点、类型及投放数据", "逐篇复核内容判断，寻找可复用标题、表达和产品承接方式"],
    ["链接审计", "内容ID与链接的一致性及页面读取状态", "隔离错配或打不开的笔记，防止错误内容进入统计；当前无需继续处理"],
  ];
  const conceptRows = [
    ["笔记主题", "整篇笔记主要在讲什么，是内容结构分类", "一篇笔记只保留一个主主题"],
    ["大卖点", "支撑购买的主要理由，如部位毛发痛点、冰感温和技术", "一篇笔记可以覆盖多个大卖点"],
    ["小卖点", "可跨笔记汇总的具体短标签，如手毛痛点、智能识肤", "一篇笔记可以包含多个小卖点，并归入对应大卖点"],
    ["笔记类型", "图文笔记或视频笔记", "用于比较两种内容形态的投放效率"],
    ["已分析", "内容ID与链接一致，且笔记内容可读取", "进入主题、卖点和内容效率统计"],
    ["链接错配 / 待验证", "链接指向错误内容，或页面暂时无法可靠读取", "不进入内容统计，暂不继续处理"],
  ];
  const metricRows = [
    ["篇数 / 覆盖笔记", "命中该主题或卖点的笔记数量", "卖点允许一篇多选，不同卖点篇数不可相加"],
    ["消耗", "该范围内笔记的广告投放消耗之和", "判断内容方向能否承接预算和持续放量"],
    ["曝光量", "广告被展示的总次数", "作为CTR的分母"],
    ["点击量", "广告获得的总点击次数", "反映内容带动进一步了解的能力"],
    ["CTR", "点击量 ÷ 曝光量", "判断封面、标题和内容切入是否能吸引点击"],
    ["转化金额 / 成交金额", "归因到笔记的成交金额之和", "衡量内容带来的成交规模"],
    ["ROI", "成交金额 ÷ 消耗", "单篇笔记的投入产出效率"],
    ["聚合ROI", "某主题或卖点全部笔记成交金额之和 ÷ 消耗之和", "判断该方向整体投放效率，不能简单平均单篇ROI"],
    ["中位ROI", "同组单篇ROI排序后的中间值", "判断典型笔记表现，降低个别爆款对结论的干扰"],
    ["头部成交占比", "组内成交金额最高的一篇 ÷ 该组总成交金额", "占比越高，聚合结果越依赖单篇爆款，复制时需谨慎"],
    ["点赞 / 收藏", "笔记公开互动数据", "仅作内容兴趣辅助信号，不替代投放成交判断"],
    ["评论", "本次按刷量处理", "评论数与评论内容均已排除，不展示、不参与分析"],
  ];
  const table = (headers, rows) => `<div class="table-wrap"><table class="data-table docs-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? `<strong>${cell}</strong>` : cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<section class="docs-intro"><span class="docs-kicker">READ ME</span><h2>这份复盘怎么看</h2><p>先在“复盘总览”确认整体方向，再从“主题 → 笔记”和“卖点 → 笔记”定位有效内容，最后到“单篇笔记”复核具体表达。内容统计仅基于101篇可确认笔记。</p></section>
    <section class="section panel"><div class="panel-head"><h3>不同页面代表什么</h3><p>每个页面对应一个复盘问题，避免把内容主题、产品卖点和数据审计混在一起</p></div>${table(["页面", "表格内容", "使用目的"], viewRows)}</section>
    <section class="section panel"><div class="panel-head"><h3>内容分类定义</h3><p>主题回答“在讲什么”，卖点回答“为什么买”</p></div>${table(["字段", "定义", "统计规则"], conceptRows)}</section>
    <section class="section panel"><div class="panel-head"><h3>投放字段定义</h3><p>同时看规模、点击和成交，避免只用单一ROI判断素材</p></div>${table(["字段", "计算或含义", "复盘目的"], metricRows)}</section>
    <section class="section methodology"><h3>阅读注意事项</h3><div class="method-grid"><div><strong>卖点数据不可相加</strong><p>一篇笔记可能覆盖多个大卖点和小卖点，因此各卖点消耗、成交金额存在重复覆盖。</p></div><div><strong>高聚合ROI不等于稳定</strong><p>需要同时查看中位ROI和头部成交占比，判断结果是否由少数爆款拉动。</p></div><div><strong>互动只作辅助</strong><p>点赞、收藏用于观察内容兴趣；最终仍以消耗承接、CTR、成交金额和ROI判断投放价值。</p></div></div></section>`;
}

function bindInteractions() {
  document.querySelectorAll(".accordion-toggle").forEach((button) => button.addEventListener("click", () => {
    const item = button.closest(".accordion");
    item.classList.toggle("open");
    button.setAttribute("aria-expanded", item.classList.contains("open"));
  }));
  const all = document.querySelector("#toggle-all");
  if (all) all.addEventListener("click", () => {
    const items = [...document.querySelectorAll(".accordion")];
    const open = items.some((x) => !x.classList.contains("open"));
    items.forEach((x) => { x.classList.toggle("open", open); x.querySelector("button").setAttribute("aria-expanded", open); });
    all.textContent = open ? "全部收起" : "全部展开";
  });
  document.querySelectorAll("[data-open-note]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    state.view = "notes";
    state.filters = { q: String(link.dataset.openNote), status: "已分析", type: "全部", theme: "全部" };
    selectTab("notes");
  }));
  const filterIds = ["q-filter", "status-filter", "type-filter", "theme-filter"];
  filterIds.forEach((id) => document.querySelector(`#${id}`)?.addEventListener(id === "q-filter" ? "input" : "change", (event) => {
    const key = { "q-filter": "q", "status-filter": "status", "type-filter": "type", "theme-filter": "theme" }[id];
    state.filters[key] = event.target.value;
    render();
    document.querySelector(`#${id}`)?.focus();
  }));
}

function render() {
  const views = { overview, themes: () => groupsView("theme"), points: () => groupsView("point"), notes: notesView, audit: auditView, docs: docsView };
  app.innerHTML = views[state.view]();
  bindInteractions();
}

function selectTab(view, updateUrl = true) {
  state.view = view;
  if (updateUrl) history.replaceState(null, "", `${location.pathname}?view=${view}`);
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.view)));

fetch("./data.json")
  .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
  .then((data) => { state.data = data; selectTab(state.view, false); })
  .catch((error) => { app.innerHTML = `<div class="empty"><strong>数据读取失败</strong><p>${esc(error.message)}。请通过本地服务器或 GitHub Pages 打开页面。</p></div>`; });
