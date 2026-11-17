// Escape HTML special characters
DummyHub.escapeHTML = function (value) {
    var div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
};


// Create a debounced function
DummyHub.debounce = function (callback, delay) {
    var timeoutId;

    return function () {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function () {
            callback();
        }, delay);
    };
};