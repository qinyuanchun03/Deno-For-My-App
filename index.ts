import { Application, Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// HTML模板
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>干净的页面 - 统计数据</title>
    <style>
        :root {
            --primary-color: #4285f4;
            --text-color: #202124;
            --background-color: #f8f9fa;
            --card-background: #ffffff;
            --border-color: #dadce0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
            padding: 2rem;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: var(--card-background);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card h2 {
            font-size: 1.25rem;
            color: var(--text-color);
            margin-bottom: 1rem;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .update-time {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }
        
        .info-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .description {
            background: var(--card-background);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .description h2 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .contact-info {
            background: var(--card-background);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .contact-info h2 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .qr-code {
            max-width: 200px;
            margin: 1rem auto;
            border-radius: 8px;
        }
        
        .github-link {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background-color: #24292e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background-color 0.2s;
        }
        
        .github-link:hover {
            background-color: #1a1f24;
        }
        
        .github-icon {
            margin-right: 0.5rem;
            vertical-align: middle;
        }
        
        @media (max-width: 768px) {
            .info-section {
                grid-template-columns: 1fr;
            }
            
            body {
                padding: 1rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .qr-code {
                max-width: 150px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>干净的页面 - 统计数据</h1>
            <p>实时统计数据展示</p>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h2>总安装量</h2>
                <div class="stat-value" id="installations">-</div>
            </div>
            <div class="stat-card">
                <h2>已过滤结果</h2>
                <div class="stat-value" id="filteredResults">-</div>
            </div>
        </div>
        
        <p class="update-time" id="lastUpdated">最后更新时间：-</p>
        
        <div class="info-section">
            <div class="description">
                <h2>关于本插件</h2>
                <p>「干净的页面」是一个浏览器扩展，帮助用户过滤搜索结果中的无用站点。它支持自定义规则，让您的搜索结果更加清晰有效。</p>
                <p style="margin-top: 1rem;">
                    <a href="https://github.com/qinyuanchun03/ResultClean/" class="github-link" target="_blank">
                        <svg class="github-icon" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                        GitHub 仓库
                    </a>
                </p>
            </div>
            <div class="contact-info">
                <h2>联系作者</h2>
                <img src="/wechat.jpg" alt="关注作者的公众号" class="qr-code">
                <p>扫码关注作者</p>
            </div>
        </div>
    </div>
    
    <script>
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
        }
        
        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        async function updateStats() {
            try {
                const response = await fetch('/stats/summary');
                const data = await response.json();
                
                document.getElementById('installations').textContent = formatNumber(data.installations);
                document.getElementById('filteredResults').textContent = formatNumber(data.filteredResults);
                document.getElementById('lastUpdated').textContent = '最后更新时间：' + formatDate(data.lastUpdated);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }
        
        // 初始加载
        updateStats();
        
        // 每30秒更新一次
        setInterval(updateStats, 30000);
    </script>
</body>
</html>`;

// 统计数据接口
interface Stats {
  installations: number;
  filteredResults: number;
  lastUpdated: number;
  clients: string[];
}

// 初始化 KV 存储
const kv = await Deno.openKv();

// 获取统计数据
async function getStats(): Promise<Stats> {
  const installations = (await kv.get(["stats", "installations"])).value as number || 0;
  const filteredResults = (await kv.get(["stats", "filteredResults"])).value as number || 0;
  const lastUpdated = (await kv.get(["stats", "lastUpdated"])).value as number || Date.now();
  const clients = (await kv.get(["stats", "clients"])).value as string[] || [];

  return {
    installations,
    filteredResults,
    lastUpdated,
    clients
  };
}

// 更新统计数据
async function updateStats(updates: Partial<Stats>) {
  const atomic = kv.atomic();

  if (updates.installations !== undefined) {
    atomic.set(["stats", "installations"], updates.installations);
  }
  if (updates.filteredResults !== undefined) {
    atomic.set(["stats", "filteredResults"], updates.filteredResults);
  }
  if (updates.lastUpdated !== undefined) {
    atomic.set(["stats", "lastUpdated"], updates.lastUpdated);
  }
  if (updates.clients !== undefined) {
    atomic.set(["stats", "clients"], updates.clients);
  }

  await atomic.commit();
}

const app = new Application();
const router = new Router();

// 静态文件服务
app.use(async (context, next) => {
  if (context.request.url.pathname.startsWith('/static')) {
    await send(context, context.request.url.pathname, {
      root: `${Deno.cwd()}/static`,
    });
  } else {
    await next();
  }
});

// 根路径返回统计页面
router.get("/", (ctx) => {
  ctx.response.type = "text/html";
  ctx.response.body = HTML_TEMPLATE;
});

// 健康检查
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok", timestamp: Date.now() };
});

// 接收统计数据
router.post("/stats", async (ctx) => {
  try {
    const body = ctx.request.body();
    const { clientId, type, count = 1 } = await body.value;
    const stats = await getStats();

    if (type === "install") {
      if (!stats.clients.includes(clientId)) {
        stats.installations++;
        stats.clients.push(clientId);
        await updateStats({
          installations: stats.installations,
          clients: stats.clients,
          lastUpdated: Date.now()
        });
      }
    } else if (type === "filter") {
      stats.filteredResults += count;
      await updateStats({
        filteredResults: stats.filteredResults,
        lastUpdated: Date.now()
      });
    }

    ctx.response.body = { success: true };
  } catch (error) {
    console.error("Error processing stats:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process stats" };
  }
});

// 获取统计数据摘要
router.get("/stats/summary", async (ctx) => {
  try {
    const stats = await getStats();
    ctx.response.body = {
      installations: stats.installations,
      filteredResults: stats.filteredResults,
      lastUpdated: stats.lastUpdated
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch stats" };
  }
});

// 中间件
app.use(oakCors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.addEventListener("error", (evt) => {
  console.error("Server error:", evt.error);
});

// 启动服务器
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server running on port ${port}`);

await app.listen({ port }); 