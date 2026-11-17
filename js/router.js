// Get the current route from the URL
DummyHub.getCurrentRoute = function () {
    var hash = window.location.hash;

    // Use login as the default route
    if (hash === "") {
        hash = "#/login";
    }

    // Remove the # symbol
    var path = hash.substring(1);

    // Split the path into separate parts
    var parts = path.split("/").filter(Boolean);

    // Identify the route
    if (parts[0] === "login") {
        return { name: "login" };
    }

    if (parts[0] === "dashboard") {
        return { name: "dashboard" };
    }

    if (parts[0] === "shop" && parts.length === 1) {
        return { name: "shop" };
    }

    if (parts[0] === "product" && parts[1]) {
        return {
            name: "product-detail",
            id: parts[1]
        };
    }

    if (parts[0] === "cart") {
        return { name: "cart" };
    }

    if (parts[0] === "recipes" && parts.length === 1) {
        return { name: "recipes" };
    }

    if (parts[0] === "recipe" && parts[1]) {
        return {
            name: "recipe-detail",
            id: parts[1]
        };
    }

    if (parts[0] === "community" && parts.length === 1) {
        return { name: "community" };
    }

    if (parts[0] === "post" && parts[1]) {
        return {
            name: "post-detail",
            id: parts[1]
        };
    }

    if (parts[0] === "people" && parts.length === 1) {
        return { name: "people" };
    }

    if (parts[0] === "people" && parts[1]) {
        return {
            name: "user-profile",
            id: parts[1]
        };
    }

    if (parts[0] === "tasks") {
        return { name: "tasks" };
    }

    return { name: "not-found" };
};