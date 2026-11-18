
// Display the Recipe Details page
DummyHub.renderRecipeDetail = function () {
    return `
        <section class="recipe-detail-page">
            <div id="recipe-detail-content">
                <p>Loading recipe details...</p>
            </div>
        </section>
    `;
};


// Retrieve a specific recipe
DummyHub.loadRecipeDetail = async function (recipeId) {
    var content = document.getElementById("recipe-detail-content");

    try {
        var recipe = await DummyHub.request("/recipes/" + recipeId);

        DummyHub.setState({
            currentRecipe: recipe,
            selectedServings: recipe.servings || 1
        });

        DummyHub.displayRecipeDetail();

    } catch (error) {
        // Show Not Found page if the recipe does not exist
        if (
            error.status === 404 ||
            error.message.includes("not found") ||
            error.message.includes("Not Found")
        ) {
            content.innerHTML = DummyHub.renderNotFound();
            return;
        }

        // Show retry option for other errors
        content.innerHTML = `
            <div class="recipe-detail-error">
                <p>Unable to load recipe details.</p>
                <button id="retry-recipe-detail">Retry</button>
            </div>
        `;

        document.getElementById("retry-recipe-detail").addEventListener(
            "click",
            function () {
                DummyHub.loadRecipeDetail(recipeId);
            }
        );
    }
};


// Display the recipe information
DummyHub.displayRecipeDetail = function () {
    var recipe = DummyHub.state.currentRecipe;
    var selectedServings = DummyHub.state.selectedServings;
    var content = document.getElementById("recipe-detail-content");

    if (!recipe) {
        content.innerHTML = "<p>Recipe details are unavailable.</p>";
        return;
    }

    // Calculate total calories based on the selected servings
    var totalCalories = recipe.caloriesPerServing * selectedServings;

    // Get the recipe ingredients and instructions
    var ingredients = recipe.ingredients || [];
    var instructions = recipe.instructions || [];

    content.innerHTML = `
        <button id="back-to-recipes">Back to Recipes</button>

        <h1>${DummyHub.escapeHTML(recipe.name)}</h1>

        <img
            src="${DummyHub.escapeHTML(recipe.image)}"
            alt="${DummyHub.escapeHTML(recipe.name)}"
            class="recipe-detail-image"
        >

        <p>Cuisine: ${DummyHub.escapeHTML(recipe.cuisine)}</p>

        <p>Rating: ${recipe.rating} / 5</p>

        <p>Difficulty: ${DummyHub.escapeHTML(recipe.difficulty)}</p>

        <p>
            Preparation Time:
            ${recipe.prepTimeMinutes} minutes
        </p>

        <p>
            Cooking Time:
            ${recipe.cookTimeMinutes} minutes
        </p>

        <p>
            Total Time:
            ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes
        </p>

        <hr>

        <h2>Servings</h2>

        <button id="decrease-servings">-</button>

        <span id="serving-count">${selectedServings}</span>

        <button id="increase-servings">+</button>

        <div class="recipe-calories">
            <p>
                Calories per Serving:
                <strong>${recipe.caloriesPerServing}</strong>
            </p>

            <p>
                Total Calories for ${selectedServings} Serving(s):
                <strong>${totalCalories}</strong>
            </p>
        </div>

        <hr>

        <h2>Ingredients</h2>

        <ul>
            ${ingredients.map(function (ingredient) {
                return `
                    <li>
                        ${DummyHub.escapeHTML(
                            DummyHub.scaleIngredient(
                                ingredient,
                                recipe.servings,
                                selectedServings
                            )
                        )}
                    </li>
                `;
            }).join("")}
        </ul>

        <h2>Instructions</h2>

        <ol>
            ${instructions.map(function (instruction) {
                return `
                    <li>${DummyHub.escapeHTML(instruction)}</li>
                `;
            }).join("")}
        </ol>
    `;

    // Return to the Recipes page
    document.getElementById("back-to-recipes").addEventListener(
        "click",
        function () {
            window.location.hash = "#/recipes";
        }
    );

    // Change the number of servings
    document.getElementById("decrease-servings").addEventListener(
        "click",
        DummyHub.decreaseServings
    );

    document.getElementById("increase-servings").addEventListener(
        "click",
        DummyHub.increaseServings
    );
};


// Convert an ingredient amount into a number
DummyHub.parseIngredientAmount = function (amount) {
    var parts = amount.trim().split(" ");

    // Handle mixed fractions such as 1 1/2
    if (parts.length === 2 && parts[1].includes("/")) {
        var mixedFraction = parts[1].split("/");

        return Number(parts[0]) +
            Number(mixedFraction[0]) / Number(mixedFraction[1]);
    }

    // Handle simple fractions such as 1/2
    if (amount.includes("/")) {
        var fraction = amount.split("/");

        return Number(fraction[0]) / Number(fraction[1]);
    }

    // Handle whole numbers and decimals
    return Number(amount);
};


// Scale ingredient quantities based on servings
DummyHub.scaleIngredient = function (
    ingredient,
    originalServings,
    selectedServings
) {
    if (!originalServings || originalServings <= 0) {
        return ingredient;
    }

    var multiplier = selectedServings / originalServings;

    // Find the quantity at the beginning of the ingredient
    var amountPattern = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/;

    return ingredient.replace(
        amountPattern,
        function (amount) {
            var quantity = DummyHub.parseIngredientAmount(amount);

            if (!Number.isFinite(quantity)) {
                return amount;
            }

            var newAmount = quantity * multiplier;

            return Number(newAmount.toFixed(2)).toString();
        }
    );
};


// Increase the serving count
DummyHub.increaseServings = function () {
    DummyHub.setState({
        selectedServings: DummyHub.state.selectedServings + 1
    });

    DummyHub.displayRecipeDetail();
};


// Decrease the serving count
DummyHub.decreaseServings = function () {
    if (DummyHub.state.selectedServings > 1) {
        DummyHub.setState({
            selectedServings: DummyHub.state.selectedServings - 1
        });

        DummyHub.displayRecipeDetail();
    }
};
