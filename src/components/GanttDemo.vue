<template>
  <div class="gantt-container" :style="{ width: props.width, height: props.height }">
    <div class="left-panel">
      <div class="main-controls">
        <div class="view-switcher">
          <label>功能视图：</label>
          <select v-model="currentView">
            <option value="dependency">依赖关系视图</option>
            <option value="conflict">资源冲突视图</option>
          </select>
        </div>

        <!-- 图例区域 (移至此处) -->
        <div class="legend-container">
          <div v-if="currentView === 'dependency'" class="legend">
            <span class="dot dependency-source"></span> 被依赖
            <span class="dot dependency-target"></span> 依赖
          </div>
          <div v-if="currentView === 'conflict'" class="legend">
            <span class="box existing"></span> 现有任务
            <span class="box new"></span> 方案新增
            <span class="spacer">|</span>
            <span class="box conflict-high"></span> 高风险
            <span class="box conflict-medium"></span> 中风险
            <span class="box conflict-low"></span> 低风险
          </div>
        </div>
      </div>

      <!-- 依赖关系视图 -->
      <div v-if="currentView === 'dependency'" class="dependency-view-container">

        <!-- 左侧独立侧边栏 -->
        <div class="gantt-sidebar">
          <!-- 侧边栏列表：行标题 -->
          <div class="sidebar-list" ref="sidebarListRef" @scroll="onSidebarScroll">
            <!-- 侧边栏头部：移入列表内部以实现 Sticky 效果 -->
            <div class="sidebar-header">
              <div class="perspective-switcher">
                <label>任务视角</label>
                <select v-model="currentPerspective">
                  <option value="taskGroup">按阶段</option>
                  <option value="unit">按单位</option>
                  <option value="role">按角色</option>
                  <option value="person">按人员</option>
                </select>
              </div>
            </div>

            <div v-for="(row, index) in dependencyRows" :key="index" class="sidebar-item" :class="{
              'is-phase': row.type === 'phase',
              'is-task': row.type === 'task',
              'active': selectedTaskIndex === index
            }" @click="handleTaskClick(row, index)">
              <svg v-if="row.tags && row.tags.includes('关键')" class="critical-icon" title="关键节点" viewBox="0 0 1024 1024"
                version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                <path
                  d="M512 74l138.6 280.8L960 399.8 736 618l52.9 308L512 820.2 235.1 926l52.9-308L64 399.8l309.4-45L512 74z"
                  fill="#f56c6c" />
              </svg>
              {{ row.label }}
            </div>
          </div>
        </div>

        <!-- 右侧甘特图区域 -->
        <div class="gantt-main-area">
          <!-- 头部（时间轴） -->
          <div class="chart-header-wrapper" ref="headerWrapperRef">
            <div class="gantt-header-content" :style="{ width: ganttWidth }">
              <g-gantt-chart :chart-start="chartStart" :chart-end="chartEnd" :precision="precision"
                bar-start="myBeginDate" bar-end="myEndDate" row-label-width="0px" grid>
                <template #upper-timeunit="{ date }">
                  {{ date.getMonth() + 1 }}月{{ date.getDate() }}日
                </template>
                <template #timeunit="{ date }">
                  {{ date.getHours() }}
                </template>
              </g-gantt-chart>
            </div>
          </div>

          <!-- 内容（条形图） -->
          <div class="chart-wrapper" ref="chartWrapperRef" @scroll="onChartScroll">
            <div class="gantt-scroll-content" :style="{ width: ganttWidth }">
              <g-gantt-chart :chart-start="chartStart" :chart-end="chartEnd" :precision="precision"
                bar-start="myBeginDate" bar-end="myEndDate" @drag-bar="onDragBar" row-label-width="0px" grid>
                <template #upper-timeunit="{ date }">
                  {{ date.getMonth() + 1 }}月{{ date.getDate() }}日
                </template>
                <template #timeunit="{ date }">
                  {{ date.getHours() }}
                </template>
                <g-gantt-row v-for="(row, index) in dependencyRows" :key="index" :label="row.label" :bars="row.bars"
                  highlight-on-hover :class="{ 'gantt-row-active': selectedTaskIndex === index }">
                  <template #bar-label="{ bar }">
                    <div :id="bar.ganttBarConfig.id" class="gantt-bar-content"
                      :style="{ background: bar.ganttBarConfig.style.background || bar.ganttBarConfig.style.backgroundColor }"
                      @click.stop="handleBarClick(bar)" @mouseenter="checkOverflow" @mouseleave="resetOverflow">
                      <span>{{ bar.ganttBarConfig.label }}</span>
                      <span v-for="tag in bar.ganttBarConfig.tags" :key="tag" class="task-tag"
                        :class="{ 'tag-key': tag === '关' }">
                        {{ tag }}
                      </span>
                    </div>
                  </template>
                </g-gantt-row>
              </g-gantt-chart>

              <!-- 使用 SVG 绘制连线 -->
              <svg class="gantt-lines">
                <template v-for="(line, index) in dependencyLines" :key="index">
                  <!-- 隐形点击热区（粗线条） -->
                  <path :d="line.d" class="dependency-line-hit-area" fill="none"
                    @click="handleLineClick(line, $event)" />
                  <!-- 可见线条 -->
                  <path :d="line.d" class="dependency-line" fill="none" marker-start="url(#circle-start)"
                    marker-end="url(#circle-end)" />
                </template>
                <defs>
                  <!-- 起点圆圈：红色同心圆设计 -->
                  <marker id="circle-start" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <circle cx="4" cy="4" r="3" fill="white" stroke="#f56c6c" stroke-width="1" />
                    <circle cx="4" cy="4" r="1.5" fill="#f56c6c" />
                  </marker>
                  <!-- 终点圆圈：淡绿色同心圆设计 -->
                  <marker id="circle-end" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <circle cx="4" cy="4" r="3" fill="white" stroke="#67c23a" stroke-width="1" />
                    <circle cx="4" cy="4" r="1.5" fill="#67c23a" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源冲突视图 -->
      <div v-if="currentView === 'conflict'" class="dependency-view-container">

        <!-- 左侧独立侧边栏 -->
        <div class="gantt-sidebar">
          <!-- 侧边栏列表：行标题 -->
          <div class="sidebar-list" ref="conflictSidebarListRef" @scroll="onConflictSidebarScroll">
            <!-- 侧边栏头部：固定为人员视角，移入内部 Sticky -->
            <div class="sidebar-header">
              <div class="perspective-title">资源视角 (人员)</div>
            </div>

            <div v-for="(row, index) in conflictRows" :key="index" class="sidebar-item"
              :class="{ 'active': selectedConflictPerson === row.label }" @click="handleConflictPersonClick(row)">
              {{ row.label }}
            </div>
          </div>
        </div>

        <!-- 右侧甘特图区域 -->
        <div class="gantt-main-area">
          <!-- 头部（时间轴） -->
          <div class="chart-header-wrapper" ref="conflictHeaderWrapperRef">
            <div class="gantt-header-content" :style="{ width: ganttWidth }">
              <g-gantt-chart :chart-start="chartStart" :chart-end="chartEnd" :precision="precision"
                bar-start="myBeginDate" bar-end="myEndDate" row-label-width="0px" grid>
                <template #upper-timeunit="{ date }">
                  {{ date.getMonth() + 1 }}月{{ date.getDate() }}日
                </template>
                <template #timeunit="{ date }">
                  {{ date.getHours() }}
                </template>
              </g-gantt-chart>
            </div>
          </div>

          <!-- 内容（条形图） -->
          <div class="chart-wrapper" ref="conflictChartWrapperRef" @scroll="onConflictChartScroll">
            <div class="gantt-scroll-content" :style="{ width: ganttWidth }">
              <g-gantt-chart :chart-start="chartStart" :chart-end="chartEnd" :precision="precision"
                bar-start="myBeginDate" bar-end="myEndDate" @drag-bar="onDragBar" row-label-width="0px" grid>
                <template #upper-timeunit="{ date }">
                  {{ date.getMonth() + 1 }}月{{ date.getDate() }}日
                </template>
                <template #timeunit="{ date }">
                  {{ date.getHours() }}
                </template>
                <g-gantt-row v-for="(row, index) in conflictRows" :key="index" :label="row.label" :bars="row.bars"
                  highlight-on-hover>
                  <template #bar-label="{ bar }">
                    <div class="gantt-bar-content conflict-bar-content"
                      :class="{ 'has-conflict': bar.ganttBarConfig.hasConflict }"
                      :style="{ background: bar.ganttBarConfig.style.background || bar.ganttBarConfig.style.backgroundColor }"
                      @click.stop="handleConflictBarClick(bar)" @mouseenter="checkOverflow" @mouseleave="resetOverflow">
                      <span>{{ bar.ganttBarConfig.label }}</span>
                    </div>
                  </template>
                </g-gantt-row>
              </g-gantt-chart>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧详情面板 -->
    <div class="right-panel" v-show="!isRightPanelCollapsed">
      <div class="panel-header">
        <h3>{{ currentView === 'dependency' ? (selectedTask ? '任务详情' : '依赖关系详情') : '资源冲突详情' }}</h3>
        <button class="panel-toggle-btn" @click="isRightPanelCollapsed = true" title="收起面板">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="panel-content">
        <div v-if="currentView === 'dependency'">
          <div v-if="selectedTask" class="detail-card">
            <div class="detail-row">
              <span class="label">任务名称：</span>
              <span class="value">{{ selectedTask.name || selectedTask.label }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.id">
              <span class="label">任务ID：</span>
              <span class="value">{{ selectedTask.id }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.start">
              <span class="label">开始时间：</span>
              <span class="value">{{ selectedTask.start }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.end">
              <span class="label">结束时间：</span>
              <span class="value">{{ selectedTask.end }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.unit">
              <span class="label">所属单位：</span>
              <span class="value">{{ selectedTask.unit }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.role">
              <span class="label">角色：</span>
              <span class="value">{{ selectedTask.role }}</span>
            </div>
            <div class="detail-row" v-if="selectedTask.person">
              <span class="label">人员：</span>
              <span class="value">{{ selectedTask.person }}</span>
            </div>

            <div class="detail-divider"></div>

            <div class="detail-row" v-if="selectedTask.tags && selectedTask.tags.includes('关键')">
              <span class="label">节点类型：</span>
              <span class="value tag critical-tag">★ 关键节点</span>
            </div>

            <div class="detail-row" v-if="selectedTaskPredecessors.length > 0">
              <span class="label">前置任务：</span>
              <div class="value-list">
                <div v-for="(name, idx) in selectedTaskPredecessors" :key="idx" class="list-item">
                  • {{ name }}
                </div>
              </div>
            </div>
            <div class="detail-row" v-else>
              <span class="label">前置任务：</span>
              <span class="value text-gray">无</span>
            </div>

            <div class="detail-row" v-if="selectedTaskSuccessors.length > 0">
              <span class="label">后置任务：</span>
              <div class="value-list">
                <div v-for="(name, idx) in selectedTaskSuccessors" :key="idx" class="list-item">
                  • {{ name }}
                </div>
              </div>
            </div>
            <div class="detail-row" v-else>
              <span class="label">后置任务：</span>
              <span class="value text-gray">无</span>
            </div>
          </div>
          <div v-else-if="selectedGroupTasks.length > 0" class="detail-card">
            <div class="detail-row">
              <span class="label">分组名称：</span>
              <span class="value">{{ selectedGroup }}</span>
            </div>
            <div class="detail-row">
              <span class="label">包含任务数：</span>
              <span class="value">{{ selectedGroupTasks.length }}</span>
            </div>
            <div class="detail-divider"></div>
            <div class="group-task-list">
              <div v-for="task in selectedGroupTasks" :key="task.id" class="group-task-item">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-meta">
                  <span>{{ task.start.split(' ')[1] }} - {{ task.end.split(' ')[1] }}</span>
                  <span v-if="task.role" class="tag">{{ task.role }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="selectedLine" class="detail-card">
            <div class="detail-row">
              <span class="label">前置任务：</span>
              <span class="value">{{ selectedLine.fromTask?.name || selectedLine.relation.from }}</span>
            </div>
            <div class="detail-row">
              <span class="label">后置任务：</span>
              <span class="value">{{ selectedLine.toTask?.name || selectedLine.relation.to }}</span>
            </div>
            <div class="detail-row">
              <span class="label">依赖类型：</span>
              <span class="value">结束-开始 (FS)</span>
            </div>
            <div class="detail-row">
              <span class="label">状态：</span>
              <span class="value tag">正常</span>
            </div>
          </div>
          <div v-else class="empty-state">
            请点击左侧任务名称或右侧连线查看详情
          </div>
        </div>
        <div v-if="currentView === 'conflict'">
          <div v-if="visibleConflictDetails.length > 0" class="conflict-cards">
            <div v-for="item in visibleConflictDetails" :key="item.id" class="conflict-card-new">
              <div class="card-header-person">
                <span class="person-name">{{ item.personName }}</span>
                <span class="header-badge" :class="'level-' + (item.level || 'medium')">{{ getRiskLevelText(item.level)
                  }}</span>
              </div>
              <div class="related-tasks-section conflict-reason-row">
                <div class="section-title">冲突原因：</div>
                <div class="card-time-row">
                  <span class="time-tag">时间冲突 {{ item.time }}</span>
                </div>
              </div>

              <div class="related-tasks-section">
                <div class="section-title">冲突任务：</div>

                <div class="task-detail-card is-existing">
                  <div class="task-card-header">
                    <span class="task-name" @click="openTaskDetail(item, 'task1')">{{ item.task1 }}</span>
                  </div>
                  <div class="task-card-meta">
                    <span class="meta-item">首长重点关注：{{ item.task1IsLeaderFocus ? '是' : '否' }}</span>
                    <span class="meta-item">优先级：{{ item.task1Priority || '高' }}</span>
                    <span class="meta-item">关键节点：{{ item.task1IsCritical ? '是' : '否' }}</span>
                  </div>
                </div>

                <div class="task-detail-card is-new">
                  <div class="task-card-header">
                    <span class="task-name" @click="openTaskDetail(item, 'task2')">{{ item.task2 }}</span>
                  </div>
                  <div class="task-card-meta">
                    <span class="meta-item">首长重点关注：{{ item.task2IsLeaderFocus ? '是' : '否' }}</span>
                    <span class="meta-item">优先级：{{ item.task2Priority || '中' }}</span>
                    <span class="meta-item">关键节点：{{ item.task2IsCritical ? '是' : '否' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            暂无资源冲突风险
          </div>
        </div>
      </div>
    </div>

    <!-- 展开按钮悬浮条 -->
    <div class="expand-panel-trigger" v-if="isRightPanelCollapsed" @click="isRightPanelCollapsed = false"
      title="展开详情面板">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </div>

    <!-- 任务详情弹窗 -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTaskDetailModal" @click.self="showTaskDetailModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>任务详情</h3>
            <button class="close-btn" @click="showTaskDetailModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="detail-item">
              <span class="label">任务名称：</span>
              <span class="value">{{ currentDetailTask.name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">优先级：</span>
              <span class="value">{{ currentDetailTask.priority || '中' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">关键节点：</span>
              <span class="value">{{ currentDetailTask.isCritical ? '是' : '否' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">首长重点关注：</span>
              <span class="value">{{ currentDetailTask.isLeaderFocus ? '是' : '否' }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="primary-btn" @click="showTaskDetailModal = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue"
import { fetchGanttData, fetchConflictData } from '../api/mockData'

const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '100%'
  }
})

const currentView = ref("dependency")
const currentPerspective = ref("taskGroup") // 当前视角
const labelColumnWidth = "200px" // 左侧列宽度

const chartStart = ref("2026-01-18 08:00")
const chartEnd = ref("2026-01-19 09:00")
const precision = ref("hour")

// 数据状态
const rawTasks = ref([])
const taskRelations = ref([])
const conflictRows = ref([])
const conflictDetails = ref([])

const selectedTask = ref(null)
const selectedTaskIndex = ref(null)
const selectedGroup = ref(null)
const selectedGroupTasks = ref([])
const selectedConflictPerson = ref(null) // 新增：选中的冲突人员
const showTaskDetailModal = ref(false)
const currentDetailTask = ref({})

// 新增：计算属性，根据选中的人员过滤冲突详情
const visibleConflictDetails = computed(() => {
  if (!selectedConflictPerson.value) {
    return conflictDetails.value
  }
  return conflictDetails.value.filter(detail => detail.personName === selectedConflictPerson.value)
})

const openTaskDetail = (conflictItem, taskType) => {
  if (taskType === 'task1') {
    currentDetailTask.value = {
      name: conflictItem.task1,
      priority: conflictItem.task1Priority,
      isCritical: conflictItem.task1IsCritical,
      isLeaderFocus: conflictItem.task1IsLeaderFocus
    }
  } else {
    currentDetailTask.value = {
      name: conflictItem.task2,
      priority: conflictItem.task2Priority,
      isCritical: conflictItem.task2IsCritical,
      isLeaderFocus: conflictItem.task2IsLeaderFocus
    }
  }
  showTaskDetailModal.value = true
}

const scrollToTime = (dateStr) => {
  if (!dateStr) return

  // 确定当前使用的滚动容器
  const container = currentView.value === 'dependency' ? chartWrapperRef.value : conflictChartWrapperRef.value
  if (!container) return

  const startDate = new Date(chartStart.value)
  const targetDate = new Date(dateStr)
  const diffHours = (targetDate - startDate) / (1000 * 60 * 60)

  // 计算目标位置 (px)
  const targetX = diffHours * hourWidth
  const containerWidth = container.clientWidth

  // 计算滚动位置：将目标时间点置于视口中间
  // scrollLeft = 目标X - (视口宽度 / 2)
  let scrollLeft = targetX - (containerWidth / 2)

  // 边界检查
  if (scrollLeft < 0) scrollLeft = 0

  // 执行滚动
  // 使用直接赋值以确保生效，并在 requestAnimationFrame 中执行以防止被覆盖
  requestAnimationFrame(() => {
    container.scrollLeft = scrollLeft
  })
}

const handleTaskClick = (row, index) => {
  // 阻止事件冒泡，防止触发全局点击关闭面板
  // 注意：这里是逻辑处理函数，实际的 stop 需要在 template 中添加或者在这里处理 event
  // 但因为我们已经在 handleGlobalClick 中做了 target.closest('.sidebar-item') 判断，
  // 所以这里不需要显式的 stopPropagation，也不会有问题。
  // 为了保险起见，建议在 template 中使用 @click.stop

  selectedTaskIndex.value = index
  selectedLine.value = null // 清除连线选中状态
  isRightPanelCollapsed.value = false // 展开面板

  if (row.type === 'task') {
    selectedGroup.value = null
    selectedGroupTasks.value = []

    // 只有点击任务行才触发（排除阶段标题行）
    // 从 bars 中获取任务详细信息 (bars[0].ganttBarConfig)
    if (row.bars && row.bars.length > 0) {
      // 需要找到对应的原始任务数据以获取更多详情
      const taskId = row.bars[0].ganttBarConfig.id
      const originalTask = rawTasks.value.find(t => t.id === taskId)
      selectedTask.value = originalTask || row.bars[0].ganttBarConfig

      // 自动滚动到任务位置
      if (selectedTask.value && selectedTask.value.start) {
        nextTick(() => {
          scrollToTime(selectedTask.value.start)
        })
      }
    } else {
      selectedTask.value = { name: row.label }
    }
  } else if (row.type === 'group') {
    // 处理分组点击 (单位、角色、人员视角)
    selectedTask.value = null
    selectedGroup.value = row.label

    // 提取该分组下的所有任务
    const tasks = []
    if (row.bars && row.bars.length > 0) {
      row.bars.forEach(bar => {
        const taskId = bar.ganttBarConfig.id
        const originalTask = rawTasks.value.find(t => t.id === taskId)
        if (originalTask) tasks.push(originalTask)
      })
    }
    // 按开始时间排序
    tasks.sort((a, b) => new Date(a.start) - new Date(b.start))
    selectedGroupTasks.value = tasks

    // 自动滚动到第一个任务的位置
    if (tasks.length > 0 && tasks[0].start) {
      nextTick(() => {
        scrollToTime(tasks[0].start)
      })
    }
  }
}

const handleBarClick = (bar) => {
  // 根据 ID 找到原始任务
  const taskId = bar.ganttBarConfig.id
  const task = rawTasks.value.find(t => t.id === taskId)

  if (task) {
    selectedTask.value = task
    selectedLine.value = null
    selectedGroup.value = null
    selectedGroupTasks.value = []
    isRightPanelCollapsed.value = false

    // 同时高亮对应的行
    // 需要找到该任务所在的行索引
    const rowIndex = dependencyRows.value.findIndex(row => {
      if (row.type !== 'task') return false
      return row.bars && row.bars.some(b => b.ganttBarConfig.id === taskId)
    })

    if (rowIndex !== -1) {
      selectedTaskIndex.value = rowIndex
    }
  }
}

const handleConflictPersonClick = (row) => {
  selectedConflictPerson.value = row.label
  isRightPanelCollapsed.value = false
  
  // 如果该人员没有冲突详情（例如王干事），可能需要提示或显示空状态
  // 目前 visibleConflictDetails 会自动变为空数组，显示 "暂无资源冲突风险"
}

const handleConflictBarClick = (bar) => {
  console.log('Conflict bar clicked:', bar)
  isRightPanelCollapsed.value = false
  
  // 根据点击的条形图找到对应的人员
  const foundRow = conflictRows.value.find(row => 
    row.bars.some(b => b.ganttBarConfig.id === bar.ganttBarConfig.id)
  )
  
  if (foundRow) {
    selectedConflictPerson.value = foundRow.label
  }
}

const checkOverflow = (e) => {
  const el = e.currentTarget
  // 增加容差值，避免因边框或子像素渲染导致的误判
  // 只有当内容显著超出容器时才触发
  if (el.scrollWidth > el.clientWidth + 2) {
    el.classList.add('is-overflowing')
  }
}

const resetOverflow = (e) => {
  const el = e.currentTarget
  el.classList.remove('is-overflowing')
}

const selectedTaskPredecessors = computed(() => {
  if (!selectedTask.value || !selectedTask.value.id) return []
  // 找到所有指向当前任务的连线
  const relations = taskRelations.value.filter(r => r.to === selectedTask.value.id)
  return relations.map(r => {
    const fromTask = rawTasks.value.find(t => t.id === r.from)
    return fromTask ? fromTask.name : r.from
  })
})

const selectedTaskSuccessors = computed(() => {
  if (!selectedTask.value || !selectedTask.value.id) return []
  // 找到所有从当前任务出发的连线
  const relations = taskRelations.value.filter(r => r.from === selectedTask.value.id)
  return relations.map(r => {
    const toTask = rawTasks.value.find(t => t.id === r.to)
    return toTask ? toTask.name : r.to
  })
})

// 动态计算 chartEnd，确保有足够的缓冲空间显示任务名称
watch(rawTasks, (tasks) => {
  if (tasks.length > 0) {
    // 1. 找到所有任务中最晚的结束时间
    let maxEndTime = 0
    tasks.forEach(task => {
      const endTime = new Date(task.end).getTime()
      if (endTime > maxEndTime) {
        maxEndTime = endTime
      }
    })

    // 2. 增加 3 小时缓冲 (3 * 60 * 60 * 1000)
    if (maxEndTime > 0) {
      const bufferTime = 3 * 60 * 60 * 1000
      const newEndDate = new Date(maxEndTime + bufferTime)

      // 3. 格式化为 "YYYY-MM-DD HH:mm"
      const pad = (n) => n.toString().padStart(2, '0')
      const formattedEnd = `${newEndDate.getFullYear()}-${pad(newEndDate.getMonth() + 1)}-${pad(newEndDate.getDate())} ${pad(newEndDate.getHours())}:${pad(newEndDate.getMinutes())}`

      // 4. 更新 chartEnd (如果计算出的结束时间比当前的还要晚)
      // 也可以直接覆盖，取决于需求。这里直接覆盖以确保适应数据。
      chartEnd.value = formattedEnd
    }
  }
}, { deep: true })

// 计算甘特图总宽度
const hourWidth = 60 // 每小时宽度 (px)
const ganttWidth = computed(() => {
  const start = new Date(chartStart.value)
  const end = new Date(chartEnd.value)
  const hours = (end - start) / (1000 * 60 * 60)
  return Math.max(hours * hourWidth, 100) + 'px' // 确保有最小宽度
})

// --- 依赖视图数据 (Computed) ---
const dependencyRows = computed(() => {
  const groups = {}

  // 1. 分组
  rawTasks.value.forEach(task => {
    const key = task[currentPerspective.value]
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  })

  // 2. 转换为 Gantt Row 格式
  if (currentPerspective.value === 'taskGroup') {
    // 任务视角：层级化展示 (阶段 -> 任务)
    const rows = []
    Object.keys(groups).forEach(groupName => {
      // 1. 添加阶段行 (作为标题，不放任务条)
      rows.push({
        label: groupName,
        bars: [],
        type: 'phase' // 标记为阶段
      })

      // 2. 添加该阶段下的任务行 (每个任务一行)
      groups[groupName].forEach(task => {
        rows.push({
          label: task.name, // 左侧显示任务名
          tags: task.tags || [], // 传递 tags 到行数据中
          bars: [{
            myBeginDate: task.start,
            myEndDate: task.end,
            ganttBarConfig: {
              id: task.id,
              label: task.name,
              tags: task.tags || [],
              style: {
                background: "linear-gradient(to right, #05436a, #0b69a3)",
                borderRadius: "4px",
                color: "white",
                border: "1px solid #05436a"
              }
            }
          }],
          type: 'task' // 标记为任务
        })
      })
    })
    return rows
  } else {
    // 其他视角：保持原有的分组聚合逻辑 (一个单位一行)
    return Object.keys(groups).map(groupName => ({
      label: groupName,
      bars: groups[groupName].map(task => ({
        myBeginDate: task.start,
        myEndDate: task.end,
        ganttBarConfig: {
          id: task.id,
          label: task.name,
          tags: task.tags || [],
          style: {
            background: "linear-gradient(to right, #05436a, #0b69a3)",
            borderRadius: "4px",
            color: "white",
            border: "1px solid #05436a"
          }
        }
      })),
      type: 'group' // 标记为普通分组
    }))
  }
})

// 连线数据
const dependencyLines = ref([])


// 滚动同步用的 Ref
const sidebarListRef = ref(null)
const chartWrapperRef = ref(null)
const headerWrapperRef = ref(null)
const conflictSidebarListRef = ref(null)
const conflictChartWrapperRef = ref(null)
const conflictHeaderWrapperRef = ref(null)


let isSyncingRight = false
let resizeObserver = null
let conflictResizeObserver = null

const onSidebarScroll = (e) => {
  if (isSyncingLeft) return
  isSyncingRight = true
  if (chartWrapperRef.value) {
    chartWrapperRef.value.scrollTop = e.target.scrollTop
  }
  isSyncingRight = false
}

const onConflictSidebarScroll = (e) => {
  if (isSyncingLeft) return
  isSyncingRight = true
  if (conflictChartWrapperRef.value) {
    conflictChartWrapperRef.value.scrollTop = e.target.scrollTop
  }
  isSyncingRight = false
}

const onChartScroll = (e) => {
  // 1. 垂直滚动同步
  if (!isSyncingRight) {
    isSyncingLeft = true
    if (sidebarListRef.value) {
      sidebarListRef.value.scrollTop = e.target.scrollTop
    }
    isSyncingLeft = false
  }

  // 2. 水平滚动同步
  if (headerWrapperRef.value) {
    headerWrapperRef.value.scrollLeft = e.target.scrollLeft
  }
}

const onConflictChartScroll = (e) => {
  // 1. 垂直滚动同步
  if (!isSyncingRight) {
    isSyncingLeft = true
    if (conflictSidebarListRef.value) {
      conflictSidebarListRef.value.scrollTop = e.target.scrollTop
    }
    isSyncingLeft = false
  }

  // 2. 水平滚动同步
  if (conflictHeaderWrapperRef.value) {
    conflictHeaderWrapperRef.value.scrollLeft = e.target.scrollLeft
  }
}

const syncHeaderWidth = () => {
  // 仅保留 updateLines 调用，因为宽度现在由 CSS 统一控制
  // 依赖视图
  if (chartWrapperRef.value && headerWrapperRef.value) {
    // 这里的强制同步逻辑已废弃，由 :style="{ width: ganttWidth }" 接管
  }
}

// 动态计算连线坐标
const updateLines = () => {
  dependencyLines.value = []

  // 1. 获取所有任务条的 DOM 元素位置
  const barElements = {}

  // 辅助函数：尝试获取元素
  const getBarRect = (id) => {
    // vue-ganttastic 会自动将 config.id 应用到 DOM 元素上
    // 为了稳健性，使用 querySelector 查找包含特定 ID 的 gantt-bar
    // 或者因为我们设置了 ganttBarConfig.id，插件通常会把它作为 DOM id
    const el = document.getElementById(id)
    if (el) {
      // 找到真正的条形图容器 (g-gantt-bar)
      const barContainer = el.closest('.g-gantt-bar')
      return barContainer ? barContainer.getBoundingClientRect() : el.getBoundingClientRect()
    }
    return null
  }

  // 更新容器定位基准：现在连线是相对于 .gantt-scroll-content 的（随内容滚动）
  const container = document.querySelector('.gantt-scroll-content')
  if (!container) return
  const containerRect = container.getBoundingClientRect()

  // 只需要遍历 rawTasks，因为所有可能的任务都在这里
  rawTasks.value.forEach(task => {
    const rect = getBarRect(task.id)
    if (rect) {
      barElements[task.id] = {
        // 计算相对于内容容器的坐标（即使滚动，相对坐标也不变）
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      }
    }
  })

  // 2. 生成连线 (只生成起点和终点都可见的连线)
  taskRelations.value.forEach(rel => {
    const start = barElements[rel.from]
    const end = barElements[rel.to]

    if (start && end) {
      // 终点：Target 左侧中心
      const endX = end.x
      const endY = end.y + end.height / 2

      // 动态选择起点：
      // 如果 Target 开始时间早于 Source 结束时间 (回钩)，则从 Source 左侧出发 (SS模式)
      // 否则从 Source 右侧出发 (FS模式)
      const sourceRight = start.x + start.width
      let startX, startY
      let startSide = 'right' // 记录起点方向

      if (endX < sourceRight) {
        // 回钩情况：使用左侧中心作为起点
        startX = start.x
        startY = start.y + start.height / 2
        startSide = 'left'
      } else {
        // 正常情况：使用右侧中心作为起点
        startX = sourceRight
        startY = start.y + start.height / 2
        startSide = 'right'
      }

      // 路径计算
      const gap = 20
      let d = ''

      if (startSide === 'right') {
        // 从右侧出
        const p1x = startX + gap
        const p2x = endX - gap

        if (p1x < p2x) {
          // 空间足够，直接 Z 字形
          // M start -> Right -> Vertical -> Right -> End
          const midX = (startX + endX) / 2
          d = `M ${startX} ${startY} 
                           L ${midX} ${startY} 
                           L ${midX} ${endY} 
                           L ${endX} ${endY}`
        } else {
          // 空间不足或需要回绕 (虽然我们已经尽量避免回钩，但如果 Target 就在 Source 右边很近处也可能)
          // 或者简单的折线
          d = `M ${startX} ${startY} 
                           L ${p1x} ${startY} 
                           L ${p1x} ${endY} 
                           L ${endX} ${endY}`
        }
      } else {
        // 从左侧出 (startSide === 'left')
        // M start -> Left -> Vertical -> Right -> End
        const p1x = startX - gap
        const p2x = endX - gap

        // 这里 endX 肯定大于 startX (即使是 SS 关系，通常 Target 也在 Source 后面一点，或者至少不远)
        // 如果 endX < startX，那是反向依赖，更复杂。假设 endX >= startX 或不远

        // 路径：向左出 -> 下/上 -> 向右进
        // 如果 endX > p1x，则可以拐弯

        d = `M ${startX} ${startY} 
                       L ${p1x} ${startY} 
                       L ${p1x} ${endY} 
                       L ${endX} ${endY}`
      }

      // 查找源任务和目标任务的详细信息
      const fromTask = rawTasks.value.find(t => t.id === rel.from)
      const toTask = rawTasks.value.find(t => t.id === rel.to)

      dependencyLines.value.push({
        d,
        relation: rel,
        fromTask,
        toTask
      })
    }
  })
}


// --- 连线点击交互 ---
const selectedLine = ref(null)
const popupStyle = ref({ top: '0px', left: '0px' })

const handleLineClick = (line, event) => {
  // 阻止冒泡，防止触发全局关闭
  event.stopPropagation()

  selectedLine.value = line
  isRightPanelCollapsed.value = false // 确保面板展开
  // 计算相对于 chart-wrapper 的位置，因为弹窗是在 chart-wrapper 内部
  const container = document.querySelector('.chart-wrapper')
  if (container) {
    const rect = container.getBoundingClientRect()
    // 获取点击位置相对于 container 的坐标
    const relativeX = event.clientX - rect.left
    const relativeY = event.clientY - rect.top

    // 设置弹窗位置
    popupStyle.value = {
      top: (relativeY + 10) + 'px',
      left: (relativeX + 10) + 'px'
    }
  }
}

const closePopup = () => {
  selectedLine.value = null
}

const onDragBar = () => {
  updateLines()
}


const getRiskLevelText = (level) => {
  const map = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level] || '中风险'
}

// --- 冲突视图数据 ---
// 移除 generateConflictRows 和静态赋值

const isRightPanelCollapsed = ref(true)

// 点击空白处关闭详情面板
const handleGlobalClick = (event) => {
  // 检查点击事件的目标是否在需要保持打开的区域内
  const target = event.target

  // 如果点击的是侧边栏项（任务名），不处理（由 handleTaskClick 处理）
  if (target.closest('.sidebar-item')) return

  // 如果点击的是详情面板内部，不处理
  if (target.closest('.right-panel')) return

  // 如果点击的是冲突条，不处理（由 handleConflictBarClick 处理）
  if (target.closest('.conflict-bar-content')) return

  // 如果点击的是任务条，不处理（由 handleBarClick 处理）
  if (target.closest('.gantt-bar-content')) return

  // 如果点击的是连线，不处理（由 handleLineClick 处理）
  if (target.closest('.dependency-line-hit-area')) return

  // 如果点击的是任务详情弹窗，不处理
  if (target.closest('.modal-overlay')) return

  // 否则关闭面板
  if (!isRightPanelCollapsed.value) {
    isRightPanelCollapsed.value = true
    // 清除选中状态
    selectedConflictPerson.value = null
    selectedTaskIndex.value = null
  }
}

// 监听视图切换，重置滚动位置以确保对齐
watch([currentView, currentPerspective], () => {
  // 切换视图时清除选中状态
  selectedConflictPerson.value = null
  selectedTask.value = null
  selectedTaskIndex.value = null
  selectedLine.value = null
  isRightPanelCollapsed.value = true

  // 重置依赖视图滚动
  if (sidebarListRef.value) sidebarListRef.value.scrollTop = 0
  if (chartWrapperRef.value) chartWrapperRef.value.scrollTop = 0

  // 重置冲突视图滚动
  if (conflictSidebarListRef.value) conflictSidebarListRef.value.scrollTop = 0
  if (conflictChartWrapperRef.value) conflictChartWrapperRef.value.scrollTop = 0

  // 强制更新连线（如果需要）
  nextTick(() => {
    updateLines()
  })
})

// 监听面板收起/展开，重新计算连线
watch(isRightPanelCollapsed, () => {
  nextTick(() => {
    updateLines()
    // 额外延时以确保布局完全稳定
    setTimeout(updateLines, 300)
  })
})

onMounted(async () => {
  // 初始数据加载
  const ganttData = await fetchGanttData()
  rawTasks.value = ganttData.tasks
  taskRelations.value = ganttData.relations

  const conflictData = await fetchConflictData()
  conflictRows.value = conflictData.rows
  conflictDetails.value = conflictData.details

  // 初始同步
  nextTick(() => {
    updateLines()
  })

  // 监听窗口调整，触发连线更新
  window.addEventListener('resize', updateLines)
  // 监听全局点击
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLines)
  document.removeEventListener('click', handleGlobalClick)
})

// 滚动同步状态锁
let isSyncingLeft = false

watch(currentView, () => {
  if (currentView.value === 'dependency') {
    // 增加延时，确保 DOM 完全渲染
    setTimeout(() => {
      updateLines()
    }, 500)
  }
}, { immediate: true })

// 监听数据变化，实现拖拽跟随
watch(dependencyRows, () => {
  // 1. 数据变化时，先清空连线，防止旧连线在错误的坐标残留
  dependencyLines.value = []

  // 2. 等待 DOM 更新
  nextTick(() => {
    // 初次尝试更新
    updateLines()

    // 3. 再次延迟更新，确保布局完全稳定（应对可能的动画或渲染延迟）
    setTimeout(() => {
      updateLines()
    }, 300)
  })
}, { deep: true })

</script>

<style scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  /* 移除内边距，实现无缝连接 */
  overflow: hidden;
  min-width: 0;
  border-right: 1px solid #e4e7ed;
  /* 右侧分割线 */
}

.right-panel {
  width: 480px;
  background: #fff;
  border-left: none;
  /* 移除左边框，避免双重边框 */
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

.panel-header {
  height: 50px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #f5f7fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-card {
  background: #f9fafc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.sidebar-item {
  height: 40px;
  line-height: 40px;
  padding: 0 10px 0 26px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.sidebar-item:hover {
  background-color: #f5f7fa;
}

.critical-icon {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
}

.sidebar-item.is-phase {
  font-weight: bold;
  background-color: #fafafa;
  color: #303133;
  cursor: default;
}

.sidebar-item.is-phase:hover {
  background-color: #fafafa;
}

.sidebar-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
  border-right: 3px solid #409eff;
}

/* 覆盖 g-gantt-row 的样式以支持高亮 */
:deep(.g-gantt-row.gantt-row-active) {
  background-color: #ecf5ff !important;
}

:deep(.g-gantt-row.gantt-row-active .g-gantt-row-bars-container) {
  background-color: #ecf5ff !important;
}

.detail-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 15px 0;
}

.value-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item {
  font-size: 13px;
  color: #303133;
}

.text-gray {
  color: #909399;
}

.tag.critical-tag {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  width: 80px;
  color: #909399;
  font-size: 13px;
  flex-shrink: 0;
}

.detail-row .value {
  color: #303133;
  font-size: 13px;
  word-break: break-all;
}

.value.tag {
  display: inline-block;
  background: #f0f9eb;
  color: #67c23a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.empty-state {
  color: #909399;
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}

.conflict-cards {
  padding: 10px;
}

.conflict-card-new {
  background-color: #f5f7fa;
  /* 浅灰色背景 */
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #ebeef5;
}

.card-header-person {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.person-name {
  font-size: 16px;
  font-weight: bold;
  color: #003366;
}

.header-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  border: 1px solid #dcdfe6;
}

.header-badge.level-high {
  border-color: #f56c6c;
  color: #f56c6c;
  background-color: #fde2e2;
}

.header-badge.level-medium {
  border-color: #e6a23c;
  color: #e6a23c;
  background-color: #fdf6ec;
}

.header-badge.level-low {
  border-color: #909399;
  color: #909399;
  background-color: #f4f4f5;
}

.card-desc {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10px;
}

.card-time-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 13px;
}

.time-tag {
  background-color: #fde2e2;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
}

.related-tasks-section {
  margin-top: 15px;
}

.section-title {
  text-align: left;
  font-size: 14px;
  font-weight: bold;
  color: #003366;
  margin-bottom: 10px;
}

.conflict-reason-row {
  display: flex;
  align-items: center;
}

.conflict-reason-row .section-title {
  margin-bottom: 0;
  margin-right: 10px;
}

.conflict-reason-row .card-time-row {
  margin-bottom: 0;
}

.task-detail-card {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

/* 现有任务样式 - 蓝色系 */
.task-detail-card.is-existing {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
  border-left: 4px solid #05436a;
}

.task-detail-card.is-existing .task-name {
  color: #05436a;
}

.task-detail-card.is-existing .task-type-badge {
  background-color: #05436a;
  color: white;
}

/* 方案新增样式 - 青绿色系 */
.task-detail-card.is-new {
  background-color: #f0fcf9;
  border-color: #a3e6d7;
  border-left: 4px solid #1abc9c;
}

.task-detail-card.is-new .task-name {
  color: #16a085;
}

.task-detail-card.is-new .task-type-badge {
  background-color: #1abc9c;
  color: white;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-type-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  margin-right: 8px;
  font-weight: normal;
  white-space: nowrap;
}

.task-name {
  text-align: left;
  font-weight: bold;
  color: #333;
  font-size: 14px;
  flex: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.task-name:hover {
  text-decoration: underline;
}

.task-card-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #606266;
}

.meta-item {
  display: flex;
  align-items: center;
}


.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conflict-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  font-size: 13px;
  color: #f56c6c;
  align-items: flex-start;
}

.conflict-icon {
  font-size: 16px;
}

.conflict-text {
  flex: 1;
  line-height: 1.4;
}

.main-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  background: #f8f9fa;
  padding: 0 20px;
  height: 50px;
  /* 固定高度与右侧标题一致 */
  border-bottom: 1px solid #ebeef5;
  /* 改为下边框 */
  border-top: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
  /* 移除圆角以贴合顶部 */
  margin-bottom: 0;
  /* 移除底部间距，直接连接下方内容 */
}

.view-switcher,
.perspective-switcher {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.view-switcher label,
.perspective-switcher label {
  font-weight: bold;
  margin-right: 10px;
  color: #303133;
}

select {
  padding: 5px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
}

/* Legend Styles */
.legend-container {
  margin-left: auto;
}

.legend {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 13px;
  color: #606266;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
  margin-right: 5px;
}

.dependency-source {
  background-color: #f56c6c;
  /* 红色：对应起点 */
  border: 1px solid #f56c6c;
}

.dependency-target {
  background-color: #67c23a;
  /* 绿色：对应终点 */
  border: 1px solid #67c23a;
}

.existing {
  background: linear-gradient(to right, #05436a, #0b69a3);
}

.new {
  background-color: #1abc9c;
}

.conflict-high {
  background-color: #f56c6c;
}

.conflict-medium {
  background-color: #e6a23c;
}

.conflict-low {
  background-color: #909399;
  /* 使用灰色表示低风险，或者用淡黄 */
}

/* 冲突徽章样式 */
.conflict-level-badge {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.level-high {
  background-color: #f56c6c;
}

.level-medium {
  background-color: #e6a23c;
}

.level-low {
  background-color: #909399;
}

.level-text {
  font-size: 12px;
  color: #303133;
  font-weight: bold;
}

/* --- 新的左右分栏布局样式 --- */
.dependency-view-container {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  border: none;
  /* 移除外框，因为 main-controls 已经有了下边框，整体由 left-panel 控制 */
  background: #fff;
}

/* 左侧侧边栏 */
.gantt-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 56px;
  /* 必须与 g-timeaxis 高度完全一致 (28px * 2) */
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  /* 确保包含边框 */
  /* Sticky 定位 */
  position: sticky;
  top: 0;
  z-index: 20;
  /* 保证在列表内容之上 */
}

.sidebar-list {
  flex-grow: 1;
  overflow-y: auto;
  /* 允许滚动，但通过下方规则隐藏滚动条 */
  scrollbar-width: none;
  /* Firefox */
}

.sidebar-list::-webkit-scrollbar {
  display: none;
  /* Chrome/Safari/Edge 隐藏滚动条 */
}

.sidebar-item {
  height: 40px;
  /* 必须与 g-gantt-row 高度严格一致 */
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  padding-left: 15px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sidebar-item.is-phase {
  background-color: #eef1f6;
  font-weight: bold;
  color: #303133;
}

.sidebar-item.is-task {
  padding-left: 35px;
  font-weight: normal;
  font-size: 13px;
}

/* 右侧甘特图区域 */
.gantt-main-area {
  flex-grow: 1;
  overflow: hidden;
  /* 包含 SVG 和 Chart */
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 填满父容器 */
}

.chart-header-wrapper {
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid #e4e7ed;
  box-sizing: border-box;
  /* 确保 padding 包含在宽度内 */
}

.chart-header-wrapper :deep(.g-timeaxis) {
  border-bottom: none !important;
  margin-bottom: 0 !important;
}

.chart-wrapper {
  position: relative;
  /* 用于 SVG 定位 */
  flex-grow: 1;
  overflow-y: auto;
  /* 允许垂直滚动 */
  overflow-x: auto;
  /* 允许水平滚动 */
  scrollbar-width: thin;
  /* Firefox: 细滚动条 */
  scrollbar-color: #05436a #f1f1f1;
  /* Firefox: 滚动条颜色 (滑块 轨道) */
}

/* 自定义滚动条样式，使其更窄，减少对齐误差 */
.chart-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.chart-wrapper::-webkit-scrollbar-thumb {
  background: #05436a !important;
  /* 增加 !important 确保生效 */
  border-radius: 4px;
}

.chart-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Hide Time Axis in Body Chart */
.chart-wrapper :deep(.g-timeaxis) {
  display: none !important;
}

/* 提升 SVG 容器的 z-index，务必高于 Row */
.gantt-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 让鼠标事件穿透 SVG，不影响 Gantt 操作 */
  /* 恢复高层级，确保线条可见且在普通行之上 */
  z-index: 2000;
  overflow: hidden;
  /* 裁剪超出范围的连线 */
}

/* 连线基础样式 */
.dependency-line {
  stroke: #c0c4cc;
  /* 稍微加深一点点的灰，配合虚线更清晰 */
  stroke-width: 1.5px;
  fill: none;
  stroke-dasharray: 4 3;
  /* 虚线效果：4px实线，3px间隔 */
  pointer-events: stroke;
  transition: all 0.3s ease;
  /* 添加平滑过渡 */
}

.dependency-line:hover {
  stroke-width: 2.5px;
  /* 悬浮时变粗 */
  stroke: #409eff;
  stroke-dasharray: 0;
  /* 悬浮时变实线，强调连接感 */
  cursor: pointer;
  filter: drop-shadow(0 0 2px rgba(64, 158, 255, 0.5));
  /* 添加发光效果 */
  z-index: 2100;
}

/* 点击热区样式：透明但粗，方便点击 */
.dependency-line-hit-area {
  stroke: transparent;
  stroke-width: 15px;
  fill: none;
  cursor: pointer;
  pointer-events: stroke;
  z-index: 200;
  /* 热区层级 */
}


/* 覆盖 g-gantt-chart 样式以对齐 */
:deep(.g-gantt-chart) {
  border: none;
  width: 100%;
  padding: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
  /* 关键：允许 sticky 生效 */
}

/* 滚动内容包裹层 */
.gantt-scroll-content {
  position: relative;
  /* 为 SVG 提供定位上下文 */
  min-width: 100%;
  width: max-content;
  /* 确保宽度足够包裹内容 */
  height: max-content;
  /* 随内容撑开高度 */
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  /* 关键：裁剪超出时间轴范围的内容（如连线或任务条），防止滚动区域意外撑大 */
}

.gantt-header-content {
  min-width: 100%;
  width: max-content;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* 强制时间轴高度与侧边栏头部一致 */
:deep(.g-timeaxis) {
  height: 56px !important;
  max-height: 56px !important;
  position: relative !important;
  /* 改为 relative，避免 sticky 导致横向滚动时位置异常 */
  width: 100% !important;
  /* 确保占满容器宽度 */
  top: 0;
  left: auto !important;
  right: auto !important;
  z-index: 2020;
  /* 高于 SVG (2000) 确保连线不遮挡时间轴 */
  background: white;
  /* 必须有背景色，防止滚动时被内容透视 */
  border-bottom: 1px solid #e4e7ed;
  /* 增加底边框区分 */
  box-sizing: border-box;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 调整时间轴内部行的高度 */
:deep(.g-upper-timeunit),
:deep(.g-timeunit) {
  height: 28px !important;
  line-height: 28px !important;
  box-sizing: border-box;
  margin: 0 !important;
  padding: 0 !important;
  border: none;
  /* 移除可能的内部边框 */
}

/* 在依赖视图（分栏布局）中，隐藏甘特图内置的行标签，因为左侧已经有独立侧边栏 */
.dependency-view-container :deep(.g-gantt-row-label) {
  display: none;
}

/* 强制行高 */
:deep(.g-gantt-row) {
  height: 40px !important;
  width: 100% !important;
  position: relative;
  z-index: 1;
  transition: z-index 0s;
  box-sizing: border-box;
  /* 确保 padding 不影响高度 */
  border-bottom: 1px solid #ebeef5;
  /* 关键：与左侧侧边栏保持一致的边框 */
  margin: 0 !important;
  padding: 0 !important;
  display: block;
  /* 确保显示 */
}

/* 终极防闪烁：使用 CSS :has 选择器来提升行层级 */
/* 当行内任意 g-gantt-bar 被 hover 时，提升整行层级 */
/* 必须高于 SVG 的 z-index (2000) */
:deep(.g-gantt-row:has(.g-gantt-bar:hover)) {
  z-index: 2005 !important;
}

/* 2. 悬浮时提升行层级（防止被下行遮挡） */
/* 只要鼠标进入行区域，就提升层级，确保行内元素不被遮挡 */
:deep(.g-gantt-row:hover) {
  z-index: 2005 !important;
}

/* 3. 悬浮时提升 Bar 层级 - 务必极高以覆盖 SVG (2000) */
:deep(.g-gantt-bar:hover) {
  z-index: 3000 !important;
  overflow: visible !important;
  /* 关键：允许内容溢出 */
}

/* 4. 内容层：平时是普通的 flex 盒子 */
:deep(.gantt-bar-content) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  background-color: inherit;
  /* 继承 Bar 的颜色 */
  border-radius: 4px;
  padding: 0 4px;
  box-sizing: border-box;
}

/* 5. 内容层：悬浮时变为“弹窗”，覆盖在 Bar 上方 */
:deep(.g-gantt-bar:hover .gantt-bar-content.is-overflowing) {
  position: absolute;
  /* 脱离文档流 */
  top: 0;
  left: 0;
  width: fit-content !important;
  /* 使用 fit-content 替代 auto */
  min-width: 100% !important;
  /* 强制至少和 Bar 一样宽 */
  height: auto !important;
  min-height: 100%;
  z-index: 3001;
  /* 比 Bar 更高 */

  /* 视觉样式 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  /* 加深阴影 */
  /* background-color: inherit; 这里 inherit 可能拿到透明，需要处理 */

  /* 确保文字完整显示 */
  overflow: visible !important;
  white-space: nowrap !important;
  box-sizing: border-box !important;
  /* 确保 padding 包含在宽度内 */
}

/* 6. 针对冲突视图的特殊处理（如果有特定颜色） */
:deep(.conflict-bar-content) {
  /* 可以在这里添加特定样式 */
  display: flex;
  /* 确保不为空 */
}

/* 面板收起/展开按钮样式 */
.panel-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  margin-left: auto;
  /* 推到最右侧 */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.panel-toggle-btn:hover {
  background-color: #e4e7ed;
  color: #606266;
}

.expand-panel-trigger {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 50px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 4px 0 0 4px;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3000;
  /* 确保在最上层 */
  color: #909399;
  transition: all 0.3s;
}

.expand-panel-trigger:hover {
  background: #f5f7fa;
  color: #409eff;
  width: 24px;
}

/* 普通任务条默认颜色（如果插件没传背景色，给个默认安全值，实际会被 style 覆盖） */

/* 必须给 content 指定背景色，否则悬浮展开部分是透明的 */
:deep(.g-gantt-bar:hover .gantt-bar-content) {
  /* 
       重要：背景色不再写死，而是通过 inherit 继承父级（或者行内样式直接生效）
       由于我们在 template 中已经绑定了 style.background，
       这里设置为 inherit 可以作为兜底，或者干脆不设背景色（如果行内样式优先级够高）。
       但考虑到 hover 状态下 content 是 absolute，最好显式 inherit 或利用行内样式。
       实测：行内样式优先级高于类选择器，所以 template 中的 :style 会生效。
       这里只做辅助设置。
    */
  background: inherit;
}

/* 针对冲突视图 */
/* 移除这里的强制橙色，让行内样式生效 */
/*
:deep(.g-gantt-bar:hover .conflict-bar-content) {
    background-color: #e6a23c; 
}
*/
/* 如果是普通任务条，尽量匹配原色 */
:deep(.g-gantt-bar[style*="3f86f8"]:hover .gantt-bar-content) {
  background-color: #3f86f8;
}

/* 修正：让 g-gantt-bar 即使 hover 也不要变宽 */
/* 已移除错误的 width: auto !important */

/* 重新定义上面的规则 3 */
:deep(.g-gantt-bar:hover) {
  z-index: 1000 !important;
  /* width 保持不变！ */
}

/* 强制内部所有容器允许内容撑开 - 这一段要删掉，改用上面的 .gantt-bar-content 规则 */

/* 任务条内容 Hover 展开效果 */
/* 已合并到上方规则中 */
.task-tag {
  display: inline-block;
  padding: 0 4px;
  margin-left: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  line-height: 14px;
  vertical-align: middle;
}

.tag-key {
  background-color: #f56c6c;
  /* 红色背景 */
  color: white;
  border: 1px solid #e6a23c;
  /* 金色边框增强醒目度 */
}



.conflict-bar-content {
  justify-content: space-between;
}

.conflict-badge {
  background: red;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

.conflict-alert {
  margin-top: 20px;
  border: 1px solid #f56c6c;
  background: #fef0f0;
  padding: 10px;
  color: #f56c6c;
}

.group-task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 10px;
}

.group-task-item {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.group-task-item .task-name {
  font-weight: 500;
  margin-bottom: 6px;
  color: #303133;
  font-size: 13px;
}

.group-task-item .task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
}

.close-btn:hover {
  color: #606266;
}

.modal-body {
  padding: 20px;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  color: #606266;
  width: 100px;
  font-weight: 500;
}

.detail-item .value {
  color: #303133;
  flex: 1;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.primary-btn {
  background-color: #409eff;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background-color: #66b1ff;
}
</style>