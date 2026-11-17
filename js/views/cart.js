DummyHub.renderCart = function () {
    var cart = DummyHub.state.cart;
    var pastCarts = DummyHub.state.pastCarts;

    var subtotal = cart.reduce(function (total, item) {
        return total + (item.price * item.quantity);
    }, 0);

    var discount = cart.reduce(function (total, item) {
        var itemSubtotal = item.price * item.quantity;
        return total + (itemSubtotal * (item.discountPercentage / 100));
    }, 0);

    var grandTotal = subtotal - discount;

    return `
        <section class="cart-page">
            <h1>My Shopping Cart</h1>

            ${cart.length === 0
                ? `
                    <p>Your shopping cart is currently empty.</p>
                    <a href="#/shop">Continue Shopping</a>
                `
                : `
                    <div class="cart-items">
                        ${cart.map(function (item) {
                            return `
                                <div class="cart-item" data-id="${item.id}">
                                    <h3>${DummyHub.escapeHTML(item.title)}</h3>

                                    <p>Price: $${item.price}</p>

                                    <div class="quantity-controls">
                                        <button data-action="decrease">-</button>
                                        <span>${item.quantity}</span>
                                        <button data-action="increase">+</button>
                                    </div>

                                    <p>
                                        Subtotal:
                                        $${(item.price * item.quantity).toFixed(2)}
                                    </p>

                                    <button data-action="remove">Remove</button>
                                </div>
                            `;
                        }).join("")}
                    </div>

                    <div class="cart-summary">
                        <h2>Cart Summary</h2>
                        <p>Subtotal: $${subtotal.toFixed(2)}</p>
                        <p>Discount: -$${discount.toFixed(2)}</p>
                        <h3>Grand Total: $${grandTotal.toFixed(2)}</h3>

                        <button id="checkout-button">Checkout</button>
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

                                <p>Total Products: ${purchase.totalProducts}</p>

                                <p>Total Quantity: ${purchase.totalQuantity}</p>

                                <p>Original Total: $${purchase.total.toFixed(2)}</p>

                                <p>Discounted Total: $${purchase.discountedTotal.toFixed(2)}</p>
                            </div>
                        `;
                    }).join("")
                }
            </div>
        </section>
    `;
};

DummyHub.setupCartEvents = function () {
    var cartItems = document.querySelector(".cart-items");

    cartItems.addEventListener("click", function (event) {
        var button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        var action = button.dataset.action;

        var cartItem = button.closest(".cart-item");
        var productId = Number(cartItem.dataset.id);

        if (action === "increase") {
            DummyHub.updateCartQuantity(productId, 1);

        } else if (action === "decrease") {
            DummyHub.updateCartQuantity(productId, -1);

        } else if (action === "remove") {
            DummyHub.removeFromCart(productId);
        }
    });

    var checkoutButton = document.getElementById("checkout-button");

    checkoutButton.addEventListener("click", function () {
        DummyHub.checkout();
    });
};


DummyHub.updateCartQuantity = function (productId, change) {
    var updatedCart = DummyHub.state.cart.map(function (item) {
        if (item.id === productId) {
            var newQuantity = item.quantity + change;

            if (
                newQuantity < item.minimumOrderQuantity ||
                newQuantity > item.stock
            ) {
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
        cart: updatedCart
    });
};


DummyHub.removeFromCart = function (productId) {
    var updatedCart = DummyHub.state.cart.filter(function (item) {
        return item.id !== productId;
    });

    DummyHub.setState({
        cart: updatedCart
    });
};

DummyHub.checkout = async function () {
    if (!DummyHub.state.user) {
        alert("Please log in before checking out.");
        return;
    }

    try {
        var products = DummyHub.state.cart.map(function (item) {
            return {
                id: item.id,
                quantity: item.quantity
            };
        });

        var result = await DummyHub.request("/carts/add", {
            method: "POST",
            body: JSON.stringify({
                userId: DummyHub.state.user.id,
                products: products
            })
        });

        DummyHub.setState({
            pastCarts: [
                ...DummyHub.state.pastCarts,
                result
            ],
            cart: []
        });

        alert("Checkout successful! Order ID: " + result.id);

    } catch (error) {
        alert("Checkout failed: " + error.message);
        console.log(error);
    }
};