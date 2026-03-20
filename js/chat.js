/**
 * AnonyTalk - Chat & Discussion Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const createPostForm = document.getElementById('create-post-form');
    const categoryItems = document.querySelectorAll('.sidebar-nav-item[data-category]');
    
    let currentCategory = 'tous';

    // --- Post Management ---
    async function loadPosts(category = 'tous') {
        const currentUser = await Auth.getCurrentUser();
        
        // Fetch posts with author profiles
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles (
                    username,
                    initials
                )
            `)
            .order('created_at', { ascending: false });

        if (category !== 'tous') {
            query = query.eq('category', category);
        }

        const { data: posts, error } = await query;

        if (error || !posts || posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state animate-fade">
                    <div class="empty-icon">💭</div>
                    <h3>Prêt à partager ?</h3>
                    <p>Soyez le premier à lancer une discussion dans cette catégorie.</p>
                </div>
            `;
            return;
        }

        // Apply visibility filter locally (counselor posts)
        const visiblePosts = posts.filter(p => {
            if (p.type === 'counselor') {
                return currentUser && (currentUser.id === p.author_id || currentUser.id === p.authorId || currentUser.role === 'counselor' || currentUser.role === 'admin');
            }
            return true;
        });

        const html = await Promise.all(visiblePosts.map(async post => {
            const author = post.profiles || { initials: '??', username: 'Anonyme' };
            const date = new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const replyCount = await getReplyCount(post.id);
            const typeBadge = post.type === 'counselor' ? '<span class="badge badge-red" style="margin-left: 10px;">🔒 Privé (Conseil)</span>' : '';
            
            return `
                <a href="chat.html?id=${post.id}" class="post-card animate-fade">
                    <div class="post-header">
                        <div class="avatar avatar-sm">${author.initials}</div>
                        <div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${author.username}${typeBadge}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${date} • <span class="badge badge-gray" style="text-transform: capitalize; padding: 1px 6px;">${post.category}</span></div>
                        </div>
                    </div>
                    <div class="post-title">${post.title}</div>
                    <p style="margin-bottom: 16px; line-height: 1.5; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${post.content}
                    </p>
                    <div class="post-meta">
                        <span>💬 ${replyCount} réponses</span>
                        <span>🤝 0 conseillers ont rejoint</span>
                    </div>
                </a>
            `;
        }));

        postsContainer.innerHTML = html.join('');
    }

    async function getReplyCount(postId) {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
        return error ? 0 : count;
    }

    // --- Create Post ---
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const user = await Auth.getCurrentUser();
            const postType = document.querySelector('input[name="post-type"]:checked').value;
            
            const { error } = await supabase
                .from('posts')
                .insert({
                    author_id: user.id,
                    title: document.getElementById('post-title').value,
                    category: document.getElementById('post-category').value,
                    type: postType,
                    content: document.getElementById('post-content').value
                });

            if (error) {
                UI.showToast(error.message, "error");
                return;
            }
            
            UI.showToast("Sujet publié avec succès !", "success");
            closeModal('modal-create-post');
            createPostForm.reset();
            loadPosts(currentCategory);
        });
    }

    // --- Category Filtering ---
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            loadPosts(currentCategory);
        });
    });

    // --- Load Counselors ---
    async function loadOnlineCounselors() {
        const { data: counselors, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['counselor', 'admin']);

        const listContainer = document.getElementById('counselor-list');
        if (!listContainer) return;

        if (error || !counselors || counselors.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="padding: 10px; opacity: 0.6;">
                    <p style="font-size: 0.8rem;">Aucun conseiller disponible</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = counselors.map(c => `
            <div class="user-list-item">
                <div class="avatar avatar-sm" style="background: var(--accent-2);">${c.initials}</div>
                <div class="user-info">
                    <div class="user-name">${c.username}</div>
                    <div class="user-status"><span class="success" style="color: var(--success)">●</span> En ligne</div>
                </div>
            </div>
        `).join('');
    }

    // Initial load
    if (postsContainer) {
        loadPosts();
        loadOnlineCounselors();
    }
});
