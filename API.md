我会帮你将API改造成RESTful风格。RESTful API的主要特点是：
1. 使用HTTP方法表示操作类型（GET/POST/PUT/DELETE）
2. 使用名词复数形式表示资源
3. 使用URL参数表示资源层级关系
4. 使用查询参数进行过滤和分页

让我帮你重新设计API：

# RESTful API 文档

## 1. 用户认证模块 (Auth)

### 1.1 用户登录
- **接口**: POST `/auth/tokens`
- **描述**: 创建新的访问令牌
- **请求体**:
  ```typescript
  {
    phone: string;
    password: string;
  }
  ```
- **响应**: TokenResponseDto
- **状态码**: 
  - 201: 登录成功
  - 401: 登录失败

### 1.2 短信验证码登录
- **接口**: POST `/auth/tokens/sms`
- **描述**: 使用短信验证码创建访问令牌
- **请求体**:
  ```typescript
  {
    phone: string;
    code: string;
  }
  ```
- **响应**: TokenResponseDto
- **状态码**: 
  - 201: 登录成功
  - 401: 登录失败

### 1.3 用户注册
- **接口**: POST `/users`
- **描述**: 创建新用户
- **请求体**:
  ```typescript
  {
    phone: string;
    password: string;
    code: string;
    name: string;
  }
  ```
- **响应**: TokenResponseDto
- **状态码**: 
  - 201: 注册成功
  - 400: 注册失败

### 1.4 获取用户信息
- **接口**: GET `/users/me`
- **描述**: 获取当前登录用户的信息
- **认证**: 需要Bearer Token
- **响应**: ProfileResponseDto
- **状态码**: 
  - 200: 获取成功
  - 404: 用户不存在

### 1.5 更新用户信息
- **接口**: PUT `/users/me`
- **描述**: 更新当前用户信息
- **认证**: 需要Bearer Token
- **请求体**: UpdateProfileDto
- **响应**: ProfileResponseDto
- **状态码**: 
  - 200: 更新成功
  - 404: 用户不存在

### 1.6 更新用户密码
- **接口**: PUT `/users/me/password`
- **描述**: 更新当前用户密码
- **认证**: 需要Bearer Token
- **请求体**:
  ```typescript
  {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **响应**: MessageResponseDto
- **状态码**: 
  - 200: 密码更新成功
  - 401: 当前密码错误
  - 404: 用户不存在

### 1.7 发送短信验证码
- **接口**: POST `/verification-codes`
- **描述**: 创建新的验证码
- **请求体**:
  ```typescript
  {
    phone: string;
  }
  ```
- **响应**: VerificationResponseDto
- **状态码**: 
  - 201: 验证码发送成功
  - 429: 请求过于频繁

### 1.8 验证短信验证码
- **接口**: POST `/verification-codes/verify`
- **描述**: 验证短信验证码
- **请求体**:
  ```typescript
  {
    phone: string;
    code: string;
  }
  ```
- **响应**: MessageResponseDto
- **状态码**: 
  - 200: 验证成功
  - 400: 验证码错误

### 1.9 刷新访问令牌
- **接口**: POST `/auth/tokens/refresh`
- **描述**: 使用刷新令牌获取新的访问令牌
- **请求体**:
  ```typescript
  {
    refresh_token: string;
  }
  ```
- **响应**: TokenResponseDto
- **状态码**: 
  - 200: 刷新成功
  - 401: 刷新令牌无效

### 1.10 退出登录
- **接口**: POST `/auth/logout`
- **描述**: 退出当前登录
- **认证**: 需要Bearer Token
- **响应**: MessageResponseDto
- **状态码**: 
  - 200: 退出成功

### 1.11 重置密码
- **接口**: POST `/auth/reset-password`
- **描述**: 通过验证码重置密码
- **请求体**:
  ```typescript
  {
    phone: string;
    code: string;
    newPassword: string;
  }
  ```
- **响应**: MessageResponseDto
- **状态码**: 
  - 200: 密码重置成功
  - 400: 验证码错误或用户不存在

## 2. 会话管理模块 (Conversation)

### 2.1 获取对话列表
- **接口**: GET `/conversations`
- **描述**: 获取对话列表
- **认证**: 需要Bearer Token
- **查询参数**:
  ```typescript
  {
    page?: number;
    limit?: number;
    title?: string;
  }
  ```
- **状态码**: 
  - 200: 成功获取对话列表

### 2.2 创建新对话
- **接口**: POST `/conversations`
- **描述**: 创建新的对话
- **认证**: 需要Bearer Token
- **请求体**:
  ```typescript
  {
    title: string;
    context: string;
  }
  ```
- **状态码**: 
  - 201: 对话创建成功

### 2.3 获取对话详情
- **接口**: GET `/conversations/:id`
- **描述**: 获取指定对话的详细信息
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **状态码**: 
  - 200: 成功获取对话详情
  - 404: 对话不存在

### 2.4 更新对话
- **接口**: PUT `/conversations/:id`
- **描述**: 更新对话信息
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **请求体**: UpdateConversationDto
- **状态码**: 
  - 200: 更新成功
  - 404: 对话不存在

### 2.5 删除对话
- **接口**: DELETE `/conversations/:id`
- **描述**: 删除对话
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **状态码**: 
  - 204: 删除成功
  - 404: 对话不存在

### 2.6 发送消息（流式响应）
- **接口**: POST `/conversations/:id/messages`
- **描述**: 在对话中发送新消息
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **请求体**:
  ```typescript
  {
    content: string;
  }
  ```
- **响应**: Server-Sent Events 流
- **状态码**: 
  - 200: 消息发送成功

## 3. 文件管理模块 (File)

### 3.1 获取文件列表
- **接口**: GET `/files`
- **描述**: 获取文件列表
- **认证**: 需要Bearer Token
- **查询参数**:
  ```typescript
  {
    page?: number;
    limit?: number;
  }
  ```
- **状态码**: 
  - 200: 成功获取文件列表

### 3.2 上传文件
- **接口**: POST `/files`
- **描述**: 上传新文件
- **认证**: 需要Bearer Token
- **请求格式**: multipart/form-data
- **参数**: file (文件)
- **限制**: 
  - 文件大小: 最大5MB
  - 文件类型: jpg, jpeg, png, pdf
- **状态码**: 
  - 201: 文件上传成功

### 3.3 获取文件
- **接口**: GET `/files/:id`
- **描述**: 获取文件内容
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **状态码**: 
  - 200: 成功获取文件
  - 404: 文件不存在

### 3.4 删除文件
- **接口**: DELETE `/files/:id`
- **描述**: 删除文件
- **认证**: 需要Bearer Token
- **参数**: id (路径参数)
- **状态码**: 
  - 204: 删除成功
  - 404: 文件不存在

## 4. AI服务模块 (AI)

### 4.1 文本转语音
- **接口**: POST `/tts`
- **描述**: 将文本转换为语音
- **认证**: 需要Bearer Token
- **请求体**:
  ```typescript
  {
    text: string;
    voice?: string;
    language?: string;
  }
  ```
- **响应**: TtsResponseDto
  ```typescript
  {
    audioUrl: string;
    duration: number;
  }
  ```
- **状态码**: 
  - 201: 转换成功

## 通用说明

1. **认证方式**: 所有需要认证的接口都需要在请求头中添加 `Authorization: Bearer <token>`

2. **HTTP方法使用**:
   - GET: 获取资源
   - POST: 创建资源
   - PUT: 更新资源
   - DELETE: 删除资源

3. **状态码使用**:
   - 200: 成功
   - 201: 创建成功
   - 204: 删除成功（无内容返回）
   - 400: 请求错误
   - 401: 未认证
   - 403: 无权限
   - 404: 资源不存在
   - 429: 请求过于频繁

4. **响应格式**: 所有接口都返回JSON格式的响应

5. **分页参数**:
   - page: 页码（从1开始）
   - limit: 每页数量

6. **文件上传**: 文件上传接口支持的最大文件大小为5MB，支持的文件类型为jpg、jpeg、png和pdf

7. **流式响应**: 对话接口支持Server-Sent Events (SSE)的流式响应

8. **密码规则**:
   - 最小长度: 6位
   - 建议包含: 字母、数字和特殊字符

这个RESTful API设计遵循了REST架构风格的最佳实践，使用了更规范的HTTP方法和资源命名方式，使API更加直观和易于理解。每个资源都有清晰的CRUD操作对应，并且使用了合适的HTTP状态码来表示操作结果。
