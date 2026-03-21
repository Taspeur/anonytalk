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
    // With Supabase, we don't need to manually initialize users here.
    // However, we should check if the session exists.
    console.log("Supabase initialization complete.");
}

// --- Auth Utilities ---
const Auth = {
    async getCurrentUser() {
        try {
            if (typeof supabase === 'undefined' || !supabase.auth) {
                console.error("Supabase client not initialized.");
                return null;
            }

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session) return null;
            
            // Fetch additional profile info
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
            if (profileError) throw profileError;

            return profile ? { ...profile, email: session.user.email } : null;
        } catch (err) {
            console.error("Error in getCurrentUser:", err);
            return null;
        }
    },
    
    async login(username, password) {
        try {
            if (typeof supabase === 'undefined' || !supabase.auth) {
                return { success: false, message: "Le service d'authentification est indisponible. Veuillez vérifier la configuration." };
            }

            // Use a dummy email for simplicity since the UI only has 'username'
            const email = `${username.toLowerCase()}@anonytalk.com`;
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                if (error.message.includes("Invalid login credentials") || error.code === "invalid_credentials") {
                    return { success: false, message: "Pseudo ou mot de passe incorrect." };
                }
                return { success: false, message: error.message };
            }
            
            const user = await this.getCurrentUser();
            if (!user) {
                return { success: false, message: "Votre profil n'a pas pu être trouvé. Vérifiez que votre compte est bien créé." };
            }
            
            return { success: true, user };
        } catch (err) {
            console.error("Login Error:", err);
            return { success: false, message: "Une erreur de connexion au serveur est survenue." };
        }
    },
    
    async logout() {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    },
    
    async register(username, password, initials) {
        try {
            if (typeof supabase === 'undefined' || !supabase.auth) {
                return { success: false, message: "Le service Supabase n'est pas initialisé. Vérifiez votre connexion." };
            }

            // Generate a valid email from username (remove spaces and special chars)
            const safeUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
            const email = `${safeUsername}_${Math.floor(Math.random() * 1000)}@anonytalk.com`;
            
            // 1. Sign up user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        initials
                    }
                }
            });
            
            if (error) return { success: false, message: error.message };
            
            // 2. Create profile entries
            // Note: If email confirmation is enabled, data.user might be present but sparse
            if (data.user) {
                const isInitialAdmin = username.toLowerCase() === 'sam';
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        username,
                        initials: initials.toUpperCase(),
                        role: isInitialAdmin ? 'admin' : 'user'
                    });
                    
                if (profileError) {
                    console.error("Profile creation error:", profileError);
                    // We don't return false here because the user IS created in auth.
                }
            }
            
            return { success: true, user: data.user };
        } catch (err) {
            console.error("Critical Register Error:", err);
            return { success: false, message: "Une erreur critique est survenue." };
        }
    },
    
    async requireAuth() {
        const user = await this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        }
    },
    
    async requireAdmin() {
        const user = await this.getCurrentUser();
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
document.addEventListener('DOMContentLoaded', async () => {
    initStorage();
    
    // Auto-update navbar if user is logged in
    const user = await Auth.getCurrentUser();
    const navActions = document.querySelector('.nav-actions');
    const navLinks = document.querySelector('.nav-links');
    
    if (navActions && user) {
        navActions.innerHTML = `
            <div class="flex-center" style="gap: 15px;">
                <div class="avatar avatar-sm" title="${user.username}">${user.initials}</div>
                <button class="btn btn-secondary btn-sm" id="logout-btn">Déconnexion</button>
            </div>
        `;
        
        document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());
        
        if (navLinks) {
            let extraLinks = `<li><a href="dashboard.html">Tableau de bord</a></li>`;
            if (user.role === 'admin') extraLinks += `<li><a href="admin.html">Admin</a></li>`;
            if (user.role === 'counselor') extraLinks += `<li><a href="counselor.html">Conseils</a></li>`;
            navLinks.innerHTML += extraLinks;
        }
    }
});
