DummyHub.renderDashboard = function () {
    return `
        <section class="dashboard">
            <h1>Welcome, ${DummyHub.escapeHTML(
        DummyHub.state.user.firstName
    )}!</h1>

            <section class="quote-card">
                <h2>Quote of the Day</h2>
                <p id="dashboard-quote">Loading quote...</p>

                <button id="new-quote-button">New Quote</button>
                <button id="dashboard-retry" class="hidden">Retry</button>
            </section>

            <section class="dashboard-cards">
                <div class="dashboard-card">
                    <h2>My Carts</h2>
                    <p id="dashboard-carts">Loading...</p>
                </div>

                <div class="dashboard-card">
                    <h2>My Todos</h2>
                    <p id="dashboard-todos">Loading...</p>
                </div>

                <div class="dashboard-card">
                    <h2>My Posts</h2>
                    <p id="dashboard-posts">Loading...</p>
                </div>
            </section>
        </section>
    `;
};

DummyHub.loadDashboardData = async function () {
    var userId = DummyHub.state.user.id;

    try {
        var results = await Promise.all([
            DummyHub.request("/quotes/random"),
            DummyHub.request("/carts/user/" + userId),
            DummyHub.request("/todos/user/" + userId),
            DummyHub.request("/posts/user/" + userId)
        ]);

        var quoteData = results[0];
        var cartData = results[1];
        var todoData = results[2];
        var postData = results[3];

        document.getElementById("dashboard-quote").textContent =
            quoteData.quote + " — " + quoteData.author;

        document.getElementById("dashboard-carts").textContent =
            cartData.total;

        document.getElementById("dashboard-todos").textContent =
            todoData.total;

        document.getElementById("dashboard-posts").textContent =
            postData.total;
        // Try to load the dashboard data
    } catch (error) {
        // Handle the error if something fails
        console.error(error);

        document.getElementById("dashboard-quote").textContent =
            "Unable to load dashboard data.";

        document.getElementById("dashboard-retry").classList.remove("hidden");

    }

    var retryButton = document.getElementById("dashboard-retry");

    retryButton.addEventListener("click", function () {
        retryButton.classList.add("hidden");

        document.getElementById("dashboard-quote").textContent =
            "Loading quote...";

        DummyHub.loadDashboardData();
    });
};

DummyHub.loadNewQuote = async function () {
    var quoteElement = document.getElementById("dashboard-quote");
    var quoteButton = document.getElementById("new-quote-button");

    quoteButton.disabled = true;
    quoteButton.textContent = "Loading...";

    try {
        var quoteData = await DummyHub.request("/quotes/random");

        quoteElement.textContent =
            quoteData.quote + " — " + quoteData.author;

    } catch (error) {
        quoteElement.textContent = "Unable to load a new quote.";
    }

    quoteButton.disabled = false;
    quoteButton.textContent = "New Quote";
};