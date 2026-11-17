
DummyHub.allUsers = [];

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
                    <option value="">All Job Titles</option>
                </select>

                <select id="people-sort">
                    <option value="">Sort By</option>
                    <option value="firstName-asc">First Name (A-Z)</option>
                    <option value="firstName-desc">First Name (Z-A)</option>
                    <option value="lastName-asc">Last Name (A-Z)</option>
                    <option value="age-asc">Age (Youngest First)</option>
                    <option value="age-desc">Age (Oldest First)</option>
                </select>
            </div>

            <div id="people-list">
                <p>Loading people...</p>
            </div>
        </section>
    `;
};

// Retrieve users from the API
DummyHub.loadPeople = async function () {
    var peopleList = document.getElementById("people-list");

    try {
        var data = await DummyHub.request("/users?limit=0");

        DummyHub.allUsers = data.users;

        DummyHub.loadPeopleJobTitles();
        DummyHub.displayPeople(DummyHub.allUsers);

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

// Load available job titles into the filter
DummyHub.loadPeopleJobTitles = function () {
    var roleFilter = document.getElementById("people-role");

    var jobTitles = [
        ...new Set(
            DummyHub.allUsers.map(function (user) {
                return user.company.title;
            })
        )
    ];

    jobTitles.sort();

    jobTitles.forEach(function (title) {
        var option = document.createElement("option");

        option.value = title;
        option.textContent = title;

        roleFilter.appendChild(option);
    });
};

// Display users
DummyHub.displayPeople = function (users) {
    var peopleList = document.getElementById("people-list");

    if (users.length === 0) {
        peopleList.innerHTML = "<p>No people found.</p>";
        return;
    }

    peopleList.innerHTML = users.map(function (user) {
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

                <p>${DummyHub.escapeHTML(user.company.title)}</p>

                <p>${DummyHub.escapeHTML(user.company.department)}</p>

                <p>${DummyHub.escapeHTML(user.email)}</p>

                <button
                    data-action="view-person"
                    data-id="${user.id}"
                >
                    View Profile
                </button>
            </article>
        `;
    }).join("");
};

// Search and filter users
DummyHub.filterPeople = function () {
    var searchTerm = document
        .getElementById("people-search")
        .value.toLowerCase();

    var selectedTitle = document.getElementById("people-role").value;

    var filteredUsers = DummyHub.allUsers.filter(function (user) {
        var fullName = user.firstName + " " + user.lastName;

        var matchesSearch =
            fullName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.company.title.toLowerCase().includes(searchTerm);

        var matchesTitle =
            selectedTitle === "" ||
            user.company.title === selectedTitle;

        return matchesSearch && matchesTitle;
    });

    DummyHub.displayPeople(filteredUsers);
};

// Sort users using the API
DummyHub.sortPeople = async function () {
    var sortValue = document.getElementById("people-sort").value;

    if (sortValue === "") {
        DummyHub.filterPeople();
        return;
    }

    var parts = sortValue.split("-");
    var sortBy = parts[0];
    var order = parts[1];

    try {
        var data = await DummyHub.request(
            "/users?sortBy=" + sortBy +
            "&order=" + order +
            "&limit=0"
        );

        DummyHub.allUsers = data.users;

        DummyHub.loadPeopleJobTitles();

        // Restore the selected job title
        var roleFilter = document.getElementById("people-role");

        var selectedTitle = roleFilter.value;

        roleFilter.innerHTML = '<option value="">All Job Titles</option>';

        DummyHub.loadPeopleJobTitles();

        roleFilter.value = selectedTitle;

        DummyHub.filterPeople();

    } catch (error) {
        console.log("Unable to sort people:", error);
    }
};

// Set up search, filter, and sorting
DummyHub.setupPeopleControls = function () {
    document.getElementById("people-search").addEventListener(
        "input",
        DummyHub.filterPeople
    );

    document.getElementById("people-role").addEventListener(
        "change",
        DummyHub.filterPeople
    );

    document.getElementById("people-sort").addEventListener(
        "change",
        DummyHub.sortPeople
    );
};

// Handle profile navigation using event delegation
DummyHub.setupPeopleNavigation = function () {
    var peopleList = document.getElementById("people-list");

    peopleList.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="view-person"]');

        if (!button) {
            return;
        }

        var userId = button.dataset.id;

        window.location.hash = "#/people/" + userId;
    });
};
