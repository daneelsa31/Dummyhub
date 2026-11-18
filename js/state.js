
// Create the shared DummyHub object
window.DummyHub = window.DummyHub || {};

// Central application state
DummyHub.state = {
    // User authentication
    user: null,
    accessToken: null,
    refreshToken: null,

    // Application navigation
    currentRoute: "dashboard",
    redirectAfterLogin: null,

    // Dashboard information
    dashboardData: null,

    // Cart information
    cart: [],
    pastCarts: [],
    cartReceipt: null,

    // Shop information
    shopProducts: [],
    shopCurrentPage: 1,
    shopTotal: 0,
    shopSearchTerm: "",
    shopCategory: "",
    shopSortValue: "",
    shopInStockOnly: false,

    // Product details
    currentProduct: null,

    // Recipe information
    recipes: [],
    filteredRecipes: [],
    recipeTotal: 0,
    recipeCurrentPage: 1,
    currentRecipe: null,
    selectedServings: 1,

    // Community information
    communityPosts: [],
    communitySkip: 0,
    communityTotal: 0,
    communityReactions: {},

    // Post details
    currentPost: null,
    currentPostComments: [],

    // People information
    users: [],
    peopleTotal: 0,
    peopleCurrentPage: 1,
    currentUserProfile: null,

    // Tasks
    tasks: [],

    // Page loading statuses
    pageStatus: {}
};


// Update the application state
// Update the application state
DummyHub.setState = function (newState) {
    DummyHub.state = {
        ...DummyHub.state,
        ...newState
    };

    // Automatically update the cart badge whenever the state changes
    if (typeof DummyHub.updateCartBadge === "function") {
        DummyHub.updateCartBadge();
    }
};