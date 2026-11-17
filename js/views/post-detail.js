
DummyHub.currentPost = null;
DummyHub.currentPostComments = [];

// Display the Post Details page
DummyHub.renderPostDetail = function () {
    return `
        <section class="post-detail-page">
            <div id="post-detail-content">
                <p>Loading post...</p>
            </div>
        </section>
    `;
};


// Retrieve a post and its comments
DummyHub.loadPostDetail = async function (postId) {
    var content = document.getElementById("post-detail-content");

    try {
        var results = await Promise.all([
            DummyHub.request("/posts/" + postId),
            DummyHub.request("/posts/" + postId + "/comments")
        ]);

        DummyHub.currentPost = results[0];
        DummyHub.currentPostComments = results[1].comments;

        DummyHub.displayPostDetail();

    } catch (error) {
        content.innerHTML = `
            <p>Unable to load post details.</p>
            <button id="retry-post-detail">Retry</button>
        `;

        document.getElementById("retry-post-detail").addEventListener(
            "click",
            function () {
                DummyHub.loadPostDetail(postId);
            }
        );
    }
};


// Display the post and its comments
DummyHub.displayPostDetail = function () {
    var post = DummyHub.currentPost;
    var content = document.getElementById("post-detail-content");

    var currentReaction = DummyHub.getCommunityReaction(post.id);

    content.innerHTML = `
        <button id="back-to-community">Back to Community</button>

        <article class="post-detail">
            <h1>${DummyHub.escapeHTML(post.title)}</h1>

            <p>${DummyHub.escapeHTML(post.body)}</p>

            <p>
                Tags:
                ${post.tags.map(function (tag) {
                    return DummyHub.escapeHTML(tag);
                }).join(", ")}
            </p>

            <div class="post-reactions">
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
            </div>
        </article>

        <hr>

        <section class="post-comments">
            <h2>Comments (${DummyHub.currentPostComments.length})</h2>

            <div id="comment-list">
                ${DummyHub.renderPostComments()}
            </div>

            <h3>Add a Comment</h3>

            ${
                DummyHub.state.user
                    ? `
                        <form id="comment-form">
                            <textarea
                                id="comment-input"
                                placeholder="Write your comment..."
                                required
                            ></textarea>

                            <p id="comment-error"></p>

                            <button type="submit" id="comment-submit">
                                Submit Comment
                            </button>
                        </form>
                    `
                    : `
                        <p>You must log in to comment.</p>
                        <a href="#/login" id="login-to-comment">Login</a>
                    `
            }
        </section>
    `;

    document.getElementById("back-to-community").addEventListener(
        "click",
        function () {
            window.location.hash = "#/community";
        }
    );

    // Save the current post before going to Login
    var loginToComment = document.getElementById("login-to-comment");

    if (loginToComment) {
        loginToComment.addEventListener("click", function () {
            DummyHub.state.redirectAfterLogin =
                window.location.hash;
        });
    }

    // Handle Like and Dislike buttons
    content.addEventListener("click", function (event) {
        var button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        var action = button.dataset.action;
        var postId = Number(button.dataset.id);

        if (action === "like-post") {
            DummyHub.reactToPost(postId, "like");
        } else if (action === "dislike-post") {
            DummyHub.reactToPost(postId, "dislike");
        }
    });

    var commentForm = document.getElementById("comment-form");

    if (commentForm) {
        commentForm.addEventListener(
            "submit",
            DummyHub.handleCommentSubmit
        );
    }
};


// Display the comments
DummyHub.renderPostComments = function () {
    if (DummyHub.currentPostComments.length === 0) {
        return "<p>No comments yet.</p>";
    }

    return DummyHub.currentPostComments.map(function (comment) {
        return `
            <article class="comment-card">
                <h4>${DummyHub.escapeHTML(comment.user.fullName)}</h4>
                <p>${DummyHub.escapeHTML(comment.body)}</p>
                <p>Likes: ${comment.likes}</p>
            </article>
        `;
    }).join("");
};


// Handle comment submission
DummyHub.handleCommentSubmit = async function (event) {
    event.preventDefault();

    if (!DummyHub.state.user) {
        return;
    }

    var commentInput = document.getElementById("comment-input");
    var errorElement = document.getElementById("comment-error");
    var submitButton = document.getElementById("comment-submit");

    var commentText = commentInput.value.trim();

    if (commentText === "") {
        errorElement.textContent = "Please enter a comment.";
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        var newComment = await DummyHub.request("/comments/add", {
            method: "POST",
            body: JSON.stringify({
                body: commentText,
                postId: DummyHub.currentPost.id,
                userId: DummyHub.state.user.id
            })
        });

        DummyHub.currentPostComments = [
            ...DummyHub.currentPostComments,
            newComment
        ];

        DummyHub.displayPostDetail();

    } catch (error) {
        errorElement.textContent =
            "Unable to submit comment: " + error.message;

        submitButton.disabled = false;
        submitButton.textContent = "Submit Comment";
    }
};
