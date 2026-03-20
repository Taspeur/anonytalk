/**
 * AnonyTalk - Counselor Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const urgentPostsList = document.getElementById('urgent-posts-list');
    const activeInterventionsList = document.getElementById('active-interventions-list');

    function loadCounselorDashboard() {
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || "[]");
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || "[]");
        const currentUser = Auth.getCurrentUser();

        // 1. Find posts without any replies
        const urgentPosts = posts.filter(post => {
            const replyCount = messages.filter(m => m.postId === post.id).length;
            return replyCount === 0;
        });

        // 2. Find posts where the current counselor has replied
        const activePostsIds = [...new Set(messages
            .filter(m => m.authorId === currentUser.id)
            .map(m => m.postId))];
        
        const activePosts = posts.filter(post => activePostsIds.includes(post.id));

        // Render Urgent
        if (urgentPosts.length === 0) {
            urgentPostsList.innerHTML = `<p class="empty-state" style="padding: 10px;">Tous les sujets ont des réponses. Bon travail !</p>`;
        } else {
            urgentPostsList.innerHTML = urgentPosts.map(post => `
                <div class="user-list-item" onclick="window.location.href='chat.html?id=${post.id}'" style="border-bottom: 1px solid var(--border); border-radius: 0;">
                    <div class="user-info">
                        <div class="user-name" style="font-weight: 700;">${post.title}</div>
                        <div class="user-status" style="font-size: 0.75rem;">Posté le ${new Date(post.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button class="btn btn-primary btn-sm">Aider</button>
                </div>
            `).join('');
        }

        // Render Active
        if (activePosts.length === 0) {
            activeInterventionsList.innerHTML = `<p class="empty-state" style="padding: 10px;">Vous n'avez pas encore d'interventions actives.</p>`;
        } else {
            activeInterventionsList.innerHTML = activePosts.map(post => `
                <div class="user-list-item" onclick="window.location.href='chat.html?id=${post.id}'" style="border-bottom: 1px solid var(--border); border-radius: 0;">
                    <div class="user-info">
                        <div class="user-name" style="font-weight: 700;">${post.title}</div>
                        <div class="user-status" style="color: var(--accent-light);">Discussion en cours...</div>
                    </div>
                    <div class="badge badge-purple">Suivi</div>
                </div>
            `).join('');
        }
    }

    if (urgentPostsList) {
        loadCounselorDashboard();
    }
});
