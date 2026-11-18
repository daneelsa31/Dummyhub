
// Display the Not Found page
DummyHub.renderNotFound = function () {
    return `
        <section class="not-found-page">
            <h1>404 - Page Not Found</h1>

            <p>
                Sorry, the page you're looking for
                doesn't exist.
            </p>

            <a href="#/">Go to Dashboard</a>
        </section>
    `;
};
