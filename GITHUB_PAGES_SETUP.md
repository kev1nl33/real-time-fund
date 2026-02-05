# 🚀 GitHub Pages + Supabase 部署指南

## 架构说明

- **前端**：GitHub Pages（静态托管）
- **后端**：Supabase（数据库 + 直接调用）
- **优势**：完全免费、无需服务器、多设备同步

---

## 第一步：创建 Supabase 项目（3分钟）

1. 访问 https://supabase.com
2. 点击 "New Project"
3. 填写：
   - Name: `real-time-fund`
   - Database Password: 设置一个强密码（记住它）
   - Region: `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 点击 "Create new project"
5. 等待 1-2 分钟创建完成

---

## 第二步：初始化数据库（2分钟）

1. 在 Supabase Dashboard，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-schema.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 "Run" 执行

✅ 看到 "Success. No rows returned" 说明成功！

---

## 第三步：获取 API 凭据（1分钟）

1. 在 Supabase Dashboard，点击左侧 "Settings" → "API"
2. 记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 第四步：配置 GitHub Secrets（2分钟）

1. 访问你的 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加两个 secrets：

**Secret 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: 你的 Project URL

**Secret 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: 你的 anon public key

---

## 第五步：修改 GitHub Actions 配置（1分钟）

编辑 `.github/workflows/deploy.yml`（如果没有就创建）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 第六步：推送代码并部署（1分钟）

```bash
cd /Users/liran/Documents/03-Github/real-time-fund
git add .
git commit -m "feat: 集成 Supabase 后端"
git push origin main
```

GitHub Actions 会自动：
1. 构建项目
2. 注入 Supabase 凭据
3. 部署到 GitHub Pages

---

## 第七步：导入初始数据（可选）

### 方式一：通过 Supabase Dashboard

1. 在 Supabase Dashboard，点击 "Table Editor"
2. 选择 `funds` 表
3. 点击 "Insert row"
4. 手动添加你的 8 只基金

### 方式二：通过 SQL

在 SQL Editor 中执行：

```sql
INSERT INTO funds (user_id, fund_code, fund_name, shares, cost, group_name) VALUES
('kevin', '000218', '国泰黄金ETF联接A', 84672.74, 305889.77, '核心仓-黄金'),
('kevin', '007044', '博道沪深300指数增强A', 176756.71, 327726.45, '核心仓-沪深300'),
('kevin', '270023', '广发全球精选股票(QDII)A', 54810.17, 229583.42, '卫星仓-美股'),
('kevin', '005698', '华夏全球科技先锋混合(QDII)A', 41608.57, 83851.76, '卫星仓-美股'),
('kevin', '011839', '天弘中证人工智能主题指数A', 33267.96, 56000, '卫星仓-AI'),
('kevin', '012348', '天弘恒生科技ETF联接(QDII)A', 30940.17, 30000, '卫星仓-港股'),
('kevin', '015282', '华安恒生科技ETF联接(QDII)A', 7036.25, 10000, '卫星仓-港股'),
('kevin', '016707', '华夏有色金属ETF联接A', 107060.75, 220657.97, '卫星仓-有色金属');
```

**注意**：需要先访问网页，让系统生成你的 `user_id`，然后在 localStorage 中查看，替换上面的 `'kevin'`。

---

## ✅ 完成！

访问你的 GitHub Pages 地址：
- `https://kev1nl33.github.io/real-time-fund/`

应该能看到：
- ✅ 实时估值正常显示
- ✅ 添加的基金会保存到 Supabase
- ✅ 刷新页面数据不丢失
- ✅ 多设备访问数据同步

---

## 🔍 如何查看你的 user_id

1. 访问网页
2. 打开浏览器开发者工具（F12）
3. 切换到 "Console" 标签
4. 输入：`localStorage.getItem('fund_user_id')`
5. 复制显示的 ID

---

## 📊 数据同步原理

1. **首次访问**：自动生成 `user_id`，存储在 localStorage
2. **添加基金**：保存到 Supabase，关联你的 `user_id`
3. **换设备访问**：
   - 方式一：手动导入/导出 `user_id`
   - 方式二：未来添加登录功能

---

## 🆘 故障排查

### 数据没有保存
- 检查浏览器 Console 是否有错误
- 检查 Supabase 凭据是否正确配置
- 检查 GitHub Secrets 是否设置

### 跨设备数据不同步
- 确保使用相同的 `user_id`
- 可以手动复制 localStorage 中的 `fund_user_id`

### GitHub Actions 构建失败
- 检查 Secrets 是否正确设置
- 查看 Actions 日志中的错误信息

---

## 💡 未来优化

1. **添加登录功能**
   - 使用 Supabase Auth
   - 邮箱/密码登录
   - 自动跨设备同步

2. **数据导出/导入**
   - 导出为 JSON
   - 一键导入到新设备

3. **分享功能**
   - 生成分享链接
   - 其他人可以查看（只读）

---

## 📝 本地开发

如果想在本地测试：

```bash
# 创建 .env.local
cp .env.local.example .env.local
# 编辑 .env.local，填入 Supabase 凭据

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000
