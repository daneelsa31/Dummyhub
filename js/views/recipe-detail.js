
DummyHub.currentRecipe = null;
DummyHub.selectedServings = 1;


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

        DummyHub.currentRecipe = recipe;
        DummyHub.selectedServings = recipe.servings;

        DummyHub.displayRecipeDetail();

    } catch (error) {
        content.innerHTML = `
            <p>Unable to load recipe details.</p>
            <button id="retry-recipe-detail">Retry</button>
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
    var recipe = DummyHub.currentRecipe;
    var content = document.getElementById("recipe-detail-content");

    console.log("Original servings:", recipe.servings);
    console.log("Selected servings:", DummyHub.selectedServings);
    console.log("Ingredients:", recipe.ingredients);

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
        <p>Preparation Time: ${recipe.prepTimeMinutes} minutes</p>
        <p>Cooking Time: ${recipe.cookTimeMinutes} minutes</p>
        <p>Calories per Serving: ${recipe.caloriesPerServing}</p>

        <hr>

        <h2>Servings</h2>

        <button id="decrease-servings">-</button>
        <span id="serving-count">${DummyHub.selectedServings}</span>
        <button id="increase-servings">+</button>

        <h2>Ingredients</h2>

        <ul>
            ${recipe.ingredients.map(function (ingredient) {
                return `
                    <li>
                        ${DummyHub.escapeHTML(
                            DummyHub.scaleIngredient(
                                ingredient,
                                recipe.servings,
                                DummyHub.selectedServings
                            )
                        )}
                    </li>
                `;
            }).join("")}
        </ul>

        <h2>Instructions</h2>

        <ol>
            ${recipe.instructions.map(function (instruction) {
                return `
                    <li>${DummyHub.escapeHTML(instruction)}</li>
                `;
            }).join("")}
        </ol>
    `;

    document.getElementById("back-to-recipes").addEventListener(
        "click",
        function () {
            window.location.hash = "#/recipes";
        }
    );

    document.getElementById("decrease-servings").addEventListener(
        "click",
        DummyHub.decreaseServings
    );

    document.getElementById("increase-servings").addEventListener(
        "click",
        DummyHub.increaseServings
    );
};


// Convert an ingredient quantity into a number
DummyHub.parseIngredientAmount = function (amount) {
    if (amount.includes(" ")) {
        var parts = amount.split(" ");
        var fraction = parts[1].split("/");

        return Number(parts[0]) +
            Number(fraction[0]) / Number(fraction[1]);
    }

    if (amount.includes("/")) {
        var fraction = amount.split("/");

        return Number(fraction[0]) / Number(fraction[1]);
    }

    return Number(amount);
};


// Scale ingredient quantities based on servings
DummyHub.scaleIngredient = function (
    ingredient,
    originalServings,
    selectedServings
) {
    var multiplier = selectedServings / originalServings;

    return ingredient.replace(
        /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/,
        function (amount) {
            var quantity = DummyHub.parseIngredientAmount(amount);

            var newAmount = quantity * multiplier;

            return Number(newAmount.toFixed(2)).toString();
        }
    );
};


// Increase the serving count
DummyHub.increaseServings = function () {
    DummyHub.selectedServings++;

    DummyHub.displayRecipeDetail();
};


// Decrease the serving count
DummyHub.decreaseServings = function () {
    if (DummyHub.selectedServings > 1) {
        DummyHub.selectedServings--;

        DummyHub.displayRecipeDetail();
    }
};
