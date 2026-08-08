// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (menuToggle && navMenu && overlay) {
        const outside = [document.getElementById('main'), document.querySelector('.footer')];

        const setMenu = (open) => {
            menuToggle.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            overlay.classList.toggle('active', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
            // Keep focus inside the open drawer instead of letting it wander
            // through the page behind it (WCAG 2.4.3).
            outside.forEach(el => { if (el) el.inert = open; });
        };

        // Toggle menu
        menuToggle.addEventListener('click', () => {
            setMenu(!navMenu.classList.contains('active'));
        });

        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });

        // Close menu when clicking on overlay
        overlay.addEventListener('click', () => setMenu(false));

        // Close menu on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                setMenu(false);
                menuToggle.focus();
            }
        });
    }
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
            block: 'start'
        });
        // Move focus to the target, otherwise keyboard users keep tabbing
        // from the link they just used and the skip link does nothing.
        if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.feature-card, .package-card, .step, .pricing-card, .doc-card');

    // Never hide content when motion is reduced or IntersectionObserver is
    // unavailable — the reveal is decoration, not a reason to lose the page.
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
        return;
    }

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

/*
 * Copy code to clipboard.
 *
 * This used to be a click handler on the <pre> itself: mouse-only, so it was
 * unreachable by keyboard (WCAG 2.1.1) and invisible to every user. Each block
 * now gets a real <button> with a live-region status message.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.clipboard) return;

    const status = document.createElement('div');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);

    document.querySelectorAll('pre > code').forEach((block, i) => {
        const pre = block.parentElement;
        const label = (pre.closest('.code-example') ? 'example commands' : block.textContent.trim().split('\n')[0]);

        // The block scrolls horizontally, so it needs to be focusable (2.1.1)
        pre.setAttribute('tabindex', '0');
        pre.setAttribute('role', 'group');
        pre.setAttribute('aria-label', 'Code: ' + label);

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code: ' + label);
        wrapper.appendChild(btn);

        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent).then(() => {
                btn.textContent = 'Copied';
                btn.dataset.copied = 'true';
                status.textContent = 'Copied ' + label + ' to clipboard';
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    delete btn.dataset.copied;
                }, 2000);
            }).catch(() => {
                status.textContent = 'Copy failed';
            });
        });
    });
});

/*
 * Warn assistive-tech users about links that open a new tab (WCAG 3.2.5).
 * Done here rather than in markup to keep the 22 link tags readable.
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', link.getAttribute('rel') || 'noopener noreferrer');
        if (link.querySelector('.sr-only')) return;
        const note = document.createElement('span');
        note.className = 'sr-only';
        note.textContent = ' (opens in a new tab)';
        link.appendChild(note);
    });
});
