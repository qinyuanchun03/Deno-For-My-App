# 干净的页面 - 统计服务

这是「干净的页面」浏览器扩展的统计服务后端，使用 Deno 和 MongoDB 构建。

## 功能

- 记录插件安装数据
- 统计过滤结果数量
- 提供实时统计数据API

## 环境要求

- Deno 1.37 或更高版本
- MongoDB 4.4 或更高版本

## 本地开发

1. 安装 Deno：
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

2. 配置环境变量：
   复制 `.env.example` 到 `.env` 并根据需要修改配置：
   ```
   MONGODB_URI=mongodb://localhost:27017
   PORT=8000
   ALLOWED_ORIGINS=chrome-extension://*
   ```

3. 运行开发服务器：
   ```bash
   deno task dev
   ```

## 部署

### Deno Deploy

1. 在 [Deno Deploy](https://deno.com/deploy) 创建新项目

2. 配置环境变量：
   - `MONGODB_URI`: MongoDB 连接字符串
   - `PORT`: 服务端口（Deno Deploy 会自动设置）
   - `ALLOWED_ORIGINS`: 允许的源（默认允许所有扩展）

3. 部署命令：
   ```bash
   deployctl deploy --project=your-project-name main.ts
   ```

### 手动部署

1. 安装 Deno

2. 配置环境变量

3. 运行服务：
   ```bash
   deno task start
   ```

## API 端点

### POST /stats
接收统计数据

请求体：
```json
{
  "clientId": "string",
  "type": "install" | "filter",
  "count": number,
  "timestamp": number,
  "browser": "string",
  "searchEngine": "string"
}
```

### GET /stats/summary
获取统计摘要

响应：
```json
{
  "installations": number,
  "filteredResults": number,
  "lastUpdated": number
}
```

## 注意事项

1. 确保 MongoDB 服务正在运行
2. 在生产环境中使用安全的 MongoDB 连接字符串
3. 根据需要配置 CORS 策略

## 许可证

MIT 