/**
 * AnonyTalk - Counselor Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const urgentPostsList = document.getElementById('urgent-posts-list');
    const activeInterventionsList = document.getElementById('active-interventions-list');

    async function loadCounselorDashboard() {
        const currentUser = await Auth.getCurrentUser();
        if (!currentUser) return;

        // 1. Find posts without any replies (Urgent)
        // We use a subquery or separate fetch since Supabase doesn't easily support "count where replies = 0" in one go without RPC
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                *,
                messages (id)
            `)
            .order('created_at', { ascending: false });

        if (postsError) return;

        const urgentPosts = posts.filter(post => !post.messages || post.messages.length === 0);

        // 2. Find posts where the current counselor has replied (Active)
        const { data: myMessages, error: msgError } = await supabase
            .from('messages')
            .select('post_id')
            .eq('author_id', currentUser.id);

        if (msgError) return;

        const myPostIds = [...new Set(myMessages.map(m => m.post_id))];
        const activePosts = posts.filter(post => myPostIds.includes(post.id));

        // Render Urgent
        if (urgentPosts.length === 0) {
            urgentPostsList.innerHTML = `<p class="empty-state" style="padding: 10px;">Tous les sujets ont des réponses. Bon travail !</p>`;
        } else {
            urgentPostsList.innerHTML = urgentPosts.map(post => `
                <div class="user-list-item" onclick="window.location.href='chat.html?id=${post.id}'" style="border-bottom: 1px solid var(--border); border-radius: 0; cursor: pointer;">
                    <div class="user-info">
                        <div class="user-name" style="font-weight: 700;">${post.title}</div>
                        <div class="user-status" style="font-size: 0.75rem;">Posté le ${new Date(post.created_at).toLocaleDateString()}</div>
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
                <div class="user-list-item" onclick="window.location.href='chat.html?id=${post.id}'" style="border-bottom: 1px solid var(--border); border-radius: 0; cursor: pointer;">
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
