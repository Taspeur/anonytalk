/**
 * AnonyTalk - Auth Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    // --- Handle Registration ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = registerForm.querySelector('button[type="submit"]');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const initials = document.getElementById('initials').value.trim().toUpperCase();

            UI.setLoading(btn, true);

            try {
                const result = await Auth.register(username, password, initials);
                
                if (result.success) {
                    UI.showToast("Compte créé avec succès ! Connectez-vous.", "success");
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    UI.showToast(result.message, "error");
                }
            } catch (err) {
                console.error("Registration Error:", err);
                UI.showToast("Une erreur inattendue est survenue lors de l'inscription.", "error");
            } finally {
                UI.setLoading(btn, false);
            }
        });
    }

    // --- Handle Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = loginForm.querySelector('button[type="submit"]');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            UI.setLoading(btn, true);

            try {
                const result = await Auth.login(username, password);
                
                if (result.success && result.user) {
                    UI.showToast(`Bienvenue, ${result.user.username} !`, "success");
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (result.user.role === 'admin') {
                            window.location.href = 'admin.html';
                        } else if (result.user.role === 'counselor') {
                            window.location.href = 'counselor.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    const errorMsg = result.message || "Impossible de se connecter. Vérifiez la configuration de votre projet.";
                    UI.showToast(errorMsg, "error");
                    console.error("Login Failure:", result.message);
                }
            } catch (err) {
                console.error("Login unexpected Error:", err);
                UI.showToast("Une erreur critique est survenue lors de la connexion. Contactez l'administrateur.", "error");
            } finally {
                UI.setLoading(btn, false);
            }
        });
    }
});
