// js/blog-data.js
// ADAPTER: Bridging Admin UI to Supabase Client
// This file replaces the old localStorage logic with calls to window.SupabaseClient

// --- AUTHENTICATION ---
// Used by Admin Login Page
async function authenticate(email, password) {
    if (!window.SupabaseClient) return { success: false, error: 'Supabase Client Not Loaded' };

    const result = await window.SupabaseClient.login(email, password);
    if (result.success) {
        // Store session in memory or let Supabase handle it (Supabase handles auto-refresh)
        return { success: true, session: result.session, user: result.user };
    } else {
        return { success: false, error: result.error };
    }
}

// Check if user is logged in (Session Validity)
async function verifySession(session) {
    if (!window.SupabaseClient) return false;
    // Current SDK handles session check better
    const currentSession = await window.SupabaseClient.getSession();
    return !!currentSession;
}

// --- BLOG POSTS ---

// Get all posts (wrapper)
async function getBlogPosts(includeDeleted = false) {
    if (!window.SupabaseClient) return [];
    return await window.SupabaseClient.getBlogPosts(includeDeleted);
}

// Get single post by ID (helper for UI)
async function getBlogPostById(id) {
    const posts = await getBlogPosts(true);
    return posts.find(p => p.id === id);
}

// Save post
async function saveBlogPost(post) {
    // Adapter: Old UI passed synchronous errors sometimes.
    // We validate locally first if needed, but SupabaseClient handles upsert.
    if (!post.title) throw new Error("Title required");

    await window.SupabaseClient.saveBlogPost(post);
    // No return needed if success, UI expects void or simple completion
}

// Delete Post
async function deleteBlogPost(id, actor) {
    await window.SupabaseClient.deleteBlogPost(id);
}

// --- HOMEPAGE CONFIG ---

async function getHomepageConfig() {
    if (!window.SupabaseClient) {
        console.warn("Supabase Client not available.");
        return null;
    }
    const data = await window.SupabaseClient.getHomepageConfig();
    return data;
}

async function saveHomepageConfig(config, actor) {
    await window.SupabaseClient.saveHomepageConfig(config);
}

// Reset not efficiently supported in Cloud without a "Template", 
// we can implement a hard reset if needed, but for now we skip or log warning.
async function resetHomepageConfig(actor) {
    alert("Reset to default is not fully supported in Cloud mode yet. Please edit manually.");
}

// --- AUDIT LOGS ---

async function getAuditLogs() {
    if (!window.SupabaseClient) return [];
    return await window.SupabaseClient.getAuditLogs();
}

// We expose this for UI rendering
// Note: The UI functions (renderAuditLogs, showList, etc.) in admin.html
// likely call these synchronously or expect immediate returns.
// WE MUST CHECK ADMIN.HTML to ensure it handles ASYNC/AWAIT.
// If admin.html calls `const posts = getBlogPosts(); render(posts)`, we will have a bug
// because `getBlogPosts` now returns a Promise.
// --- ADMIN MANAGEMENT ---

// Client-side simulation or restricted access
// --- ADMIN MANAGEMENT ---
// Removed: User management is now handled via Supabase Auth Console, not client-side.
// If needed, we can implement a Cloud Function, but for this portfolio site, manual auth management is safer.
async function getAllAdmins() {
    return []; // Return empty or basic placeholder if anything still calls it
}

// --- EXPORTS ---
// Explicitly expose to window to ensure admin.html can find them
window.authenticate = authenticate;
window.verifySession = verifySession;
window.getBlogPosts = getBlogPosts;
window.getBlogPostById = getBlogPostById;
window.saveBlogPost = saveBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.getHomepageConfig = getHomepageConfig;
window.saveHomepageConfig = saveHomepageConfig;
window.resetHomepageConfig = resetHomepageConfig;
window.getAuditLogs = getAuditLogs;
window.getAllAdmins = getAllAdmins; // Kept for generic usage if needed
window.addAdmin = addAdmin;
window.deleteAdmin = deleteAdmin;
window.unlockAdmin = unlockAdmin;
window.resetAdminPassword = resetAdminPassword;
