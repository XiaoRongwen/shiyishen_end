# 食品委托生产监管系统 - 后端

基于 Express + Prisma + MySQL 的食品委托生产监管后端服务。

## 功能特性

- 微信小程序手机号登录
- 企业信息管理（委托方/受托方）
- 合作关系管理（申请、审核、解除）
- JWT 认证授权

## 技术栈

- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL
- JWT

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

主要配置项：
- `DATABASE_URL`: MySQL 数据库连接字符串
- `JWT_SECRET`: JWT 密钥
- `WECHAT_APP_ID`: 微信小程序 AppID
- `WECHAT_APP_SECRET`: 微信小程序 AppSecret

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库结构
pnpm db:push
```

### 4. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

## API 文档

### 认证接口

#### POST /api/v1/auth/wechat-login
微信手机号登录

请求体：
```json
{
  "code": "微信登录code",
  "phoneCode": "手机号授权code"
}
```

### 企业信息接口

#### POST /api/v1/companies
创建/更新企业信息（需要认证）

#### GET /api/v1/companies/my
获取当前用户的企业信息（需要认证）

#### GET /api/v1/companies/search?keyword=xxx
搜索委托方企业（需要认证）

### 合作关系接口

#### POST /api/v1/partnerships/apply
受托方申请绑定委托方（需要认证）

#### POST /api/v1/partnerships/audit
委托方审核绑定申请（需要认证）

#### GET /api/v1/partnerships
获取合作关系列表（需要认证）

#### DELETE /api/v1/partnerships/:id
解除合作关系（需要认证）

## 数据库结构

### User (用户表)
- id: 主键
- openid: 微信 openid
- phone: 手机号
- avatar: 头像
- nickname: 昵称

### Company (企业信息表)
- id: 主键
- userId: 用户ID
- type: 企业类型（principal/trustee）
- name: 企业名称
- address: 企业地址
- legalPerson: 法定代表人
- contact: 联系电话
- licenseNo: 许可证号
- licenseType: 许可证类型
- businessLicense: 营业执照号
- productionCapacity: 生产能力说明

### Partnership (合作关系表)
- id: 主键
- principalId: 委托方企业ID
- trusteeId: 受托方企业ID
- status: 状态（pending/approved/rejected）
- applyTime: 申请时间
- auditTime: 审核时间
- rejectReason: 拒绝原因

## 开发说明

- 使用 TypeScript 开发
- 遵循 RESTful API 设计规范
- 使用 Prisma 进行数据库操作
- JWT 认证保护接口
