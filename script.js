// Trend-AI - Core AI News Engine
const SITE_NAME = "Trend-AI";
const SITE_TAGLINE = "Intelligence Optimized";

class TrendAI {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentCategory = 'All Feed';
        this.init();
    }

    async init() {
        this.setupSearch();
        this.setupTheme();
        this.setupNewsletter();
        this.initLightbox();

        try {
            const response = await fetch('./posts.json?v=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    this.posts = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                    this.filteredPosts = [...this.posts];
                }
            }
        } catch (e) {
            console.error("Failed to load posts", e);
        }

        this.renderCategories();
        this.renderFooterCategories();
        this.renderTrendingSidebar();
        this.renderFeed();
        this.handleRouting();

        window.onpopstate = () => this.handleRouting();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        searchInput.oninput = (e) => this.handleSearch(e.target.value);
    }

    setupTheme() {
        const toggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.className = savedTheme;

        toggle.onclick = () => {
            const current = document.documentElement.className;
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.className = next;
            localStorage.setItem('theme', next);
        };
    }

    setupNewsletter() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;
        form.onsubmit = (e) => {
            e.preventDefault();
            this.handleNewsletter();
        };
    }

    async handleNewsletter() {
        const email = document.getElementById('newsletterEmail').value;
        const msg = document.getElementById('newsletterMessage');
        const btn = document.getElementById('newsletterSubmit');
        const originalText = btn.textContent;

        btn.disabled = true;
        btn.textContent = 'Joining...';
        msg.classList.remove('hidden');

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            msg.textContent = 'Welcome! You are on the list.';
            msg.className = 'newsletter-message success';
            btn.textContent = 'Success!';
            localStorage.setItem('isSubscribed', 'true');
            setTimeout(() => {
                document.getElementById('newsletterEmail').disabled = true;
                btn.textContent = 'Subscribed';
            }, 2000);
        } catch (error) {
            msg.textContent = 'Error. Please try again.';
            msg.className = 'newsletter-message error';
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    handleRouting() {
        const params = new URLSearchParams(window.location.search);
        const file = params.get('file');
        if (file) {
            this.showPost(file);
        } else {
            this.showFeed();
        }
    }

    renderTrendingSidebar() {
        const list = document.getElementById('trendingPostsList');
        if (!list) return;
        const trending = this.posts.filter(p => p.trending).slice(0, 5);
        const displayList = trending.length > 0 ? trending : this.posts.slice(0, 5);

        list.innerHTML = displayList.map((post, index) => `
            <div class="trending-item" onclick="app.navigateToPost('${post.file}')">
                <span class="trending-num">0${index + 1}</span>
                <div class="trending-item-content">
                    <h4>${post.title}</h4>
                    <span>${post.category} • ${post.date}</span>
                </div>
            </div>
        `).join('');
    }

    renderCategories() {
        const categories = ['All Feed', ...new Set(this.posts.map(p => p.category))];
        const bar = document.getElementById('categoryBar');
        bar.innerHTML = categories.map(cat => `
            <button class="cat-btn ${cat === this.currentCategory ? 'active' : ''}" 
                    onclick="app.filterByCategory('${cat}')">${cat}</button>
        `).join('');
    }

    renderFooterCategories() {
        const categories = [...new Set(this.posts.map(p => p.category))];
        const list = document.getElementById('footerCategories');
        if (!list) return;
        
        list.innerHTML = `
            <li><a href="#" onclick="app.showFeed(); return false;">Latest Insights</a></li>
            ${categories.map(cat => `
                <li><a href="#" onclick="app.filterByCategory('${cat}'); return false;">${cat}</a></li>
            `).join('')}
        `;
    }

    showPolicy(type) {
        const modal = document.getElementById('policyModal');
        const body = document.getElementById('modalBody');
        const content = {
            privacy: `<h2>Privacy Policy</h2><p>At Trend-AI, we take your privacy seriously. We only collect your email for the newsletter and never share it with third parties. We use industry-standard encryption to protect your data.</p>`,
            terms: `<h2>Terms of Service</h2><p>By using Trend-AI, you agree to our terms. All content is for informational purposes only. We do not provide financial or legal advice. AI trends evolve rapidly; always verify critical information.</p>`,
            editorial: `<h2>Editorial Guidelines</h2><p>Our mission is to provide high-signal, objective reporting on AI breakthroughs. Every article is reviewed by our editorial team for technical accuracy and clarity before publication.</p>`
        };
        
        body.innerHTML = content[type] || 'Content not found.';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('policyModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.renderCategories();
        this.filteredPosts = category === 'All Feed'
            ? [...this.posts]
            : this.posts.filter(p => p.category === category);
        this.renderFeed();
    }

    handleSearch(query) {
        const q = query.toLowerCase();
        this.filteredPosts = this.posts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
        this.renderFeed();
    }

    renderFeed() {
        const grid = document.getElementById('postsGrid');
        const featured = document.getElementById('featuredPost');

        if (this.filteredPosts.length === 0) {
            grid.innerHTML = '<div class="loader">No insights found matching your criteria.</div>';
            featured.innerHTML = '';
            return;
        }

        const showFeatured = this.currentCategory === 'All Feed' && !document.getElementById('searchInput').value;

        if (showFeatured && this.filteredPosts.length > 0) {
            const top = this.filteredPosts[0];
            const others = this.filteredPosts.slice(1);

            featured.innerHTML = `
                <div class="featured-card" onclick="app.navigateToPost('${top.file}')">
                    <div class="featured-image" style="background-image: url('${top.image}')"></div>
                    <div class="featured-info">
                        <span class="post-tag">${top.category}</span>
                        <h1>${top.title}</h1>
                        <p class="post-excerpt">${top.description}</p>
                        <div class="post-meta">
                            <span>By ${top.author}</span>
                            <span>•</span>
                            <span>${top.date}</span>
                        </div>
                    </div>
                </div>
            `;

            grid.innerHTML = others.map(post => this.createPostCard(post)).join('');
        } else {
            featured.innerHTML = '';
            grid.innerHTML = this.filteredPosts.map(post => this.createPostCard(post)).join('');
        }
    }

    createPostCard(post) {
        return `
            <div class="post-card" onclick="app.navigateToPost('${post.file}')">
                <div class="post-card-image" style="background-image: url('${post.image}')"></div>
                <div class="post-card-content">
                    <span class="post-tag">${post.category}</span>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.description}</p>
                    <div class="post-meta">
                        <span>${post.date}</span>
                    </div>
                </div>
            </div>
        `;
    }

    navigateToPost(file) {
        window.history.pushState({}, '', `?file=${file}`);
        this.showPost(file);
    }

    updateMeta(data) {
        document.title = data.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.description);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', data.title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', data.description);
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', data.url);
        if (data.image) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) ogImage.setAttribute('content', data.image);
        }

        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', data.url);

        const structuredData = document.getElementById('structuredData');
        if (structuredData) {
            const schema = data.isArticle ? {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": data.title,
                "image": [data.image],
                "datePublished": data.date,
                "author": [{ "@type": "Person", "name": data.author }]
            } : {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": SITE_NAME,
                "url": data.url
            };
            structuredData.textContent = JSON.stringify(schema);
        }
    }

    showFeed() {
        document.getElementById('feedView').classList.remove('hidden');
        document.getElementById('postView').classList.add('hidden');
        window.scrollTo(0, 0);
        this.updateMeta({
            title: `${SITE_NAME} | ${SITE_TAGLINE}`,
            description: 'Discover the latest trends in Artificial Intelligence at Trend-AI.',
            url: window.location.origin
        });
    }

    async showPost(file) {
        const post = this.posts.find(p => p.file === file);
        if (!post) return this.showFeed();

        this.updateMeta({
            title: `${post.title} | ${SITE_NAME}`,
            description: post.description,
            image: post.image,
            url: window.location.href,
            author: post.author,
            date: post.date,
            isArticle: true
        });

        document.getElementById('feedView').classList.add('hidden');
        document.getElementById('postView').classList.remove('hidden');
        window.scrollTo(0, 0);

        document.getElementById('postHeader').innerHTML = `
        <div class="post-header-tag">${post.category}</div>
        <h1 class="post-title-main">${post.title}</h1>
        <div class="post-header-meta">
            <div class="author-info">
                <span class="author-name">By ${post.author}</span>
                <span class="meta-dot">•</span>
                <span class="post-date">${post.date}</span>
            </div>
            <div id="readTime" class="reading-time"></div>
        </div>
    `;

        document.getElementById('postHero').innerHTML = `
        <img src="${post.image}" class="post-hero-img article-img" alt="${post.title}">
    `;

        this.setupSocialShare(post);

        const body = document.getElementById('postBody');
        body.innerHTML = '<div class="loader">Unfolding the future...</div>';

        try {
            let content = '';

            // ✅ TRY TO FETCH FULL MARKDOWN FILE
            const response = await fetch(`./posts/${file}`);

            if (response.ok) {
                content = await response.text();  // FULL ARTICLE HERE
            } else {
                // fallback if file not found
                content = `## ${post.title}\n\n${post.description}`;
            }

            // ✅ Strip YAML frontmatter if present
            content = content.replace(/^---\n[\s\S]*?\n---\n*/, '');

            // ✅ Convert markdown to HTML
            const htmlContent = (window.marked && window.marked.parse)
                ? marked.parse(content)
                : `<p>${content.replace(/\n/g, '<br>')}</p>`;

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // ✅ Add IDs for TOC
            tempDiv.querySelectorAll('h2, h3').forEach(header => {
                header.id = header.innerText.toLowerCase().replace(/[^\w]+/g, '-');
            });

            body.innerHTML = tempDiv.innerHTML;

            // ✅ Accurate read time (NOW FULL CONTENT)
            this.calculateReadTime(content);

            this.generateToC(tempDiv);
            this.initLightbox();

            if (window.Prism) Prism.highlightAll();

        } catch (error) {
            body.innerHTML = `<p>${post.description}</p>`;
        }

        this.renderRelatedPosts(post);
        window.dispatchEvent(new Event('scroll'));
    }

    calculateReadTime(text) {
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        document.getElementById('readTime').innerHTML = `
            <svg style="vertical-align: middle; margin-right: 5px" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${minutes} min read
        `;
    }

    generateToC(tempDiv) {
        const tocList = document.getElementById('tocList');
        const headers = tempDiv.querySelectorAll('h2, h3');
        if (headers.length < 2) {
            document.getElementById('tocContainer').style.display = 'none';
            return;
        }
        document.getElementById('tocContainer').style.display = 'block';
        tocList.innerHTML = Array.from(headers).map(header => `
            <a href="#${header.id}" class="toc-link" style="margin-left: ${header.tagName === 'H3' ? '15px' : '0'}">${header.innerText}</a>
        `).join('');
        tocList.querySelectorAll('.toc-link').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const target = document.getElementById(link.getAttribute('href').substring(1));
                window.scrollTo({ top: target.offsetTop - 100, behavior: 'smooth' });
            };
        });
    }

    setupSocialShare(post) {
        const shareButtons = document.getElementById('shareButtons');
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(post.title);
        const platforms = [
            { name: 'X', icon: '<path d="M4 4l11.733 16h4.267l-11.733 -16zM4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>', url: `https://twitter.com/intent/tweet?text=${title}&url=${url}` },
            { name: 'LinkedIn', icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>', url: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}` },
            { name: 'WhatsApp', icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>', url: `https://api.whatsapp.com/send?text=${title}%20${url}` },
            { name: 'Link', icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>', action: 'copy' }
        ];
        shareButtons.innerHTML = platforms.map(p => `<button class="share-btn" data-action="${p.action || ''}" data-url="${p.url || ''}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.icon}</svg></button>`).join('');
        shareButtons.querySelectorAll('.share-btn').forEach(btn => {
            btn.onclick = () => {
                if (btn.dataset.action === 'copy') {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        const originalSvg = btn.innerHTML;
                        btn.innerHTML = '✓';
                        setTimeout(() => btn.innerHTML = originalSvg, 2000);
                    });
                } else {
                    window.open(btn.dataset.url, '_blank');
                }
            };
        });
    }

    initLightbox() {
        const images = document.querySelectorAll('.post-body img, .post-hero-img');
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const close = document.querySelector('.lightbox-close');
        if (!lightbox) return;
        images.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.onclick = () => { lightbox.style.display = "flex"; lightboxImg.src = img.src; };
        });
        close.onclick = () => lightbox.style.display = "none";
        lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.style.display = "none"; };
    }

    renderRelatedPosts(currentPost) {
        const relatedGrid = document.getElementById('relatedPostsGrid');
        const related = this.posts.filter(p => p.category === currentPost.category && p.file !== currentPost.file).slice(0, 3);
        const display = related.length > 0 ? related : this.posts.filter(p => p.file !== currentPost.file).slice(0, 3);
        relatedGrid.innerHTML = display.map(post => this.createPostCard(post)).join('');
    }
}

const scrollHandler = () => {
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    bar.style.width = scrolled + "%";
    document.getElementById('scrollProgress').style.opacity = winScroll > 100 ? 1 : 0;
};

window.addEventListener('scroll', scrollHandler);

window.app = new TrendAI();
