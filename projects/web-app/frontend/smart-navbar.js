/**
 * ==========================================
 * HAZOOM SMART NAVBAR - Navigation Intelligente
 * Version: 2.0
 * Date: 01/11/2025
 * ==========================================
 */

class SmartNavbar {
    constructor() {
        this.navbar = null;
        this.navItems = [];
        this.currentPage = '';
        this.notifications = [];
        this.contextualHints = new Map();
        this.init();
    }

    init() {
        this.navbar = document.querySelector('.smart-navbar');
        if (!this.navbar) return;

        this.navItems = Array.from(this.navbar.querySelectorAll('.nav-item'));
        this.detectCurrentPage();
        this.setupContextualDirections();
        this.setupNotifications();
        this.setupScrollEffects();
        this.setupActiveState();
        this.addKeyboardNavigation();
        this.addHoverEffects();
    }

    /**
     * Détecte la page actuelle automatiquement
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().toLowerCase();

        const pageMap = {
            '': 'accueil',
            'index.html': 'accueil',
            'accueil': 'accueil',
            'agenda': 'agenda',
            'devoirs': 'devoirs',
            'revisions': 'révisions',
            'cosmos': 'cosmos',
            'profil': 'profil',
            'support': 'support'
        };

        this.currentPage = pageMap[page] || 'accueil';
        this.updateActiveState();
    }

    /**
     * Configure les directions contextuelles selon la page
     */
    setupContextualDirections() {
        const directions = {
            'accueil': {
                message: '👋 Bienvenue ! Explorez nos fonctionnalités',
                nextAction: '🚀 Découvrir',
                priority: 'high'
            },
            'agenda': {
                message: '📅 Votre emploi du temps vous attend',
                nextAction: 'Voir Planning',
                priority: 'medium'
            },
            'devoirs': {
                message: '📚 Continuez vos exercices !',
                nextAction: 'Reprendre',
                priority: 'high'
            },
            'révisions': {
                message: '🎯 Phase de révision détectée',
                nextAction: 'Commencer',
                priority: 'medium'
            },
            'cosmos': {
                message: '🌌 Espace d\'apprentissage infini',
                nextAction: 'Explorer',
                priority: 'low'
            },
            'profil': {
                message: '⚙️ Personnalisez votre expérience',
                nextAction: 'Modifier',
                priority: 'low'
            },
            'support': {
                message: '💬 Nous sommes là pour vous aider',
                nextAction: 'Poser Question',
                priority: 'medium'
            }
        };

        this.contextualHints = directions;
        this.showContextualHint();
    }

    /**
     * Affiche un indice contextuel pour la page actuelle
     */
    showContextualHint() {
        const hint = this.contextualHints[this.currentPage];
        if (!hint) return;

        // Créer un élément hint s'il n'existe pas
        let hintElement = document.querySelector('.navbar-context-hint');
        if (!hintElement) {
            hintElement = document.createElement('div');
            hintElement.className = 'navbar-context-hint';
            this.navbar.appendChild(hintElement);
        }

        hintElement.innerHTML = `
            <div class="hint-content ${hint.priority}">
                <span class="hint-message">${hint.message}</span>
                <button class="hint-action-btn">${hint.nextAction}</button>
            </div>
        `;

        // Animation d'apparition
        hintElement.style.opacity = '0';
        hintElement.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            hintElement.style.opacity = '1';
            hintElement.style.transform = 'translateY(0)';
        }, 300);

        // Auto-disparition après 5 secondes
        setTimeout(() => {
            hintElement.style.opacity = '0';
            hintElement.style.transform = 'translateY(-10px)';
        }, 5000);
    }

    /**
     * Gère les notifications intelligentes
     */
    setupNotifications() {
        const notifications = [
            { type: 'homework', message: '📝 Nouveau devoir en mathématiques', page: 'devoirs', priority: 'high' },
            { type: 'achievement', message: '🏆 Bravo ! Vous avez complété 5 leçons', page: 'accueil', priority: 'medium' },
            { type: 'reminder', message: '⏰ Rappel : Session de révision dans 30 min', page: 'revisions', priority: 'medium' },
            { type: 'support', message: '💬 Nouvelle réponse de votre tutor', page: 'support', priority: 'low' }
        ];

        this.notifications = notifications;
        this.updateNotificationBadges();
    }

    /**
     * Met à jour les badges de notification
     */
    updateNotificationBadges() {
        this.navItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            let count = 0;

            this.notifications.forEach(notif => {
                if (text.includes(notif.page) || this.getPageFromText(text) === notif.page) {
                    count++;
                }
            });

            let badge = item.querySelector('.nav-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'nav-badge';
                    item.appendChild(badge);
                }
                badge.textContent = count;
                badge.style.animation = 'pulse-badge 2s ease-in-out infinite';
            } else if (badge) {
                badge.remove();
            }
        });
    }

    /**
     * Configure les effets au scroll
     */
    setupScrollEffects() {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateNavbar = () => {
            const navbar = document.querySelector('.modern-header');
            const scrollY = window.scrollY;

            // Effet de transparence au scroll
            if (scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = 'var(--shadow-lg)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'var(--shadow-sm)';
            }

            // Masquer/afficher au scroll
            if (scrollY > lastScrollY && scrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = scrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        });
    }

    /**
     * Met à jour l'état actif
     */
    updateActiveState() {
        this.navItems.forEach(item => {
            const text = item.textContent.toLowerCase().trim();
            const isActive = this.isActiveItem(text);

            item.classList.toggle('active', isActive);

            // Ajouter indicateurs visuels
            if (isActive) {
                this.addActiveIndicator(item);
            }
        });
    }

    /**
     * Vérifie si un élément est actif
     */
    isActiveItem(text) {
        const activeMap = {
            'accueil': ['accueil', 'home'],
            'fonctionnalités': ['fonctionnalités', 'features'],
            'ressources': ['ressources', 'resources'],
            'pour parents': ['pour parents', 'parents'],
            'support': ['support', 'aide']
        };

        for (const [key, values] of Object.entries(activeMap)) {
            if (values.some(v => text.includes(v))) {
                return this.currentPage === key;
            }
        }

        return false;
    }

    /**
     * Ajoute un indicateur actif
     */
    addActiveIndicator(item) {
        const indicator = item.querySelector('.nav-indicator');
        if (indicator) {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateX(-50%) scale(1.5)';
        }
    }

    /**
     * Navigation au clavier
     */
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateTo(0);
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateTo(1);
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateTo(2);
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateTo(3);
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateTo(4);
                        break;
                }
            }
        });
    }

    /**
     * Navigue vers un index spécifique
     */
    navigateTo(index) {
        if (this.navItems[index]) {
            this.navItems[index].click();
            this.animateNavigate(this.navItems[index]);
        }
    }

    /**
     * Anime la navigation
     */
    animateNavigate(item) {
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
            item.style.transform = 'scale(1)';
        }, 150);
    }

    /**
     * Effets de survol avancés
     */
    addHoverEffects() {
        this.navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.showHoverPreview(item);
            });

            item.addEventListener('mouseleave', () => {
                this.hideHoverPreview();
            });
        });
    }

    /**
     * Aperçu au survol
     */
    showHoverPreview(item) {
        const text = item.textContent.toLowerCase().trim();
        const preview = this.getPreviewContent(text);

        if (preview) {
            this.displayPreview(preview);
        }
    }

    /**
     * Cache l'aperçu
     */
    hideHoverPreview() {
        const preview = document.querySelector('.nav-hover-preview');
        if (preview) {
            preview.remove();
        }
    }

    /**
     * Contenu d'aperçu selon l'élément
     */
    getPreviewContent(text) {
        const previews = {
            'accueil': { icon: '🏠', desc: 'Page d\'accueil avec résumé' },
            'fonctionnalités': { icon: '🚀', desc: 'Toutes nos fonctionnalités' },
            'ressources': { icon: '📚', desc: 'Bibliothèque de ressources' },
            'pour parents': { icon: '👨‍👩‍👧‍👦', desc: 'Espace dédié aux parents' },
            'support': { icon: '💬', desc: 'Centre d\'aide et support' }
        };

        for (const [key, value] of Object.entries(previews)) {
            if (text.includes(key)) {
                return value;
            }
        }

        return null;
    }

    /**
     * Affiche l'aperçu
     */
    displayPreview(content) {
        const preview = document.createElement('div');
        preview.className = 'nav-hover-preview';
        preview.innerHTML = `
            <div class="preview-content">
                <span class="preview-icon">${content.icon}</span>
                <span class="preview-text">${content.desc}</span>
            </div>
        `;

        document.body.appendChild(preview);

        // Positionner près du curseur
        document.addEventListener('mousemove', (e) => {
            preview.style.left = e.pageX + 15 + 'px';
            preview.style.top = e.pageY + 15 + 'px';
        });
    }

    /**
     * Définit l'état actif manuellement
     */
    setActive(page) {
        this.currentPage = page;
        this.updateActiveState();
    }

    /**
     * Ajoute une notification
     */
    addNotification(notification) {
        this.notifications.push(notification);
        this.updateNotificationBadges();
    }

    /**
     * Supprime une notification
     */
    removeNotification(index) {
        this.notifications.splice(index, 1);
        this.updateNotificationBadges();
    }

    /**
     * Obtient la page depuis le texte
     */
    getPageFromText(text) {
        for (const page of Object.keys(this.contextualHints)) {
            if (text.includes(page)) {
                return page;
            }
        }
        return null;
    }
}

/**
 * Initialisation automatique
 */
document.addEventListener('DOMContentLoaded', () => {
    const smartNavbar = new SmartNavbar();

    // Export pour usage global
    window.smartNavbar = smartNavbar;

    console.log('🚀 SmartNavbar initialisée avec succès !');
});

/**
 * Styles CSS additionnels pour la navbar intelligente
 */
const smartNavbarStyles = `
    .navbar-context-hint {
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--gradient-primary);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        box-shadow: var(--shadow-md);
        transition: all var(--transition-normal);
        z-index: 10;
        white-space: nowrap;
    }

    .hint-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .hint-content.high {
        background: var(--gradient-secondary);
    }

    .hint-content.medium {
        background: var(--gradient-primary);
    }

    .hint-content.low {
        background: var(--gradient-success);
    }

    .hint-action-btn {
        background: rgba(255, 255, 255, 0.3);
        border: none;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .hint-action-btn:hover {
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.05);
    }

    .nav-hover-preview {
        position: absolute;
        background: #2d3748;
        color: white;
        padding: 10px 15px;
        border-radius: 10px;
        font-size: 0.9rem;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        pointer-events: none;
        animation: fadeIn 0.2s ease;
    }

    .preview-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .preview-icon {
        font-size: 1.2rem;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .nav-badge {
        background: var(--hazoom-pink);
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
    }

    .modern-header {
        transition: all var(--transition-normal);
    }
`;

// Injection des styles
const styleSheet = document.createElement('style');
styleSheet.textContent = smartNavbarStyles;
document.head.appendChild(styleSheet);
