
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
                    maxlength="120"
                    required
                >

                <p id="task-error" class="error-message"></p>

                <button type="submit" id="add-task-button">
                    Add Task
                </button>
            </form>

            <div class="task-summary">
                <p>Total Tasks: <span id="total-tasks">0</span></p>
                <p>Completed: <span id="completed-tasks">0</span></p>
                <p>Active: <span id="pending-tasks">0</span></p>
                <p><span id="items-left">0 items left</span></p>
            </div>

            <div class="task-controls">
                <select id="task-filter">
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div id="task-list">
                <p>Loading tasks...</p>
            </div>
        </section>
    `;
};


// Retrieve tasks belonging to the logged-in user
DummyHub.loadTasks = async function () {
    var taskList = document.getElementById("task-list");

    try {
        var userId = DummyHub.state.user.id;

        var data = await DummyHub.request(
            "/auth/users/" + userId + "/todos"
        );

        DummyHub.setState({
            tasks: data.todos || []
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

    if (!taskList) {
        return;
    }

    // Update counts whenever the tasks are rendered
    DummyHub.updateTaskSummary();

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
    var tasks = DummyHub.state.tasks || [];

    var total = tasks.length;

    var completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    var active = total - completed;

    var totalElement = document.getElementById("total-tasks");
    var completedElement = document.getElementById("completed-tasks");
    var pendingElement = document.getElementById("pending-tasks");
    var itemsLeftElement = document.getElementById("items-left");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

    if (pendingElement) {
        pendingElement.textContent = active;
    }

    if (itemsLeftElement) {
        itemsLeftElement.textContent =
            active + (active === 1 ? " item left" : " items left");
    }
};


// Filter tasks
DummyHub.filterTasks = function () {
    var filterElement = document.getElementById("task-filter");

    if (!filterElement) {
        return;
    }

    var selectedFilter = filterElement.value;
    var tasks = DummyHub.state.tasks || [];

    var filteredTasks = tasks.filter(function (task) {
        if (selectedFilter === "completed") {
            return task.completed;
        }

        if (selectedFilter === "active") {
            return !task.completed;
        }

        return true;
    });

    DummyHub.displayTasks(filteredTasks);
};


// Add a new task
DummyHub.addTask = async function (event) {
    event.preventDefault();

    var taskInput = document.getElementById("task-input");
    var errorElement = document.getElementById("task-error");
    var addButton = document.getElementById("add-task-button");

    var taskText = taskInput.value.trim();

    var validationMessage = DummyHub.validateTask(taskText);

    if (validationMessage) {
        errorElement.textContent = validationMessage;
        return;
    }

    try {
        addButton.disabled = true;
        addButton.textContent = "Adding...";
        errorElement.textContent = "";

        var newTask = await DummyHub.request("/todos/add", {
            method: "POST",
            body: JSON.stringify({
                todo: taskText,
                completed: false,
                userId: DummyHub.state.user.id
            })
        });

        // Mark the new task as locally created
        newTask.isLocal = true;

        // Add the task to the application state
        DummyHub.setState({
            tasks: [
                newTask,
                ...(DummyHub.state.tasks || [])
            ]
        });

        taskInput.value = "";

        // Show the new task even if Completed was selected
        document.getElementById("task-filter").value = "all";

        DummyHub.filterTasks();

    } catch (error) {
        errorElement.textContent =
            "Unable to add task: " + error.message;

    } finally {
        addButton.disabled = false;
        addButton.textContent = "Add Task";
    }
};


// Toggle task completion
DummyHub.toggleTask = async function (taskId) {
    var task = DummyHub.state.tasks.find(function (item) {
        return item.id === taskId;
    });

    if (!task) {
        return;
    }

    var newStatus = !task.completed;

    // Locally created tasks do not need an API request
    if (task.isLocal) {
        var localTasks = DummyHub.state.tasks.map(function (item) {
            if (item.id === taskId) {
                return {
                    ...item,
                    completed: newStatus
                };
            }

            return item;
        });

        DummyHub.setState({
            tasks: localTasks
        });

        DummyHub.filterTasks();
        return;
    }

    try {
        await DummyHub.request("/todos/" + taskId, {
            method: "PUT",
            body: JSON.stringify({
                completed: newStatus
            })
        });

        // Update state only after the request succeeds
        var updatedTasks = DummyHub.state.tasks.map(function (item) {
            if (item.id === taskId) {
                return {
                    ...item,
                    completed: newStatus
                };
            }

            return item;
        });

        DummyHub.setState({
            tasks: updatedTasks
        });

        DummyHub.filterTasks();

    } catch (error) {
        alert("Unable to update task: " + error.message);
        DummyHub.filterTasks();
    }
};


// Delete a task
DummyHub.deleteTask = async function (taskId) {
    var task = DummyHub.state.tasks.find(function (item) {
        return item.id === taskId;
    });

    if (!task) {
        return;
    }

    // Locally created tasks can be deleted without an API request
    if (task.isLocal) {
        var localTasks = DummyHub.state.tasks.filter(function (item) {
            return item.id !== taskId;
        });

        DummyHub.setState({
            tasks: localTasks
        });

        DummyHub.filterTasks();
        return;
    }

    try {
        var response = await DummyHub.request("/todos/" + taskId, {
            method: "DELETE"
        });

        // Remove the task only when the API confirms deletion
        if (response.isDeleted === true) {
            var updatedTasks = DummyHub.state.tasks.filter(function (item) {
                return item.id !== taskId;
            });

            DummyHub.setState({
                tasks: updatedTasks
            });

            DummyHub.filterTasks();
        } else {
            alert("The task was not deleted.");
        }

    } catch (error) {
        alert("Unable to delete task: " + error.message);
    }
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
