import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// 统计数据接口
interface Stats {
  installations: number;
  filteredResults: number;
  lastUpdated: number;
  clients: Set<string>;
}

// 初始化统计数据
const stats: Stats = {
  installations: 0,
  filteredResults: 0,
  lastUpdated: Date.now(),
  clients: new Set()
};

// 数据文件路径
const STATS_FILE = "./data/stats.json";

// 确保数据目录存在
try {
  await Deno.mkdir("./data", { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    console.error("Failed to create data directory:", error);
  }
}

// 加载已存在的统计数据
try {
  const data = await Deno.readTextFile(STATS_FILE);
  const loadedStats = JSON.parse(data);
  stats.installations = loadedStats.installations || 0;
  stats.filteredResults = loadedStats.filteredResults || 0;
  stats.lastUpdated = loadedStats.lastUpdated || Date.now();
  stats.clients = new Set(loadedStats.clients || []);
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    console.error("Error loading stats:", error);
  }
}

// 保存统计数据
async function saveStats() {
  try {
    await Deno.writeTextFile(STATS_FILE, JSON.stringify({
      ...stats,
      clients: Array.from(stats.clients)
    }, null, 2));
  } catch (error) {
    console.error("Error saving stats:", error);
  }
}

// 定期保存数据（每5分钟）
setInterval(saveStats, 5 * 60 * 1000);

const app = new Application();
const router = new Router();

// 健康检查
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok", timestamp: Date.now() };
});

// 接收统计数据
router.post("/stats", async (ctx) => {
  try {
    const body = ctx.request.body();
    const { clientId, type, count = 1 } = await body.value;

    if (type === "install") {
      if (!stats.clients.has(clientId)) {
        stats.installations++;
        stats.clients.add(clientId);
      }
    } else if (type === "filter") {
      stats.filteredResults += count;
    }

    stats.lastUpdated = Date.now();
    await saveStats();

    ctx.response.body = { success: true };
  } catch (error) {
    console.error("Error processing stats:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process stats" };
  }
});

// 获取统计数据摘要
router.get("/stats/summary", (ctx) => {
  ctx.response.body = {
    installations: stats.installations,
    filteredResults: stats.filteredResults,
    lastUpdated: stats.lastUpdated
  };
});

// 中间件
app.use(oakCors({
  origin: "*", // 允许所有来源，您可以根据需要限制
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

app.listen({ port }); 