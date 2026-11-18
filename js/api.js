// DummyJSON API address
DummyHub.API_BASE_URL = "https://dummyjson.com";

// Send requests to the API
DummyHub.request = async function (endpoint, options) {
    options = options || {};

    var headers = {};

    // Add JSON header when sending a request body
    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    // Add access token when the user is logged in
    if (DummyHub.state.accessToken) {
        headers.Authorization =
            "Bearer " + DummyHub.state.accessToken;
    }

    // Include any additional headers
    if (options.headers) {
        headers = {
            ...headers,
            ...options.headers
        };
    }

    try {
        var response = await fetch(
            DummyHub.API_BASE_URL + endpoint,
            {
                method: options.method || "GET",
                headers: headers,
                body: options.body
            }
        );

        var data = {};

        // Read the response
        var responseText = await response.text();

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error("The server returned an invalid response.");
            }
        }

        // Check whether the request was successful
        if (!response.ok) {
            var requestError = new Error(
                data.message || "Request failed: " + response.status
            );

            // Preserve the HTTP status code
            requestError.status = response.status;

            throw requestError;
        }

        return data;

    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                "Unable to connect to the server. Please check your internet connection."
            );
        }

        throw error;
    }
};
