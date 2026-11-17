// Create the shared DummyHub object
window.DummyHub = window.DummyHub || {};

// Central application state
DummyHub.state = {
    user: null,
    accessToken: null,
    cart: [],
    pastCarts: [],
    currentRoute: "login",
    redirectAfterLogin: null
};

// Update the application state
DummyHub.setState = function (newState) {
    DummyHub.state = {
        ...DummyHub.state,
        ...newState
    };

    // Re-render the application after updating state
    if (typeof DummyHub.renderApp === "function") {
        DummyHub.renderApp();
    }
};