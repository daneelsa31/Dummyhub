
// Get the current route from the URL hash
DummyHub.getCurrentRoute = function () {
    var hash = window.location.hash;

    // Dashboard is the default page
    if (hash === "" || hash === "#/" || hash === "#") {
        return { name: "dashboard" };
    }

    var path = hash.substring(1);
    var parts = path.split("/").filter(Boolean);

    // Login
    if (parts[0] === "login" && parts.length === 1) {
        return { name: "login" };
    }

    // Dashboard
    if (parts[0] === "dashboard" && parts.length === 1) {
        return { name: "dashboard" };
    }

    // Shop
    if (parts[0] === "shop" && parts.length === 1) {
        return { name: "shop" };
    }

    // Product details
    if (parts[0] === "shop" && parts[1] && parts.length === 2) {
        return {
            name: "product-detail",
            id: parts[1]
        };
    }

    // Support the old product route too
    if (parts[0] === "product" && parts[1] && parts.length === 2) {
        return {
            name: "product-detail",
            id: parts[1]
        };
    }

    // Cart
    if (parts[0] === "cart" && parts.length === 1) {
        return { name: "cart" };
    }

    // Recipes
    if (parts[0] === "recipes" && parts.length === 1) {
        return { name: "recipes" };
    }

    // Recipe details
    if (
        (parts[0] === "recipes" || parts[0] === "recipe") &&
        parts[1] &&
        parts.length === 2
    ) {
        return {
            name: "recipe-detail",
            id: parts[1]
        };
    }

    // Community
    if (parts[0] === "community" && parts.length === 1) {
        return { name: "community" };
    }

    // Post details
    if (
        (parts[0] === "community" || parts[0] === "post") &&
        parts[1] &&
        parts.length === 2
    ) {
        return {
            name: "post-detail",
            id: parts[1]
        };
    }

    // People
    if (parts[0] === "people" && parts.length === 1) {
        return { name: "people" };
    }

    // User profile
    if (parts[0] === "people" && parts[1] && parts.length === 2) {
        return {
            name: "user-profile",
            id: parts[1]
        };
    }

    // Tasks
    if (parts[0] === "tasks" && parts.length === 1) {
        return { name: "tasks" };
    }

    // Unknown route
    return { name: "not-found" };
};
