DummyHub.renderProductDetail = function () {
    return `
        <section class="product-detail">
            <div id="product-detail-content">
                <p>Loading product details...</p>
            </div>
        </section>
    `;
};


DummyHub.loadProductDetail = async function (productId) {
    var content = document.getElementById("product-detail-content");

    try {
        var product = await DummyHub.request("/products/" + productId);

        content.innerHTML = `
        <button id="back-to-shop">Back to Shop</button>

        <div class="product-detail-image">
            <img
                id="main-product-image"
                src="${DummyHub.escapeHTML(product.images[0] || product.thumbnail)}"
                alt="${DummyHub.escapeHTML(product.title)}"
            >

            <div class="product-thumbnails">
                ${product.images.map(function (image, index) {
            return `
                        <img
                            src="${DummyHub.escapeHTML(image)}"
                            alt="${DummyHub.escapeHTML(product.title)} image ${index + 1}"
                            data-action="change-image"
                            data-image="${DummyHub.escapeHTML(image)}"
                        >
                    `;
        }).join("")}
            </div>
            
        </div>

            <div class="product-detail-info">
                <h1>${DummyHub.escapeHTML(product.title)}</h1>

                    <p>Brand: ${DummyHub.escapeHTML(product.brand || "No brand")}</p>

                    <h2>$${product.price}</h2>

                    <p>Discount: ${product.discountPercentage}%</p>

                    <p>Rating: ${product.rating} / 5</p>

                    <p>Stock: ${product.stock}</p>

                    <p>Category: ${DummyHub.escapeHTML(product.category)}</p>

                    <p>${DummyHub.escapeHTML(product.description)}</p>

            </div>

            <div class="add-to-cart-controls">
                <label for="product-quantity">Quantity:</label>

                <input
                    type="number"
                    id="product-quantity"
                    value="${product.minimumOrderQuantity || 1}"
                    min="${product.minimumOrderQuantity || 1}"
                    max="${product.stock}"
                >

                <button id="add-to-cart-button">
                    Add to Cart
                </button>

                <p id="cart-message"></p>
            </div>


            <div class="product-reviews">
                <h2>Customer Reviews</h2>

                ${product.reviews.length === 0
                ? "<p>No reviews yet.</p>"
                : product.reviews.map(function (review) {
                    return `
                            <div class="review-card">
                                <h3>${DummyHub.escapeHTML(review.reviewerName)}</h3>

                                <p>Rating: ${review.rating} / 5</p>

                                <p>${DummyHub.escapeHTML(review.comment)}</p>

                                <small>${DummyHub.escapeHTML(review.date)}</small>
                            </div>
                        `;
                }).join("")
            }
            </div>

        `;

        document.getElementById("add-to-cart-button").addEventListener(
            "click",
            function () {
                DummyHub.addProductToCart(product);
            }
        );

        document.getElementById("back-to-shop").addEventListener(
            "click",
            function () {
                window.location.hash = "#/shop";
            }
        );

    } catch (error) {
        content.textContent = "Unable to load product details.";
    }
};

DummyHub.setupProductGallery = function () {
    var content = document.getElementById("product-detail-content");

    content.addEventListener("click", function (event) {
        var thumbnail = event.target.closest('[data-action="change-image"]');

        if (!thumbnail) {
            return;
        }

        var selectedImage = thumbnail.dataset.image;

        document.getElementById("main-product-image").src = selectedImage;
    });
};


DummyHub.addProductToCart = function (product) {
    var quantityInput = document.getElementById("product-quantity");
    var quantity = Number(quantityInput.value);

    var minimum = product.minimumOrderQuantity || 1;

    var message = document.getElementById("cart-message");

    if (!Number.isInteger(quantity) || quantity < 1) {
        message.textContent = "Please enter a valid quantity.";
        return;
    }

    if (quantity < minimum) {
        message.textContent =
            "Minimum order quantity is " + minimum + ".";
        return;
    }

    if (quantity > product.stock) {
        message.textContent =
            "Only " + product.stock + " items are available.";
        return;
    }

    var existingProduct = DummyHub.state.cart.find(function (item) {
        return item.id === product.id;
    });

    if (existingProduct) {

        if (existingProduct.quantity + quantity > product.stock) {
            message.textContent = "Not enough stock available.";
            return;
        }

        DummyHub.setState({
            cart: DummyHub.state.cart.map(function (item) {
                if (item.id === product.id) {
                    return {
                        ...item,
                        quantity: item.quantity + quantity
                    };
                }

                return item;
            })
        });
    } else {
        DummyHub.setState({
            cart: [
                ...DummyHub.state.cart,
                {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: quantity,
                    stock: product.stock,
                    minimumOrderQuantity: product.minimumOrderQuantity || 1,
                    discountPercentage: product.discountPercentage
                }
            ]
        });
    }

    message.textContent = "Product added to cart!";
};

