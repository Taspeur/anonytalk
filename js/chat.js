/**
 * AnonyTalk - Chat & Discussion Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const createPostForm = document.getElementById('create-post-form');
    const categoryItems = document.querySelectorAll('.sidebar-nav-item[data-category]');
    
    let currentCategory = 'tous';

    // --- Post Management ---
    function loadPosts(category = 'tous') {
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || "[]");
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        
        const filteredPosts = category === 'tous' 
            ? posts 
            : posts.filter(p => p.category === category);

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state animate-fade">
                    <div class="empty-icon">💭</div>
                    <h3>Prêt à partager ?</h3>
                    <p>Soyez le premier à lancer une discussion dans cette catégorie.</p>
                </div>
            `;
            return;
        }

        // Sort by newest
        filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        postsContainer.innerHTML = filteredPosts.map(post => {
            const author = users.find(u => u.id === post.authorId) || { initials: '??', username: 'Anonyme' };
            const date = new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            return `
                <a href="chat.html?id=${post.id}" class="post-card animate-fade">
                    <div class="post-header">
                        <div class="avatar avatar-sm">${author.initials}</div>
                        <div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${author.username}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${date} • <span class="badge badge-gray" style="text-transform: capitalize; padding: 1px 6px;">${post.category}</span></div>
                        </div>
                    </div>
                    <div class="post-title">${post.title}</div>
                    <p style="margin-bottom: 16px; line-height: 1.5; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${post.content}
                    </p>
                    <div class="post-meta">
                        <span>💬 ${getReplyCount(post.id)} réponses</span>
                        <span>🤝 0 conseillers ont rejoint</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    function getReplyCount(postId) {
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || "[]");
        return messages.filter(m => m.postId === postId).length;
    }

    // --- Create Post ---
    if (createPostForm) {
        createPostForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = Auth.getCurrentUser();
            const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || "[]");
            
            const newPost = {
                id: 'post-' + Date.now(),
                authorId: user.id,
                title: document.getElementById('post-title').value,
                category: document.getElementById('post-category').value,
                content: document.getElementById('post-content').value,
                createdAt: new Date().toISOString()
            };

            posts.push(newPost);
            localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
            
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
    function loadOnlineCounselors() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const listContainer = document.getElementById('counselor-list');
        if (!listContainer) return;

        const counselors = users.filter(u => u.role === 'counselor' || u.role === 'admin');

        if (counselors.length === 0) {
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
