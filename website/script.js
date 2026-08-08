// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (menuToggle && navMenu && overlay) {
        const setMenu = (open) => {
            menuToggle.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            overlay.classList.toggle('active', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
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

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
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

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Copy code to clipboard
document.querySelectorAll('pre code').forEach(block => {
    block.parentElement.addEventListener('click', () => {
        const text = block.textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Show a brief "Copied!" tooltip
            const tooltip = document.createElement('div');
            tooltip.textContent = 'Copied!';
            tooltip.style.cssText = `
                position: absolute;
                background: #10b981;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                pointer-events: none;
                z-index: 1000;
            `;
            block.parentElement.style.position = 'relative';
            block.parentElement.appendChild(tooltip);

            setTimeout(() => tooltip.remove(), 2000);
        });
    });

    // Add cursor pointer
    block.parentElement.style.cursor = 'pointer';
});
