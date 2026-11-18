
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


// Load products from DummyJSON
DummyHub.loadProducts = async function () {
    var productGrid = document.getElementById("product-grid");
    var pagination = document.getElementById("product-pagination");

    productGrid.innerHTML = "<p>Loading products...</p>";
    pagination.innerHTML = "";

    try {
        var limit = 12;
        var skip = (DummyHub.state.shopCurrentPage - 1) * limit;
        var endpoint = "/products";

        // Search products
        if (DummyHub.state.shopSearchTerm !== "") {
            endpoint = "/products/search?q=" +
                encodeURIComponent(DummyHub.state.shopSearchTerm);
        }

        // Filter products by category
        else if (DummyHub.state.shopCategory !== "") {
            endpoint = "/products/category/" +
                encodeURIComponent(DummyHub.state.shopCategory);
        }

        // Add pagination and select the required fields
        var separator = endpoint.includes("?") ? "&" : "?";

        endpoint += separator +
            "limit=" + limit +
            "&skip=" + skip +
            "&select=title,price,discountPercentage,rating,stock,thumbnail,category";

        // Add sorting
        if (DummyHub.state.shopSortValue !== "") {
            var sortBy = DummyHub.state.shopSortValue.replace("-", "");
            var order = "asc";

            if (DummyHub.state.shopSortValue.startsWith("-")) {
                order = "desc";
            }

            endpoint += "&sortBy=" + sortBy + "&order=" + order;
        }

        var data = await DummyHub.request(endpoint);

        DummyHub.setState({
            shopProducts: data.products,
            shopTotal: data.total
        });

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


// Display the products
DummyHub.displayShopProducts = function () {
    var productGrid = document.getElementById("product-grid");
    var pagination = document.getElementById("product-pagination");

    var products = DummyHub.state.shopProducts;

    // Apply the in-stock filter
    if (DummyHub.state.shopInStockOnly) {
        products = DummyHub.filterInStockProducts(products);
    }

    var limit = 12;
    var totalProducts = DummyHub.state.shopTotal || 0;
    var totalPages = Math.ceil(totalProducts / limit);

    if (products.length === 0) {
        productGrid.innerHTML = "<p>No products found.</p>";
        pagination.innerHTML = "";
        return;
    }

    // Display product cards
    productGrid.innerHTML = products.map(function (product) {
        return `
            <div
                class="product-card"
                data-id="${product.id}"
                data-stock="${product.stock}"
            >
                <img
                    src="${DummyHub.escapeHTML(product.thumbnail)}"
                    alt="${DummyHub.escapeHTML(product.title)}"
                >

                <h3>${DummyHub.escapeHTML(product.title)}</h3>

                <p>${DummyHub.formatPrice(product.price)}</p>

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
            ${DummyHub.state.shopCurrentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>Page ${DummyHub.state.shopCurrentPage} of ${totalPages}</span>

        <button
            id="next-page"
            ${DummyHub.state.shopCurrentPage >= totalPages ? "disabled" : ""}
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
            DummyHub.setState({
                shopCurrentPage: DummyHub.state.shopCurrentPage - 1
            });

            DummyHub.loadProducts();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            DummyHub.setState({
                shopCurrentPage: DummyHub.state.shopCurrentPage + 1
            });

            DummyHub.loadProducts();
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
        categoryFilter.innerHTML =
            '<option value="">Categories unavailable</option>';
    }
};


// Apply category filter
DummyHub.filterProductsByCategory = function (category) {
    DummyHub.setState({
        shopCategory: category,
        shopSearchTerm: "",
        shopCurrentPage: 1
    });

    document.getElementById("product-search").value = "";

    DummyHub.loadProducts();
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
    DummyHub.setState({
        shopSearchTerm: searchTerm,
        shopCategory: "",
        shopCurrentPage: 1
    });

    document.getElementById("category-filter").value = "";

    DummyHub.loadProducts();
};


// Set up debounced search
DummyHub.setupProductSearch = function () {
    var searchInput = document.getElementById("product-search");

    var searchHandler = DummyHub.debounce(function () {
        DummyHub.searchProducts(searchInput.value.trim());
    }, 300);

    searchInput.addEventListener("input", searchHandler);
};


// Apply sorting
DummyHub.sortProducts = function (sortValue) {
    DummyHub.setState({
        shopSortValue: sortValue,
        shopCurrentPage: 1
    });

    DummyHub.loadProducts();
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
        DummyHub.setState({
            shopInStockOnly: stockCheckbox.checked
        });

        DummyHub.displayShopProducts();
    });
};


// Handle product navigation using event delegation
DummyHub.setupProductNavigation = function () {
    var productGrid = document.getElementById("product-grid");

    productGrid.addEventListener("click", function (event) {
        var button = event.target.closest('[data-action="view-product"]');

        if (button) {
            var productId = button.dataset.id;

            window.location.hash = "#/shop/" + productId;
        } else {
            var card = event.target.closest(".product-card");

            if (card) {
                window.location.hash = "#/shop/" + card.dataset.id;
            }
        }
    });
};
