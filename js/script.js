document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check localStorage or System Preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Icon swap
        if (newTheme === 'light') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    });


    // --- Mobile Navigation ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Scroll Animations ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // --- Smart Header (Hide on Scroll Down, Show on Up) ---
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScrollY = currentScrollY;
    });

    // --- Homepage Configuration Application ---
    applyHomepageConfig();
});

async function applyHomepageConfig() {
    if (typeof getHomepageConfig !== 'function') return;
    const config = await getHomepageConfig(); // Now Async
    if (!config) {
        console.warn("Homepage config failed to load.");
        // Optional: Hide loading state or show error
        document.querySelectorAll('h1').forEach(el => {
            if (el.textContent === 'Loading...') el.textContent = 'Welcome';
        });
        return;
    }

    const footer = document.querySelector('footer');

    // 1. Reorder Sections
    const header = document.querySelector('header');

    // We need a reference point. Since we want to reorder the *layout*, 
    // we should append them in order to a container or after the header.

    const blogPreviewEl = document.getElementById('blog-preview');

    config.sections.forEach(secConfig => {
        // Safe check for blog-preview in config (if user adds it later)
        if (secConfig.id === 'blog-preview') {
            // If it IS in config, handle normally
        } else if (secConfig.id === 'contact' && blogPreviewEl) {
            // Ensure Blog Preview always appears above Contact
            blogPreviewEl.parentNode.insertBefore(blogPreviewEl, footer);
        }

        const el = document.getElementById(secConfig.id);
        if (el && footer) {
            el.parentNode.insertBefore(el, footer);
        }
    });

    // Edge case: If "contact" checks failed or contact missing, ensure blog preview is somewhere reasonable?
    // But assuming default config has contact at end.
    // If blog-preview is still at top (because contact missing?), move it to end.
    if (blogPreviewEl && blogPreviewEl.previousElementSibling === header) {
        blogPreviewEl.parentNode.insertBefore(blogPreviewEl, footer);
    }

    // 2. Update Content
    config.sections.forEach(secConfig => {
        const el = document.getElementById(secConfig.id);
        if (!el || !secConfig.content) return;

        // Helper to safely set text
        const setText = (sel, txt) => {
            const target = el.querySelector(sel);
            if (target && txt) target.textContent = txt;
        };
        const setHTML = (sel, html) => {
            const target = el.querySelector(sel);
            // Default to raw if Purify not available, assuming Admin sanitized it. 
            // If DOMPurify exists (added to index), use it.
            if (target && html) target.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
        };

        if (secConfig.id === 'home') {
            setText('h1', secConfig.content.title);
            setText('.hero-subtitle', secConfig.content.subtitle);
            setText('.hero-description', secConfig.content.description);
            setText('.btn-primary', secConfig.content.ctaPrimary);
            setText('.btn-outline', secConfig.content.ctaSecondary);
        } else if (secConfig.id === 'about') {
            setText('h2', secConfig.content.title);
            // Text logic: index.html has multiple paragraphs. Simple mapping:
            // If we have text1, text2 in config, try to find p:nth-of-type(1), etc.
            const pTags = el.querySelectorAll('.about-text p');
            if (pTags[0] && secConfig.content.text1) pTags[0].textContent = secConfig.content.text1;
            if (pTags[1] && secConfig.content.text2) pTags[1].textContent = secConfig.content.text2;

            // Stats
            // Structure: .stat-item h3 (Value), .stat-item p (Label)
            const stats = el.querySelectorAll('.stat-item');
            if (stats[0]) {
                if (secConfig.content.stat1Value) stats[0].querySelector('h3').textContent = secConfig.content.stat1Value;
                if (secConfig.content.stat1Label) stats[0].querySelector('p').textContent = secConfig.content.stat1Label;
            }
            if (stats[1]) {
                if (secConfig.content.stat2Value) stats[1].querySelector('h3').textContent = secConfig.content.stat2Value;
                if (secConfig.content.stat2Label) stats[1].querySelector('p').textContent = secConfig.content.stat2Label;
            }
        } else if (secConfig.id === 'contact') {
            setText('h2', secConfig.content.title);
            setText('.contact-container > p', secConfig.content.description);
            // Location is tricky, it's inside a div with icon.
            // <p><i...></i> Location</p>
            // We can search for the p that contains map-marker
            const locP = Array.from(el.querySelectorAll('p')).find(p => p.innerHTML.includes('map-marker-alt'));
            if (locP && secConfig.content.location) {
                locP.innerHTML = `<i class="fas fa-map-marker-alt" style="color: var(--accent);"></i> ${DOMPurify ? DOMPurify.sanitize(secConfig.content.location) : secConfig.content.location}`;
            }
        } else if (secConfig.id === 'blog-preview') {
            setText('h2', secConfig.content.title);
            setText('p', secConfig.content.description);
        }

        // Generic: if section has a name/title that matches h2 (Experience, Skills, Education)
        // Check if config has explicit title override logic (not fully implemented in Admin yet, but good for future)
    });

    // 3. Rebuild Lists
    config.sections.forEach(secConfig => {
        const el = document.getElementById(secConfig.id);
        if (!el || secConfig.type !== 'list' || !secConfig.items) return;

        if (secConfig.id === 'experience' || secConfig.id === 'education') {
            const timeline = el.querySelector('.rich-timeline');
            if (timeline) {
                // Keep spine
                const spine = timeline.querySelector('.timeline-spine');
                timeline.innerHTML = '';
                if (spine) timeline.appendChild(spine);

                secConfig.items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'timeline-card';
                    // Determine Icon
                    let iconClass = 'fas fa-briefcase';
                    if (secConfig.id === 'education') iconClass = 'fas fa-graduation-cap';
                    if (item.company && item.company.includes('School')) iconClass = 'fas fa-school'; // heuristic

                    const descHTML = item.description ? `<div class="t-desc">${window.DOMPurify ? DOMPurify.sanitize(item.description) : item.description}</div>` : '';

                    card.innerHTML = `
                        <div class="timeline-date">
                            <span class="d-start">${item.dateStart || ''}</span>
                            <div class="d-divider"></div>
                            <span class="d-end">${item.dateEnd || ''}</span>
                        </div>
                        <div class="timeline-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="card-logo"><i class="fas fa-building"></i></div>
                            <span class="t-company">${item.company || ''}</span>
                            <h3 class="t-role">${item.role || ''}</h3>
                            <div class="t-meta">
                              <span><i class="fas fa-map-marker-alt"></i> ${item.location || ''}</span>
                            </div>
                            ${descHTML}
                        </div>
                    `;
                    timeline.appendChild(card);
                });
            }
        } else if (secConfig.id === 'skills') {
            const grid = el.querySelector('.skills-grid');
            if (grid) {
                grid.innerHTML = '';
                secConfig.items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'skill-card';
                    // Tags logic: split by comma if string
                    let tagsHTML = '';
                    if (item.tags) {
                        const tagsList = item.tags.split(',').map(t => t.trim());
                        tagsList.forEach(t => tagsHTML += `<span class="skill-tag">${t}</span>`);
                    }

                    card.innerHTML = `
                        <h3>${item.category || 'Category'}</h3>
                        <div class="skill-tags">
                            ${tagsHTML}
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        }
    });
}
