import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const STATS_FILE = "./stats.json";

// 加载或初始化统计数据
let stats = {
  total_installs: 0,
  filtered_results: 0,
  last_update: new Date().toLocaleString("zh-CN", { hour12: false }),
  clients: new Set()
};

try {
  const data = await Deno.readTextFile(STATS_FILE);
  const obj = JSON.parse(data);
  stats.total_installs = obj.total_installs || 0;
  stats.filtered_results = obj.filtered_results || 0;
  stats.last_update = obj.last_update || stats.last_update;
  stats.clients = new Set(obj.clients || []);
} catch {}

async function saveStats() {
  await Deno.writeTextFile(STATS_FILE, JSON.stringify({
    total_installs: stats.total_installs,
    filtered_results: stats.filtered_results,
    last_update: stats.last_update,
    clients: Array.from(stats.clients)
  }));
}

const app = new Application();
const router = new Router();

// 主页：四大卡片区块
router.get("/", (ctx) => {
  ctx.response.type = "text/html";
  ctx.response.body = `<!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <title>干净的页面 - 统计数据</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { background: #f5f7fa; font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif; color: #222; margin:0; }
      .container { max-width: 900px; margin: 0 auto; padding: 32px 8px; }
      h1 { text-align: center; color: #4285f4; font-size: 2.2rem; margin-bottom: 28px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(66,133,244,0.07); padding: 28px 24px 22px 24px; display: flex; flex-direction: column; gap: 14px; }
      .card h2 { color: #4285f4; font-size: 1.3rem; margin-bottom: 10px; }
      .stat-list { list-style: none; padding: 0; margin: 0; }
      .stat-list li { font-size: 1.1rem; margin-bottom: 8px; }
      .stat-value { font-size: 2.1rem; color: #3367d6; font-weight: bold; margin-right: 8px; }
      .trend-placeholder { height: 120px; background: linear-gradient(90deg,#e3e7ef 30%,#f5f7fa 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 1.1rem; }
      .github-link { color: #24292e; text-decoration: none; font-weight: 500; }
      .github-link:hover { text-decoration: underline; }
      .author-info { font-size: 1.05rem; }
      .author-info a { color: #4285f4; text-decoration: none; }
      .author-info a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>干净的页面 - 统计数据</h1>
      <div class="grid">
        <!-- 统计结果 -->
        <div class="card">
          <h2>统计总览</h2>
          <ul class="stat-list">
            <li><span class="stat-value">${stats.total_installs}</span>总安装量</li>
            <li><span class="stat-value">${stats.filtered_results}</span>已过滤结果</li>
            <li>最后更新时间：${stats.last_update}</li>
          </ul>
        </div>
        <!-- 安装次数趋势 -->
        <div class="card">
          <h2>安装次数趋势</h2>
          <div class="trend-placeholder">（此处可接入折线图/趋势图，当前为占位）</div>
        </div>
        <!-- GitHub项目信息 -->
        <div class="card">
          <h2>GitHub 项目</h2>
          <div>
            <a class="github-link" href="https://github.com/qinyuanchun03/ResultClean" target="_blank">
              qinyuanchun03/ResultClean
            </a>
            <div style="margin-top:8px; color:#555;">开源浏览器扩展，支持自定义规则过滤主流搜索引擎结果。</div>
            <div style="margin-top:8px;">Star数：<span id="star-count">--</span></div>
          </div>
        </div>
        <!-- 作者信息 -->
        <div class="card">
          <h2>作者信息</h2>
          <div class="author-info">
            <div>作者：秦元春</div>
            <div>邮箱：<a href="mailto:qinyuanchun03@gmail.com">qinyuanchun03@gmail.com</a></div>
            <div>个人主页：<a href="https://github.com/qinyuanchun03" target="_blank">https://github.com/qinyuanchun03</a></div>
          </div>
        </div>
      </div>
    </div>
    <script>
      // 获取GitHub Star数
      fetch('https://api.github.com/repos/qinyuanchun03/ResultClean')
        .then(r=>r.json()).then(d=>{
          if(d.stargazers_count!==undefined) document.getElementById('star-count').textContent = d.stargazers_count;
        });
    </script>
  </body>
  </html>`;
});

// JSON统计接口
router.get("/api/stats", (ctx) => {
  ctx.response.headers.set("content-type", "application/json; charset=utf-8");
  ctx.response.body = {
    total_installs: stats.total_installs,
    filtered_results: stats.filtered_results,
    last_update: stats.last_update
  };
});

// 统计数据上报接口
router.post("/api/stats", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  if (body.type === "install" && body.clientId) {
    if (!stats.clients.has(body.clientId)) {
      stats.total_installs++;
      stats.clients.add(body.clientId);
    }
  } else if (body.type === "filter") {
    stats.filtered_results += body.count || 1;
  }
  stats.last_update = new Date().toLocaleString("zh-CN", { hour12: false });
  await saveStats();
  ctx.response.body = { success: true };
});

app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`服务器运行在端口 ${port}`);
await app.listen({ port }); 