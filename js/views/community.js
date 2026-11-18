
DummyHub.communityLimit = 10;


// Display the Community page
DummyHub.renderCommunity = function () {
    return `
        <section class="community-page">
            <h1>Community</h1>

            <div class="community-controls">
                <input
                    type="text"
                    id="community-search"
                    placeholder="Search posts..."
                >

                <select id="community-tag">
                    <option value="">All Tags</option>
                </select>
            </div>

            <div id="community-posts">
                <p>Loading community posts...</p>
            </div>

            <button id="load-more-posts">Load More</button>
        </section>
    `;
};


// Retrieve community posts
DummyHub.loadCommunityPosts = async function (reset) {
    var postsContainer = document.getElementById("community-posts");
    var loadMoreButton = document.getElementById("load-more-posts");

    if (!postsContainer) {
        return;
    }

    if (reset) {
        DummyHub.setState({
            communityPosts: [],
            communitySkip: 0,
            communityTotal: 0
        });

        postsContainer.innerHTML = "<p>Loading community posts...</p>";
    }

    if (loadMoreButton) {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = "Loading...";
    }

    var searchInput = document.getElementById("community-search");
    var tagInput = document.getElementById("community-tag");

    var searchTerm = searchInput ? searchInput.value.trim() : "";
    var selectedTag = tagInput ? tagInput.value : "";
    var skip = DummyHub.state.communitySkip || 0;

    var endpoint = "/posts?limit=" + DummyHub.communityLimit +
        "&skip=" + skip;

    // Search posts using the API
    if (searchTerm !== "") {
        endpoint = "/posts/search?q=" +
            encodeURIComponent(searchTerm) +
            "&limit=" + DummyHub.communityLimit +
            "&skip=" + skip;
    }

    // Filter posts by tag using the API
    else if (selectedTag !== "") {
        endpoint = "/posts/tag/" +
            encodeURIComponent(selectedTag) +
            "?limit=" + DummyHub.communityLimit +
            "&skip=" + skip;
    }

    try {
        var data = await DummyHub.request(endpoint);
        var newPosts = data.posts || [];

        // Apply the tag filter too when searching
        if (searchTerm !== "" && selectedTag !== "") {
            newPosts = newPosts.filter(function (post) {
                return post.tags.includes(selectedTag);
            });
        }

        // Append new posts using spread instead of replacing old posts
        var updatedPosts = reset
            ? [...newPosts]
            : [...DummyHub.state.communityPosts, ...newPosts];

        DummyHub.setState({
            communityPosts: updatedPosts,
            communitySkip: skip + newPosts.length,
            communityTotal: data.total || 0
        });

        DummyHub.displayCommunityPosts(updatedPosts);

        // Show or hide Load More depending on remaining posts
        if (loadMoreButton) {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load More";

            loadMoreButton.classList.toggle(
                "hidden",
                DummyHub.state.communitySkip >=
                DummyHub.state.communityTotal
            );
        }

    } catch (error) {
        postsContainer.innerHTML = `
            <p>Unable to load community posts.</p>
            <button id="retry-community">Retry</button>
        `;

        document.getElementById("retry-community").addEventListener(
            "click",
            function () {
                DummyHub.loadCommunityPosts(true);
            }
        );

        if (loadMoreButton) {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load More";
        }
    }
};


// Display community posts
DummyHub.displayCommunityPosts = function (posts) {
    var postsContainer = document.getElementById("community-posts");

    if (!postsContainer) {
        return;
    }

    if (posts.length === 0) {
        postsContainer.innerHTML = "<p>No posts found.</p>";
        return;
    }

    postsContainer.innerHTML = posts.map(function (post) {
        var currentReaction = DummyHub.getCommunityReaction(post.id);

        return `
            <article class="community-post">
                <h3>${DummyHub.escapeHTML(post.title)}</h3>

                <p>${DummyHub.escapeHTML(post.body)}</p>

                <p>
                    Tags:
                    ${post.tags.map(function (tag) {
                        return DummyHub.escapeHTML(tag);
                    }).join(", ")}
                </p>

                <button
                    data-action="like-post"
                    data-id="${post.id}"
                    class="${currentReaction === "like" ? "active" : ""}"
                >
                    ${currentReaction === "like" ? "Unlike" : "Like"}
                    (${post.reactions.likes})
                </button>

                <button
                    data-action="dislike-post"
                    data-id="${post.id}"
                    class="${currentReaction === "dislike" ? "active" : ""}"
                >
                    ${currentReaction === "dislike" ? "Remove Dislike" : "Dislike"}
                    (${post.reactions.dislikes})
                </button>

                <button
                    data-action="view-post"
                    data-id="${post.id}"
                >
                    View Post
                </button>
            </article>
        `;
    }).join("");
};


// Load available post tags
DummyHub.loadCommunityTags = async function () {
    var tagFilter = document.getElementById("community-tag");

    if (!tagFilter) {
        return;
    }

    try {
        // Get available tags from the correct API endpoint
        var tags = await DummyHub.request("/posts/tag-list");

        tagFilter.innerHTML = '<option value="">All Tags</option>';

        tags.forEach(function (tag) {
            var tagName = typeof tag === "string" ? tag : tag.name;
            var tagSlug = typeof tag === "string" ? tag : tag.slug;

            var option = document.createElement("option");

            option.value = tagSlug;
            option.textContent = tagName;

            tagFilter.appendChild(option);
        });

    } catch (error) {
        // Posts can still be displayed if tags cannot be loaded.
    }
};


// Search and filter community posts
DummyHub.filterCommunityPosts = function () {
    DummyHub.loadCommunityPosts(true);
};


// Set up search and tag filtering
DummyHub.setupCommunityFilters = function () {
    var searchInput = document.getElementById("community-search");
    var tagFilter = document.getElementById("community-tag");

    var searchHandler = DummyHub.debounce(function () {
        DummyHub.filterCommunityPosts();
    }, 300);

    searchInput.addEventListener("input", searchHandler);

    tagFilter.addEventListener("change", function () {
        DummyHub.filterCommunityPosts();
    });
};


// Load the next group of posts
DummyHub.loadMoreCommunityPosts = async function () {
    if (
        DummyHub.state.communitySkip >=
        DummyHub.state.communityTotal
    ) {
        return;
    }

    await DummyHub.loadCommunityPosts(false);
};


// Set up the Load More button
DummyHub.setupLoadMorePosts = function () {
    var button = document.getElementById("load-more-posts");

    if (button) {
        button.addEventListener(
            "click",
            DummyHub.loadMoreCommunityPosts
        );
    }
};


// Handle post buttons using event delegation
DummyHub.setupCommunityEvents = function () {
    var postsContainer = document.getElementById("community-posts");

    postsContainer.addEventListener("click", function (event) {
        var button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        var postId = Number(button.dataset.id);
        var action = button.dataset.action;

        if (action === "like-post") {
            DummyHub.reactToPost(postId, "like");

        } else if (action === "dislike-post") {
            DummyHub.reactToPost(postId, "dislike");

        } else if (action === "view-post") {
            window.location.hash = "#/post/" + postId;
        }
    });
};


// Get the current user's reaction to a post
DummyHub.getCommunityReaction = function (postId) {
    var userId = DummyHub.state.user
        ? DummyHub.state.user.id
        : "guest";

    var reactionKey = userId + "-" + postId;

    return DummyHub.state.communityReactions[reactionKey] || null;
};


// Like or dislike a post using local state only
DummyHub.reactToPost = function (postId, reaction) {
    var userId = DummyHub.state.user
        ? DummyHub.state.user.id
        : "guest";

    var reactionKey = userId + "-" + postId;
    var reactions = DummyHub.state.communityReactions;

    var currentReaction = reactions[reactionKey];

    // Clicking the same reaction removes it
    var newReaction = currentReaction === reaction
        ? null
        : reaction;

    var updatedPosts = DummyHub.state.communityPosts.map(function (post) {
        if (post.id !== postId) {
            return post;
        }

        var likes = post.reactions.likes;
        var dislikes = post.reactions.dislikes;

        // Remove the previous reaction
        if (currentReaction === "like") {
            likes--;
        } else if (currentReaction === "dislike") {
            dislikes--;
        }

        // Apply the new reaction
        if (newReaction === "like") {
            likes++;
        } else if (newReaction === "dislike") {
            dislikes++;
        }

        return {
            ...post,
            reactions: {
                ...post.reactions,
                likes: likes,
                dislikes: dislikes
            }
        };
    });

    // Copy the reaction object before changing it
    var updatedReactions = {
        ...reactions
    };

    if (newReaction === null) {
        delete updatedReactions[reactionKey];
    } else {
        updatedReactions[reactionKey] = newReaction;
    }

    // Also update the post currently being viewed
    var updatedCurrentPost = DummyHub.state.currentPost;

    if (updatedCurrentPost && updatedCurrentPost.id === postId) {
        var updatedPostInList = updatedPosts.find(function (post) {
            return post.id === postId;
        });

        if (updatedPostInList) {
            updatedCurrentPost = updatedPostInList;
        } else {
            var likes = updatedCurrentPost.reactions.likes;
            var dislikes = updatedCurrentPost.reactions.dislikes;

            if (currentReaction === "like") {
                likes--;
            } else if (currentReaction === "dislike") {
                dislikes--;
            }

            if (newReaction === "like") {
                likes++;
            } else if (newReaction === "dislike") {
                dislikes++;
            }

            updatedCurrentPost = {
                ...updatedCurrentPost,
                reactions: {
                    ...updatedCurrentPost.reactions,
                    likes: likes,
                    dislikes: dislikes
                }
            };
        }
    }

    DummyHub.setState({
        communityPosts: updatedPosts,
        communityReactions: updatedReactions,
        currentPost: updatedCurrentPost
    });

    if (document.getElementById("post-detail-content")) {
        DummyHub.displayPostDetail();
    } else if (document.getElementById("community-posts")) {
        DummyHub.displayCommunityPosts(updatedPosts);
    }
};
