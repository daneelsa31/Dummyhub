
// Display the Recipes page
DummyHub.renderRecipes = function () {
    return `
        <section class="recipes-page">
            <h1>Recipes</h1>

            <div class="recipe-controls">
                <input
                    type="text"
                    id="recipe-search"
                    placeholder="Search recipes..."
                >

                <select id="recipe-sort">
                    <option value="">Sort By</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="rating-desc">Highest Rating</option>
                    <option value="rating-asc">Lowest Rating</option>
                    <option value="caloriesPerServing-asc">Lowest Calories</option>
                    <option value="caloriesPerServing-desc">Highest Calories</option>
                </select>

                <select id="recipe-tag">
                    <option value="">All Tags</option>
                </select>

                <select id="recipe-meal-type">
                    <option value="">All Meal Types</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Dessert">Dessert</option>
                </select>

                <select id="recipe-difficulty">
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>

                <select id="recipe-prep-time">
                    <option value="">Any Preparation Time</option>
                    <option value="15">Under 15 minutes</option>
                    <option value="30">Under 30 minutes</option>
                    <option value="45">Under 45 minutes</option>
                    <option value="60">Under 60 minutes</option>
                </select>
            </div>

            <div id="recipe-list">
                <p>Loading recipes...</p>
            </div>

            <div id="recipe-pagination"></div>
        </section>
    `;
};


// Retrieve recipes from DummyJSON
DummyHub.loadRecipes = async function () {
    var recipeList = document.getElementById("recipe-list");

    recipeList.innerHTML = "<p>Loading recipes...</p>";

    try {
        // Load recipes from the API
        var data = await DummyHub.request("/recipes?limit=50");

        DummyHub.setState({
            recipes: data.recipes,
            recipeTotal: data.total,
            recipeCurrentPage: 1
        });

        await DummyHub.loadRecipeFilters();
        await DummyHub.applyRecipeFilters();

    } catch (error) {
        recipeList.innerHTML = `
            <p>Unable to load recipes.</p>
            <button id="retry-recipes">Retry</button>
        `;

        document.getElementById("retry-recipes").addEventListener(
            "click",
            DummyHub.loadRecipes
        );
    }
};


// Populate the Tag dropdown
DummyHub.loadRecipeFilters = async function () {
    var tagFilter = document.getElementById("recipe-tag");

    try {
        // Get available tags from the API
        var tags = await DummyHub.request("/recipes/tags");

        // Clear old options before adding tags
        tagFilter.innerHTML = '<option value="">All Tags</option>';

        tags.forEach(function (tag) {
            var option = document.createElement("option");

            option.value = tag;
            option.textContent = tag;

            tagFilter.appendChild(option);
        });

    } catch (error) {
        // Keep the tag dropdown usable if loading tags fails
    }
};


// Apply search, server sorting, and client-side filters
DummyHub.applyRecipeFilters = async function () {
    var searchTerm = document.getElementById("recipe-search").value.trim();
    var selectedTag = document.getElementById("recipe-tag").value;
    var selectedMealType = document.getElementById("recipe-meal-type").value;
    var difficulty = document.getElementById("recipe-difficulty").value;
    var prepTime = document.getElementById("recipe-prep-time").value;
    var sortValue = document.getElementById("recipe-sort").value;

    var endpoint = "/recipes?limit=50";

    // Use the API search endpoint when a search term is entered
    if (searchTerm !== "") {
        endpoint = "/recipes/search?q=" +
            encodeURIComponent(searchTerm) + "&limit=50";
    }

    // Use the API tag endpoint when a tag is selected
    else if (selectedTag !== "") {
        endpoint = "/recipes/tag/" +
            encodeURIComponent(selectedTag) + "?limit=50";
    }

    // Use the API meal-type endpoint when a meal type is selected
    else if (selectedMealType !== "") {
        endpoint = "/recipes/meal-type/" +
            encodeURIComponent(selectedMealType) + "?limit=50";
    }

    // Add server-side sorting parameters
    if (sortValue !== "") {
        var sortParts = sortValue.split("-");
        var sortBy = sortParts[0];
        var order = sortParts[1];

        endpoint += "&sortBy=" + encodeURIComponent(sortBy);
        endpoint += "&order=" + encodeURIComponent(order);
    }

    var recipeList = document.getElementById("recipe-list");

    recipeList.innerHTML = "<p>Loading recipes...</p>";

    try {
        // Request the recipes using the selected API endpoint
        var data = await DummyHub.request(endpoint);

        var recipes = data.recipes;

        // Apply tag filter to the results when another endpoint was used
        if (selectedTag !== "" && searchTerm !== "") {
            recipes = recipes.filter(function (recipe) {
                return recipe.tags.includes(selectedTag);
            });
        }

        // Apply meal-type filter when another endpoint was used
        if (
            selectedMealType !== "" &&
            (searchTerm !== "" || selectedTag !== "")
        ) {
            recipes = recipes.filter(function (recipe) {
                return recipe.mealType.includes(selectedMealType);
            });
        }

        // Apply difficulty filter on the client side
        if (difficulty !== "") {
            recipes = recipes.filter(function (recipe) {
                return recipe.difficulty === difficulty;
            });
        }

        // Apply total preparation time filter on the client side
        if (prepTime !== "") {
            recipes = recipes.filter(function (recipe) {
                var totalTime =
                    recipe.prepTimeMinutes + recipe.cookTimeMinutes;

                return totalTime < Number(prepTime);
            });
        }

        // Save the filtered recipes
        DummyHub.setState({
            filteredRecipes: recipes,
            recipeCurrentPage: 1
        });

        DummyHub.displayRecipes(recipes);

    } catch (error) {
        recipeList.innerHTML = `
            <p>Unable to filter recipes.</p>
            <button id="retry-recipes">Retry</button>
        `;

        document.getElementById("retry-recipes").addEventListener(
            "click",
            DummyHub.applyRecipeFilters
        );
    }
};


// Display the filtered recipes
DummyHub.displayRecipes = function (recipes) {
    var recipeList = document.getElementById("recipe-list");
    var pagination = document.getElementById("recipe-pagination");

    var limit = 12;
    var totalPages = Math.ceil(recipes.length / limit);

    if (recipes.length === 0) {
        recipeList.innerHTML = "<p>No recipes found.</p>";
        pagination.innerHTML = "";
        return;
    }

    var currentPage = DummyHub.state.recipeCurrentPage || 1;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    var start = (currentPage - 1) * limit;
    var displayedRecipes = recipes.slice(start, start + limit);

    recipeList.innerHTML = displayedRecipes.map(function (recipe) {
        return `
            <div class="recipe-card">
                <img
                    src="${DummyHub.escapeHTML(recipe.image)}"
                    alt="${DummyHub.escapeHTML(recipe.name)}"
                >

                <h3>${DummyHub.escapeHTML(recipe.name)}</h3>

                <p>Cuisine: ${DummyHub.escapeHTML(recipe.cuisine)}</p>

                <p>Rating: ${recipe.rating} / 5</p>

                <p>
                    Total Time:
                    ${recipe.prepTimeMinutes + recipe.cookTimeMinutes}
                    minutes
                </p>

                <p>
                    Difficulty:
                    ${DummyHub.escapeHTML(recipe.difficulty)}
                </p>

                <button
                    data-action="view-recipe"
                    data-id="${recipe.id}"
                >
                    View Recipe
                </button>
            </div>
        `;
    }).join("");

    pagination.innerHTML = `
        <button
            id="previous-recipe-page"
            ${currentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>Page ${currentPage} of ${totalPages}</span>

        <button
            id="next-recipe-page"
            ${currentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    DummyHub.setupRecipePagination();
};


// Set up recipe pagination
DummyHub.setupRecipePagination = function () {
    var previousButton = document.getElementById("previous-recipe-page");
    var nextButton = document.getElementById("next-recipe-page");

    if (previousButton) {
        previousButton.addEventListener("click", function () {
            DummyHub.setState({
                recipeCurrentPage: DummyHub.state.recipeCurrentPage - 1
            });

            DummyHub.displayRecipes(DummyHub.state.filteredRecipes);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            DummyHub.setState({
                recipeCurrentPage: DummyHub.state.recipeCurrentPage + 1
            });

            DummyHub.displayRecipes(DummyHub.state.filteredRecipes);
        });
    }
};


// Connect the search and filter controls
DummyHub.setupRecipeFilters = function () {
    var searchInput = document.getElementById("recipe-search");

    var searchHandler = DummyHub.debounce(function () {
        DummyHub.applyRecipeFilters();
    }, 300);

    searchInput.addEventListener("input", searchHandler);

    document.getElementById("recipe-sort").addEventListener(
        "change",
        DummyHub.applyRecipeFilters
    );

    document.getElementById("recipe-tag").addEventListener(
        "change",
        DummyHub.applyRecipeFilters
    );

    document.getElementById("recipe-meal-type").addEventListener(
        "change",
        DummyHub.applyRecipeFilters
    );

    document.getElementById("recipe-difficulty").addEventListener(
        "change",
        DummyHub.applyRecipeFilters
    );

    document.getElementById("recipe-prep-time").addEventListener(
        "change",
        DummyHub.applyRecipeFilters
    );
};


// Handle clicks on View Recipe buttons
DummyHub.setupRecipeNavigation = function () {
    var recipeList = document.getElementById("recipe-list");

    recipeList.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="view-recipe"]');

        if (!button) {
            return;
        }

        var recipeId = button.dataset.id;

        window.location.hash = "#/recipes/" + recipeId;
    });
};
