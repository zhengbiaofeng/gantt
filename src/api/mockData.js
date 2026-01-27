// 模拟 API 请求延时
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. 生成大量模拟数据 (Gantt 任务)
const generateMockData = () => {
  const tasks = []
  const relations = []
  // 减少阶段数量，去除冗余
  const phases = ["阶段一：数据收集", "阶段二：情报研判", "阶段三：综合整编"]
  const units = ["联指中心", "情报中心", "战略规划部", "综合保障组"]
  const roles = ["综合计划席", "作战值班席", "情报员", "参谋"]
  const persons = ["王强", "李明", "赵敏", "陈刚", "刘建国"]

  let taskIdCounter = 1

  phases.forEach((phase, pIndex) => {
    // 减少每个阶段的任务数量，避免冗余
    const taskCount = 3 + Math.floor(Math.random() * 2) // 3-4 个任务
    let lastTaskId = null

    for (let i = 0; i < taskCount; i++) {
      const id = `T-${String(taskIdCounter).padStart(3, '0')}`
      const startHour = 8 + Math.floor(Math.random() * 4) + (pIndex * 3) // 时间更紧凑
      const duration = 1 + Math.floor(Math.random() * 2) // 1-2 小时
      
      // 跨天处理
      let day = 18
      let h = startHour
      if (h >= 24) {
          day += Math.floor(h / 24)
          h = h % 24
      }
      
      const startStr = `2026-01-${day} ${String(h).padStart(2, '0')}:00`
      const endH = h + duration
      const endStr = `2026-01-${day} ${String(endH).padStart(2, '0')}:00`

      const unit = units[i % units.length] // 轮询使用单位，保证覆盖
      const role = roles[i % roles.length]
      const person = persons[i % persons.length]

      tasks.push({
        id,
        name: `${phase}-任务${i+1}: ${unit}执行专项操作`,
        start: startStr,
        end: endStr,
        taskGroup: phase,
        unit,
        role,
        person: `${person} ${role}`,
        // 确保每个阶段第一个任务是关键任务，方便测试
        tags: i === 0 || Math.random() > 0.8 ? ["关键"] : []
      })

      // 串行依赖
      if (lastTaskId) {
        relations.push({ from: lastTaskId, to: id })
      }
      lastTaskId = id
      taskIdCounter++
    }
  })
  
  // 减少跨阶段依赖
  for(let i=0; i<2; i++) {
      if (tasks.length > 5) {
        const from = tasks[Math.floor(Math.random() * (tasks.length / 2))].id
        const to = tasks[Math.floor(tasks.length / 2) + Math.floor(Math.random() * (tasks.length / 2))].id
        relations.push({ from, to })
      }
  }

  return { tasks, relations }
}

// 2. 生成大量冲突数据 (资源冲突视图)
const generateConflictRows = () => {
    const rows = []
    // 减少人员数量
    const persons = ["张参谋", "李参谋", "王干事", "赵助理", "孙科长"]
    
    persons.forEach((person, index) => {
        const bars = []
        // 现有任务 1-2 个
        const existingCount = 1 + Math.floor(Math.random() * 2)
        for(let i=0; i<existingCount; i++) {
            const startHour = 9 + Math.floor(Math.random() * 8)
            const duration = 1 + Math.floor(Math.random() * 2)
            bars.push({
                myBeginDate: `2026-01-18 ${String(startHour).padStart(2,'0')}:00`,
                myEndDate: `2026-01-18 ${String(startHour+duration).padStart(2,'0')}:00`,
                ganttBarConfig: { 
                    id: `ce-${index}-${i}`, 
                    label: "现有任务", 
                    style: { 
                        background: "linear-gradient(to right, #05436a, #0b69a3)", 
                        color: "white",
                        borderRadius: "4px"
                    } 
                }
            })
        }

        // 新增任务 1 个 (可能冲突)
        if (Math.random() > 0.2) {
             const startHour = 10 + Math.floor(Math.random() * 8)
             const duration = 2
             const levels = ['high', 'medium', 'low']
             const level = levels[Math.floor(Math.random() * levels.length)]
             
             bars.push({
                myBeginDate: `2026-01-18 ${String(startHour).padStart(2,'0')}:00`,
                myEndDate: `2026-01-18 ${String(startHour+duration).padStart(2,'0')}:00`,
                ganttBarConfig: { 
                    id: `cn-${index}`, 
                    label: "方案新增", 
                    conflictLevel: level,
                    style: { 
                        background: "#1abc9c", 
                        color: "white",
                        borderRadius: "4px"
                    } 
                }
            })
        }

        rows.push({
            label: person,
            bars: bars
        })
    })
    return rows
}

// API: 获取依赖视图数据
export const fetchGanttData = async () => {
    await delay(500); // 模拟网络延时
    return generateMockData();
}

// API: 获取冲突视图数据
export const fetchConflictData = async () => {
    await delay(500); // 模拟网络延时
    return {
        rows: generateConflictRows(),
        details: [
            "张参谋：[10:00-11:00] 严重冲突 (高)",
            "李参谋：[14:00-15:00] 一般冲突 (中)",
        ]
    };
}
