
// Escape HTML to prevent unsafe content from being displayed
DummyHub.escapeHTML = function (value) {
    var div = document.createElement("div");

    div.textContent = value == null ? "" : String(value);

    return div.innerHTML;
};

// Delay a function until the user stops triggering it
DummyHub.debounce = function (callback, delay) {
    var timeoutId;

    return function () {
        var args = arguments;

        clearTimeout(timeoutId);

        timeoutId = setTimeout(function () {
            callback.apply(null, args);
        }, delay);
    };
};

// Format numbers as Philippine pesos
DummyHub.formatPrice = function (price) {
    return "₱" + Number(price || 0).toFixed(2);
};

// Validate task descriptions
DummyHub.validateTask = function (task) {
    var taskText = task.trim();

    if (taskText.length < 3) {
        return "Task must contain at least 3 characters.";
    }

    if (taskText.length > 120) {
        return "Task must not exceed 120 characters.";
    }

    return "";
};

// Validate community comments
DummyHub.validateComment = function (comment) {
    var commentText = comment.trim();

    if (commentText.length < 1) {
        return "Please enter a comment.";
    }

    if (commentText.length > 280) {
        return "Comment must not exceed 280 characters.";
    }

    return "";
};

DummyHub.validateTask = function (task) {
    var taskText = task.trim();

    if (taskText.length < 3) {
        return "Task must contain at least 3 characters.";
    }

    if (taskText.length > 120) {
        return "Task must not exceed 120 characters.";
    }

    return "";
};
