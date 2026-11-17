
DummyHub.allRecipes = [];

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
                </select>

                <select id="recipe-tag">
                    <option value="">All Tags</option>
                </select>

                <select id="recipe-meal-type">
                    <option value="">All Meal Types</option>
                </select>
            </div>

            <div id="recipe-list">
                <p>Loading recipes...</p>
            </div>
        </section>
    `;
};


// Retrieve all recipes from DummyJSON
DummyHub.loadRecipes = async function () {
    var recipeList = document.getElementById("recipe-list");

    try {
        var data = await DummyHub.request("/recipes?limit=0");

        DummyHub.allRecipes = data.recipes;

        DummyHub.loadRecipeFilters();
        DummyHub.applyRecipeFilters();

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


// Populate the Tag and Meal Type dropdowns
DummyHub.loadRecipeFilters = function () {
    var tagFilter = document.getElementById("recipe-tag");
    var mealTypeFilter = document.getElementById("recipe-meal-type");

    var tags = [];
    var mealTypes = [];

    DummyHub.allRecipes.forEach(function (recipe) {
        recipe.tags.forEach(function (tag) {
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        });

        recipe.mealType.forEach(function (mealType) {
            if (!mealTypes.includes(mealType)) {
                mealTypes.push(mealType);
            }
        });
    });

    tags.forEach(function (tag) {
        tagFilter.innerHTML += `
            <option value="${DummyHub.escapeHTML(tag)}">
                ${DummyHub.escapeHTML(tag)}
            </option>
        `;
    });

    mealTypes.forEach(function (mealType) {
        mealTypeFilter.innerHTML += `
            <option value="${DummyHub.escapeHTML(mealType)}">
                ${DummyHub.escapeHTML(mealType)}
            </option>
        `;
    });
};


// Apply search, sorting, and filters
DummyHub.applyRecipeFilters = function () {
    var searchTerm = document.getElementById("recipe-search").value.toLowerCase();
    var sortValue = document.getElementById("recipe-sort").value;
    var selectedTag = document.getElementById("recipe-tag").value;
    var selectedMealType = document.getElementById("recipe-meal-type").value;

    var filteredRecipes = DummyHub.allRecipes.filter(function (recipe) {
        var matchesSearch =
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.cuisine.toLowerCase().includes(searchTerm);

        var matchesTag =
            selectedTag === "" || recipe.tags.includes(selectedTag);

        var matchesMealType =
            selectedMealType === "" || recipe.mealType.includes(selectedMealType);

        return matchesSearch && matchesTag && matchesMealType;
    });

    if (sortValue === "name-asc") {
        filteredRecipes.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

    } else if (sortValue === "name-desc") {
        filteredRecipes.sort(function (a, b) {
            return b.name.localeCompare(a.name);
        });

    } else if (sortValue === "rating-desc") {
        filteredRecipes.sort(function (a, b) {
            return b.rating - a.rating;
        });

    } else if (sortValue === "rating-asc") {
        filteredRecipes.sort(function (a, b) {
            return a.rating - b.rating;
        });
    }

    DummyHub.displayRecipes(filteredRecipes);
};


// Display the filtered recipes
DummyHub.displayRecipes = function (recipes) {
    var recipeList = document.getElementById("recipe-list");

    if (recipes.length === 0) {
        recipeList.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    recipeList.innerHTML = recipes.map(function (recipe) {
        return `
            <div class="recipe-card">
                <img
                    src="${DummyHub.escapeHTML(recipe.image)}"
                    alt="${DummyHub.escapeHTML(recipe.name)}"
                >

                <h3>${DummyHub.escapeHTML(recipe.name)}</h3>

                <p>Cuisine: ${DummyHub.escapeHTML(recipe.cuisine)}</p>

                <p>Rating: ${recipe.rating} / 5</p>

                <p>Preparation Time: ${recipe.prepTimeMinutes} minutes</p>

                <button
                    data-action="view-recipe"
                    data-id="${recipe.id}"
                >
                    View Recipe
                </button>
            </div>
        `;
    }).join("");
};


// Connect the search and filter controls
DummyHub.setupRecipeFilters = function () {
    document.getElementById("recipe-search").addEventListener(
        "input",
        DummyHub.applyRecipeFilters
    );

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

        window.location.hash = "#/recipe/" + recipeId;
    });
};
