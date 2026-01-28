<template>
  <div class="conflict-card-new">
    <div class="card-header-person">
      <span class="person-name">{{ item.personName }}</span>
      <span class="header-badge" :class="'level-' + (item.level || 'medium')">{{ getRiskLevelText(item.level) }}</span>
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
          <span class="task-name" @click="onOpenTaskDetail(item, 'task1')">{{ item.task1 }}</span>
        </div>
        <div class="task-card-meta">
          <span class="meta-item">首长重点关注：{{ item.task1IsLeaderFocus ? '是' : '否' }}</span>
          <span class="meta-item">优先级：{{ item.task1Priority || '高' }}</span>
          <span class="meta-item">关键节点：{{ item.task1IsCritical ? '是' : '否' }}</span>
        </div>
      </div>

      <div class="task-detail-card is-new">
        <div class="task-card-header">
          <span class="task-name" @click="onOpenTaskDetail(item, 'task2')">{{ item.task2 }}</span>
        </div>
        <div class="task-card-meta">
          <span class="meta-item">首长重点关注：{{ item.task2IsLeaderFocus ? '是' : '否' }}</span>
          <span class="meta-item">优先级：{{ item.task2Priority || '中' }}</span>
          <span class="meta-item">关键节点：{{ item.task2IsCritical ? '是' : '否' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-task-detail'])

const getRiskLevelText = (level) => {
  const map = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level] || '中风险'
}

const onOpenTaskDetail = (item, taskKey) => {
  emit('open-task-detail', { item, taskKey })
}
</script>

<style scoped>
.conflict-card-new {
  background-color: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.conflict-card-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.card-header-person {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.person-name {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
}

.header-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid transparent;
}

.header-badge.level-high {
  border-color: #fecaca;
  color: #ef4444;
  background-color: #fef2f2;
}

.header-badge.level-medium {
  border-color: #fed7aa;
  color: #f97316;
  background-color: #fff7ed;
}

.header-badge.level-low {
  border-color: #e5e7eb;
  color: #6b7280;
  background-color: #f9fafb;
}

.card-desc {
  font-size: 13px;
  color: #4b5563;
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
  background-color: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.related-tasks-section {
  margin-top: 15px;
}

.section-title {
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

/* 现有任务样式 - 优化蓝色 */
.task-detail-card.is-existing {
  background-color: #f0f9ff; /* Sky 50 */
  border-color: #bae6fd; /* Sky 200 */
  border-left: 4px solid #0ea5e9; /* Sky 500 */
}

.task-detail-card.is-existing .task-name {
  color: #0369a1; /* Sky 700 */
}

.task-detail-card.is-existing .task-type-badge {
  background-color: #0ea5e9;
  color: white;
}

/* 方案新增样式 - 优化青色 */
.task-detail-card.is-new {
  background-color: #f0fdfa; /* Teal 50 */
  border-color: #99f6e4; /* Teal 200 */
  border-left: 4px solid #14b8a6; /* Teal 500 */
}

.task-detail-card.is-new .task-name {
  color: #0f766e; /* Teal 700 */
}

.task-detail-card.is-new .task-type-badge {
  background-color: #14b8a6;
  color: white;
}

.task-name {
  font-size: 15px;
  font-weight: 600;
  margin-right: 8px;
  cursor: pointer;
  position: relative;
  display: inline-block;
}

.task-name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.task-name:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item {
  position: relative;
  padding-right: 12px;
}

.meta-item:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 2px;
  height: 12px;
  width: 1px;
  background-color: #d1d5db;
}
</style>