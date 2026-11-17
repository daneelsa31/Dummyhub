
DummyHub.communityPosts = [];
DummyHub.communityLimit = 10;
DummyHub.communityReactions = {};


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
DummyHub.loadCommunityPosts = async function () {
    var postsContainer = document.getElementById("community-posts");

    try {
        var data = await DummyHub.request(
            "/posts?limit=" + DummyHub.communityLimit
        );

        DummyHub.communityPosts = data.posts;

        await DummyHub.loadCommunityTags();

        DummyHub.displayCommunityPosts(DummyHub.communityPosts);

    } catch (error) {
        postsContainer.innerHTML = `
            <p>Unable to load community posts.</p>
            <button id="retry-community">Retry</button>
        `;

        document.getElementById("retry-community").addEventListener(
            "click",
            DummyHub.loadCommunityPosts
        );
    }
};


// Display community posts
DummyHub.displayCommunityPosts = function (posts) {
    var postsContainer = document.getElementById("community-posts");

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

                <p>Likes: ${post.reactions.likes}</p>
                <p>Dislikes: ${post.reactions.dislikes}</p>

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

    try {
        var tags = await DummyHub.request("/posts/tags");

        tagFilter.innerHTML = '<option value="">All Tags</option>';

        tags.forEach(function (tag) {
            var tagSlug = typeof tag === "string"
                ? tag
                : tag.slug;

            var tagName = typeof tag === "string"
                ? tag
                : tag.name;

            var option = document.createElement("option");

            option.value = tagSlug;
            option.textContent = tagName;

            tagFilter.appendChild(option);
        });

    } catch (error) {
        console.log("Unable to load post tags:", error);
    }
};

// Search and filter community posts
DummyHub.filterCommunityPosts = function () {
    var searchTerm = document.getElementById("community-search").value.toLowerCase();
    var selectedTag = document.getElementById("community-tag").value;

    var filteredPosts = DummyHub.communityPosts.filter(function (post) {
        var matchesSearch =
            post.title.toLowerCase().includes(searchTerm) ||
            post.body.toLowerCase().includes(searchTerm);

        var matchesTag =
            selectedTag === "" || post.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    DummyHub.displayCommunityPosts(filteredPosts);
};


// Set up search and tag filtering
DummyHub.setupCommunityFilters = function () {
    document.getElementById("community-search").addEventListener(
        "input",
        DummyHub.filterCommunityPosts
    );

    document.getElementById("community-tag").addEventListener(
        "change",
        DummyHub.filterCommunityPosts
    );
};


// Load more posts
DummyHub.loadMoreCommunityPosts = async function () {
    DummyHub.communityLimit += 10;

    await DummyHub.loadCommunityPosts();

    DummyHub.filterCommunityPosts();
};


// Set up Load More button
DummyHub.setupLoadMorePosts = function () {
    document.getElementById("load-more-posts").addEventListener(
        "click",
        DummyHub.loadMoreCommunityPosts
    );
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

    return DummyHub.communityReactions[reactionKey] || null;
};


// Like or dislike a post using toggle behavior
// Like or dislike a post using toggle behavior
DummyHub.reactToPost = function (postId, reaction) {
    var userId = DummyHub.state.user
        ? DummyHub.state.user.id
        : "guest";

    var reactionKey = userId + "-" + postId;

    var currentReaction = DummyHub.communityReactions[reactionKey];

    var newReaction = currentReaction === reaction
        ? null
        : reaction;

    var updatedPosts = DummyHub.communityPosts.map(function (post) {
        if (post.id === postId) {
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
        }

        return post;
    });

    DummyHub.communityReactions[reactionKey] = newReaction;
    DummyHub.communityPosts = updatedPosts;

    // Update the current post if the user is viewing its details
    if (
        DummyHub.currentPost &&
        DummyHub.currentPost.id === postId
    ) {
        var updatedCurrentPost = updatedPosts.find(function (post) {
            return post.id === postId;
        });

        DummyHub.currentPost = updatedCurrentPost;
    }

    // Refresh whichever page is currently displayed
    if (document.getElementById("post-detail-content")) {
        DummyHub.displayPostDetail();
    } else if (document.getElementById("community-posts")) {
        DummyHub.filterCommunityPosts();
    }
};
