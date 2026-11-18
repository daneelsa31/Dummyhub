
// Get the main application container
DummyHub.app = document.getElementById("app");

// Check whether the saved login information has been checked
DummyHub.authInitialized = false;


// Update the header based on login status
DummyHub.updateAuthNavigation = function () {
    var loginLink = document.getElementById("login-link");
    var logoutButton = document.getElementById("logout-button");
    var loggedInUser = document.getElementById("logged-in-user");
    var userName = document.getElementById("user-name");
    var userAvatar = document.getElementById("user-avatar");

    if (DummyHub.state.user) {
        if (loginLink) {
            loginLink.classList.add("hidden");
        }

        if (logoutButton) {
            logoutButton.classList.remove("hidden");
        }

        if (loggedInUser) {
            loggedInUser.classList.remove("hidden");
        }

        if (userName) {
            userName.textContent =
                DummyHub.state.user.firstName +
                " " +
                DummyHub.state.user.lastName;
        }

        if (userAvatar) {
            userAvatar.src = DummyHub.state.user.image || "";
            userAvatar.alt = "Profile picture of " +
                (DummyHub.state.user.firstName || "user");
        }

    } else {
        if (loginLink) {
            loginLink.classList.remove("hidden");
        }

        if (logoutButton) {
            logoutButton.classList.add("hidden");
        }

        if (loggedInUser) {
            loggedInUser.classList.add("hidden");
        }

        if (userName) {
            userName.textContent = "";
        }

        if (userAvatar) {
            userAvatar.src = "";
        }
    }
};


// Update the cart badge in the header
DummyHub.updateCartBadge = function () {
    var cartBadge = document.getElementById("cart-badge");

    if (!cartBadge) {
        return;
    }

    // Calculate the total quantity of all cart items
    var cartCount = DummyHub.state.cart.reduce(function (total, item) {
        return total + Number(item.quantity || 0);
    }, 0);

    // Always display the badge, even when the cart is empty
    cartBadge.textContent = cartCount;
    cartBadge.classList.remove("hidden");
};


// Highlight the navigation link for the current page
DummyHub.updateActiveNavigation = function (routeName) {
    var navLinks = document.querySelectorAll(".main-nav a");

    // Group detail pages with their main navigation pages
    var activeRoute = routeName;

    if (routeName === "product-detail") {
        activeRoute = "shop";
    } else if (routeName === "recipe-detail") {
        activeRoute = "recipes";
    } else if (routeName === "post-detail") {
        activeRoute = "community";
    } else if (routeName === "user-profile") {
        activeRoute = "people";
    }

    navLinks.forEach(function (link) {
        var linkRoute = link.getAttribute("href").replace("#/", "");

        if (linkRoute === activeRoute) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        }
    });
};


// Restore and verify a saved login session
DummyHub.initializeAuth = async function () {
    var savedAccessToken = localStorage.getItem("accessToken");
    var savedRefreshToken = localStorage.getItem("refreshToken");

    if (!savedAccessToken) {
        DummyHub.authInitialized = true;
        return;
    }

    // Temporarily restore the saved tokens
    DummyHub.setState({
        accessToken: savedAccessToken,
        refreshToken: savedRefreshToken
    });

    try {
        // Ask the server to verify the saved access token
        var userData = await DummyHub.request("/auth/me");

        DummyHub.setState({
            user: userData
        });

    } catch (error) {
        // Remove invalid or expired login information
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        DummyHub.setState({
            user: null,
            accessToken: null,
            refreshToken: null
        });
    }

    DummyHub.authInitialized = true;
};


// Display the current page
DummyHub.renderApp = async function () {
    // Wait until saved login information has been checked
    if (!DummyHub.authInitialized) {
        return;
    }

    var route = DummyHub.getCurrentRoute();

    // Prevent logged-in users from opening Login
    if (route.name === "login" && DummyHub.state.user) {
        window.location.hash = "#/";
        return;
    }

    // Pages that require login
    var protectedRoutes = ["dashboard", "cart", "tasks"];

    if (
        protectedRoutes.includes(route.name) &&
        !DummyHub.state.user
    ) {
        DummyHub.state.redirectAfterLogin =
            window.location.hash || "#/";

        window.location.hash = "#/login";
        return;
    }

    // Update the current page and header
    DummyHub.state.currentRoute = route.name;

    DummyHub.updateAuthNavigation();
    DummyHub.updateCartBadge();
    DummyHub.updateActiveNavigation(route.name);

    // Login page
    if (route.name === "login") {
        DummyHub.app.innerHTML = DummyHub.renderLogin();

        var loginForm = document.getElementById("login-form");

        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                DummyHub.handleLogin
            );
        }
    }

    // Dashboard page
    else if (route.name === "dashboard") {
        DummyHub.app.innerHTML = DummyHub.renderDashboard();

        await DummyHub.loadDashboardData();

        var quoteButton = document.getElementById("new-quote-button");

        if (quoteButton) {
            quoteButton.addEventListener(
                "click",
                DummyHub.loadNewQuote
            );
        }
    }

    // Shop page
    else if (route.name === "shop") {
        DummyHub.app.innerHTML = DummyHub.renderShop();

        DummyHub.setupCategoryFilter();
        DummyHub.setupProductSearch();
        DummyHub.setupProductSorting();
        DummyHub.setupInStockFilter();
        DummyHub.setupProductNavigation();

        await DummyHub.loadProducts();
        await DummyHub.loadCategories();
    }

    // Product Details page
    else if (route.name === "product-detail") {
        DummyHub.app.innerHTML = DummyHub.renderProductDetail();

        await DummyHub.loadProductDetail(route.id);
    }

    // Cart page
    else if (route.name === "cart") {
        DummyHub.app.innerHTML = DummyHub.renderCart();

        await DummyHub.loadPastCarts();
    }

    // Recipes page
    else if (route.name === "recipes") {
        DummyHub.app.innerHTML = DummyHub.renderRecipes();

        DummyHub.setupRecipeFilters();
        DummyHub.setupRecipeNavigation();

        await DummyHub.loadRecipes();
    }

    // Recipe Details page
    else if (route.name === "recipe-detail") {
        DummyHub.app.innerHTML = DummyHub.renderRecipeDetail();

        await DummyHub.loadRecipeDetail(route.id);
    }

    // Community page
    else if (route.name === "community") {
        DummyHub.app.innerHTML = DummyHub.renderCommunity();

        DummyHub.setupCommunityFilters();
        DummyHub.setupLoadMorePosts();
        DummyHub.setupCommunityEvents();

        await DummyHub.loadCommunityTags();
        await DummyHub.loadCommunityPosts(true);
    }

    // Post Details page
    else if (route.name === "post-detail") {
        DummyHub.app.innerHTML = DummyHub.renderPostDetail();

        await DummyHub.loadPostDetail(route.id);
    }

    // People page
    else if (route.name === "people") {
        DummyHub.app.innerHTML = DummyHub.renderPeople();

        DummyHub.setupPeopleControls();
        DummyHub.setupPeopleNavigation();

        await DummyHub.loadPeople();
    }

    // User Profile page
    else if (route.name === "user-profile") {
        DummyHub.app.innerHTML = DummyHub.renderUserProfile();

        await DummyHub.loadUserProfile(route.id);
    }

    // Tasks page
    else if (route.name === "tasks") {
        DummyHub.app.innerHTML = DummyHub.renderTasks();

        DummyHub.setupTaskControls();
        DummyHub.setupTaskEvents();

        await DummyHub.loadTasks();
    }

    // Not Found page
    else {
        DummyHub.app.innerHTML = DummyHub.renderNotFound();
    }
};


// Log out the current user
DummyHub.logout = function () {
    DummyHub.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        cart: [],
        pastCarts: [],
        cartReceipt: null,
        tasks: [],
        dashboardData: null
    });

    // Clear saved login information
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.location.hash = "#/login";
};


// Set up the Logout button
var logoutButton = document.getElementById("logout-button");

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        DummyHub.logout
    );
}


// Listen for page navigation
window.addEventListener("hashchange", function () {
    DummyHub.renderApp();
});


// Start the application after checking the saved session
DummyHub.initializeAuth().then(function () {
    DummyHub.renderApp();
});
