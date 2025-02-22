# Iframe Proxy Fetch Demo

这个项目演示了如何使用iframe作为代理来绕过API的referer限制，同时保持API调用的简单性和透明性。

## 项目背景

在Web开发中，有时我们会遇到这样的情况：某些API接口只允许来自特定页面的请求（通过检查referer）。这种情况下，如果我们想在其他页面调用这些API，就需要一个代理机制。

传统的解决方案通常是：
1. 在服务器端设置代理
2. 使用CORS配置
3. 修改API实现

本项目提供了一个创新的前端解决方案，通过巧妙使用iframe来实现API代理，无需修改服务器端代码。

## 工作原理

1. 创建一个隐藏的iframe，加载允许访问API的页面
2. 在iframe加载完成后，替换其window.fetch函数
3. 当需要调用API时，在iframe的上下文中执行fetch请求
4. 由于请求来自iframe，因此referer为代理页面的URL，可以通过服务器的检查

关键技术点：
- 使用iframe作为代理
- 动态替换iframe中的fetch函数
- 保持与原生fetch API相同的接口
- 处理响应克隆和数据传递

## 项目结构

```
src/
  ├── server.ts              # Express服务器
  └── public/
      ├── index.html        # 主页面
      ├── inner.html        # 被代理的页面
      └── js/
          ├── api-proxy.js  # API代理实现
          └── demo.js       # 演示代码
```

## 使用方法

1. 安装依赖：
```bash
pnpm install
```

2. 启动服务器：
```bash
pnpm start
```

3. 访问 http://localhost:3000

## API代理使用示例

```typescript
import { ApiProxy } from './js/api-proxy.js';

// 创建代理实例，可以配置多个选项
const api = new ApiProxy({
    // 必需：指定代理页面的URL
    proxyPage: '/proxy-page.html',
    
    // 可选：是否在创建时立即初始化iframe（默认false）
    initializeImmediately: true,
    
    // 可选：自定义iframe的样式
    iframeStyle: {
        display: 'none',
        width: '0',
        height: '0',
        border: 'none'
    },
    
    // 可选：自定义错误处理
    onError: (error) => {
        console.error('API Proxy Error:', error);
    }
});

// 使用方式与原生fetch完全相同
const response = await api.fetch('/api/someEndpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: 'example' })
});

const data = await response.json();

// 在不需要时销毁实例
api.destroy();
```

## 配置选项

### ProxyOptions 接口

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| proxyPage | string | 是 | - | 代理页面的URL |
| initializeImmediately | boolean | 否 | false | 是否在创建时立即初始化iframe |
| iframeStyle | Partial<CSSStyleDeclaration> | 否 | { display: 'none' } | iframe的CSS样式 |
| onError | (error: Error) => void | 否 | console.error | 错误处理函数 |

## 特点

1. **高度可配置**：
   - 可以指定任意页面作为代理
   - 支持自定义样式和错误处理
   - 可以控制iframe的初始化时机

2. **透明性**：
   - 使用方式与原生fetch完全相同
   - 不需要了解代理实现细节
   - 支持所有fetch选项（method、headers、body等）

3. **可靠性**：
   - 自动管理iframe生命周期
   - 处理响应克隆，确保数据正确传递
   - 完整的错误处理和超时机制
   - 资源清理机制

4. **类型安全**：
   - 完整的TypeScript类型定义
   - 编译时错误检查

## 注意事项

1. 首次API调用会有轻微延迟（iframe加载时间）
   - 可以通过设置 `initializeImmediately: true` 预加载来优化
2. 需要确保代理页面可访问
3. 代理页面应该尽可能简单，以减少加载时间
4. 记得在不需要时调用 `destroy()` 方法清理资源

## 许可证

MIT 