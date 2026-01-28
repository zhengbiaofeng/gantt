
// 模拟 API 请求延时
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. 依赖视图数据 (Gantt Data)
 * 结构说明：
 * tasks: 任务列表
 *   - id: 任务唯一标识
 *   - name: 任务名称
 *   - start: 开始时间 (YYYY-MM-DD HH:mm)
 *   - end: 结束时间 (YYYY-MM-DD HH:mm)
 *   - taskGroup: 所属阶段/分组
 *   - unit: 所属单位
 *   - role: 角色
 *   - person: 执行人员
 *   - tags: 标签数组，如 ["关键"]
 * 
 * relations: 任务依赖关系
 *   - from: 前置任务ID
 *   - to: 后置任务ID
 */
const staticGanttData = {
    tasks: [
        // 阶段一：数据收集
        {
            id: "T-101",
            name: "联指中心下达指令",
            start: "2026-01-18 08:00",
            end: "2026-01-18 10:00",
            taskGroup: "阶段一：数据收集",
            unit: "联指中心",
            role: "综合计划席",
            person: "王强 综合计划席",
            tags: ["关键"]
        },
        {
            id: "T-102",
            name: "情报中心接收数据",
            start: "2026-01-18 10:00",
            end: "2026-01-18 12:00",
            taskGroup: "阶段一：数据收集",
            unit: "情报中心",
            role: "情报员",
            person: "李明 情报员",
            tags: []
        },
        {
            id: "T-103",
            name: "数据初步清洗",
            start: "2026-01-18 12:00",
            end: "2026-01-18 14:00",
            taskGroup: "阶段一：数据收集",
            unit: "情报中心",
            role: "技术员",
            person: "张伟 技术员",
            tags: []
        },

        // 阶段二：情报研判
        {
            id: "T-201",
            name: "多源情报融合",
            start: "2026-01-18 14:00",
            end: "2026-01-18 16:00",
            taskGroup: "阶段二：情报研判",
            unit: "战略规划部",
            role: "高级参谋",
            person: "赵敏 高级参谋",
            tags: ["关键"]
        },
        {
            id: "T-202",
            name: "态势分析报告",
            start: "2026-01-18 16:00",
            end: "2026-01-18 18:00",
            taskGroup: "阶段二：情报研判",
            unit: "战略规划部",
            role: "参谋",
            person: "陈刚 参谋",
            tags: []
        },

        // 阶段三：综合整编
        {
            id: "T-301",
            name: "汇总各类成果",
            start: "2026-01-18 19:00",
            end: "2026-01-18 21:00",
            taskGroup: "阶段三：综合整编",
            unit: "综合保障组",
            role: "助理",
            person: "刘建国 助理",
            tags: []
        },
        {
            id: "T-302",
            name: "最终方案汇报",
            start: "2026-01-18 21:00",
            end: "2026-01-18 23:00",
            taskGroup: "阶段三：综合整编",
            unit: "联指中心",
            role: "指挥长",
            person: "孙军 指挥长",
            tags: ["关键"]
        }
    ],
    relations: [
        // 阶段内依赖
        { from: "T-101", to: "T-102" },
        { from: "T-102", to: "T-103" },
        { from: "T-201", to: "T-202" },
        { from: "T-301", to: "T-302" },
        
        // 跨阶段依赖
        { from: "T-103", to: "T-201" },
        { from: "T-202", to: "T-301" }
    ]
};

/**
 * 2. 资源冲突视图数据 (Conflict Data)
 * 结构说明：
 * rows: 人员行列表
 *   - label: 人员名称
 *   - bars: 该人员的任务条
 *     - myBeginDate: 任务开始时间
 *     - myEndDate: 任务结束时间
 *     - ganttBarConfig: 任务条配置
 *       - id: 唯一标识
 *       - label: 显示文本
 *       - conflictLevel: 冲突等级 (high/medium/low) - 仅新增任务有
 *       - style: 样式配置
 * 
 * details: 冲突详情描述列表
 */
const staticConflictData = {
    rows: [
        {
            label: "张参谋",
            bars: [
                {
                    myBeginDate: "2026-01-18 09:00",
                    myEndDate: "2026-01-18 12:00",
                    ganttBarConfig: {
                        id: "conflict-existing-1",
                        label: "现有任务：日常值班",
                        style: {
                            background: "linear-gradient(to right, #05436a, #0b69a3)",
                            color: "white",
                            borderRadius: "4px"
                        }
                    }
                },
                {
                    myBeginDate: "2026-01-18 10:00", // 与上面任务重叠
                    myEndDate: "2026-01-18 14:00",
                    ganttBarConfig: {
                        id: "conflict-new-1",
                        label: "方案新增：紧急会议",
                        hasConflict: true,
                        conflictLevel: "high",
                        style: {
                            background: "#1abc9c",
                            color: "white",
                            borderRadius: "4px"
                        }
                    }
                }
            ]
        },
        {
            label: "李参谋",
            bars: [
                {
                    myBeginDate: "2026-01-18 14:00",
                    myEndDate: "2026-01-18 18:00",
                    ganttBarConfig: {
                        id: "conflict-existing-2",
                        label: "现有任务：文档编写",
                        style: {
                            background: "linear-gradient(to right, #05436a, #0b69a3)",
                            color: "white",
                            borderRadius: "4px"
                        }
                    }
                },
                {
                    myBeginDate: "2026-01-18 15:00", // 重叠
                    myEndDate: "2026-01-18 16:00",
                    ganttBarConfig: {
                        id: "conflict-new-2",
                        label: "方案新增：临时协调",
                        hasConflict: true,
                        conflictLevel: "medium",
                        style: {
                            background: "#1abc9c",
                            color: "white",
                            borderRadius: "4px"
                        }
                    }
                }
            ]
        },
        {
            label: "王干事",
            bars: [
                {
                    myBeginDate: "2026-01-18 08:00",
                    myEndDate: "2026-01-18 10:00",
                    ganttBarConfig: {
                        id: "conflict-existing-3",
                        label: "现有任务：器材维护",
                        style: {
                            background: "linear-gradient(to right, #05436a, #0b69a3)",
                            color: "white",
                            borderRadius: "4px"
                        }
                    }
                }
                // 此人无冲突任务
            ]
        }
    ],
    details: [
        {
            id: 1,
            title: "风险预警",
            level: "high",
            personChar: "张",
            personName: "张参谋",
            task1: "日常值班",
            task1Priority: "高",
            task1IsCritical: true,
            task1IsLeaderFocus: true,
            task2: "紧急会议",
            task2Priority: "中",
            task2IsCritical: false,
            task2IsLeaderFocus: false,
            description: "严重冲突",
            time: "2026-01-18 10:00-12:00"
        },
        {
            id: 2,
            title: "风险预警",
            level: "medium",
            personChar: "李",
            personName: "李参谋",
            task1: "文档编写",
            task1Priority: "中",
            task1IsCritical: false,
            task1IsLeaderFocus: false,
            task2: "临时协调",
            task2Priority: "低",
            task2IsCritical: false,
            task2IsLeaderFocus: true,
            description: "一般冲突",
            time: "2026-01-18 15:00-16:00"
        }
    ]
};

// API: 获取依赖视图数据
export const fetchGanttData = async () => {
    await delay(300); // 模拟网络延时
    return staticGanttData;
}

// API: 获取冲突视图数据
export const fetchConflictData = async () => {
    await delay(300); // 模拟网络延时
    return staticConflictData;
}
