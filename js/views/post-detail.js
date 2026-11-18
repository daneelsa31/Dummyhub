
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


// Retrieve a post, its comments, and its author
DummyHub.loadPostDetail = async function (postId) {
    var content = document.getElementById("post-detail-content");

    try {
        // Check whether the post is already available in the Community feed
        var existingPost = DummyHub.state.communityPosts.find(
            function (post) {
                return post.id === Number(postId);
            }
        );

        var post;

        if (existingPost) {
            post = existingPost;
        } else {
            // Retrieve the post first if it is not in the current feed
            post = await DummyHub.request("/posts/" + postId);
        }

        // Retrieve comments and author information in parallel
        var results = await Promise.all([
            DummyHub.request("/posts/" + postId + "/comments"),
            DummyHub.request("/users/" + post.userId)
        ]);

        DummyHub.setState({
            currentPost: post,
            currentPostComments: results[0].comments || [],
            currentPostAuthor: results[1]
        });

        DummyHub.displayPostDetail();

    } catch (error) {
        // Show the Not Found page if the post does not exist
        if (
            error.status === 404 ||
            error.message.toLowerCase().includes("not found")
        ) {
            content.innerHTML = DummyHub.renderNotFound();
            return;
        }

        // Show retry option for other errors
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
    var post = DummyHub.state.currentPost;
    var content = document.getElementById("post-detail-content");

    if (!post || !content) {
        return;
    }

    var author = DummyHub.state.currentPostAuthor;
    var comments = DummyHub.state.currentPostComments || [];

    var currentReaction = DummyHub.getCommunityReaction(post.id);

    var authorName = author
        ? author.firstName + " " + author.lastName
        : "Unknown User";

    // Create a profile link if the author information is available
    var authorDisplay = author
        ? `<a href="#/people/${Number(author.id)}">${DummyHub.escapeHTML(authorName)}</a>`
        : "Unknown User";

    content.innerHTML = `
        <button id="back-to-community">Back to Community</button>

        <article class="post-detail">
            <h1>${DummyHub.escapeHTML(post.title)}</h1>

            <p>
                Posted by:
                ${authorDisplay}
            </p>

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
            <h2>Comments (${comments.length})</h2>

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
                                maxlength="280"
                                required
                            ></textarea>

                            <p id="comment-error" class="error-message"></p>

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

    // Return to the Community page
    document.getElementById("back-to-community").addEventListener(
        "click",
        function () {
            window.location.hash = "#/community";
        }
    );

    // Handle Like and Dislike buttons
    content.onclick = function (event) {
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
    };

    // Handle comment submission
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
    var comments = DummyHub.state.currentPostComments || [];

    if (comments.length === 0) {
        return "<p>No comments yet.</p>";
    }

    return comments.map(function (comment) {
        var commenter = comment.user
            ? comment.user.fullName
            : "User";

        return `
            <article class="comment-card">
                <h4>${DummyHub.escapeHTML(commenter)}</h4>

                <p>${DummyHub.escapeHTML(comment.body)}</p>

                <p>Likes: ${comment.likes || 0}</p>
            </article>
        `;
    }).join("");
};


// Validate a comment before submission
DummyHub.validateComment = function (comment) {
    var trimmedComment = comment.trim();

    if (trimmedComment.length === 0) {
        return "Comment cannot be empty or contain only spaces.";
    }

    if (trimmedComment.length > 280) {
        return "Comment cannot exceed 280 characters.";
    }

    return "";
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

    // Check the comment before sending it
    var validationMessage = DummyHub.validateComment(commentText);

    if (validationMessage) {
        errorElement.textContent = validationMessage;
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
        errorElement.textContent = "";

        // Send the new comment to DummyJSON
        var newComment = await DummyHub.request("/comments/add", {
            method: "POST",
            body: JSON.stringify({
                body: commentText,
                postId: DummyHub.state.currentPost.id,
                userId: DummyHub.state.user.id
            })
        });

        // Attach the current user's name to the returned comment
        newComment.user = {
            fullName: DummyHub.state.user.firstName +
                " " + DummyHub.state.user.lastName
        };

        // Append the returned comment to local state
        DummyHub.setState({
            currentPostComments: [
                ...DummyHub.state.currentPostComments,
                newComment
            ]
        });

        // Refresh the post detail page
        DummyHub.displayPostDetail();

    } catch (error) {
        errorElement.textContent =
            "Unable to submit comment. Please try again.";

        submitButton.disabled = false;
        submitButton.textContent = "Submit Comment";
    }
};
