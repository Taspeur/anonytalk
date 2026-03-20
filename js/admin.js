/**
 * AnonyTalk - Admin Panel Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const usersTableBody = document.getElementById('users-table-body');
    
    // Load Stats
    function loadStats() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || "[]");
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || "[]");
        
        document.getElementById('stat-users').innerText = users.length;
        document.getElementById('stat-counselors').innerText = users.filter(u => u.role === 'counselor').length;
        document.getElementById('stat-posts').innerText = posts.length;
        document.getElementById('stat-messages').innerText = messages.length;
    }

    // Load Users Table
    function loadUsers() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const currentUser = Auth.getCurrentUser();

        usersTableBody.innerHTML = users.map(user => {
            const isSelf = currentUser && currentUser.id === user.id;
            const roleBadge = user.role === 'admin' ? 'badge-red' : (user.role === 'counselor' ? 'badge-blue' : 'badge-purple');
            
            return `
                <tr>
                    <td><div class="avatar avatar-sm">${user.initials}</div></td>
                    <td>${user.username} ${isSelf ? '<small>(Moi)</small>' : ''}</td>
                    <td><span class="badge ${roleBadge}" style="text-transform: capitalize;">${user.role}</span></td>
                    <td>
                        ${isSelf ? '---' : `
                            <button class="btn btn-sm ${user.role === 'counselor' ? 'btn-secondary' : 'btn-outline'}" 
                                onclick="toggleCounselor('${user.id}')">
                                ${user.role === 'counselor' ? 'Révoquer' : 'Nommer Conseiller'}
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Global toggle function
    window.toggleCounselor = function(userId) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            const user = users[userIndex];
            user.role = user.role === 'counselor' ? 'user' : 'counselor';
            users[userIndex] = user;
            
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            UI.showToast(`Rôle de ${user.username} mis à jour.`, "success");
            loadUsers();
            loadStats();
        }
    };

    if (usersTableBody) {
        loadUsers();
        loadStats();
    }
});
