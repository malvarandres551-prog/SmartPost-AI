// Lightweight hash-based SPA router
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
        this.container = null;
    }

    init(containerId = 'app') {
        this.container = document.getElementById(containerId);
        window.addEventListener('hashchange', () => this.handleRoute());
        // Handle initial load
        this.handleRoute();
    }

    addRoute(hash, pageInstance) {
        this.routes[hash] = pageInstance;
    }

    navigate(hash) {
        window.location.hash = hash;
    }

    handleRoute() {
        const hash = window.location.hash || '#/dashboard';

        // Normalize hash
        const route = hash.startsWith('#/') ? hash : '#/dashboard';

        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        // Get page
        const page = this.routes[route];
        if (page) {
            // Unmount current page if it has cleanup
            if (this.currentPage && typeof this.currentPage.unmount === 'function') {
                this.currentPage.unmount();
            }

            this.currentPage = page;
            this.container.innerHTML = '';

            // Render page
            if (typeof page.render === 'function') {
                const content = page.render();
                if (typeof content === 'string') {
                    this.container.innerHTML = content;
                } else if (content instanceof HTMLElement) {
                    this.container.appendChild(content);
                }
            }

            // Mount - for event binding after render
            if (typeof page.mount === 'function') {
                page.mount();
            }

            // Scroll to top
            this.container.scrollTop = 0;
        } else {
            // Fallback to dashboard
            this.navigate('#/dashboard');
        }
    }

    getCurrentRoute() {
        return window.location.hash || '#/dashboard';
    }
}

export default new Router();
