import router from './router.js';
import DashboardPage from './pages/DashboardPage.js';
import TopicExplorerPage from './pages/TopicExplorerPage.js';
import ArticleGeneratorPage from './pages/ArticleGeneratorPage.js';
import SavedArticlesPage from './pages/SavedArticlesPage.js';
import SettingsPage from './pages/SettingsPage.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        // Register routes
        router.addRoute('#/dashboard', new DashboardPage());
        router.addRoute('#/explorer', new TopicExplorerPage());
        router.addRoute('#/generator', new ArticleGeneratorPage());
        router.addRoute('#/articles', new SavedArticlesPage());
        router.addRoute('#/settings', new SettingsPage());

        // Initialize router
        router.init('app');

        // Set default hash if none
        if (!window.location.hash) {
            window.location.hash = '#/dashboard';
        }

        // Sidebar toggle (mobile)
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('visible');
        };

        mobileMenuBtn?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', toggleSidebar);

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('visible');
                }
            });
        });

        console.log('🚀 SmartPost AI initialized');
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}
