// js/supabase-client.js

// =========================================================
// ⚠️ IMPORTANT: REPLACE THESE WITH YOUR KEYS FROM SUPABASE
// =========================================================
const SUPABASE_URL = 'https://svhwsfzvaotanzbcwcez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aHdzZnp2YW90YW56YmN3Y2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTI0MDYsImV4cCI6MjA4NDIyODQwNn0.zDkjAe5BSiiLmnO6-s0jceIJv9TswEP_kXLf9uY2VcE';
// =========================================================

if (typeof supabase === 'undefined') {
    console.error('CRITICAL ERROR: Supabase SDK is not loaded. Make sure the CDN script is in your HTML <head>.');
}

// Initialize the Supabase Client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export standard helper functions to be used by the rest of the app
const SupabaseClient = {

    // --- AUTHENTICATION ---

    // Login with Email and Password
    async login(email, password) {
        try {
            const { data, error } = await _supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) return { success: false, error: error.message };
            return { success: true, session: data.session, user: data.user };
        } catch (e) {
            console.error("Login exception:", e);
            return { success: false, error: "Network or unexpected error during login." };
        }
    },

    // Logout
    async logout() {
        try {
            const { error } = await _supabase.auth.signOut();
            if (error) console.error('Logout failed:', error);
            else window.location.reload();
        } catch (e) {
            console.error("Logout exception:", e);
        }
    },

    // Get Current Session (Safe)
    async changePassword(newPassword) {
        try {
            const { data, error } = await this.client.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return { success: true };
        } catch (e) {
            console.error("Password Update Error:", e);
            return { success: false, error: e.message };
        }
    },

    async getSession() {
        try {
            const { data, error } = await _supabase.auth.getSession();
            if (error) {
                console.warn("Session check error:", error);
                return null;
            }
            return data.session;
        } catch (e) {
            console.error("Session check exception:", e);
            return null;
        }
    },

    // Require Session (Strict)
    // Throws error or redirects if not authenticated. 
    // Usage: await SupabaseClient.requireSession();
    async requireSession() {
        const session = await this.getSession();
        if (!session) {
            throw new Error("User not authenticated");
        }
        return session;
    },

    // --- HOMEPAGE CONFIGURATION ---

    // Load Homepage Config
    async getHomepageConfig() {
        try {
            const { data, error } = await _supabase
                .from('homepage_config')
                .select('config')
                .eq('id', 'global_config_v1') // Fixed ID to match plan
                .single();

            if (error) {
                // If "PGRST116" error (0 rows), it means no config exists yet. Return null to use default.
                if (error.code === 'PGRST116') return null;
                console.error('Error fetching homepage config:', error);
                return null;
            }
            return data?.config;
        } catch (err) {
            console.error('Unexpected error fetching config:', err);
            return null;
        }
    },

    // Save Homepage Config
    async saveHomepageConfig(config) {
        try {
            const { error } = await _supabase
                .from('homepage_config')
                .upsert({ id: 'global_config_v1', config: config, updated_at: new Date() }); // Fixed ID

            if (error) throw error;
            await this.logAudit('HOMEPAGE_UPDATE', 'Updated homepage layout and content');
            return true;
        } catch (e) {
            console.error("Save config error:", e);
            throw e; // Re-throw for UI to handle
        }
    },

    // --- BLOG POSTS ---

    async getBlogPosts(includeDeleted = false) {
        try {
            let query = _supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (!includeDeleted) {
                query = query.eq('deleted', false);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Error fetching blogs:', error);
                return [];
            }
            return data;
        } catch (e) {
            console.error("Get posts exception:", e);
            return [];
        }
    },

    async saveBlogPost(post) {
        try {
            // If ID is present, use Upsert. If null, use Insert (let DB gen UUID)
            let result;
            if (post.id) {
                result = await _supabase.from('blog_posts').upsert({
                    id: post.id,
                    title: post.title,
                    excerpt: post.excerpt,
                    content: post.content,
                    image: post.image,
                    tags: post.tags || [],
                    deleted: post.deleted || false,
                    updated_at: new Date()
                });
            } else {
                // New Post -> Insert
                // We exclude 'id' so DB generates default
                result = await _supabase.from('blog_posts').insert({
                    title: post.title,
                    excerpt: post.excerpt,
                    content: post.content,
                    image: post.image,
                    tags: post.tags || [],
                    deleted: post.deleted || false,
                    updated_at: new Date()
                });
            }

            if (result.error) throw result.error;
            await this.logAudit('POST_SAVE', `Saved blog post: ${post.title}`);
            return true;
        } catch (e) {
            console.error("Save post exception:", e);
            throw e;
        }
    },

    async deleteBlogPost(id) {
        try {
            // Soft Delete
            const { error } = await _supabase
                .from('blog_posts')
                .update({ deleted: true, updated_at: new Date() })
                .eq('id', id);

            if (error) throw error;
            await this.logAudit('POST_DELETE', `Soft deleted post ID: ${id}`);
            return true;
        } catch (e) {
            console.error("Delete post exception:", e);
            throw e;
        }
    },

    // --- AUDIT LOGS ---

    async logAudit(eventType, description) {
        try {
            const user = (await _supabase.auth.getUser()).data.user;
            const actor = user ? user.email : 'system';

            await _supabase
                .from('audit_logs')
                .insert({
                    event_type: eventType,
                    actor: actor,
                    description: description
                });
        } catch (e) {
            console.error("Audit log failure (non-critical):", e);
        }
    },

    async getAuditLogs() {
        try {
            const { data, error } = await _supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching logs:', error);
                return [];
            }
            return data;
        } catch (e) {
            console.error("Get audit logs exception:", e);
            return [];
        }
    }
};

// Expose globally for easy specific access in existing scripts
window.SupabaseClient = SupabaseClient;
