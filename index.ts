import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
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
            max-width: 800px;
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
        }
        
        .description {
            background: var(--card-background);
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .description h2 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 1rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
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
        
        <div class="description">
            <h2>关于本插件</h2>
            <p>「干净的页面」是一个浏览器扩展，帮助用户过滤搜索结果中的无用站点。它支持自定义规则，让您的搜索结果更加清晰有效。</p>
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