/**
 * CONFIGURATION SUPABASE
 * ----------------------
 * ATTENTION : L'URL est correcte, mais la clé ci-dessous semble être une clé STRIPE (sb_publishable_...).
 * Vous devez la remplacer par votre clé "anon" Supabase (commençant par "eyJ...").
 */
const SUPABASE_URL = "https://stivwykpspychgtqtxlj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aXZ3eWtwc3B5Y2hndHF0eGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzI1NjAsImV4cCI6MjA4OTU0ODU2MH0.bhpVoWYCx_NY5UFr_gG0jy7fQpqYTyyTKPMnyT42TP4";

// Initialisation du client Supabase
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase Client initialized.");
    } else {
        console.error("Supabase SDK not found. Double check your <script> tags.");
    }
} catch (err) {
    console.error("Failed to initialize Supabase client:", err);
}
