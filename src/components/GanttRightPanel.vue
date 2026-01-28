<template>
  <!-- 右侧详情面板 -->
  <div class="right-panel" v-show="!collapsed">
    <div class="panel-header">
      <h3>{{ currentView === 'dependency' ? (selectedTask ? '任务详情' : '依赖关系详情') : '资源冲突详情' }}</h3>
      <button class="panel-toggle-btn" @click="updateCollapsed(true)" title="收起面板">
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
          <ConflictCard 
            v-for="item in visibleConflictDetails" 
            :key="item.id" 
            :item="item" 
            @open-task-detail="onOpenTaskDetail"
          />
        </div>
        <div v-else class="empty-state">
          暂无资源冲突风险
        </div>
      </div>
    </div>
  </div>

  <!-- 展开按钮悬浮条 -->
  <div class="expand-panel-trigger" v-if="collapsed" @click="updateCollapsed(false)"
    title="展开详情面板">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  </div>
</template>

<script setup>
import ConflictCard from './ConflictCard.vue'

const props = defineProps({
  collapsed: {
    type: Boolean,
    required: true
  },
  currentView: {
    type: String,
    default: 'dependency'
  },
  selectedTask: {
    type: Object,
    default: null
  },
  selectedTaskPredecessors: {
    type: Array,
    default: () => []
  },
  selectedTaskSuccessors: {
    type: Array,
    default: () => []
  },
  selectedGroup: {
    type: String,
    default: null
  },
  selectedGroupTasks: {
    type: Array,
    default: () => []
  },
  selectedLine: {
    type: Object,
    default: null
  },
  visibleConflictDetails: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:collapsed', 'open-task-detail'])

const updateCollapsed = (val) => {
  emit('update:collapsed', val)
}

const onOpenTaskDetail = (payload) => {
  emit('open-task-detail', payload)
}
</script>

<style scoped>
.right-panel {
  width: 480px;
  background: #fff;
  border-left: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.panel-header {
  height: 56px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.panel-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.panel-toggle-btn:hover {
  background-color: #f3f4f6;
  color: #606266;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.expand-panel-trigger {
  width: 24px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
  z-index: 90;
}

.expand-panel-trigger:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

/* Detail Card Styles */
.detail-card {
  background: #f9fafc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
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

.value.tag {
  display: inline-block;
  background: #f0f9eb;
  color: #67c23a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* Group Task Styles */
.group-task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-task-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  font-size: 13px;
  color: #303133;
}

.task-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

/* Empty State */
.empty-state {
  color: #909399;
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}

.conflict-cards {
  padding: 10px;
}
</style>