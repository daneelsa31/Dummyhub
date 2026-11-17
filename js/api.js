DummyHub.API_BASE_URL = "https://dummyjson.com";

// Make a request to DummyJSON
DummyHub.request = async function (endpoint, options) {
    options = options || {};

    var url = DummyHub.API_BASE_URL + endpoint;

    var headers = {
        "Content-Type": "application/json"
    };

    // Attach authentication token when available
    if (DummyHub.state.accessToken) {
        headers.Authorization = "Bearer " + DummyHub.state.accessToken;
    }

    // Include custom headers if provided
    if (options.headers) {
        headers = {
            ...headers,
            ...options.headers
        };
    }

    var response = await fetch(url, {
        method: options.method || "GET",
        headers: headers,
        body: options.body
    });

    var data = await response.json();

    // Handle unsuccessful responses
    if (!response.ok) {
        throw new Error(data.message || "Request failed: " + response.status);
    }

    return data;
};