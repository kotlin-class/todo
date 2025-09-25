/* DOM selects */
const openModalBtn = document.getElementById('openModalBtn');
const taskModal = document.getElementById('taskModal');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelBtn = document.getElementById('cancelBtn');

const taskName = document.getElementById('taskName');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const taskPriority = document.getElementById('taskPriority');
const taskDesc = document.getElementById('taskDesc');

const taskList = document.getElementById('taskList');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.querySelector('.modal-content');

const viewTaskModal = document.getElementById('viewTaskModal');
const viewTaskTitle = document.getElementById('viewTaskTitle');
const viewTaskDate = document.getElementById('viewTaskDate');
const viewTaskPriority = document.getElementById('viewTaskPriority');
const viewTaskDesc = document.getElementById('viewTaskDesc');
const closeViewBtn = document.getElementById('closeViewBtn');

let editTask = null; // currently-edited <li> (null when adding)

function formatTimeTo12Hour(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minute] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // 0 → 12
  return `${hour}:${minute} ${ampm}`;
}

function toggleEmptyMessage() {
  const emptyMessage = document.getElementById('emptyMessage');
  emptyMessage.style.display = taskList.children.length === 0 ? 'block' : 'none';
}

/* Utility: show / hide modal using CSS class .show */
function showModal() {
  taskModal.classList.add('show');
  // focus first field for convenience
  setTimeout(() => taskName.focus(), 120);
}
function hideModal() {
  taskModal.classList.remove('show');
}

/* Clear form fields (used on Add) */
function clearForm() {
  taskName.value = '';
  taskDate.value = '';
  taskTime.value = '';
  taskPriority.value = 'Normal';
  taskDesc.value = '';
  // clear validation states
  [taskName, taskDate, taskTime, taskPriority].forEach(f => f.classList.remove('invalid'));
}

/* Create task <li> element with listeners — returns the <li> */
function createTaskElement({ name, date, time, priority, desc }) {
  const li = document.createElement('li');
  li.className = 'task-card';

  // build header
  const header = document.createElement('div');
  header.className = 'task-header';

  const titleEl = document.createElement('span');
  titleEl.className = 'task-title';
  titleEl.textContent = name;

  const prEl = document.createElement('span');
  prEl.className = `task-meta task-priority ${priority}`;
  prEl.textContent = priority;

  header.appendChild(titleEl);
  header.appendChild(prEl);
  li.appendChild(header);

  // date
  const dateEl = document.createElement('div');
  dateEl.className = 'task-meta task-date';
  dateEl.textContent = date ? `📅 ${date} ${time || ''}` : '';
  li.appendChild(dateEl);

  // optional description (truncated in CSS)
  if (desc) {
    const descEl = document.createElement('div');
    descEl.className = 'task-desc';
    descEl.textContent = desc;
    li.appendChild(descEl);
  }

  // actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openEditModal(li));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener("click", () => {
  li.remove();
  toggleEmptyMessage();
});

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(actions);

  li.addEventListener('click', (e) => {
    if (!e.target.closest('.task-actions')) {
      openViewModal(li);
    }
  });

  return li;
}

/* Open modal to edit a given task <li> */
function openEditModal(li) {
  editTask = li;
  modalTitle.textContent = 'Edit Task';

  taskName.value = li.querySelector('.task-title')?.textContent || '';
  const dateText = (li.querySelector('.task-date')?.textContent || '').replace('📅', '').trim();
  if (dateText) {
    // dateText might be "YYYY-MM-DD HH:MM" or just "YYYY-MM-DD"
    const parts = dateText.split(' ');
    taskDate.value = parts[0] || '';
    taskTime.value = parts[1] || '';
  } else {
    taskDate.value = '';
    taskTime.value = '';
  }

  taskPriority.value = li.querySelector('.task-priority')?.textContent || 'Normal';
  taskDesc.value = li.querySelector('.task-desc')?.textContent || '';

  // clear previous invalid marks
  [taskName, taskDate, taskTime, taskPriority].forEach(f => f.classList.remove('invalid'));
  showModal();
}

/* Validate fields — mark invalid fields with class and return boolean */
function validateForm() {
  let ok = true;
  // clear previous
  [taskName, taskDate, taskTime, taskPriority].forEach(f => f.classList.remove('invalid'));

  if (taskName.value.trim() === '') {
    taskName.classList.add('invalid'); ok = false;
  }
  if (taskDate.value === '') {
    taskDate.classList.add('invalid'); ok = false;
  }
  if (taskTime.value === '') {
    taskTime.classList.add('invalid'); ok = false;
  }
  if (taskPriority.value === '') {
    taskPriority.classList.add('invalid'); ok = false;
  }

  // subtle shake animation on invalid
  if (!ok) {
    modalContent.classList.remove('shake');
    // force reflow to restart css animation
    void modalContent.offsetWidth;
    modalContent.classList.add('shake');
    setTimeout(() => modalContent.classList.remove('shake'), 350);
  }
  return ok;
}

/* Remove invalid styling as user types/changes */
[taskName, taskDate, taskTime, taskPriority].forEach(field => {
  field.addEventListener('input', () => {
    if (field.value.trim() !== '') field.classList.remove('invalid');
  });
});

/* Open Add modal */
openModalBtn.addEventListener('click', () => {
  modalTitle.textContent = 'Add Task';
  editTask = null;
  clearForm();
  showModal();
});

/* Cancel */
cancelBtn.addEventListener('click', () => {
  hideModal();
});

/* Stop closing modal on outside clicks: do nothing if backdrop is clicked */
taskModal.addEventListener('click', (e) => {
  // intentionally do not close — clicking outside will be ignored
  if (e.target === taskModal) {
    e.stopPropagation();
  }
});
// prevent clicks inside modal-content from bubbling (safety)
if (modalContent) modalContent.addEventListener('click', e => e.stopPropagation());

/* Save (Add or Update) */
saveTaskBtn.addEventListener("click", () => {
  if (!validateForm()) return;

  const name = taskName.value.trim();
  const date = taskDate.value;
  const time = taskTime.value;
  const priority = taskPriority.value;
  const desc = taskDesc.value.trim();

  // ✅ Convert time into 12-hour format here
  const timeFormatted = formatTimeTo12Hour(time);

  if (editTask) {
    // update existing task
    const titleEl = editTask.querySelector('.task-title');
    const dateEl = editTask.querySelector('.task-date');
    const prEl = editTask.querySelector('.task-priority');
    const descEl = editTask.querySelector('.task-desc');
    const header = editTask.querySelector('.task-header');

    if (titleEl) titleEl.textContent = name;
    if (dateEl) dateEl.textContent = date ? `📅 ${date} ${timeFormatted}` : '';
    if (prEl) {
      prEl.textContent = priority;
      prEl.className = `task-meta task-priority ${priority}`;
    }

    if (descEl) {
      if (desc) descEl.textContent = desc;
      else descEl.remove();
    } else if (desc) {
      const newDesc = document.createElement('div');
      newDesc.className = 'task-desc';
      newDesc.textContent = desc;
      const actions = editTask.querySelector('.task-actions');
      editTask.insertBefore(newDesc, actions);
    }

    editTask = null;
  } else {
    // create new task
    const taskObj = { name, date, time: timeFormatted, priority, desc };
    const li = createTaskElement(taskObj);
    taskList.appendChild(li);
    toggleEmptyMessage();
  }

  hideModal();
  clearForm();
});

/* optional: keyboard shortcut - Esc closes modal when open */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && taskModal.classList.contains('show')) {
    // don't close modal on Esc if you'd rather force explicit Cancel; comment out if not wanted
    hideModal();
  }
});

// Show View Modal
function openViewModal(li) {
  viewTaskTitle.textContent = li.querySelector('.task-title')?.textContent || '';

  // Extract date and time text from card
  const dateText = li.querySelector('.task-date')?.textContent.replace('📅', '').trim() || '';
  let formattedDate = '';
  if (dateText) {
    const parts = dateText.split(' ');
    const d = parts[0];
    const t = parts[1] || '';
    formattedDate = `${d} ${formatTimeTo12Hour(t)}`;
  }
  viewTaskDate.textContent = formattedDate;

  const priority = li.querySelector('.task-priority')?.textContent || '';
  viewTaskPriority.textContent = priority;
  viewTaskPriority.className = priority ? priority : '';

  viewTaskDesc.textContent = li.querySelector('.task-desc')?.textContent || 'No description provided.';
  viewTaskModal.classList.add('show');
}

// Close View Modal
closeViewBtn.addEventListener('click', () => {
  viewTaskModal.classList.remove('show');
});

document.addEventListener("DOMContentLoaded", toggleEmptyMessage);
