# Backend API Service

一个基于 Node.js + Express + TypeScript + Prisma的后台服务，提供用户认证、文件上传等基础功能。

## 🚀 主要功能

- ✅ 用户注册和登录
- ✅ JWT 身份验证
- ✅ 文件上传和访问
- ✅ 速率限制防护
- ✅ 统一错误处理
- ✅ TypeScript 支持
- ✅ 环境配置管理

## 📋 API 接口

### 用户认证 (v1)

| 方法 | 路径                       | 描述             | 认证 |
| ---- | -------------------------- | ---------------- | ---- |
| POST | `/api/v1/auth/register`    | 用户注册         | ❌   |
| POST | `/api/v1/auth/login`       | 用户登录         | ❌   |
| POST | `/api/v1/auth/refresh`     | 刷新令牌         | ✅   |
| GET  | `/api/v1/auth/me`          | 获取当前用户信息 | ✅   |
| PUT  | `/api/v1/auth/password`    | 修改密码         | ✅   |
| POST | `/api/v1/auth/logout`      | 用户登出         | ✅   |
| GET  | `/api/v1/auth/check-email` | 检查邮箱可用性   | ❌   |

### 文件管理 (v1)

| 方法   | 路径                      | 描述     | 认证 |
| ------ | ------------------------- | -------- | ---- |
| POST   | `/api/v1/upload`          | 上传文件 | ✅   |
| GET    | `/api/v1/files/:filename` | 访问文件 | ❌   |
| DELETE | `/api/v1/files/:id`       | 删除文件 | ✅   |

### 系统接口

| 方法 | 路径      | 描述                           |
| ---- | --------- | ------------------------------ |
| GET  | `/health` | 健康检查（包含数据库连接状态） |
| GET  | `/api`    | API 版本信息                   |
| GET  | `/api/v1` | API v1 信息                    |

## 🚀 快速开始

## 所需环境

在开始之前，请确保您的系统已安装以下环境。您可以通过下面的命令验证版本：

### Node.js

- **版本要求**：>= 18.0.0
- **下载链接**：https://nodejs.org/
- **验证安装**：
  ```bash
  node --version    # 应显示 v18.0.0 或更高版本
  npm --version     # 应显示 9.0.0 或更高版本
  ```

### MySQL

- **版本要求**：5.7 或更高（推荐 8.0）
- **下载链接**：https://dev.mysql.com/downloads/mysql/
- **验证安装**：
  ```bash
  mysql --version   # 应显示 mysql  Ver 5.7.x 或更高
  ```
- **启动服务**（以本地运行为例）：
  - Windows：在服务管理器中启动 MySQL 服务
  - macOS/Linux：`brew services start mysql` 或 `sudo systemctl start mysql`

### Redis

- **版本要求**：>= 5.0（推荐 6.0 或更高）
- **下载链接**：https://redis.io/download
- **验证安装**：
  ```bash
  redis-cli --version  # 应显示版本信息
  ```
- **启动服务**：
  - Windows：安装后自启动或者在服务管理器中启动 Redis 服务
  - macOS/Linux：`brew services start redis` 或 `redis-server`

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

```bash
cp env.example .env
```

编辑 `.env` 文件，设置必需的配置：

## 3. 设置数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma db push
```

创建管理员账号

运行以下命令来创建默认的管理员账号：

```bash
npm run db:seed
```

## 默认管理员账号信息

- **用户名**: admin
- **邮箱**: admin@admin.com
- **密码**: admin

## 注意事项

无

## 相关命令

- `npm run db:seed` - 创建管理员账号
- `npm run db:studio` - 打开 Prisma Studio 查看数据库
- `npm run db:push` - 推送数据库结构变更
- `npm run db:reset` - 重置数据库（会删除所有数据）

## 4. 启动服务

```bash
npm run dev
```

## 5. 测试 API

访问 http://localhost:4000/health 检查服务状态。

### 检查 API 状态

```bash
curl http://localhost:4000/health
```

就这么简单！🎉

## ⚙️ 配置选项

所有配置项都在 `.env` 文件中设置。首先复制 `env.example` 文件：

```bash
cp env.example .env
```

然后根据您的环境需要修改配置。以下是完整的配置说明：

### 🖥️ 服务器配置

```env
PORT=4000
# 应用运行端口，默认 4000，访问地址为 http://localhost:4000

NODE_ENV=development
# 运行环境选项：
# - development: 开发环境（启用调试日志、热重载等）
# - production: 生产环境（性能优化、安全加固）
# - test: 测试环境（禁用外部服务）
```

### 🗄️ 数据库配置

```env
DATABASE_URL="mysql://username:password@localhost:3306/db_name"
# 数据库连接字符串，格式为 mysql://用户名:密码@主机:端口/数据库名
# 例如：mysql://root:123456@localhost:3306/backend_db

# 连接池配置 - 建议根据服务器性能调整
DB_CONNECTION_LIMIT=10
# 连接池最大连接数，生产环境建议 20-50

DB_CONNECT_TIMEOUT=60000
# 连接超时时间（毫秒），默认 60 秒

DB_QUERY_TIMEOUT=10000
# 单个查询超时时间（毫秒），默认 10 秒

DB_POOL_TIMEOUT=10000
# 连接池获取连接超时时间（毫秒），默认 10 秒

DB_IDLE_TIMEOUT=600000
# 空闲连接超时时间（毫秒），默认 10 分钟，超时后连接关闭

DB_MAX_LIFETIME=1800000
# 连接最大生命周期（毫秒），默认 30 分钟，超过此时间的连接会被回收
```

### 🔑 JWT 认证配置

```env
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-characters"
# JWT 签名密钥，用于签发和验证 token，必须足够长和随机（至少 32 字符）
# 生产环境建议使用 128+ 字符的随机字符串
# ⚠️ 注意：改变此密钥会导致所有现有 token 失效

JWT_EXPIRES_IN=24h
# Access Token 有效期，例如 24h（24 小时）、30d（30 天）
# 建议设置 1-7 小时

JWT_REFRESH_EXPIRES_IN=7d
# Refresh Token 有效期，用于获取新的 Access Token
# 建议设置 7-30 天

JWT_ISSUER=backend-api
# Token 发行者（issuer），可用于验证 token 来源，通常设置为应用标识

JWT_AUDIENCE=frontend-app
# Token 受众（audience），可用于限制 token 使用的对象
```

### 🌐 CORS 跨域配置

```env
CORS_ORIGIN=http://localhost:3000
# 允许跨域访问的前端地址
# 支持多个地址：http://localhost:3000,http://localhost:3001,https://example.com
```

### 🔒 密码策略配置

```env
PASSWORD_MIN_LENGTH=6
# 密码最小长度，建议 8 字符以上

PASSWORD_MAX_LENGTH=128
# 密码最大长度，防止过长密码导致的性能问题
```

### 🚦 速率限制配置

```env
RATE_LIMIT_WINDOW_MS=900000
# 限流时间窗口（毫秒），默认 900000ms = 15 分钟
# 在此时间窗口内统计请求数

RATE_LIMIT_MAX_REQUESTS=5
# 在时间窗口内允许的最大请求数
# 建议针对不同 API 端点设置不同的限制
```

### 🔐 Bcrypt 加密配置

```env
BCRYPT_SALT_ROUNDS=12
# Bcrypt 加密盐的复杂度（轮数）
# - 10: 较快，安全性较好
# - 12: 中等（推荐值）
# - 14+: 更安全但速度较慢
# 注意：增加此值会使密码哈希变慢，生产环境建议 10-12
```

### 📁 文件上传配置

```env
UPLOAD_DIR=uploads
# 文件上传保存目录，相对于项目根目录

MAX_FILE_SIZE=10485760
# 最大文件大小（字节）
# 默认 10485760 = 10MB
# 常见大小：
#   - 5MB   = 5242880
#   - 10MB  = 10485760
#   - 50MB  = 52428800
#   - 100MB = 104857600

ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx
# 允许上传的文件类型，用逗号分隔（不含点号）
```

### 📱 微信配置（可选）

```env
WECHAT_APP_ID=your_wechat_app_id
# 微信公众号的 AppID，从微信公众平台获取

WECHAT_APP_SECRET=your_wechat_app_secret
# 微信公众号的 AppSecret，从微信公众平台获取
```

### 🔴 Redis 配置

```env
# 连接方式 1：使用连接 URL（推荐）
REDIS_URL=redis://localhost:6379
# Redis 连接 URL，格式为 redis://[密码@]主机:端口/数据库号
# 例如：
#   - redis://localhost:6379          # 无密码
#   - redis://:password@localhost:6379 # 有密码
#   - redis://redis.example.com:6380  # 远程 Redis

# 连接方式 2：分开配置（REDIS_URL 优先使用）
REDIS_HOST=localhost
# Redis 服务器地址，默认为本地

REDIS_PORT=6379
# Redis 服务器端口，默认为 6379

REDIS_PASSWORD=
# Redis 密码，如果 Redis 设置了密码则填写，否则留空

REDIS_DB=0
# Redis 数据库号，默认为 0，通常保持为 0
```

---

### 📌 配置最佳实践

1. **生产环境检查清单**

   - 设置强大的 `JWT_SECRET`（至少 32 字符的随机字符串）
   - 使用强密码连接 MySQL 和 Redis
   - 设置合理的速率限制参数
   - 启用 HTTPS 并正确配置 `CORS_ORIGIN`
   - 定期轮换 `JWT_SECRET`

2. **敏感信息保护**

   - 不要将 `.env` 文件提交到版本控制
   - 在生产服务器上使用环境变量或密钥管理服务
   - 定期审查和更新敏感配置

3. **性能优化建议**
   - 根据并发量调整 `DB_CONNECTION_LIMIT`
   - 根据实际需求调整 `BCRYPT_SALT_ROUNDS`
   - 为不同 API 端点配置不同的速率限制

## 📁 项目结构

```
src/
├── config/           # 配置管理
├── controllers/      # 控制器
│   ├── authController.ts
│   └── fileController.ts
├── middleware/       # 中间件
│   ├── authMiddleware.ts
│   ├── errorHandler.ts
│   └── uploadMiddleware.ts
├── routes/          # 路由定义
│   ├── auth.ts
│   ├── file.ts
│   └── api.ts
├── utils/           # 工具函数
└── index.ts         # 应用入口

prisma/
├── schema.prisma    # 数据库模型
└── migrations/      # 数据库迁移

uploads/             # 文件上传目录
```

## 🔒 安全特性

- **身份验证**: JWT 令牌验证
- **密码加密**: bcrypt 哈希加密
- **文件安全**: 文件类型和大小限制
- **速率限制**: 防止暴力破解攻击
- **输入验证**: 严格的数据验证
- **错误处理**: 统一的错误响应格式
- **CORS 配置**: 跨域请求控制

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### PM2 部署

使用 PM2 进行进程管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看日志
pm2 logs

# 停止应用
pm2 stop all

# 重启应用
pm2 restart all
```

### 环境变量检查


## 📝 开发说明

### 添加新的 API 接口

1. 在 `src/controllers/` 中创建控制器
2. 在 `src/routes/` 中定义路由
3. 在 `src/routes/api.ts` 中注册路由
4. 更新数据库模型（如需要）

### 数据库操作

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma db push --force-reset

# 生成客户端
npx prisma generate
```
