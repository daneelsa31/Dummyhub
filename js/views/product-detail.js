
// Display the Product Details page
DummyHub.renderProductDetail = function () {
    return `
        <section class="product-detail">
            <div id="product-detail-content">
                <p>Loading product details...</p>
            </div>
        </section>
    `;
};


// Load one product from DummyJSON
DummyHub.loadProductDetail = async function (productId) {
    var content = document.getElementById("product-detail-content");

    try {
        var product = await DummyHub.request("/products/" + productId);

        // Save the selected product
        DummyHub.setState({
            currentProduct: product
        });

        // Calculate the discounted price
        var discountedPrice = product.price -
            (product.price * product.discountPercentage / 100);

        // Get the product images
        var images = product.images || [];

        if (images.length === 0 && product.thumbnail) {
            images = [product.thumbnail];
        }

        // Get customer reviews
        var reviews = product.reviews || [];

        // Check product availability
        var stockMessage = product.stock > 0
            ? "In Stock"
            : "Out of Stock";

        var stockClass = product.stock > 0
            ? "in-stock"
            : "out-of-stock";

        content.innerHTML = `
            <div class="product-detail-top">
                <button id="back-to-shop" class="back-to-shop-button">
                    &larr; Back to Shop
                </button>
            </div>

            <div class="product-detail-layout">

                <!-- Product Image Gallery -->
                <div class="product-detail-image">
                    <div class="main-image-container">
                        ${images.length > 0
                ? `
                                <img
                                    id="main-product-image"
                                    src="${DummyHub.escapeHTML(images[0])}"
                                    alt="${DummyHub.escapeHTML(product.title)}"
                                >
                            `
                : "<p>No product image available.</p>"
            }
                    </div>

                    <div class="product-thumbnails">
                        ${images.map(function (image, index) {
                return `
                                <img
                                    src="${DummyHub.escapeHTML(image)}"
                                    alt="${DummyHub.escapeHTML(product.title)} image ${index + 1}"
                                    data-action="change-image"
                                    data-image="${DummyHub.escapeHTML(image)}"
                                    class="${index === 0 ? "selected-thumbnail" : ""}"
                                >
                            `;
            }).join("")}
                    </div>
                </div>

                <!-- Product Information -->
                <div class="product-detail-info">

                    <div class="product-detail-labels">
                        <span class="product-category">
                            ${DummyHub.escapeHTML(product.category)}
                        </span>

                        <span class="product-stock ${stockClass}">
                            ${stockMessage}
                        </span>
                    </div>

                    <h1>${DummyHub.escapeHTML(product.title)}</h1>

                    <p class="product-brand">
                        Brand: <strong>${DummyHub.escapeHTML(product.brand || "No brand")}</strong>
                    </p>

                    <p class="product-rating">
                        <span class="rating-star">&#9733;</span>
                        ${product.rating} / 5
                    </p>

                    <div class="product-detail-price">
                        <div class="discounted-price">
                            ${DummyHub.formatPrice(discountedPrice)}
                        </div>

                        <div class="original-price">
                            <del>${DummyHub.formatPrice(product.price)}</del>

                            <span class="discount-badge">
                                ${product.discountPercentage}% OFF
                            </span>
                        </div>
                    </div>

                    <div class="product-description">
                        <h3>Product Description</h3>
                        <p>${DummyHub.escapeHTML(product.description)}</p>
                    </div>

                    <div class="add-to-cart-controls">
                        <p class="available-stock">
                            ${product.stock} item(s) available
                        </p>

                        <label for="product-quantity">Quantity</label>

                        <input
                            type="number"
                            id="product-quantity"
                            value="${product.minimumOrderQuantity || 1}"
                            min="${product.minimumOrderQuantity || 1}"
                            max="${product.stock}"
                        >

                        <button
                            id="add-to-cart-button"
                            ${product.stock <= 0 ? "disabled" : ""}
                        >
                            Add to Cart
                        </button>

                        <p id="cart-message"></p>
                    </div>
                </div>
            </div>

            <!-- Customer Reviews -->
            <div class="product-reviews">
                <div class="reviews-heading">
                    <h2>Customer Reviews</h2>
                    <span>${reviews.length} review(s)</span>
                </div>

                ${reviews.length === 0
                ? "<p>No reviews yet.</p>"
                : reviews.map(function (review) {
                    return `
                            <div class="review-card">
                                <div class="review-card-header">
                                    <h3>${DummyHub.escapeHTML(review.reviewerName)}</h3>
                                    <span class="review-rating">
                                        &#9733; ${review.rating} / 5
                                    </span>
                                </div>

                                <p>${DummyHub.escapeHTML(review.comment)}</p>

                                <small>
                                    ${DummyHub.escapeHTML(review.date)}
                                </small>
                            </div>
                        `;
                }).join("")
            }
            </div>
        `;

        // Back to Shop
        document.getElementById("back-to-shop").addEventListener(
            "click",
            function () {
                window.location.hash = "#/shop";
            }
        );

        // Add product to cart
        document.getElementById("add-to-cart-button").addEventListener(
            "click",
            function () {
                DummyHub.addProductToCart(product);
            }
        );

        // Set up product image gallery
        DummyHub.setupProductGallery();



    } catch (error) {
        // Show Not Found page for a missing product
        if (error.status === 404) {
            content.innerHTML = DummyHub.renderNotFound();
            return;
        }

        // Show retry option for other errors
        content.innerHTML = `
            <div class="product-detail-error">
                <p>Unable to load product details.</p>
                <button id="retry-product-detail">Retry</button>
            </div>
        `;

        document.getElementById("retry-product-detail").addEventListener(
            "click",
            function () {
                DummyHub.loadProductDetail(productId);
            }
        );
    }


};


// Change the main product image when a thumbnail is clicked
DummyHub.setupProductGallery = function () {
    var content = document.getElementById("product-detail-content");

    content.addEventListener("click", function (event) {
        var thumbnail = event.target.closest('[data-action="change-image"]');

        if (!thumbnail) {
            return;
        }

        var selectedImage = thumbnail.dataset.image;

        document.getElementById("main-product-image").src = selectedImage;

        // Update the selected thumbnail
        var thumbnails = content.querySelectorAll(".product-thumbnails img");

        thumbnails.forEach(function (image) {
            image.classList.remove("selected-thumbnail");
        });

        thumbnail.classList.add("selected-thumbnail");
    });
};


// Add a product to the shopping cart
DummyHub.addProductToCart = function (product) {
    var quantityInput = document.getElementById("product-quantity");
    var quantity = Number(quantityInput.value);

    var minimum = product.minimumOrderQuantity || 1;
    var message = document.getElementById("cart-message");

    // Check if quantity is a valid whole number
    if (!Number.isInteger(quantity) || quantity < 1) {
        message.textContent = "Please enter a valid quantity.";
        return;
    }

    // Check minimum order quantity
    if (quantity < minimum) {
        message.textContent =
            "Minimum order quantity is " + minimum + ".";
        return;
    }

    // Check available stock
    if (quantity > product.stock) {
        message.textContent =
            "Only " + product.stock + " items are available.";
        return;
    }

    var existingProduct = DummyHub.state.cart.find(function (item) {
        return item.id === product.id;
    });

    if (existingProduct) {
        var newQuantity = existingProduct.quantity + quantity;

        if (newQuantity > product.stock) {
            message.textContent = "Not enough stock available.";
            return;
        }

        // Update the quantity of an existing cart item
        DummyHub.setState({
            cart: DummyHub.state.cart.map(function (item) {
                if (item.id === product.id) {
                    return {
                        ...item,
                        quantity: newQuantity
                    };
                }

                return item;
            })
        });

    } else {
        // Add a new product to the cart
        DummyHub.setState({
            cart: [
                ...DummyHub.state.cart,
                {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: quantity,
                    stock: product.stock,
                    minimumOrderQuantity: minimum,
                    discountPercentage: product.discountPercentage
                }
            ]
        });
    }

    message.textContent = "Product added to cart!";
};
