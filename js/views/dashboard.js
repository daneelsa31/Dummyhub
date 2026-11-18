
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


// Retrieve dashboard information
DummyHub.loadDashboardData = async function () {
    var userId = DummyHub.state.user.id;

    var quoteElement = document.getElementById("dashboard-quote");
    var cartsElement = document.getElementById("dashboard-carts");
    var todosElement = document.getElementById("dashboard-todos");
    var postsElement = document.getElementById("dashboard-posts");
    var retryButton = document.getElementById("dashboard-retry");

    retryButton.classList.add("hidden");

    try {
        // Load all dashboard information at the same time
        var results = await Promise.all([
            DummyHub.request("/quotes/random"),

            DummyHub.request("/auth/users/" + userId + "/carts"),

            DummyHub.request("/auth/users/" + userId + "/todos"),

            DummyHub.request("/auth/users/" + userId + "/posts")
        ]);

        var quoteData = results[0];
        var cartData = results[1];
        var todoData = results[2];
        var postData = results[3];

        // Calculate cart count and combined discounted total using reduce
        var cartSummary = cartData.carts.reduce(
            function (summary, cart) {
                summary.count++;

                summary.discountedTotal += Number(
                    cart.discountedTotal || 0
                );

                return summary;
            },
            {
                count: 0,
                discountedTotal: 0
            }
        );

        // Calculate completed and pending todos using reduce
        var todoSummary = todoData.todos.reduce(
            function (summary, todo) {
                if (todo.completed) {
                    summary.completed++;
                } else {
                    summary.pending++;
                }

                return summary;
            },
            {
                completed: 0,
                pending: 0
            }
        );

        // Count posts using reduce
        var postCount = postData.posts.reduce(
            function (count) {
                return count + 1;
            },
            0
        );

        // Save dashboard information
        DummyHub.setState({
            dashboardData: {
                quote: quoteData,
                cartCount: cartSummary.count,
                discountedTotal: cartSummary.discountedTotal,
                completedTodos: todoSummary.completed,
                pendingTodos: todoSummary.pending,
                postCount: postCount
            }
        });

        // Display quote
        quoteElement.textContent =
            quoteData.quote + " — " + quoteData.author;

        // Display cart information
        cartsElement.textContent =
            cartSummary.count +
            " carts · Discounted total: $" +
            cartSummary.discountedTotal.toFixed(2);

        // Display todo information
        todosElement.textContent =
            todoSummary.completed +
            " completed · " +
            todoSummary.pending +
            " pending";

        // Display post information
        postsElement.textContent = postCount;

    } catch (error) {
        // Show an error if any dashboard request fails
        quoteElement.textContent =
            "Unable to load dashboard data.";

        cartsElement.textContent = "Unable to load carts.";
        todosElement.textContent = "Unable to load todos.";
        postsElement.textContent = "Unable to load posts.";

        retryButton.classList.remove("hidden");
    }

    // Set the retry action
    retryButton.onclick = function () {
        quoteElement.textContent = "Loading quote...";
        cartsElement.textContent = "Loading...";
        todosElement.textContent = "Loading...";
        postsElement.textContent = "Loading...";

        DummyHub.loadDashboardData();
    };
};


// Load a new random quote
DummyHub.loadNewQuote = async function () {
    var quoteElement = document.getElementById("dashboard-quote");
    var quoteButton = document.getElementById("new-quote-button");

    quoteButton.disabled = true;
    quoteButton.textContent = "Loading...";

    try {
        var quoteData = await DummyHub.request("/quotes/random");

        // Update only the quote in dashboard state
        DummyHub.setState({
            dashboardData: {
                ...DummyHub.state.dashboardData,
                quote: quoteData
            }
        });

        // Update only the quote card
        quoteElement.textContent =
            quoteData.quote + " — " + quoteData.author;

    } catch (error) {
        quoteElement.textContent = "Unable to load a new quote.";
    }

    quoteButton.disabled = false;
    quoteButton.textContent = "New Quote";
};
