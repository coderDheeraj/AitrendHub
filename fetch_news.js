import fs from 'fs';
import Parser from 'rss-parser';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const parser = new Parser();
const SOURCE_FEEDS = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' }
];

const CATEGORY_MAP = {
    'ai': 'Technology',
    'robot': 'Robotics',
    'coding': 'Development',
    'money': 'Finance',
    'bitcoin': 'Finance',
    'education': 'Education',
    'learn': 'Education',
    'startup': 'Innovation',
    'future': 'Innovation',
    'gaming': 'Gaming',
    'game': 'Gaming'
};

const IMAGE_POOLS = {
    'Technology': [
        'photo-1485827404703-89b55fcc595e',
        'photo-1518770660439-4636190af475',
        'photo-1550741164-12eb0bb47036',
        'photo-1451187580459-43490279c0fa'
    ],
    'Robotics': [
        'photo-1546776310-eef45dd6d63c',
        'photo-1581094ddaf9e-01584b47c6ce',
        'photo-1531746020748-7ce707a74759'
    ],
    'Development': [
        'photo-1498050108023-c5249f4df085',
        'photo-1461749280644-62e3ba5c7b7a',
        'photo-1517694712202-14dd9538aa97'
    ],
    'Finance': [
        'photo-1611162617213-7d7a39e9b1d7',
        'photo-1561414927177-36e537d46f34',
        'photo-1518186414732-d8a9a2aa5f12'
    ],
    'Education': [
        'photo-1523240795612-9a054b0db644',
        'photo-1501503069356-3c6b82a17d89',
        'photo-1497633762265-9d179a990aa6'
    ],
    'Innovation': [
        'photo-1485827404703-89b55fcc595e',
        'photo-1519389950473-47ba0277781c',
        'photo-1496171367470-9ed9a91ea931'
    ],
    'General': [
        'photo-1620712943543-bcc4688e7485',
        'photo-1518770660439-4636190af475',
        'photo-1451187580459-43490279c0fa'
    ]
};

const POSTS_JSON_PATH = path.resolve('public/posts.json');
const POSTS_DIR = path.resolve('public/posts');

const slugify = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

function getRandomImage(category) {
    const pool = IMAGE_POOLS[category] || IMAGE_POOLS['General'];
    const id = pool[Math.floor(Math.random() * pool.length)];
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;
}

async function scrapeFullContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const html = await response.text();
        const $ = cheerio.load(html);
        let paragraphs = $('.entry-content p, .article-body p, .article-content p, .c-entry-content p')
            .map((i, el) => $(el).text().trim())
            .get()
            .filter(p => p.length > 50); 
        return paragraphs.length > 0 ? paragraphs : null;
    } catch (e) {
        return null;
    }
}

function freshenText(paragraphs) {
    const synonyms = {
        'startup': ['venture', 'emerging player', 'new entrant', 'innovator'],
        'launched': ['unveiled', 'debuted', 'introduced', 'rolled out'],
        'valuation': ['market standing', 'estimated worth', 'funding cap'],
        'says': ['reports', 'highlights', 'indicates', 'points out'],
        'AI': ['artificial intelligence', 'intelligent systems', 'autonomous tech'],
        'future': ['upcoming horizon', 'next chapter', 'roadmap'],
        'tool': ['solution', 'platform', 'engine'],
        'company': ['enterprise', 'organization', 'firm']
    };

    return paragraphs.map((p, i) => {
        let text = p;
        for (const [word, replacements] of Object.entries(synonyms)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            text = text.replace(regex, () => replacements[Math.floor(Math.random() * replacements.length)]);
        }
        const connectors = [
            "What we're seeing here is",
            "Looking closer at the details,",
            "It's interesting to note that",
            "Furthermore, the industry expects that",
            "This suggests a broader shift where"
        ];
        if (i > 0 && Math.random() > 0.4) {
            text = connectors[Math.floor(Math.random() * connectors.length)] + " " + text.charAt(0).toLowerCase() + text.slice(1);
        }
        return text;
    });
}

async function automate() {
    console.log("🚀 Initializing Premium News Synthesis Engine...");
    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

    let allItems = [];
    for (const feed of SOURCE_FEEDS) {
        try {
            console.log(`📡 Scan: ${feed.name}...`);
            const data = await parser.parseURL(feed.url);
            allItems.push(...data.items);
        } catch (e) {
            console.warn(`⚠️  Source ${feed.name} unavailable.`);
        }
    }
    
    if (allItems.length === 0) return console.error("❌ No signals detected.");

    const latest = allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 10);
    let posts = fs.existsSync(POSTS_JSON_PATH) ? JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8')) : [];
    const existingSlugs = new Set(posts.map(p => slugify(p.title)));
    let count = 0;

    for (const item of latest) {
        if (count >= 3) break;
        if (existingSlugs.has(slugify(item.title))) continue;

        console.log(`🔎 Analyzing: ${item.title}...`);
        const fullBody = await scrapeFullContent(item.link);
        if (!fullBody || fullBody.length < 3) continue;

        const freshBody = freshenText(fullBody);
        const id = Date.now() + Math.round(Math.random() * 1000);
        const filename = `deep_${id}.md`;
        const date = new Date(item.pubDate).toISOString().split('T')[0];
        
        let category = 'Technology';
        const combinedText = (item.title + " " + fullBody.slice(0, 3).join(" ")).toLowerCase();
        for (const [key, val] of Object.entries(CATEGORY_MAP)) {
            if (combinedText.includes(key)) {
                category = val;
                break;
            }
        }

        const image = getRandomImage(category);
        const description = fullBody[0].substring(0, 160) + "...";

        const mdContent = `${freshBody.slice(0, 6).join('\n\n')}

---
*Deep Tech Intelligence Insight for AITrendHub*
`;

        fs.writeFileSync(path.join(POSTS_DIR, filename), mdContent);
        posts.unshift({
            id, file: filename, title: item.title, category, date,
            author: "AITrendHub Editorial", image, description, trending: true
        });
        count++;
        console.log(`✅ SYNTHESIZED: ${item.title}`);
    }

    if (count > 0) {
        fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(posts.slice(0, 20), null, 4));
        console.log(`✨ Successfully published ${count} deep-dive articles.`);
    } else {
        console.log("😴 No new signals to process.");
    }
}

automate();
