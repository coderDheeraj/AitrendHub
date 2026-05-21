const SUPABASE_URL = 'https://jierujvzuqbzeckajmdk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXJ1anZ6dXFiemVja2FqbWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTYxNjQsImV4cCI6MjA5Mzk3MjE2NH0.-XHTpLynRs1AIRJkoDV2KjC-k_GgkIQyTikZqIMAWUA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.sb = supabaseClient;

async function fetchTools(limit = 12, offset = 0) {
    const { data, error, count } = await window.sb
        .from('ai_tools')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
    if (error) {
        console.error('Error fetching tools:', error);
        return { tools: [], count: 0 };
    }
    return { tools: data, count };
}

async function fetchPosts(category = 'All Feed', limit = 10, offset = 0) {
    let query = window.sb.from('posts').select('*', { count: 'exact' }).order('date', { ascending: false });
    
    if (category !== 'All Feed') {
        query = query.eq('category', category);
    }
    
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    
    if (error) {
        console.error('Error fetching posts:', error);
        return { posts: [], count: 0 };
    }
    return { posts: data, count };
}

async function fetchTrendingPosts(limit = 5) {
    const { data, error } = await window.sb.from('posts').select('*').eq('trending', true).limit(limit).order('date', { ascending: false });
    if (error) {
        console.error('Error fetching trending posts:', error);
        return [];
    }
    // If no trending posts, get latest
    if (data.length === 0) {
        const { data: latest } = await window.sb.from('posts').select('*').limit(limit).order('date', { ascending: false });
        return latest || [];
    }
    return data;
}

async function fetchPostBySlug(slug) {
    const { data, error } = await window.sb.from('posts').select('*').eq('slug', slug).single();
    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }
    return data;
}

window.supabaseAPI = {
    fetchTools,
    fetchPosts,
    fetchTrendingPosts,
    fetchPostBySlug
};
