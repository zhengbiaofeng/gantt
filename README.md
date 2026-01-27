# Vue 3 智能甘特图系统 (Smart Gantt Chart System)

基于 Vue 3 + Vite 构建的高级项目管理甘特图解决方案，专注于复杂任务调度、多维视角分析与可视化交互。

## 核心功能 (Key Features)

### 1. 多维视角切换 (Multi-Perspective View)
支持从不同维度查看项目进度，满足不同角色的管理需求：
- **默认视角**：按项目阶段展示任务。
- **单位视角**：按负责单位聚合任务。
- **角色视角**：按岗位角色聚合任务。
- **人员视角**：按具体执行人员聚合任务。

### 2. 智能交互与导航 (Smart Interaction)
- **自动定位 (Auto-Scroll)**：点击左侧任务名称，甘特图时间轴自动平滑滚动至该任务的开始时间，解决长周期项目中找任务难的问题。
- **高亮聚焦 (Highlighting)**：选中任务时，对应的甘特图行高亮显示，提升视觉识别度。
- **关键节点标记 (Critical Nodes)**：关键路径上的任务在左侧任务栏自动标记红色星标图标，一目了然。

### 3. 深度详情面板 (Detailed Inspector)
右侧详情面板提供全面的任务信息：
- **基础信息**：任务名称、起止时间、所属单位、角色及负责人。
- **依赖关系**：可视化展示前置任务（Predecessors）和后置任务（Successors），辅助排程分析。
- **分组详情**：在单位/角色视角下，点击分组头可查看该组下的所有任务列表。

### 4. 冲突检测与可视化 (Conflict Detection)
- 提供独立的 **冲突视图**，自动检测并展示同一人员在重叠时间段内的任务冲突，帮助管理者合理分配人力资源。

### 5. 现代化架构 (Modern Architecture)
- **数据与业务分离**：采用 Mock API 设计 (`src/api/mockData.js`)，模拟异步数据请求与延迟。
- **Vue 3 Composition API**：逻辑复用性强，代码结构清晰。
- **E2E 测试覆盖**：集成 Playwright 进行关键功能的自动化测试（滚动、点击、详情展示）。

## 技术栈 (Tech Stack)

- **框架**: Vue 3
- **构建工具**: Vite
- **甘特图核心**: g-ganttastic
- **测试框架**: Playwright

## 快速开始 (Quick Start)

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 运行自动化测试
```bash
npx playwright test
```

## 项目结构
- `src/components/GanttDemo.vue`: 甘特图核心业务组件
- `src/api/mockData.js`: 模拟数据生成与 API 接口层
- `tests/`: Playwright 自动化测试脚本
