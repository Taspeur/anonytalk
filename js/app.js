/**
 * AnonyTalk - Shared Utilities & Auth Guard
 */

const APP_NAME = "AnonyTalk";
const STORAGE_KEYS = {
    USERS: "anonytalk_users",
    POSTS: "anonytalk_posts",
    MESSAGES: "anonytalk_messages",
    SESSION: "anonytalk_session",
    CONFIG: "anonytalk_config"
};

// --- Initialization ---
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        // Create default admin
        const adminUser = {
            id: 'admin-' + Date.now(),
            username: 'Sam',
            password: '0021Sam@', // In a real app, this would be hashed
            initials: 'S',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
    } else {
        // Migration: If 'admin' with 'password123' exists, update to 'Sam'
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
        const adminIdx = users.findIndex(u => u.username === 'admin' && u.password === 'password123');
        if (adminIdx !== -1) {
            users[adminIdx].username = 'Sam';
            users[adminIdx].password = '0021Sam@';
            users[adminIdx].initials = 'S';
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
}

// --- Auth Utilities ---
const Auth = {
    getCurrentUser() {
        const session = localStorage.getItem(STORAGE_KEYS.SESSION);
        return session ? JSON.parse(session) : null;
    },
    
    login(username, password) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: "Pseudo ou mot de passe incorrect." };
    },
    
    logout() {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        window.location.href = 'login.html';
    },
    
    register(username, password, initials) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: "Ce pseudo est déjà utilisé." };
        }
        
        const newUser = {
            id: 'user-' + Date.now(),
            username,
            password,
            initials,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return { success: true, user: newUser };
    },
    
    requireAuth() {
        if (!this.getCurrentUser()) {
            window.location.href = 'login.html';
        }
    },
    
    requireAdmin() {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
        }
    }
};

// --- UI Utilities ---
const UI = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-msg">${message}</div>
        `;
        
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    setLoading(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<div class="spinner"></div>';
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalText;
            btn.disabled = false;
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    
    // Auto-update navbar if user is logged in
    const user = Auth.getCurrentUser();
    const navActions = document.querySelector('.nav-actions');
    const navLinks = document.querySelector('.nav-links');
    
    if (navActions && user) {
        navActions.innerHTML = `
            <div class="flex-center" style="gap: 15px;">
                <div class="avatar avatar-sm" title="${user.username}">${user.initials}</div>
                <button class="btn btn-secondary btn-sm" onclick="Auth.logout()">Déconnexion</button>
            </div>
        `;
        
        if (navLinks) {
            let extraLinks = `<li><a href="dashboard.html">Tableau de bord</a></li>`;
            if (user.role === 'admin') extraLinks += `<li><a href="admin.html">Admin</a></li>`;
            if (user.role === 'counselor') extraLinks += `<li><a href="counselor.html">Conseils</a></li>`;
            navLinks.innerHTML += extraLinks;
        }
    }
});
