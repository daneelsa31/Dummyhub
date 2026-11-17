// Get the main application container
DummyHub.app = document.getElementById("app");

// Update the navigation based on login status
DummyHub.updateAuthNavigation = function () {
    var loginLink = document.getElementById("login-link");
    var logoutButton = document.getElementById("logout-button");

    if (DummyHub.state.user) {
        loginLink.classList.add("hidden");
        logoutButton.classList.remove("hidden");
    } else {
        loginLink.classList.remove("hidden");
        logoutButton.classList.add("hidden");
    }

    logoutButton.onclick = DummyHub.logout;
};

// Display the current view
DummyHub.renderApp = function () {
    DummyHub.updateAuthNavigation();

    var route = DummyHub.getCurrentRoute();

    var logoutButton = document.getElementById("logout-button");

    if (DummyHub.state.user) {
        logoutButton.classList.remove("hidden");
    } else {
        logoutButton.classList.add("hidden");
    }

    logoutButton.onclick = DummyHub.logout;

    // Update the current route in our state
    DummyHub.state.currentRoute = route.name;

    // Temporary page content for testing
    // Display the appropriate view
    if (route.name === "login") {
        DummyHub.app.innerHTML = DummyHub.renderLogin();

        var loginForm = document.getElementById("login-form");

        loginForm.addEventListener("submit", DummyHub.handleLogin);
    } else if (route.name === "dashboard") {
        if (!DummyHub.state.user) {
            window.location.hash = "#/login";
            return;
        }

        DummyHub.app.innerHTML = DummyHub.renderDashboard();
        DummyHub.loadDashboardData();

        document.getElementById("new-quote-button").addEventListener(
            "click",
            DummyHub.loadNewQuote
        );
    } else if (route.name === "shop") {
        DummyHub.app.innerHTML = DummyHub.renderShop();
        DummyHub.loadProducts();
        DummyHub.loadCategories();
        DummyHub.setupCategoryFilter();
        DummyHub.setupProductSearch();
        DummyHub.setupProductSorting();
        DummyHub.setupInStockFilter();
        DummyHub.setupProductNavigation();
    } else if (route.name === "product-detail") {
        DummyHub.app.innerHTML = DummyHub.renderProductDetail();

        DummyHub.loadProductDetail(route.id).then(function () {
            DummyHub.setupProductGallery();
        });
    } else if (route.name === "cart") {
        if (!DummyHub.state.user) {
            DummyHub.state.redirectAfterLogin = "#/cart";
            window.location.hash = "#/login";
            return;
        }

        DummyHub.app.innerHTML = DummyHub.renderCart();

        if (DummyHub.state.cart.length > 0) {
            DummyHub.setupCartEvents();
        }
    } else if (route.name === "recipes") {
        DummyHub.app.innerHTML = DummyHub.renderRecipes();

        DummyHub.setupRecipeFilters();
        DummyHub.setupRecipeNavigation();
        DummyHub.loadRecipes();
    } else if (route.name === "recipe-detail") {
        DummyHub.app.innerHTML = DummyHub.renderRecipeDetail();
        DummyHub.loadRecipeDetail(route.id);
    } else if (route.name === "community") {
        DummyHub.communityLimit = 10;
        DummyHub.app.innerHTML = DummyHub.renderCommunity();

        DummyHub.setupCommunityFilters();
        DummyHub.setupLoadMorePosts();
        DummyHub.setupCommunityEvents();

        DummyHub.loadCommunityPosts();
    } else if (route.name === "post-detail") {
        DummyHub.app.innerHTML = DummyHub.renderPostDetail();
        DummyHub.loadPostDetail(route.id);
    } else if (route.name === "people") {
        DummyHub.app.innerHTML = DummyHub.renderPeople();

        DummyHub.setupPeopleControls();
        DummyHub.setupPeopleNavigation();

        DummyHub.loadPeople();

    } else if (route.name === "user-profile") {
        DummyHub.app.innerHTML = DummyHub.renderUserProfile();

        DummyHub.loadUserProfile(route.id);
    } else if (route.name === "tasks") {
        if (!DummyHub.state.user) {
            DummyHub.state.redirectAfterLogin = "#/tasks";
            window.location.hash = "#/login";
            return;
        }

        DummyHub.app.innerHTML = DummyHub.renderTasks();

        DummyHub.setupTaskControls();
        DummyHub.setupTaskEvents();

        DummyHub.loadTasks();
    } else if (route.name === "not-found") {
        DummyHub.app.innerHTML = DummyHub.renderNotFound();
    } else {
        DummyHub.app.innerHTML = `
        <h1>${route.name}</h1>
        <p>This page is still under development.</p>
        ${route.id ? `<p>ID: ${route.id}</p>` : ""}
    `;
    }
};

DummyHub.logout = function () {
    DummyHub.setState({
        user: null,
        accessToken: null,
        cart: []
    });

    window.location.hash = "#/login";
};

// Listen for changes in the URL hash
window.addEventListener("hashchange", function () {
    DummyHub.renderApp();
});

// Display the initial page
DummyHub.renderApp();



