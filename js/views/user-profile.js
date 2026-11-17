
DummyHub.currentUserProfile = null;

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

// Retrieve user information and related activity
DummyHub.loadUserProfile = async function (userId) {
    var content = document.getElementById("user-profile-content");

    try {
        var results = await Promise.all([
            DummyHub.request("/users/" + userId),
            DummyHub.request("/users/" + userId + "/posts"),
            DummyHub.request("/users/" + userId + "/todos"),
            DummyHub.request("/users/" + userId + "/carts")
        ]);

        DummyHub.currentUserProfile = {
            user: results[0],
            posts: results[1].posts,
            todos: results[2].todos,
            carts: results[3].carts
        };

        DummyHub.displayUserProfile();

    } catch (error) {
        content.innerHTML = `
            <p>Unable to load user profile.</p>
            <button id="retry-user-profile">Retry</button>
        `;

        document.getElementById("retry-user-profile").addEventListener(
            "click",
            function () {
                DummyHub.loadUserProfile(userId);
            }
        );
    }
};

// Display user profile information
DummyHub.displayUserProfile = function () {
    var profile = DummyHub.currentUserProfile;
    var user = profile.user;

    var content = document.getElementById("user-profile-content");

    content.innerHTML = `
        <button id="back-to-people">Back to People</button>

        <div class="profile-header">
            <img
                src="${DummyHub.escapeHTML(user.image)}"
                alt="${DummyHub.escapeHTML(user.firstName)}"
                width="150"
            >

            <h1>
                ${DummyHub.escapeHTML(user.firstName)}
                ${DummyHub.escapeHTML(user.lastName)}
            </h1>

            <p>${DummyHub.escapeHTML(user.company.title)}</p>
            <p>${DummyHub.escapeHTML(user.company.department)}</p>
        </div>

        <hr>

        <section>
            <h2>Personal Information</h2>

            <p>Username: ${DummyHub.escapeHTML(user.username)}</p>
            <p>Email: ${DummyHub.escapeHTML(user.email)}</p>
            <p>Phone: ${DummyHub.escapeHTML(user.phone)}</p>
            <p>Age: ${user.age}</p>
            <p>Gender: ${DummyHub.escapeHTML(user.gender)}</p>
            <p>Birth Date: ${DummyHub.escapeHTML(user.birthDate)}</p>
            <p>Blood Group: ${DummyHub.escapeHTML(user.bloodGroup)}</p>
        </section>

        <hr>

        <section>
            <h2>Address</h2>

            <p>${DummyHub.escapeHTML(user.address.address)}</p>
            <p>
                ${DummyHub.escapeHTML(user.address.city)},
                ${DummyHub.escapeHTML(user.address.state)}
            </p>
            <p>${DummyHub.escapeHTML(user.address.country)}</p>
        </section>

        <hr>

        <section>
            <h2>Company Information</h2>

            <p>Company: ${DummyHub.escapeHTML(user.company.name)}</p>
            <p>Job Title: ${DummyHub.escapeHTML(user.company.title)}</p>
            <p>Department: ${DummyHub.escapeHTML(user.company.department)}</p>
        </section>

        <hr>

        <section>
            <h2>User Activity</h2>

            <p>Posts: ${profile.posts.length}</p>
            <p>Tasks: ${profile.todos.length}</p>
            <p>Carts: ${profile.carts.length}</p>
        </section>

        <hr>

        <section>
            <h2>Recent Posts</h2>

            ${
                profile.posts.length > 0
                    ? profile.posts.slice(0, 5).map(function (post) {
                        return `
                            <article>
                                <h3>${DummyHub.escapeHTML(post.title)}</h3>
                                <p>${DummyHub.escapeHTML(post.body)}</p>
                            </article>
                        `;
                    }).join("")
                    : "<p>No posts available.</p>"
            }
        </section>
    `;

    document.getElementById("back-to-people").addEventListener(
        "click",
        function () {
            window.location.hash = "#/people";
        }
    );
};
