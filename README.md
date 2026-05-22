# Infinix 产品线看板系统

多人实时协作的产品线管理看板，支持 GT / NOTE / HOT / SMT 四大产品线。

## 功能特性

- 按产品线分类展示产品
- 支持 3D图、六视图、配色图、CMF工艺图 上传展示
- 多维度筛选（年份、产品阶段、配色）
- 上市表现记录（正向/负面反馈）
- 工艺特点与问题复盘沉淀
- 下一代设计建议
- **多人实时协作**（所有同事共享同一套数据）

## 技术栈

- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **前端**: HTML + CSS + JavaScript
- **部署**: Railway (推荐) / Render (备用)

## 本地运行

```bash
cd infinix-kanban
npm install
npm start
```

访问 http://localhost:3000

## 部署到 Railway（推荐）

1. Fork 本仓库到您的 GitHub
2. 登录 [Railway](https://railway.app)
3. 点击 "New Project" → "Deploy from GitHub"
4. 选择 `infinix-kanban` 仓库
5. Railway 会自动检测 NIXPACKS 构建
6. 部署完成后，点击项目 → Settings → Networking → 开启 "Public Networking"
7. 获取公网 URL，分享给同事

## 部署到 Render（备用）

1. Fork 本仓库到您的 GitHub
2. 登录 [Render](https://render.com)
3. 点击 "New" → "Web Service"
4. 连接 GitHub，选择仓库
5. 设置：
   - Build Command: `npm install`
   - Start Command: `npm start`
6. 点击 "Create Web Service"
7. 等待部署完成，获取公网 URL

## 数据存储

- SQLite 数据库文件: `infinix_kanban.db`
- 图片以 Base64 格式存储在数据库中
- Railway 免费版会有持久化问题，建议使用 Render 或上传到 GitHub 后重新部署

## 注意事项

- 请定期备份 `infinix_kanban.db` 文件
- Railway 免费实例休眠后数据可能丢失
- 建议使用 Render 的持久磁盘或付费版 Railway