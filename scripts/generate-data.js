import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), '_posts');
const pagesDir = path.join(process.cwd(), '_pages');
const publicPostsDir = path.join(process.cwd(), 'public', 'posts');
const publicPagesDir = path.join(process.cwd(), 'public', 'pages');
const postsJsonPath = path.join(process.cwd(), 'public', 'posts.json');
const pagesJsonPath = path.join(process.cwd(), 'public', 'pages.json');

// Ensure directories exist
[publicPostsDir, publicPagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function parseFrontMatter(content) {
    const fmMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/);
    if (!fmMatch) return { data: {}, content };
    
    const fmText = fmMatch[1];
    const data = {};
    fmText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            let value = valueParts.join(':').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            data[key.trim()] = value;
        }
    });
    
    return { data, content: content.slice(fmMatch[0].length).trim() };
}

function syncData(dir, publicDir, outputPath, isPost = true) {
    console.log(`--- Syncing ${isPost ? 'Posts' : 'Pages'} Data ---`);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir);
    const resultData = [];

    files.forEach(file => {
        if (!file.endsWith('.md')) return;

        const fullPath = path.join(dir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const { data } = parseFrontMatter(content);

        if (data.title) {
            const entry = {
                file: file,
                slug: file.replace('.md', ''),
                title: data.title,
                description: data.description || '',
                ...data
            };
            
            if (isPost) {
                entry.id = data.id || Date.now() + Math.random();
                entry.category = data.category || 'General';
                entry.date = data.date || new Date().toISOString().split('T')[0];
                entry.author = data.author || 'Trend-AI Editorial';
                entry.image = data.image || '';
                entry.trending = data.trending === true || data.trending === 'true';
            }

            resultData.push(entry);
            fs.copyFileSync(fullPath, path.join(publicDir, file));
        }
    });

    if (isPost) resultData.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 4));
    console.log(`Successfully synced ${resultData.length} ${isPost ? 'posts' : 'pages'}`);
}

try {
    syncData(postsDir, publicPostsDir, postsJsonPath, true);
    syncData(pagesDir, publicPagesDir, pagesJsonPath, false);
} catch (error) {
    console.error('Error syncing data:', error);
}
