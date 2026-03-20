/**
 * AnonyTalk - Admin Panel Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const usersTableBody = document.getElementById('users-table-body');
    
    // Auth Check
    await Auth.requireAdmin();

    // Load Stats
    async function loadStats() {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: counselorCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'counselor');
        const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
        
        document.getElementById('stat-users').innerText = userCount || 0;
        document.getElementById('stat-counselors').innerText = counselorCount || 0;
        document.getElementById('stat-posts').innerText = postCount || 0;
        document.getElementById('stat-messages').innerText = messageCount || 0;
    }

    // Load Users Table
    async function loadUsers() {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username');

        if (error) return;

        const currentUser = await Auth.getCurrentUser();

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
                                onclick="toggleCounselor('${user.id}', '${user.role}')">
                                ${user.role === 'counselor' ? 'Révoquer' : 'Nommer Conseiller'}
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Global toggle function
    window.toggleCounselor = async function(userId, currentRole) {
        const newRole = currentRole === 'counselor' ? 'user' : 'counselor';
        
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) {
            UI.showToast(error.message, "error");
            return;
        }
            
        UI.showToast("Rôle mis à jour avec succès.", "success");
        await loadUsers();
        await loadStats();
    };

    if (usersTableBody) {
        await loadUsers();
        await loadStats();
    }
});
