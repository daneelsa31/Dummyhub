
DummyHub.shopCurrentPage = 1;
DummyHub.shopProducts = [];
DummyHub.shopSearchTerm = "";
DummyHub.shopCategory = "";
DummyHub.shopSortValue = "";
DummyHub.shopInStockOnly = false;

// Display the Shop page
DummyHub.renderShop = function () {
    return `
        <section class="shop-page">
            <h1>Shop</h1>
            <p>Browse our collection of products.</p>

            <div class="shop-controls">
                <input
                    type="text"
                    id="product-search"
                    placeholder="Search products..."
                >

                <select id="category-filter">
                    <option value="">All Categories</option>
                </select>

                <select id="sort-products">
                    <option value="">Default Sorting</option>
                    <option value="title">Name (A-Z)</option>
                    <option value="-title">Name (Z-A)</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="-price">Price (High to Low)</option>
                    <option value="rating">Rating (Low to High)</option>
                    <option value="-rating">Rating (High to Low)</option>
                </select>
            </div>

            <label>
                <input type="checkbox" id="in-stock-filter">
                Show only in-stock products
            </label>

            <div id="product-grid" class="product-grid">
                <p>Loading products...</p>
            </div>

            <div id="product-pagination"></div>
        </section>
    `;
};


// Load all products from DummyJSON
DummyHub.loadProducts = async function () {
    var productGrid = document.getElementById("product-grid");

    productGrid.innerHTML = "<p>Loading products...</p>";

    try {
        var endpoint = "/products?limit=0";

        // Sorting is handled by the DummyJSON API
        if (DummyHub.shopSortValue !== "") {
            var sortBy = DummyHub.shopSortValue.replace("-", "");
            var order = DummyHub.shopSortValue.startsWith("-")
                ? "desc"
                : "asc";

            endpoint += "&sortBy=" + sortBy + "&order=" + order;
        }

        var data = await DummyHub.request(endpoint);

        DummyHub.shopProducts = data.products;
        DummyHub.shopCurrentPage = 1;

        DummyHub.displayShopProducts();

    } catch (error) {
        productGrid.innerHTML = `
            <p>Unable to load products: ${DummyHub.escapeHTML(error.message)}</p>
            <button id="retry-products">Retry</button>
        `;

        document.getElementById("retry-products").addEventListener(
            "click",
            DummyHub.loadProducts
        );
    }
};


// Apply all filters and display the products
DummyHub.displayShopProducts = function () {
    var productGrid = document.getElementById("product-grid");
    var pagination = document.getElementById("product-pagination");

    var products = [...DummyHub.shopProducts];

    // Apply search
    if (DummyHub.shopSearchTerm !== "") {
        var searchTerm = DummyHub.shopSearchTerm.toLowerCase();

        products = products.filter(function (product) {
            return (
                product.title.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        });
    }

    // Apply category filter
    if (DummyHub.shopCategory !== "") {
        products = products.filter(function (product) {
            return product.category === DummyHub.shopCategory;
        });
    }

    // Apply in-stock filter
    if (DummyHub.shopInStockOnly) {
        products = DummyHub.filterInStockProducts(products);
    }

    // Calculate pagination
    var limit = 12;
    var totalPages = Math.ceil(products.length / limit);

    if (totalPages === 0) {
        DummyHub.shopCurrentPage = 1;
    } else if (DummyHub.shopCurrentPage > totalPages) {
        DummyHub.shopCurrentPage = totalPages;
    }

    var start = (DummyHub.shopCurrentPage - 1) * limit;
    var displayedProducts = products.slice(start, start + limit);

    // Display empty message
    if (products.length === 0) {
        productGrid.innerHTML = "<p>No products found.</p>";
        pagination.innerHTML = "";
        return;
    }

    // Display product cards
    productGrid.innerHTML = displayedProducts.map(function (product) {
        return `
            <div class="product-card" data-stock="${product.stock}">
                <img
                    src="${DummyHub.escapeHTML(product.thumbnail)}"
                    alt="${DummyHub.escapeHTML(product.title)}"
                >

                <h3>${DummyHub.escapeHTML(product.title)}</h3>

                <p>$${product.price}</p>

                <p>Rating: ${product.rating}</p>

                <button
                    data-action="view-product"
                    data-id="${product.id}"
                >
                    View Product
                </button>
            </div>
        `;
    }).join("");

    // Display pagination
    pagination.innerHTML = `
        <button
            id="previous-page"
            ${DummyHub.shopCurrentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>Page ${DummyHub.shopCurrentPage} of ${totalPages}</span>

        <button
            id="next-page"
            ${DummyHub.shopCurrentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    DummyHub.handlePagination();
};


// Handle pagination buttons
DummyHub.handlePagination = function () {
    var previousButton = document.getElementById("previous-page");
    var nextButton = document.getElementById("next-page");

    if (previousButton) {
        previousButton.addEventListener("click", function () {
            DummyHub.shopCurrentPage--;
            DummyHub.displayShopProducts();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            DummyHub.shopCurrentPage++;
            DummyHub.displayShopProducts();
        });
    }
};


// Load product categories
DummyHub.loadCategories = async function () {
    var categoryFilter = document.getElementById("category-filter");

    try {
        var categories = await DummyHub.request("/products/categories");

        categories.forEach(function (category) {
            var option = document.createElement("option");

            option.value = category.slug;
            option.textContent = category.name;

            categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.log("Unable to load categories:", error);
    }
};


// Apply category filter
DummyHub.filterProductsByCategory = function (category) {
    DummyHub.shopCategory = category;
    DummyHub.shopCurrentPage = 1;

    DummyHub.displayShopProducts();
};


// Set up category dropdown
DummyHub.setupCategoryFilter = function () {
    var categoryFilter = document.getElementById("category-filter");

    categoryFilter.addEventListener("change", function () {
        DummyHub.filterProductsByCategory(categoryFilter.value);
    });
};


// Apply search
DummyHub.searchProducts = function (searchTerm) {
    DummyHub.shopSearchTerm = searchTerm;
    DummyHub.shopCurrentPage = 1;

    DummyHub.displayShopProducts();
};


// Set up debounced search
DummyHub.setupProductSearch = function () {
    var searchInput = document.getElementById("product-search");

    var searchHandler = DummyHub.debounce(function () {
        DummyHub.searchProducts(searchInput.value.trim());
    }, 300);

    searchInput.addEventListener("input", searchHandler);
};


// Apply server-side sorting
DummyHub.sortProducts = async function (sortValue) {
    DummyHub.shopSortValue = sortValue;

    await DummyHub.loadProducts();
};


// Set up sorting dropdown
DummyHub.setupProductSorting = function () {
    var sortDropdown = document.getElementById("sort-products");

    sortDropdown.addEventListener("change", function () {
        DummyHub.sortProducts(sortDropdown.value);
    });
};


// Return only products that have stock available
DummyHub.filterInStockProducts = function (products) {
    return products.filter(function (product) {
        return product.stock > 0;
    });
};


// Set up in-stock checkbox
DummyHub.setupInStockFilter = function () {
    var stockCheckbox = document.getElementById("in-stock-filter");

    stockCheckbox.addEventListener("change", function () {
        DummyHub.shopInStockOnly = stockCheckbox.checked;
        DummyHub.shopCurrentPage = 1;

        DummyHub.displayShopProducts();
    });
};


// Handle View Product buttons using event delegation
DummyHub.setupProductNavigation = function () {
    var productGrid = document.getElementById("product-grid");

    productGrid.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="view-product"]');

        if (!button) {
            return;
        }

        var productId = button.dataset.id;

        window.location.hash = "#/product/" + productId;
    });
};
