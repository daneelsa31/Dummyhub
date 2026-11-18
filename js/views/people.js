
// Display the People page
DummyHub.renderPeople = function () {
    return `
        <section class="people-page">
            <h1>People</h1>

            <div class="people-controls">
                <input
                    type="text"
                    id="people-search"
                    placeholder="Search people..."
                >

                <select id="people-role">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                </select>

                <select id="people-sort">
                    <option value="">Sort By</option>
                    <option value="firstName-asc">First Name (A-Z)</option>
                    <option value="firstName-desc">First Name (Z-A)</option>
                    <option value="lastName-asc">Last Name (A-Z)</option>
                    <option value="lastName-desc">Last Name (Z-A)</option>
                    <option value="age-asc">Age (Youngest First)</option>
                    <option value="age-desc">Age (Oldest First)</option>
                </select>
            </div>

            <div id="people-list">
                <p>Loading people...</p>
            </div>

            <div id="people-pagination"></div>
        </section>
    `;
};


// Retrieve users from the API
DummyHub.loadPeople = async function () {
    var peopleList = document.getElementById("people-list");

    peopleList.innerHTML = "<p>Loading people...</p>";

    var searchTerm = document.getElementById("people-search").value.trim();
    var selectedRole = document.getElementById("people-role").value;
    var sortValue = document.getElementById("people-sort").value;

    var endpoint = "/users?limit=100";

    if (searchTerm !== "") {
        endpoint = "/users/search?q=" +
            encodeURIComponent(searchTerm) +
            "&limit=100";
    } else if (selectedRole !== "") {
        endpoint = "/users/filter?key=role&value=" +
            encodeURIComponent(selectedRole) +
            "&limit=100";
    }

    // Apply server-side sorting
    if (sortValue !== "") {
        var sortParts = sortValue.split("-");

        endpoint += "&sortBy=" + sortParts[0] +
            "&order=" + sortParts[1];
    }

    try {
        var data = await DummyHub.request(endpoint);
        var users = data.users || [];
        var total = data.total || users.length;

        // Retrieve additional users if the API has more than 100
        var skip = users.length;

        while (skip < total) {
            var nextEndpoint = endpoint;

            if (nextEndpoint.includes("?")) {
                nextEndpoint += "&skip=" + skip;
            }

            var nextData = await DummyHub.request(nextEndpoint);

            if (!nextData.users || nextData.users.length === 0) {
                break;
            }

            users = users.concat(nextData.users);
            skip += nextData.users.length;
        }

        // Apply the role filter when search is also being used
        if (searchTerm !== "" && selectedRole !== "") {
            users = users.filter(function (user) {
                return user.role === selectedRole;
            });
        }

        DummyHub.setState({
            users: users,
            peopleTotal: users.length,
            peopleCurrentPage: 1
        });

        DummyHub.displayPeople();

    } catch (error) {
        peopleList.innerHTML = `
            <p>Unable to load people.</p>
            <button id="retry-people">Retry</button>
        `;

        document.getElementById("retry-people").addEventListener(
            "click",
            DummyHub.loadPeople
        );
    }
};


// Display users
DummyHub.displayPeople = function () {
    var peopleList = document.getElementById("people-list");
    var pagination = document.getElementById("people-pagination");

    if (!peopleList) {
        return;
    }

    var users = DummyHub.state.users || [];
    var currentPage = DummyHub.state.peopleCurrentPage || 1;
    var usersPerPage = 12;

    var totalPages = Math.ceil(users.length / usersPerPage);

    if (users.length === 0) {
        peopleList.innerHTML = "<p>No people found.</p>";
        pagination.innerHTML = "";
        return;
    }

    var startIndex = (currentPage - 1) * usersPerPage;

    var displayedUsers = users.slice(
        startIndex,
        startIndex + usersPerPage
    );

    peopleList.innerHTML = displayedUsers.map(function (user) {
        var company = user.company || {};

        var companyName = company.name || "No company";
        var companyTitle = company.title || "No job title";
        var department = company.department || "No department";

        return `
            <article class="person-card">
                <img
                    src="${DummyHub.escapeHTML(user.image)}"
                    alt="${DummyHub.escapeHTML(user.firstName)}"
                    width="100"
                >

                <h3>
                    ${DummyHub.escapeHTML(user.firstName)}
                    ${DummyHub.escapeHTML(user.lastName)}
                </h3>

                <p>Role: ${DummyHub.escapeHTML(user.role || "user")}</p>

                <p>Company: ${DummyHub.escapeHTML(companyName)}</p>

                <p>Job Title: ${DummyHub.escapeHTML(companyTitle)}</p>

                <p>Department: ${DummyHub.escapeHTML(department)}</p>

                <button
                    data-action="view-person"
                    data-id="${user.id}"
                >
                    View Profile
                </button>
            </article>
        `;
    }).join("");

    // Display pagination buttons
    if (totalPages > 1) {
        pagination.innerHTML = `
            <button
                id="people-previous"
                ${currentPage === 1 ? "disabled" : ""}
            >
                Previous
            </button>

            <span>Page ${currentPage} of ${totalPages}</span>

            <button
                id="people-next"
                ${currentPage === totalPages ? "disabled" : ""}
            >
                Next
            </button>
        `;

        document.getElementById("people-previous").addEventListener(
            "click",
            function () {
                DummyHub.changePeoplePage(-1);
            }
        );

        document.getElementById("people-next").addEventListener(
            "click",
            function () {
                DummyHub.changePeoplePage(1);
            }
        );
    } else {
        pagination.innerHTML = "";
    }
};


// Change the current People page
DummyHub.changePeoplePage = function (change) {
    var currentPage = DummyHub.state.peopleCurrentPage || 1;

    var totalPages = Math.ceil(
        DummyHub.state.users.length / 12
    );

    var newPage = currentPage + change;

    if (newPage < 1 || newPage > totalPages) {
        return;
    }

    DummyHub.setState({
        peopleCurrentPage: newPage
    });

    DummyHub.displayPeople();
};


// Search and filter users
DummyHub.filterPeople = function () {
    DummyHub.loadPeople();
};


// Sort users
DummyHub.sortPeople = function () {
    DummyHub.loadPeople();
};


// Set up search, filter, and sorting
DummyHub.setupPeopleControls = function () {
    var searchInput = document.getElementById("people-search");
    var roleFilter = document.getElementById("people-role");
    var sortFilter = document.getElementById("people-sort");

    var searchHandler = DummyHub.debounce(function () {
        DummyHub.filterPeople();
    }, 300);

    searchInput.addEventListener("input", searchHandler);

    roleFilter.addEventListener("change", function () {
        DummyHub.filterPeople();
    });

    sortFilter.addEventListener("change", function () {
        DummyHub.sortPeople();
    });
};


// Handle profile navigation using event delegation
DummyHub.setupPeopleNavigation = function () {
    var peopleList = document.getElementById("people-list");

    peopleList.addEventListener("click", function (event) {
        var button = event.target.closest(
            '[data-action="view-person"]'
        );

        if (!button) {
            return;
        }

        var userId = button.dataset.id;

        window.location.hash = "#/people/" + userId;
    });
};
