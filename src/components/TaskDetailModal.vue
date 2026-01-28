<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="modelValue" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h3>任务详情</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <span class="label">任务名称：</span>
            <span class="value">{{ task.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">优先级：</span>
            <span class="value">{{ task.priority || '中' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">关键节点：</span>
            <span class="value">{{ task.isCritical ? '是' : '否' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">首长重点关注：</span>
            <span class="value">{{ task.isLeaderFocus ? '是' : '否' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="primary-btn" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  task: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  width: 440px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #4b5563;
  background-color: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  color: #6b7280;
  width: 100px;
  font-weight: 500;
  font-size: 14px;
}

.detail-item .value {
  color: #111827;
  flex: 1;
  font-size: 14px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  text-align: right;
  background-color: #f9fafb;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.primary-btn {
  background-color: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.primary-btn:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>