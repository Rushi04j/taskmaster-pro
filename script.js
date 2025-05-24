class TaskMasterPro {
  constructor() {
    // Clear any existing data to ensure clean start
    localStorage.removeItem("taskmaster-pro-tasks")
    this.tasks = []
    this.currentFilter = "all"
    this.currentSort = "created"
    this.currentView = "list"
    this.searchQuery = ""
    this.currentEditIndex = null
    this.theme = localStorage.getItem("taskmaster-theme") || "light"

    this.initializeApp()
  }

  async initializeApp() {
    this.showLoadingOverlay()

    // Simulate loading time for better UX
    await this.delay(1500)

    this.initializeElements()
    this.setupEventListeners()
    this.applyTheme()
    this.updateUI()
    this.startAutoSave()
    this.addProgressGradient()
    this.setupScrollToTop()
    this.hideLoadingOverlay()

    this.showToast("Welcome to TaskMaster Pro! 🚀", "success")
  }

  initializeElements() {
    // Input elements
    this.taskInput = document.getElementById("new-task")
    this.addTaskBtn = document.getElementById("add-task-btn")
    this.taskPriority = document.getElementById("task-priority")
    this.taskDueDate = document.getElementById("task-due-date")
    this.taskCategory = document.getElementById("task-category")
    this.searchInput = document.getElementById("search-tasks")
    this.sortSelect = document.getElementById("sort-tasks")

    // Display elements
    this.taskList = document.getElementById("task-list")
    this.emptyState = document.getElementById("empty-state")
    this.currentFilterTitle = document.getElementById("current-filter-title")
    this.visibleTasksCount = document.getElementById("visible-tasks-count")

    // Filter buttons
    this.filterButtons = document.querySelectorAll(".tab-btn[data-filter]")
    this.viewButtons = document.querySelectorAll(".view-btn")
    this.clearCompletedBtn = document.getElementById("clear-completed")

    // Modal elements
    this.editModal = document.getElementById("edit-modal")
    this.editTaskText = document.getElementById("edit-task-text")
    this.editTaskPriority = document.getElementById("edit-task-priority")
    this.editTaskDueDate = document.getElementById("edit-task-due-date")
    this.editTaskCategory = document.getElementById("edit-task-category")
    this.saveEditBtn = document.getElementById("save-edit-btn")
    this.cancelEditBtn = document.getElementById("cancel-edit-btn")
    this.closeBtn = document.querySelector(".close-btn")

    // Stats elements
    this.totalTasksEl = document.getElementById("total-tasks")
    this.completedTasksEl = document.getElementById("completed-tasks")
    this.pendingTasksEl = document.getElementById("pending-tasks")
    this.overdueTasksEl = document.getElementById("overdue-tasks")

    // Progress elements
    this.progressCircle = document.getElementById("progress-circle")
    this.progressPercentage = document.getElementById("progress-percentage")

    // Theme toggle
    this.themeToggle = document.getElementById("theme-toggle")

    // Toast container
    this.toastContainer = document.getElementById("toast-container")

    // Loading overlay
    this.loadingOverlay = document.getElementById("loading-overlay")

    // Scroll to top
    this.scrollToTopBtn = document.getElementById("scroll-to-top")
  }

  setupEventListeners() {
    // Task input
    this.addTaskBtn.addEventListener("click", () => this.addTask())
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.addTask()
      }
    })

    // Real-time input validation
    this.taskInput.addEventListener("input", () => this.validateTaskInput())

    // Search and sort
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase()
      this.updateTaskList()
    })

    this.sortSelect.addEventListener("change", (e) => {
      this.currentSort = e.target.value
      this.updateTaskList()
    })

    // Filters
    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.setFilter(btn.dataset.filter))
    })

    // View controls
    this.viewButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.setView(btn.dataset.view))
    })

    this.clearCompletedBtn.addEventListener("click", () => this.clearCompleted())

    // Theme toggle
    this.themeToggle.addEventListener("click", () => this.toggleTheme())

    // Modal events
    this.closeBtn.addEventListener("click", () => this.closeModal())
    this.cancelEditBtn.addEventListener("click", () => this.closeModal())
    this.saveEditBtn.addEventListener("click", () => this.saveEdit())

    // Close modal on backdrop click
    this.editModal.addEventListener("click", (e) => {
      if (e.target === this.editModal) this.closeModal()
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e))

    // Auto-resize textarea
    this.editTaskText.addEventListener("input", this.autoResizeTextarea)

    // Window events
    window.addEventListener("beforeunload", () => this.saveToStorage())
    window.addEventListener("online", () => this.showToast("Back online! 🌐", "success"))
    window.addEventListener("offline", () => this.showToast("You're offline. Changes will be saved locally.", "info"))
  }

  setupScrollToTop() {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        this.scrollToTopBtn.classList.add("visible")
      } else {
        this.scrollToTopBtn.classList.remove("visible")
      }
    })

    this.scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })
  }

  // Theme Management
  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light"
    this.applyTheme()
    localStorage.setItem("taskmaster-theme", this.theme)

    const message = this.theme === "dark" ? "Dark mode activated 🌙" : "Light mode activated ☀️"
    this.showToast(message, "info")
  }

  applyTheme() {
    document.body.setAttribute("data-theme", this.theme)

    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.content = this.theme === "dark" ? "#1e293b" : "#6366f1"
    }
  }

  // Task Management
  async addTask() {
    const text = this.taskInput.value.trim()
    if (!text) {
      this.showToast("Please enter a task description", "error")
      this.taskInput.focus()
      return
    }

    if (text.length > 200) {
      this.showToast("Task description is too long (max 200 characters)", "error")
      return
    }

    const newTask = {
      id: this.generateId(),
      text: text,
      completed: false,
      priority: this.taskPriority.value,
      dueDate: this.taskDueDate.value || null,
      category: this.taskCategory.value.trim() || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      updatedAt: new Date().toISOString(),
    }

    this.tasks.unshift(newTask)
    this.saveToStorage()
    this.updateUI()
    this.clearInputs()

    // Add success animation
    this.showToast("Task added successfully! ✨", "success")

    // Animate new task
    setTimeout(() => {
      const firstTask = this.taskList.querySelector(".task-item")
      if (firstTask) {
        firstTask.style.animation = "slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }, 100)
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      task.completedAt = task.completed ? new Date().toISOString() : null
      task.updatedAt = new Date().toISOString()

      this.saveToStorage()
      this.updateUI()

      const message = task.completed ? "Great job! Task completed! 🎉" : "Task marked as pending 📝"
      this.showToast(message, task.completed ? "success" : "info")

      // Add completion animation
      if (task.completed) {
        this.celebrateCompletion()
      }
    }
  }

  deleteTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (!task) return

    if (confirm(`Are you sure you want to delete "${task.text}"?`)) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
      this.saveToStorage()
      this.updateUI()
      this.showToast("Task deleted successfully", "info")
    }
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      this.currentEditIndex = this.tasks.findIndex((t) => t.id === id)
      this.editTaskText.value = task.text
      this.editTaskPriority.value = task.priority
      this.editTaskDueDate.value = task.dueDate || ""
      this.editTaskCategory.value = task.category || ""
      this.openModal()
    }
  }

  saveEdit() {
    if (this.currentEditIndex === null) return

    const text = this.editTaskText.value.trim()
    if (!text) {
      this.showToast("Please enter a task description", "error")
      this.editTaskText.focus()
      return
    }

    if (text.length > 200) {
      this.showToast("Task description is too long (max 200 characters)", "error")
      return
    }

    const task = this.tasks[this.currentEditIndex]
    task.text = text
    task.priority = this.editTaskPriority.value
    task.dueDate = this.editTaskDueDate.value || null
    task.category = this.editTaskCategory.value.trim() || null
    task.updatedAt = new Date().toISOString()

    this.saveToStorage()
    this.updateUI()
    this.closeModal()
    this.showToast("Task updated successfully! ✏️", "success")
  }

  // Filter and Sort Management
  setFilter(filter) {
    this.currentFilter = filter
    this.filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter)
    })
    this.updateFilterTitle()
    this.updateTaskList()
  }

  setView(view) {
    this.currentView = view
    this.viewButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view)
    })
    this.taskList.className = `task-list ${view}-view`
  }

  clearCompleted() {
    const completedTasks = this.tasks.filter((t) => t.completed)
    if (completedTasks.length === 0) {
      this.showToast("No completed tasks to clear", "info")
      return
    }

    if (confirm(`Are you sure you want to delete ${completedTasks.length} completed task(s)?`)) {
      this.tasks = this.tasks.filter((t) => !t.completed)
      this.saveToStorage()
      this.updateUI()
      this.showToast(`${completedTasks.length} completed task(s) cleared! 🗑️`, "success")
    }
  }

  // Data Processing
  getFilteredTasks() {
    let filtered = [...this.tasks]

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.text.toLowerCase().includes(this.searchQuery) ||
          (task.category && task.category.toLowerCase().includes(this.searchQuery)),
      )
    }

    // Apply status/priority filters
    switch (this.currentFilter) {
      case "pending":
        filtered = filtered.filter((t) => !t.completed)
        break
      case "completed":
        filtered = filtered.filter((t) => t.completed)
        break
      case "high":
      case "medium":
      case "low":
        filtered = filtered.filter((t) => t.priority === this.currentFilter)
        break
      case "today":
        const today = new Date().toISOString().split("T")[0]
        filtered = filtered.filter((t) => t.dueDate === today)
        break
      case "overdue":
        const now = new Date().toISOString().split("T")[0]
        filtered = filtered.filter((t) => t.dueDate && t.dueDate < now && !t.completed)
        break
    }

    return this.sortTasks(filtered)
  }

  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      // Always show incomplete tasks first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      switch (this.currentSort) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          break

        case "dueDate":
          if (!a.dueDate && !b.dueDate) break
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          const dateDiff = new Date(a.dueDate) - new Date(b.dueDate)
          if (dateDiff !== 0) return dateDiff
          break

        case "alphabetical":
          const textDiff = a.text.localeCompare(b.text)
          if (textDiff !== 0) return textDiff
          break

        case "created":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }

      // Fallback to creation date
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  // UI Updates
  updateTaskList() {
    const filteredTasks = this.getFilteredTasks()

    if (filteredTasks.length === 0) {
      this.taskList.style.display = "none"
      this.emptyState.style.display = "block"
      this.visibleTasksCount.textContent = "0"
    } else {
      this.taskList.style.display = "block"
      this.emptyState.style.display = "none"
      this.visibleTasksCount.textContent = filteredTasks.length
      this.renderTasks(filteredTasks)
    }

    this.updateFilterCounts()
  }

  renderTasks(tasks) {
    this.taskList.innerHTML = ""

    tasks.forEach((task, index) => {
      const taskElement = this.createTaskElement(task, index)
      this.taskList.appendChild(taskElement)
    })
  }

  createTaskElement(task) {
    const li = document.createElement("li")
    li.className = `task-item ${task.completed ? "completed" : ""}`
    li.style.animationDelay = `${Math.random() * 0.1}s`

    const isOverdue = this.isOverdue(task)
    const isToday = this.isToday(task)
    const timeAgo = this.getTimeAgo(task.createdAt)

    li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} 
                   aria-label="Mark task as ${task.completed ? "incomplete" : "complete"}">
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-priority ${task.priority}" title="${task.priority} priority">
                        ${task.priority}
                    </span>
                    ${
                      task.dueDate
                        ? `
                        <span class="task-due-date ${isOverdue ? "overdue" : isToday ? "today" : ""}" 
                              title="Due date: ${this.formatDate(task.dueDate)}">
                            <i class="fas fa-calendar-alt"></i>
                            ${this.formatDate(task.dueDate)}
                        </span>
                    `
                        : ""
                    }
                    ${
                      task.category
                        ? `
                        <span class="task-category" title="Category: ${this.escapeHtml(task.category)}">
                            <i class="fas fa-tag"></i>
                            ${this.escapeHtml(task.category)}
                        </span>
                    `
                        : ""
                    }
                    <span class="task-time" title="Created ${timeAgo}">
                        <i class="fas fa-clock"></i>
                        ${timeAgo}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" title="Edit task" aria-label="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete task" aria-label="Delete task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `

    // Add event listeners
    const checkbox = li.querySelector(".task-checkbox")
    const editBtn = li.querySelector(".edit-btn")
    const deleteBtn = li.querySelector(".delete-btn")

    checkbox.addEventListener("change", () => this.toggleTask(task.id))
    editBtn.addEventListener("click", () => this.editTask(task.id))
    deleteBtn.addEventListener("click", () => this.deleteTask(task.id))

    return li
  }

  updateStats() {
    const total = this.tasks.length
    const completed = this.tasks.filter((t) => t.completed).length
    const pending = total - completed
    const overdue = this.tasks.filter((t) => this.isOverdue(t)).length

    // Direct number updates without animation
    this.totalTasksEl.textContent = total
    this.completedTasksEl.textContent = completed
    this.pendingTasksEl.textContent = pending
    this.overdueTasksEl.textContent = overdue

    // Update progress circle
    const progress = total > 0 ? (completed / total) * 100 : 0
    this.updateProgressCircle(progress)
    this.progressPercentage.textContent = `${Math.round(progress)}%`
  }

  updateFilterCounts() {
    const counts = {
      all: this.tasks.length,
      pending: this.tasks.filter((t) => !t.completed).length,
      completed: this.tasks.filter((t) => t.completed).length,
      high: this.tasks.filter((t) => t.priority === "high").length,
      medium: this.tasks.filter((t) => t.priority === "medium").length,
      low: this.tasks.filter((t) => t.priority === "low").length,
      today: this.tasks.filter((t) => this.isToday(t)).length,
      overdue: this.tasks.filter((t) => this.isOverdue(t)).length,
    }

    Object.entries(counts).forEach(([filter, count]) => {
      const countEl = document.getElementById(`count-${filter}`)
      if (countEl) {
        countEl.textContent = count
      }
    })
  }

  updateFilterTitle() {
    const titles = {
      all: "All Tasks",
      pending: "Pending Tasks",
      completed: "Completed Tasks",
      high: "High Priority Tasks",
      medium: "Medium Priority Tasks",
      low: "Low Priority Tasks",
      today: "Due Today",
      overdue: "Overdue Tasks",
    }

    this.currentFilterTitle.textContent = titles[this.currentFilter] || "Tasks"
  }

  updateUI() {
    this.updateTaskList()
    this.updateStats()
    this.updateFilterCounts()
  }

  // Utility Methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  isOverdue(task) {
    if (!task.dueDate || task.completed) return false
    const today = new Date().toISOString().split("T")[0]
    return task.dueDate < today
  }

  isToday(task) {
    if (!task.dueDate) return false
    const today = new Date().toISOString().split("T")[0]
    return task.dueDate === today
  }

  formatDate(dateString) {
    if (!dateString) return ""
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateStr = date.toISOString().split("T")[0]
    const todayStr = today.toISOString().split("T")[0]
    const tomorrowStr = tomorrow.toISOString().split("T")[0]
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    if (dateStr === todayStr) return "Today"
    if (dateStr === tomorrowStr) return "Tomorrow"
    if (dateStr === yesterdayStr) return "Yesterday"

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    })
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Animation Methods
  updateProgressCircle(percentage) {
    const circumference = 2 * Math.PI * 50 // radius = 50
    const offset = circumference - (percentage / 100) * circumference

    if (this.progressCircle) {
      this.progressCircle.style.strokeDashoffset = offset
    }
  }

  addProgressGradient() {
    const svg = document.querySelector(".progress-ring")
    if (!svg) return

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    gradient.id = "progressGradient"
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "0%")
    gradient.setAttribute("x2", "100%")
    gradient.setAttribute("y2", "0%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", "#6366f1")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", "#f59e0b")

    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)
    svg.appendChild(defs)
  }

  celebrateCompletion() {
    // Create confetti effect
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.createConfetti()
      }, i * 50)
    }
  }

  createConfetti() {
    const confetti = document.createElement("div")
    confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${["#6366f1", "#f59e0b", "#10b981", "#ef4444"][Math.floor(Math.random() * 4)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall 3s linear forwards;
        `

    document.body.appendChild(confetti)

    setTimeout(() => {
      confetti.remove()
    }, 3000)
  }

  // Modal Methods
  openModal() {
    this.editModal.style.display = "block"
    this.editTaskText.focus()
    document.body.style.overflow = "hidden"
  }

  closeModal() {
    this.editModal.style.display = "none"
    this.currentEditIndex = null
    document.body.style.overflow = ""
  }

  // Loading Methods
  showLoadingOverlay() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("active")
    }
  }

  hideLoadingOverlay() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove("active")
    }
  }

  // Toast Notifications
  showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    }

    toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `

    this.toastContainer.appendChild(toast)

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards"
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }

  // Input Validation
  validateTaskInput() {
    const text = this.taskInput.value.trim()
    const isValid = text.length > 0 && text.length <= 200

    this.addTaskBtn.disabled = !isValid
    this.addTaskBtn.style.opacity = isValid ? "1" : "0.6"

    if (text.length > 200) {
      this.taskInput.style.borderColor = "var(--danger-500)"
    } else {
      this.taskInput.style.borderColor = ""
    }
  }

  // Keyboard Shortcuts
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "Enter":
          e.preventDefault()
          this.addTask()
          break
        case "f":
          e.preventDefault()
          this.searchInput.focus()
          break
        case "k":
          e.preventDefault()
          this.taskInput.focus()
          break
        case "d":
          e.preventDefault()
          this.toggleTheme()
          break
      }
    }

    if (e.key === "Escape") {
      if (this.editModal.style.display === "block") {
        this.closeModal()
      }
    }
  }

  // Auto-resize textarea
  autoResizeTextarea(e) {
    e.target.style.height = "auto"
    e.target.style.height = e.target.scrollHeight + "px"
  }

  // Storage Methods
  saveToStorage() {
    try {
      localStorage.setItem("taskmaster-pro-tasks", JSON.stringify(this.tasks))
      localStorage.setItem("taskmaster-last-save", new Date().toISOString())
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      this.showToast("Failed to save tasks locally", "error")
    }
  }

  // Auto-save functionality
  startAutoSave() {
    setInterval(() => {
      this.saveToStorage()
    }, 30000) // Auto-save every 30 seconds
  }

  clearInputs() {
    this.taskInput.value = ""
    this.taskPriority.value = "medium"
    this.taskDueDate.value = ""
    this.taskCategory.value = ""
    this.validateTaskInput()
  }

  // Export/Import functionality
  exportTasks() {
    const exportData = {
      tasks: this.tasks,
      exportDate: new Date().toISOString(),
      version: "2.0",
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `taskmaster-pro-backup-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    URL.revokeObjectURL(url)
    this.showToast("Tasks exported successfully! 📁", "success")
  }

  importTasks(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result)
        let tasksToImport = []

        // Handle different export formats
        if (importData.tasks && Array.isArray(importData.tasks)) {
          tasksToImport = importData.tasks
        } else if (Array.isArray(importData)) {
          tasksToImport = importData
        } else {
          throw new Error("Invalid file format")
        }

        // Validate and clean imported tasks
        const validTasks = tasksToImport
          .filter((task) => task && typeof task.text === "string" && task.text.trim())
          .map((task) => ({
            ...task,
            id: task.id || this.generateId(),
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))

        if (validTasks.length > 0) {
          this.tasks = validTasks
          this.saveToStorage()
          this.updateUI()
          this.showToast(`${validTasks.length} tasks imported successfully! 📥`, "success")
        } else {
          this.showToast("No valid tasks found in file", "error")
        }
      } catch (error) {
        console.error("Import error:", error)
        this.showToast("Error importing tasks. Please check the file format.", "error")
      }
    }
    reader.readAsText(file)
  }
}

// Add confetti animation CSS
const confettiStyle = document.createElement("style")
confettiStyle.textContent = `
    @keyframes confettiFall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`
document.head.appendChild(confettiStyle)

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new TaskMasterPro()

  // Make app globally accessible for debugging
  window.TaskMasterPro = app

  // Add export/import functionality to the UI
  const exportBtn = document.createElement("button")
  exportBtn.innerHTML = '<i class="fas fa-download"></i> Export'
  exportBtn.className = "action-btn"
  exportBtn.style.background = "var(--info-500)"
  exportBtn.style.color = "white"
  exportBtn.addEventListener("click", () => app.exportTasks())

  const importBtn = document.createElement("button")
  importBtn.innerHTML = '<i class="fas fa-upload"></i> Import'
  importBtn.className = "action-btn"
  importBtn.style.background = "var(--success-500)"
  importBtn.style.color = "white"

  const importInput = document.createElement("input")
  importInput.type = "file"
  importInput.accept = ".json"
  importInput.style.display = "none"
  importInput.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      app.importTasks(e.target.files[0])
    }
  })

  importBtn.addEventListener("click", () => importInput.click())

  // Add export/import buttons to the action controls
  const actionControls = document.querySelector(".action-controls")
  if (actionControls) {
    actionControls.appendChild(exportBtn)
    actionControls.appendChild(importBtn)
    actionControls.appendChild(importInput)
  }

  // Add keyboard shortcut hints
  const shortcutHints = document.createElement("div")
  shortcutHints.className = "keyboard-shortcuts"
  shortcutHints.innerHTML = `
        <div style="
            background: var(--bg-glass);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 1rem;
            margin-top: 2rem;
            text-align: center;
            border: 1px solid var(--border-primary);
            box-shadow: var(--shadow-md);
        ">
            <h4 style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 0.9rem;">
                <i class="fas fa-keyboard" style="color: var(--primary-500);"></i>
                Keyboard Shortcuts
            </h4>
            <div style="
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
                font-size: 0.8rem;
                color: var(--text-secondary);
            ">
                <span><kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">Ctrl+Enter</kbd> Add Task</span>
                <span><kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">Ctrl+F</kbd> Search</span>
                <span><kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">Ctrl+K</kbd> Focus Input</span>
                <span><kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">Ctrl+D</kbd> Toggle Theme</span>
                <span><kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">Esc</kbd> Close Modal</span>
            </div>
        </div>
    `

  const container = document.querySelector(".container")
  if (container) {
    container.appendChild(shortcutHints)
  }

  // Add service worker for offline functionality
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failed, but app still works
      console.log("Service worker registration failed - app will work without offline features")
    })
  }

  // Add install prompt for PWA
  let deferredPrompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferredPrompt = e

    // Only show install button if we have a valid prompt
    if (deferredPrompt) {
      const installBtn = document.createElement("button")
      installBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Install App'
      installBtn.className = "btn btn-primary"
      installBtn.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            z-index: 1000;
            border-radius: 2rem;
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow-glow);
            animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        `

      installBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
          try {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === "accepted") {
              app.showToast("App installed successfully! 📱", "success")
            }
          } catch (error) {
            console.log("Install prompt failed:", error)
          }
          deferredPrompt = null
          installBtn.remove()
        }
      })

      document.body.appendChild(installBtn)

      // Auto-hide after 15 seconds
      setTimeout(() => {
        if (installBtn.parentNode) {
          installBtn.style.animation = "slideOutLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards"
          setTimeout(() => installBtn.remove(), 300)
        }
      }, 15000)
    }
  })

  // Add performance monitoring
  if ("performance" in window) {
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType("navigation")[0]
      if (perfData && perfData.loadEventEnd - perfData.loadEventStart > 3000) {
        console.warn("App loaded slowly. Consider optimizing.")
      }
    })
  }

  // Add error boundary
  window.addEventListener("error", (e) => {
    console.error("TaskMaster Pro Error:", e.error)
    app.showToast("An error occurred. Please refresh the page if issues persist.", "error")
  })

  // Add unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled Promise Rejection:", e.reason)
    app.showToast("An unexpected error occurred.", "error")
  })
})

// Add slide out left animation
const additionalStyle = document.createElement("style")
additionalStyle.textContent = `
    @keyframes slideOutLeft {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
    
    .task-time {
        font-size: 0.75rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
`
document.head.appendChild(additionalStyle)
