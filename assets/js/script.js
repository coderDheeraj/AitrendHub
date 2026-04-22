document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupMobileMenu();
    initLightbox();
    setupSearch();
});


function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = savedTheme;

    toggle.onclick = () => {
        const current = document.documentElement.className;
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.className = next;
        localStorage.setItem('theme', next);
    };
}

function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.onclick = () => {
            navLinks.classList.toggle('active');
        };
    }
}



function initLightbox() {
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

let searchData = [];
async function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;

    try {
        const response = await fetch(window.searchDataUrl || '/search.json');
        if (response.ok) {
            searchData = await response.json();
        }
    } catch (e) {
        console.error("Failed to load search index", e);
    }

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const results = searchData.filter(post => 
            post.title.toLowerCase().includes(query) || 
            post.desc.toLowerCase().includes(query) ||
            post.category.toLowerCase().includes(query)
        ).slice(0, 5);

        if (results.length > 0) {
            searchResults.classList.remove('hidden');
            searchResults.innerHTML = results.map(post => `
                <a href="${post.url}" class="search-result-item" style="display: block; padding: 10px; border-bottom: 1px solid var(--card-border); text-decoration: none; color: inherit; transition: background 0.2s;">
                    <strong style="display: block; color: var(--text-primary); margin-bottom: 4px;">${post.title}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${post.category} • ${post.date}</span>
                </a>
            `).join('');
        } else {
            searchResults.classList.remove('hidden');
            searchResults.innerHTML = `<div style="padding: 10px; color: var(--text-secondary);">No results found...</div>`;
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
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

window.filterCategory = async function(category) {
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (category === 'All Feed') {
        window.location.href = "{{ '/' | relative_url }}".replace("{{ '/' | relative_url }}", "/");
        return;
    }

    const grid = document.getElementById('postsGrid');
    const featured = document.getElementById('featuredPost');
    const pagination = document.getElementById('pagination');
    if (!grid) return;

    if (featured) featured.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">Loading...</div>';

    try {
        if (searchData.length === 0) {
            const response = await fetch(window.searchDataUrl || '/search.json');
            if (response.ok) searchData = await response.json();
        }

        const filtered = searchData.filter(p => p.category === category);
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">No insights found in this category.</div>';
            return;
        }

        grid.innerHTML = filtered.map(post => `
            <a href="${post.url}" class="post-card" style="text-decoration: none; color: inherit;">
                <div class="post-card-image" style="background-image: url('${post.image}')"></div>
                <div class="post-card-content">
                    <span class="post-tag">${post.category}</span>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.desc}</p>
                    <div class="post-meta">
                        <span>${post.date}</span>
                    </div>
                </div>
            </a>
        `).join('');

    } catch (e) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">Error loading categories.</div>';
    }
};

/**
 * PWA Install Logic
 */
(function() {
    let deferredPrompt;
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('btn-install-pwa');
    const closeBtn = document.getElementById('btn-close-pwa');

    if (!banner || !installBtn || !closeBtn) return;

    // Check if the user has already been prompted or has installed the app
    const hasBeenPrompted = localStorage.getItem('pwa-install-prompted');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (hasBeenPrompted || isStandalone) {
        return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        
        // Show the banner only if we haven't shown it in this session yet
        // or based on the persistent flag (redundant check for safety)
        if (!localStorage.getItem('pwa-install-prompted')) {
            banner.classList.add('show');
            // Set flag immediately so it doesn't show on next page change
            localStorage.setItem('pwa-install-prompted', 'true');
        }
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
        // Hide the banner
        banner.classList.remove('show');
    });

    closeBtn.addEventListener('click', () => {
        banner.classList.remove('show');
    });

    window.addEventListener('appinstalled', (event) => {
        console.log('App installed successfully');
        banner.classList.remove('show');
        localStorage.setItem('pwa-install-prompted', 'true');
    });
})();

