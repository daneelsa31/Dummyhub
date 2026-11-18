
// Display the User Profile page
DummyHub.renderUserProfile = function () {
    return `
        <section class="user-profile-page">
            <div id="user-profile-content">
                <p>Loading profile...</p>
            </div>
        </section>
    `;
};


// Retrieve the user, posts, todos, and carts
DummyHub.loadUserProfile = async function (userId) {
    var content = document.getElementById("user-profile-content");

    try {
        // Load all four datasets simultaneously
        var results = await Promise.all([
            DummyHub.request("/users/" + userId),
            DummyHub.request("/users/" + userId + "/posts"),
            DummyHub.request("/users/" + userId + "/todos"),
            DummyHub.request("/carts/user/" + userId)
        ]);

        DummyHub.setState({
            currentUserProfile: {
                user: results[0],
                posts: results[1].posts || [],
                todos: results[2].todos || [],
                carts: results[3].carts || []
            }
        });

        DummyHub.displayUserProfile();

    } catch (error) {
        // Show the Not Found page if the user does not exist
        if (
            error.status === 404 ||
            error.message.toLowerCase().includes("not found")
        ) {
            content.innerHTML = DummyHub.renderNotFound();
            return;
        }

        // Show retry option for other errors
        content.innerHTML = `
            <p>Unable to load user profile.</p>
            <button onclick="DummyHub.loadUserProfile(${Number(userId)})">
                Try Again
            </button>
        `;
    }
};


// Display the User Profile and its activity
DummyHub.displayUserProfile = function () {
    var profile = DummyHub.state.currentUserProfile;
    var content = document.getElementById("user-profile-content");

    if (!profile || !content) return;

    var user = profile.user;
    var company = user.company || {};
    var address = user.address || {};

    // Display recent posts
    var postsHTML = "";

    if (profile.posts.length > 0) {
        postsHTML = profile.posts.slice(0, 5).map(function (post) {
            return `
                <article class="profile-post">
                    <h3>${DummyHub.escapeHTML(post.title)}</h3>
                    <p>${DummyHub.escapeHTML(post.body)}</p>
                    <p>Likes: ${post.reactions ? post.reactions.likes : 0}</p>
                </article>
            `;
        }).join("");
    } else {
        postsHTML = "<p>No posts available.</p>";
    }

    // Display todos
    var todosHTML = "";

    if (profile.todos.length > 0) {
        todosHTML = profile.todos.map(function (todo) {
            var status = todo.completed ? "Completed" : "Pending";

            return `
                <article class="profile-todo">
                    <p>${DummyHub.escapeHTML(todo.todo)}</p>
                    <p>Status: ${status}</p>
                </article>
            `;
        }).join("");
    } else {
        todosHTML = "<p>No todos available.</p>";
    }

    // Display carts
    var cartsHTML = "";

    if (profile.carts.length > 0) {
        cartsHTML = profile.carts.map(function (cart) {
            var productsHTML = "";

            if (cart.products && cart.products.length > 0) {
                productsHTML = cart.products.map(function (product) {
                    return `
                        <li>
                            ${DummyHub.escapeHTML(product.title)}
                            — Quantity: ${product.quantity}
                        </li>
                    `;
                }).join("");
            } else {
                productsHTML = "<li>No products in this cart.</li>";
            }

            return `
                <article class="profile-cart">
                    <h3>Cart #${cart.id}</h3>
                    <p>Total Products: ${cart.totalProducts || 0}</p>
                    <p>Total Quantity: ${cart.totalQuantity || 0}</p>
                    <p>Total: $${cart.total || 0}</p>
                    <ul>${productsHTML}</ul>
                </article>
            `;
        }).join("");
    } else {
        cartsHTML = "<p>No carts available.</p>";
    }

    // Display the complete profile
    content.innerHTML = `
        <button id="back-to-people">Back to People</button>

        <div class="profile-header">
            <img
                src="${DummyHub.escapeHTML(user.image)}"
                alt="${DummyHub.escapeHTML(user.firstName)}"
                width="120"
            >

            <h1>
                ${DummyHub.escapeHTML(user.firstName)}
                ${DummyHub.escapeHTML(user.lastName)}
            </h1>

            <p>${DummyHub.escapeHTML(company.title || "No job title")}</p>
            <p>${DummyHub.escapeHTML(company.department || "No department")}</p>
            <p>Role: ${DummyHub.escapeHTML(user.role || "user")}</p>
        </div>

        <section class="profile-information">
            <h2>Personal Information</h2>
            <p>Username: ${DummyHub.escapeHTML(user.username)}</p>
            <p>Email: ${DummyHub.escapeHTML(user.email)}</p>
            <p>Phone: ${DummyHub.escapeHTML(user.phone)}</p>
            <p>Age: ${user.age || "Not available"}</p>
            <p>Gender: ${DummyHub.escapeHTML(user.gender)}</p>
        </section>

        <section class="profile-address">
            <h2>Address</h2>
            <p>${DummyHub.escapeHTML(address.address || "Not available")}</p>
            <p>${DummyHub.escapeHTML(address.city || "")}</p>
            <p>${DummyHub.escapeHTML(address.state || "")}</p>
            <p>${DummyHub.escapeHTML(address.country || "")}</p>
        </section>

        <section class="profile-company">
            <h2>Company Information</h2>
            <p>Company: ${DummyHub.escapeHTML(company.name || "Not available")}</p>
            <p>Department: ${DummyHub.escapeHTML(company.department || "Not available")}</p>
            <p>Job Title: ${DummyHub.escapeHTML(company.title || "Not available")}</p>
        </section>

        <section class="profile-posts">
            <h2>Recent Posts (${profile.posts.length})</h2>
            ${postsHTML}
        </section>

        <section class="profile-todos">
            <h2>Todos (${profile.todos.length})</h2>
            ${todosHTML}
        </section>

        <section class="profile-carts">
            <h2>Carts (${profile.carts.length})</h2>
            ${cartsHTML}
        </section>
    `;

    // Return to the People page
    document.getElementById("back-to-people").addEventListener("click", function () {
        window.location.hash = "#/people";
    });
};
