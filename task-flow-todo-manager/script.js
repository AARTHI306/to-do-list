const STORAGE_KEY = "task-flow-tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentFilter = "all";
let editingId = null;

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const modalBackdrop = document.getElementById("modalBackdrop");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const modalTitle = document.getElementById("modalTitle");
const saveBtn = document.getElementById("saveBtn");

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHTML(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function render() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filtered = tasks.filter(task => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const text = `${task.title} ${task.description}`.toLowerCase();
    return matchesFilter && text.includes(searchTerm);
  });

  taskList.innerHTML = filtered.map(task => `
    <article class="task-card ${task.completed ? "completed" : ""}">
      <button class="check-btn ${task.completed ? "checked" : ""}" 
        aria-label="Toggle task" onclick="toggleTask('${task.id}')"></button>

      <div>
        <h4 class="task-title">${escapeHTML(task.title)}</h4>
        ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority[0].toUpperCase() + task.priority.slice(1)} Priority</span>
          ${task.date ? `<span class="date">📅 ${formatDate(task.date)}</span>` : ""}
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn" aria-label="Edit task" onclick="openEdit('${task.id}')">✎</button>
        <button class="icon-btn delete" aria-label="Delete task" onclick="deleteTask('${task.id}')">×</button>
      </div>
    </article>
  `).join("");

  emptyState.classList.toggle("hidden", filtered.length !== 0);
  taskList.classList.toggle("hidden", filtered.length === 0);

  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("pendingCount").textContent = pending;

  document.getElementById("allNavCount").textContent = tasks.length;
  document.getElementById("activeNavCount").textContent = pending;
  document.getElementById("completedNavCount").textContent = completed;

  const visibleLabel = filtered.length === 1 ? "1 task" : `${filtered.length} tasks`;
  document.getElementById("taskSummary").textContent = visibleLabel;

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

function openModal(task = null) {
  editingId = task ? task.id : null;
  modalTitle.textContent = task ? "Edit task" : "Add a new task";
  saveBtn.textContent = task ? "Save Changes" : "Add Task";

  taskTitle.value = task?.title || "";
  taskDescription.value = task?.description || "";
  taskDate.value = task?.date || "";
  taskPriority.value = task?.priority || "medium";

  modalBackdrop.classList.remove("hidden");
  setTimeout(() => taskTitle.focus(), 50);
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  taskForm.reset();
  editingId = null;
}

function addTask(data) {
  tasks.unshift({
    id: Date.now().toString(),
    title: data.title,
    description: data.description,
    date: data.date,
    priority: data.priority,
    completed: false,
    createdAt: Date.now()
  });
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  if (confirm(`Delete "${task.title}"?`)) {
    tasks = tasks.filter(item => item.id !== id);
    saveTasks();
    render();
  }
}

function openEdit(id) {
  const task = tasks.find(item => item.id === id);
  if (task) openModal(task);
}

document.getElementById("openAddBtn").addEventListener("click", () => openModal());
document.getElementById("emptyAddBtn").addEventListener("click", () => openModal());
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.classList.contains("hidden")) {
    closeModal();
  }
});

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const data = {
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    date: taskDate.value,
    priority: taskPriority.value
  };

  if (!data.title) return;

  if (editingId) {
    tasks = tasks.map(task =>
      task.id === editingId ? { ...task, ...data } : task
    );
  } else {
    addTask(data);
  }

  saveTasks();
  closeModal();
  render();
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", render);

document.getElementById("clearCompletedBtn").addEventListener("click", () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount) return;

  if (confirm(`Clear ${completedCount} completed task${completedCount > 1 ? "s" : ""}?`)) {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
  }
});

render();
