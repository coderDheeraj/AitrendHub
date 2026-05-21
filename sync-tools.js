const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUltimateList() {
    console.log('🚀 Starting ULTIMATE AI Tools Sync...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('🌐 Navigating to Ultimate List (Large Page)...');
        await page.goto('https://www.aixploria.com/en/ultimate-list-ai/', { 
            waitUntil: 'domcontentloaded',
            timeout: 120000 
        });

        console.log('📜 Scrolling to load all 4,000+ tools (this takes ~30s)...');
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 800;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight || totalHeight > 50000) { // Limit for safety
                        clearInterval(timer);
                        resolve();
                    }
                }, 200);
            });
        });

        console.log('📂 Parsing categories (Flexible Mode)...');
        const categories = await page.evaluate(() => {
            // Try different possible container selectors
            let blocks = document.querySelectorAll('.aix-category-block');
            
            // Fallback: If no category blocks, look for any headings followed by lists
            if (blocks.length === 0) {
                console.log('Using fallback parsing logic...');
                const content = document.querySelector('.entry-content');
                if (!content) return [];
                
                // Group by headings if the blocks are missing
                const headings = content.querySelectorAll('h2, h3, .aix-family-title');
                return Array.from(headings).map(h => {
                    const catName = h.innerText.trim();
                    const nextEl = h.nextElementSibling;
                    const toolLinks = nextEl ? nextEl.querySelectorAll('a.hourly-tooltip') : [];
                    
                    const tools = Array.from(toolLinks).map(link => {
                        const pricingId = link.id || '';
                        let pricing = 'Freemium';
                        if (pricingId.includes('Gratuit')) pricing = 'Free';
                        else if (pricingId.includes('Payant')) pricing = 'Paid';
                        
                        return {
                            name: link.innerText.trim(),
                            url: link.href,
                            pricing,
                            image: ''
                        };
                    });
                    return { catName, tools };
                });
            }

            return Array.from(blocks).map(block => {
                const titleEl = block.querySelector('a[href*="/category/"], h2, h3, strong');
                const catName = titleEl ? titleEl.innerText.trim() : 'AI Tools';
                
                const toolEntries = block.querySelectorAll('a.hourly-tooltip, .aix_ph-name a');
                const tools = Array.from(toolEntries).map(link => {
                    const parent = link.closest('div, li, .aix_ph-item') || link.parentElement;
                    const externalLink = parent.querySelector('a.site-review2') || link;

                    return {
                        name: link.innerText.trim(),
                        url: externalLink.href,
                        pricing: 'Freemium', // Default
                        image: ''
                    };
                });

                return { catName, tools };
            });
        });

        console.log(`🔍 Found ${categories.length} categories. Starting Database Sync...`);

        for (const cat of categories) {
            if (cat.tools.length === 0) continue;
            console.log(`📁 Category: ${cat.catName} (${cat.tools.length} tools)`);
            
            for (const tool of cat.tools) {
                const { error } = await supabase.from('ai_tools').upsert({
                    name: tool.name,
                    url: tool.url,
                    description: `Featured AI tool in the ${cat.catName} collection.`,
                    image: tool.image,
                    category: cat.catName,
                    pricing: tool.pricing
                }, { onConflict: 'name' });
                
                if (!error) process.stdout.write('.'); // Tiny dot for progress
            }
            console.log('\n✅ Category complete.');
        }

    } catch (error) {
        console.error('❌ Sync failed:', error);
        await page.screenshot({ path: 'debug_error.png' });
    } finally {
        await browser.close();
        console.log('🏁 Ultimate Sync Finished!');
    }
}

syncUltimateList();
