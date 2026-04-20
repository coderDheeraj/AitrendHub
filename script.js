// Trend-AI - Core AI News Engine (Vite-Native Automation)
const SITE_NAME = "Trend-AI";
const SITE_TAGLINE = "Intelligence Optimized";

class TrendAI {
    constructor() {
        this.posts = [];
        this.pages = [];
        this.filteredPosts = [];
        this.currentCategory = 'All Feed';
        this.currentPage = 1;
        this.postsPerPage = 9;
        this.init();
    }

    async init() {
        if (window.marked) {
            marked.setOptions({
                gfm: true,
                breaks: true,
                headerIds: true,
                mangle: false
            });
        }
        this.setupSearch();
        this.setupTheme();
        this.setupNewsletter();
        this.initLightbox();

        try {
            // Works on both GitHub Pages (/AitrendHub/) and custom domain (/)
            const basePath = window.location.pathname.startsWith('/AitrendHub') ? '/AitrendHub/' : '/';
            const [postsRes, pagesRes] = await Promise.all([
                fetch(basePath + 'posts.json?v=' + Date.now()),
                fetch(basePath + 'pages.json?v=' + Date.now())
            ]);

            if (postsRes.ok) {
                const data = await postsRes.json();
                this.posts = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                this.filteredPosts = [...this.posts];
            }
            if (pagesRes.ok) {
                this.pages = await pagesRes.json();
            }
        } catch (e) {
            console.error("Failed to load content", e);
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
        const page = params.get('page');
        
        if (file) {
            this.showPost(file);
        } else if (page) {
            this.showPage(page);
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
        if (!bar) return;
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
        
        if (body) body.innerHTML = content[type] || 'Content not found.';
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('policyModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.renderCategories();
        this.filteredPosts = category === 'All Feed'
            ? [...this.posts]
            : this.posts.filter(p => p.category === category);
        this.renderFeed();
    }

    handleSearch(query) {
        const q = query.toLowerCase();
        this.currentPage = 1;
        this.filteredPosts = this.posts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
        this.renderFeed();
    }

    renderFeed() {
        const grid = document.getElementById('postsGrid');
        const featured = document.getElementById('featuredPost');
        if (!grid || !featured) return;

        if (this.filteredPosts.length === 0) {
            grid.innerHTML = '<div class="loader">No insights found matching your criteria.</div>';
            featured.innerHTML = '';
            return;
        }

        const showFeatured = this.currentCategory === 'All Feed' && !document.getElementById('searchInput').value && this.currentPage === 1;

        let postsToDisplay = [...this.filteredPosts];
        
        if (showFeatured) {
            const top = postsToDisplay[0];
            postsToDisplay = postsToDisplay.slice(1);
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
        } else {
            featured.innerHTML = '';
        }

        // Pagination Logic
        const start = (this.currentPage - 1) * this.postsPerPage;
        const end = start + this.postsPerPage;
        const pagePosts = postsToDisplay.slice(start, end);

        grid.innerHTML = pagePosts.map(post => this.createPostCard(post)).join('');
        this.renderPagination(postsToDisplay.length);
    }

    renderPagination(totalPosts) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(totalPosts / this.postsPerPage);
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `
            <button class="pagination-item ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="app.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="pagination-item ${i === this.currentPage ? 'active' : ''}" 
                        onclick="app.changePage(${i})">${i}</button>
            `;
        }

        html += `
            <button class="pagination-item ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="app.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>
        `;

        pagination.innerHTML = html;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderFeed();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    navigateToFeed() {
        window.history.pushState({}, '', window.location.pathname);
        this.showFeed();
    }

    navigateToPage(slug) {
        window.history.pushState({}, '', `?page=${slug}`);
        this.showPage(slug);
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
    }

    showFeed() {
        document.getElementById('feedView').classList.remove('hidden');
        document.getElementById('postView').classList.add('hidden');
        this.currentCategory = 'All Feed';
        this.renderCategories();
        window.scrollTo(0, 0);
        this.updateMeta({
            title: `${SITE_NAME} | ${SITE_TAGLINE}`,
            description: 'Discover the latest trends in Artificial Intelligence at Trend-AI.',
            url: window.location.origin
        });
    }

    async showPage(slug) {
        const page = this.pages.find(p => p.slug === slug);
        if (!page) return this.showFeed();

        this.updateMeta({
            title: `${page.title} | ${SITE_NAME}`,
            description: page.description,
            url: window.location.href
        });

        const feedView = document.getElementById('feedView');
        const postView = document.getElementById('postView');
        if (feedView) feedView.classList.add('hidden');
        if (postView) postView.classList.remove('hidden');
        window.scrollTo(0, 0);

        const header = document.getElementById('postHeader');
        if (header) {
            header.innerHTML = `
                <h1 class="post-title-main" style="margin-top: 20px">${page.title}</h1>
            `;
        }

        const hero = document.getElementById('postHero');
        if (hero) hero.innerHTML = '';

        const body = document.getElementById('postBody');
        const tocContainer = document.getElementById('tocContainer');
        if (tocContainer) tocContainer.style.display = 'none';

        if (body) {
            body.innerHTML = '<div class="loader">Loading...</div>';
            try {
                let content = page.content || `# ${page.title}\n\nContent coming soon.`;
                content = content.trim().replace(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/, '');
                content = content.replace(/--- slide ---/g, '---');
                
                body.innerHTML = (window.marked && window.marked.parse) 
                    ? marked.parse(content) 
                    : content;
                
                if (window.Prism) Prism.highlightAll();
            } catch (e) {
                body.innerHTML = `<p>${page.description}</p>`;
            }
        }
        
        document.getElementById('relatedPosts').classList.add('hidden');
        window.dispatchEvent(new Event('scroll'));
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

        const feedView = document.getElementById('feedView');
        const postView = document.getElementById('postView');
        if (feedView) feedView.classList.add('hidden');
        if (postView) postView.classList.remove('hidden');
        document.getElementById('relatedPosts').classList.remove('hidden');
        window.scrollTo(0, 0);

        const header = document.getElementById('postHeader');
        if (header) {
            header.innerHTML = `
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
        }

        const hero = document.getElementById('postHero');
        if (hero) {
            hero.innerHTML = `
                <img src="${post.image}" class="post-hero-img article-img" alt="${post.title}">
            `;
        }

        this.setupSocialShare(post);

        const body = document.getElementById('postBody');
        if (body) {
            body.innerHTML = '<div class="loader">Unfolding the future...</div>';

            try {
                let content = post.content || `## ${post.title}\n\n${post.description}`;
                content = content.trim().replace(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/, '');
                content = content.replace(/--- slide ---/g, '---');

                const htmlContent = (window.marked && window.marked.parse)
                    ? marked.parse(content)
                    : `<p>${content.replace(/\n/g, '<br>')}</p>`;

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;

                tempDiv.querySelectorAll('h2, h3').forEach(header => {
                    header.id = header.innerText.toLowerCase().replace(/[^\w]+/g, '-');
                });

                body.innerHTML = tempDiv.innerHTML;
                this.calculateReadTime(content);
                this.generateToC(tempDiv);
                this.initLightbox();

                if (window.Prism) Prism.highlightAll();

            } catch (error) {
                body.innerHTML = `<p>${post.description}</p>`;
            }
        }

        this.renderRelatedPosts(post);
        window.dispatchEvent(new Event('scroll'));
    }

    calculateReadTime(text) {
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        const rt = document.getElementById('readTime');
        if (rt) {
            rt.innerHTML = `
                <svg style="vertical-align: middle; margin-right: 5px" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${minutes} min read
            `;
        }
    }

    generateToC(tempDiv) {
        const tocList = document.getElementById('tocList');
        const tocContainer = document.getElementById('tocContainer');
        if (!tocList || !tocContainer) return;

        const headers = tempDiv.querySelectorAll('h2, h3');
        if (headers.length < 2) {
            tocContainer.style.display = 'none';
            return;
        }
        tocContainer.style.display = 'block';
        tocList.innerHTML = Array.from(headers).map(header => `
            <a href="#${header.id}" class="toc-link" style="margin-left: ${header.tagName === 'H3' ? '15px' : '0'}">${header.innerText}</a>
        `).join('');
        
        tocList.querySelectorAll('.toc-link').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const target = document.getElementById(link.getAttribute('href').substring(1));
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                window.scrollTo({ top: target.offsetTop - navbarHeight - 20, behavior: 'smooth' });
            };
        });
    }

    setupSocialShare(post) {
        const shareButtons = document.getElementById('shareButtons');
        if (!shareButtons) return;
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
        if (!lightbox || !lightboxImg) return;

        images.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.onclick = () => { lightbox.style.display = "flex"; lightboxImg.src = img.src; };
        });
        if (close) close.onclick = () => lightbox.style.display = "none";
        lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.style.display = "none"; };
    }

    renderRelatedPosts(currentPost) {
        const relatedGrid = document.getElementById('relatedPostsGrid');
        if (!relatedGrid) return;
        const related = this.posts.filter(p => p.category === currentPost.category && p.file !== currentPost.file).slice(0, 3);
        const display = related.length > 0 ? related : this.posts.filter(p => p.file !== currentPost.file).slice(0, 3);
        relatedGrid.innerHTML = display.map(post => this.createPostCard(post)).join('');
    }
}

const scrollHandler = () => {
    const bar = document.getElementById('progressBar');
    const container = document.getElementById('scrollProgress');
    if (!bar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    bar.style.width = scrolled + "%";
    if (container) container.style.opacity = winScroll > 100 ? 1 : 0;
};

window.addEventListener('scroll', scrollHandler);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrendAI();
});
