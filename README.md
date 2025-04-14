# PocketLawyer 后端服务

## 项目描述

PocketLawyer 后端是一个基于 NestJS 框架开发的后端服务，为 PocketLawyer 应用提供强大且可扩展的 API，用于法律咨询和文档管理。

## 项目结构

```
src/
├── common/           # 通用组件、工具和共享代码
├── configurations/   # 项目配置（环境变量、数据库等）
├── decorator/       # 用于扩展 NestJS 功能的自定义装饰器
├── exception-handler/# 全局异常处理
├── guard/           # 认证和授权守卫
├── interceptor/     # 请求/响应拦截器
├── lib/             # 第三方库封装和自定义库
├── metadata/        # 常量、枚举和其他元数据
├── middlewares/     # 请求/响应管道中间件
├── modules/         # 业务逻辑模块
└── public-dto/      # 公共数据传输对象
```

## 环境要求

- Node.js (v18 或更高版本)
- pnpm (v8 或更高版本)

## 安装

```bash
$ pnpm install
```

## 运行应用

```bash
# 开发环境
$ pnpm run start

# 监视模式
$ pnpm run start:dev

# 生产环境
$ pnpm run start:prod
```

## 测试

```bash
# 单元测试
$ pnpm run test

# 端到端测试
$ pnpm run test:e2e

# 测试覆盖率
$ pnpm run test:cov
```


## 贡献指南

1. 为你的功能创建新分支
2. 进行代码修改
3. 提交拉取请求

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 待办事项

### 初始设置

- [x] 添加 prisma
- [x] 添加 swagger
- [ ] 添加 logger
- [ ] 添加 nestjs-cls
- [ ] 添加 nestjs-sentry
- [ ] 添加 nestjs-i18n
- [ ] 添加 nestjs-redis
- [ ] 添加 nestjs-throttler
- [ ] 添加 nestjs-bullmq
- [ ] 添加 nestjs-schedule
- [ ] 添加 nestjs-casl
- [ ] 添加认证
- [ ] 添加用户模块
- [ ] 添加文档模块