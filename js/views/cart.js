
// Load the user's previous purchases
DummyHub.loadPastCarts = async function () {
    var userId = DummyHub.state.user.id;

    try {
        var data = await DummyHub.request("/carts/user/" + userId);

        DummyHub.setState({
            pastCarts: data.carts
        });

    } catch (error) {
        DummyHub.setState({
            pastCarts: []
        });
    }

    DummyHub.refreshCart();
};


// Display the shopping cart
DummyHub.renderCart = function () {
    var cart = DummyHub.state.cart;
    var pastCarts = DummyHub.state.pastCarts || [];

    // Calculate the original subtotal
    var subtotal = cart.reduce(function (total, item) {
        return total + (item.price * item.quantity);
    }, 0);

    // Calculate the total discount
    var discount = cart.reduce(function (total, item) {
        var itemSubtotal = item.price * item.quantity;
        var percentage = Number(item.discountPercentage) || 0;

        percentage = Math.max(0, Math.min(percentage, 100));

        return total + (itemSubtotal * percentage / 100);
    }, 0);

    // Calculate the final amount
    var grandTotal = Math.max(0, subtotal - discount);

    var receipt = DummyHub.state.cartReceipt;

    return `
        <section class="cart-page">
            <h1>My Shopping Cart</h1>

            ${receipt ? `
                <div class="checkout-receipt">

                    <div class="receipt-header">
                        <div class="receipt-success-icon">
                            &#10003;
                        </div>

                        <h2>Order Successful!</h2>
                        <p>Your order has been placed successfully.</p>
                    </div>

                    <div class="receipt-order-info">
                        <div class="receipt-info-item">
                            <span class="receipt-info-label">
                                Receipt Number
                            </span>

                            <span class="receipt-info-value">
                                #${receipt.id}
                            </span>
                        </div>

                        <div class="receipt-info-item">
                            <span class="receipt-info-label">
                                Order Status
                            </span>

                            <span class="receipt-info-value">
                                Successful
                            </span>
                        </div>

                        <div class="receipt-info-item">
                            <span class="receipt-info-label">
                                Total Products
                            </span>

                            <span class="receipt-info-value">
                                ${receipt.totalProducts}
                            </span>
                        </div>

                        <div class="receipt-info-item">
                            <span class="receipt-info-label">
                                Total Quantity
                            </span>

                            <span class="receipt-info-value">
                                ${receipt.totalQuantity} items
                            </span>
                        </div>
                    </div>

                    <div class="receipt-items">
                        <h3>Order Details</h3>

                        <div class="receipt-table-container">
                            <table class="receipt-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                        <th>Discounted</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${(receipt.items || []).map(function (item) {
                                        var itemTotal = item.price * item.quantity;

                                        var percentage =
                                            Number(item.discountPercentage) || 0;

                                        percentage = Math.max(
                                            0,
                                            Math.min(percentage, 100)
                                        );

                                        var itemDiscount =
                                            itemTotal * percentage / 100;

                                        var afterDiscount = Math.max(
                                            0,
                                            itemTotal - itemDiscount
                                        );

                                        return `
                                            <tr>
                                                <td>
                                                    ${DummyHub.escapeHTML(item.title)}
                                                </td>

                                                <td>${item.quantity}</td>

                                                <td>
                                                    ${DummyHub.formatPrice(itemTotal)}
                                                </td>

                                                <td>
                                                    ${DummyHub.formatPrice(afterDiscount)}
                                                </td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="receipt-total">
                        <span>You Pay</span>

                        <strong>
                            ${DummyHub.formatPrice(receipt.discountedTotal)}
                        </strong>
                    </div>

                    <p class="receipt-thank-you">
                        Thank you for shopping with DummyHub!
                    </p>

                    <button id="dismiss-receipt">
                        Done
                    </button>
                </div>
            ` : ""}

            ${cart.length === 0
                ? `
                    <div class="empty-cart">
                        <p>Your shopping cart is currently empty.</p>

                        <a href="#/shop" class="continue-shopping-button">
                            Continue Shopping
                        </a>
                    </div>
                `
                : `
                    <div class="cart-items">
                        ${cart.map(function (item) {
                            return `
                                <div class="cart-item" data-id="${item.id}">

                                    <div class="cart-item-details">
                                        <h3>
                                            ${DummyHub.escapeHTML(item.title)}
                                        </h3>

                                        <p class="cart-item-price">
                                            ${DummyHub.formatPrice(item.price)} each
                                        </p>
                                    </div>

                                    <div class="cart-item-actions">
                                        <div class="quantity-controls">
                                            <button data-action="decrease">-</button>

                                            <span>${item.quantity}</span>

                                            <button data-action="increase">+</button>
                                        </div>

                                        <p class="cart-item-subtotal">
                                            ${DummyHub.formatPrice(
                                                item.price * item.quantity
                                            )}
                                        </p>

                                        <button
                                            class="remove-item-button"
                                            data-action="remove"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                </div>
                            `;
                        }).join("")}
                    </div>

                    <div class="cart-summary">
                        <h2>Cart Summary</h2>

                        <p>
                            <span>Subtotal:</span>
                            <span>${DummyHub.formatPrice(subtotal)}</span>
                        </p>

                        <p>
                            <span>Discount:</span>
                            <span>-${DummyHub.formatPrice(discount)}</span>
                        </p>

                        <h3>
                            <span>Grand Total:</span>
                            <span>${DummyHub.formatPrice(grandTotal)}</span>
                        </h3>

                        <button id="checkout-button">
                            Checkout
                        </button>
                    </div>
                `
            }

            <div class="past-purchases">
                <h2>Past Purchases</h2>

                ${pastCarts.length === 0
                    ? "<p>No previous purchases yet.</p>"
                    : pastCarts.map(function (purchase) {
                        return `
                            <div class="purchase-card">
                                <h3>Order #${purchase.id}</h3>

                                <p>
                                    Total Products:
                                    ${purchase.totalProducts}
                                </p>

                                <p>
                                    Total Quantity:
                                    ${purchase.totalQuantity}
                                </p>

                                <p>
                                    Original Total:
                                    ${DummyHub.formatPrice(purchase.total)}
                                </p>

                                <p>
                                    Discounted Total:
                                    ${DummyHub.formatPrice(purchase.discountedTotal)}
                                </p>
                            </div>
                        `;
                    }).join("")
                }
            </div>
        </section>
    `;
};


// Refresh the cart page and header badge
DummyHub.refreshCart = function () {
    // Update the badge immediately
    DummyHub.updateCartBadge();

    // Only redraw the page if the user is viewing the cart
    if (DummyHub.state.currentRoute !== "cart") {
        return;
    }

    DummyHub.app.innerHTML = DummyHub.renderCart();

    DummyHub.setupCartEvents();
};


// Set up cart buttons
DummyHub.setupCartEvents = function () {
    var cartItems = document.querySelector(".cart-items");

    // Use one delegated listener for cart item buttons
    if (cartItems) {
        cartItems.addEventListener("click", function (event) {
            var button = event.target.closest("[data-action]");

            if (!button) {
                return;
            }

            var cartItem = button.closest(".cart-item");

            if (!cartItem) {
                return;
            }

            var productId = Number(cartItem.dataset.id);
            var action = button.dataset.action;

            if (action === "increase") {
                DummyHub.updateCartQuantity(productId, 1);

            } else if (action === "decrease") {
                DummyHub.updateCartQuantity(productId, -1);

            } else if (action === "remove") {
                DummyHub.removeFromCart(productId);
            }
        });
    }

    // Set up the Checkout button
    var checkoutButton = document.getElementById("checkout-button");

    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            DummyHub.checkout
        );
    }

    // Set up the receipt Dismiss button
    var dismissButton = document.getElementById("dismiss-receipt");

    if (dismissButton) {
        dismissButton.addEventListener("click", function () {
            DummyHub.setState({
                cartReceipt: null
            });

            DummyHub.refreshCart();
        });
    }
};


// Increase or decrease a product quantity
DummyHub.updateCartQuantity = function (productId, change) {
    var updatedCart = DummyHub.state.cart.map(function (item) {
        if (item.id === productId) {
            var newQuantity = item.quantity + change;

            // Prevent quantity from going below the minimum order quantity
            if (newQuantity < item.minimumOrderQuantity) {
                return item;
            }

            // Check whether the requested quantity exceeds available stock
            if (newQuantity > item.stock) {
                alert(
                    "Only " + item.stock +
                    " stocks available for " + item.title + "."
                );

                return item;
            }

            return {
                ...item,
                quantity: newQuantity
            };
        }

        return item;
    });

    DummyHub.setState({
        cart: updatedCart,
        cartReceipt: null
    });

    DummyHub.refreshCart();
};


// Remove a product from the cart
DummyHub.removeFromCart = function (productId) {
    var updatedCart = DummyHub.state.cart.filter(function (item) {
        return item.id !== productId;
    });

    DummyHub.setState({
        cart: updatedCart,
        cartReceipt: null
    });

    DummyHub.refreshCart();
};


// Submit the cart as an order
DummyHub.checkout = async function () {
    if (!DummyHub.state.user) {
        DummyHub.state.redirectAfterLogin = "#/cart";
        window.location.hash = "#/login";
        return;
    }

    if (DummyHub.state.cart.length === 0) {
        return;
    }

    // Save the purchased items before clearing the cart
    var purchasedItems = DummyHub.state.cart.map(function (item) {
        return {
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            discountPercentage: item.discountPercentage
        };
    });

    var checkoutButton = document.getElementById("checkout-button");

    if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = "Processing...";
    }

    try {
        // Prepare the products for the server
        var products = DummyHub.state.cart.map(function (item) {
            return {
                id: item.id,
                quantity: item.quantity
            };
        });

        // Send the checkout request
        var result = await DummyHub.request("/carts/add", {
            method: "POST",
            body: JSON.stringify({
                userId: DummyHub.state.user.id,
                products: products
            })
        });

        // Save the receipt and clear the current cart
        DummyHub.setState({
            cartReceipt: {
                ...result,
                items: purchasedItems
            },

            pastCarts: [
                result,
                ...DummyHub.state.pastCarts
            ],

            cart: []
        });

        // Refresh the cart page and badge
        DummyHub.refreshCart();

    } catch (error) {
        var message = document.createElement("p");

        message.className = "error-message";

        message.textContent =
            "Checkout failed: " + error.message;

        var cartSummary = document.querySelector(".cart-summary");

        if (cartSummary) {
            cartSummary.appendChild(message);
        }

        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout";
        }
    }
};
