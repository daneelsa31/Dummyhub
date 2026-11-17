
DummyHub.allTasks = [];

// Display the Tasks page
DummyHub.renderTasks = function () {
    return `
        <section class="tasks-page">
            <h1>My Tasks</h1>

            <form id="task-form">
                <input
                    type="text"
                    id="task-input"
                    placeholder="Enter a new task..."
                    required
                >

                <button type="submit">Add Task</button>
            </form>

            <div class="task-summary">
                <p>Total Tasks: <span id="total-tasks">0</span></p>
                <p>Completed: <span id="completed-tasks">0</span></p>
                <p>Pending: <span id="pending-tasks">0</span></p>
            </div>

            <div class="task-controls">
                <select id="task-filter">
                    <option value="all">All Tasks</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            <div id="task-list">
                <p>Loading tasks...</p>
            </div>
        </section>
    `;
};

// Retrieve tasks from the API
DummyHub.loadTasks = async function () {
    var taskList = document.getElementById("task-list");

    try {
        var data = await DummyHub.request("/todos?limit=0");

        // Only show tasks belonging to the logged-in user
        DummyHub.allTasks = data.todos.filter(function (todo) {
            return todo.userId === DummyHub.state.user.id;
        });

        DummyHub.updateTaskSummary();
        DummyHub.filterTasks();

    } catch (error) {
        taskList.innerHTML = `
            <p>Unable to load tasks.</p>
            <button id="retry-tasks">Retry</button>
        `;

        document.getElementById("retry-tasks").addEventListener(
            "click",
            DummyHub.loadTasks
        );
    }
};

// Display tasks
DummyHub.displayTasks = function (tasks) {
    var taskList = document.getElementById("task-list");

    if (tasks.length === 0) {
        taskList.innerHTML = "<p>No tasks found.</p>";
        return;
    }

    taskList.innerHTML = tasks.map(function (task) {
        return `
            <article class="task-item">
                <label>
                    <input
                        type="checkbox"
                        data-action="toggle-task"
                        data-id="${task.id}"
                        ${task.completed ? "checked" : ""}
                    >

                    <span class="${task.completed ? "completed" : ""}">
                        ${DummyHub.escapeHTML(task.todo)}
                    </span>
                </label>

                <button
                    data-action="delete-task"
                    data-id="${task.id}"
                >
                    Delete
                </button>
            </article>
        `;
    }).join("");
};

// Update task counts
DummyHub.updateTaskSummary = function () {
    var total = DummyHub.allTasks.length;

    var completed = DummyHub.allTasks.filter(function (task) {
        return task.completed;
    }).length;

    var pending = total - completed;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("pending-tasks").textContent = pending;
};

// Filter tasks
DummyHub.filterTasks = function () {
    var selectedFilter = document.getElementById("task-filter").value;

    var filteredTasks = DummyHub.allTasks.filter(function (task) {
        if (selectedFilter === "completed") {
            return task.completed;
        }

        if (selectedFilter === "pending") {
            return !task.completed;
        }

        return true;
    });

    DummyHub.displayTasks(filteredTasks);
};

// Add a new task
DummyHub.addTask = function (event) {
    event.preventDefault();

    var taskInput = document.getElementById("task-input");
    var taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    var newTask = {
        id: Date.now(),
        todo: taskText,
        completed: false,
        userId: DummyHub.state.user.id
    };

    DummyHub.allTasks = [
        newTask,
        ...DummyHub.allTasks
    ];

    taskInput.value = "";

    DummyHub.updateTaskSummary();
    DummyHub.filterTasks();
};

// Toggle task completion
DummyHub.toggleTask = function (taskId) {
    DummyHub.allTasks = DummyHub.allTasks.map(function (task) {
        if (task.id === taskId) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    DummyHub.updateTaskSummary();
    DummyHub.filterTasks();
};

// Delete a task
DummyHub.deleteTask = function (taskId) {
    DummyHub.allTasks = DummyHub.allTasks.filter(function (task) {
        return task.id !== taskId;
    });

    DummyHub.updateTaskSummary();
    DummyHub.filterTasks();
};

// Set up task form and filter
DummyHub.setupTaskControls = function () {
    document.getElementById("task-form").addEventListener(
        "submit",
        DummyHub.addTask
    );

    document.getElementById("task-filter").addEventListener(
        "change",
        DummyHub.filterTasks
    );
};

// Handle task actions using event delegation
DummyHub.setupTaskEvents = function () {
    var taskList = document.getElementById("task-list");

    taskList.addEventListener("change", function (event) {
        var checkbox = event.target.closest(
            '[data-action="toggle-task"]'
        );

        if (checkbox) {
            DummyHub.toggleTask(Number(checkbox.dataset.id));
        }
    });

    taskList.addEventListener("click", function (event) {
        var button = event.target.closest(
            '[data-action="delete-task"]'
        );

        if (button) {
            DummyHub.deleteTask(Number(button.dataset.id));
        }
    });
};
