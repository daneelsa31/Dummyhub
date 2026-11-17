
// Display the login page
DummyHub.renderLogin = function () {
    return `
        <section class="login-container">
            <h1>Welcome to DummyHub!</h1>
            <p>Log in to access your account.</p>

            <form id="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter your username"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                    >
                </div>

                <p id="login-error" class="error-message"></p>

                <button type="submit" id="login-button">
                    Login
                </button>
            </form>
        </section>
    `;
};


// Handle login form submission
DummyHub.handleLogin = async function (event) {
    event.preventDefault();

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    var errorElement = document.getElementById("login-error");
    var loginButton = document.getElementById("login-button");

    // Validate username
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        errorElement.textContent =
            "Username must be 3–20 characters and contain only letters, numbers, or underscores.";
        return;
    }

    // Validate password
    if (password.length < 6) {
        errorElement.textContent =
            "Password must be at least 6 characters.";
        return;
    }

    try {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
        errorElement.textContent = "";

        // Send login credentials
        var loginData = await DummyHub.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password,
                expiresInMins: 30
            })
        });

        // Store the access token temporarily
        DummyHub.state.accessToken = loginData.accessToken;

        // Retrieve authenticated user information
        var userData = await DummyHub.request("/auth/me");

        // Get the page the user originally wanted to visit
        var redirectRoute = DummyHub.state.redirectAfterLogin;

        // Update application state
        DummyHub.setState({
            user: userData,
            accessToken: loginData.accessToken,
            redirectAfterLogin: null
        });

        // Return to the original page or go to Dashboard
        window.location.hash = redirectRoute || "#/dashboard";

    } catch (error) {
        errorElement.textContent = error.message;

        // Clear password after unsuccessful login
        document.getElementById("password").value = "";

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
};
