/* ===================================
   HAZOOM - COMMON JAVASCRIPT
   Navigation and shared functionality
   =================================== */

// Navigation HTML template
const navigationHTML = `
    <nav>
        <div class="nav-container">
            <ul class="nav-menu">
                <li class="nav-item" data-page="index" onclick="navigateTo('index.html')">
                    <span class="nav-icon">🏠</span>
                    <span>Home</span>
                </li>
                <li class="nav-item" data-page="agenda" onclick="navigateTo('agenda.html')">
                    <span class="nav-icon">📅</span>
                    <span>Agenda</span>
                </li>
                <li class="nav-item" data-page="devoirs" onclick="navigateTo('devoirs.html')">
                    <span class="nav-icon">📚</span>
                    <span>Devoirs</span>
                </li>
                <li class="nav-item" data-page="revisions" onclick="navigateTo('revisions.html')">
                    <span class="nav-icon">🔬</span>
                    <span>Révisions</span>
                </li>
                <li class="nav-item" data-page="cosmos" onclick="navigateTo('cosmos.html')">
                    <span class="nav-icon">🌌</span>
                    <span>Cosmos</span>
                </li>
                <li class="nav-item" onclick="alert('Freedom Studies - Coming Soon! 🗽')">
                    <span class="nav-icon">🗽</span>
                    <span>Freedom</span>
                </li>
                <li class="nav-item" onclick="alert('Ethics Studies - Coming Soon! ⚖️')">
                    <span class="nav-icon">⚖️</span>
                    <span>Ethics</span>
                </li>
                <li class="nav-item" onclick="alert('Profile - Coming Soon! 👤')">
                    <span class="nav-icon">👤</span>
                    <span>Profile</span>
                </li>
            </ul>
        </div>
    </nav>
`;

// Navigation function
function navigateTo(page) {
    window.location.href = page;
}

// Set active navigation item based on current page
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set active nav item
    setActiveNavItem();
    
    // Smooth scroll for all anchor links
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
    
    // Add entrance animations to feature cards if they exist
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

// Common header HTML template
const headerHTML = `
    <header>
        <div class="header-content">
            <div class="logo-section" onclick="navigateTo('index.html')" style="cursor: pointer;">
                <svg class="logo" viewBox="0 0 170.08 170.08">
                    <path fill="#FFE082" d="M-166.92,24.13c4.1-3,12.6,3.8,14.12,5.07s11.92,8.62,18.43,29.08c0,0,6.08-2.42,8.93-2.21,0,0-2.76-2.51-2.42-4.17s4.64-2.3,10.08-.51c0,0-2.55-4.13-1.23-6.46s7,.69,9.36,2.47,4.34,3.27,7.53,8.04c0,0,3.66.47,8.85,3.06,0,0,4.99-16.13,11.85-22.5,6.86-6.38,15.17-13.8,20.58-11.94,5.41,1.86,1.61,19.53.48,23.32s-5.57,16.22-20.66,24.86c0,0,3.23,7.67,3.31,13.88s1.53,8.15,2.42,9.85,5.57,11.62,0,20.34c-5.57,8.72-15.17,13.15-23.08,16.79s-7.99,5.89-15.41,5.97c-7.42.08-11.78-4.04-13.56-4.76s-15.98-6.21-20.5-11.7-6.46-8.15-7.02-12.59-.4-8.8,3.87-16.06c0,0,2.29-17.42,4.64-21.81,0,0-14.62-8.53-18.6-18.76-3.98-10.23-6.47-25.93-1.95-29.24Z"/>
                    <circle cx="-113.48" cy="121.86" r="3.18" fill="#4A90E2"/>
                </svg>
                <div class="logo-text">
                    <h1>Hazoom</h1>
                    <p id="header-subtitle">Super Intelligence Educational Platform</p>
                </div>
            </div>
            <div class="user-actions">
                <a href="#" class="btn btn-secondary" onclick="alert('Parent Dashboard - Coming Soon! 👨‍👩‍👧‍👦'); return false;">👨‍👩‍👧‍👦 For Parents</a>
                <a href="devoirs.html" class="btn btn-primary">🚀 Start Learning</a>
            </div>
        </div>
    </header>
`;

// Common footer HTML template
const footerHTML = `
    <footer>
        <div class="footer-content">
            <div class="footer-section">
                <h3>🎓 For Students</h3>
                <p><a href="devoirs.html">Learning Activities</a></p>
                <p><a href="devoirs.html">Homework Help</a></p>
                <p><a href="revisions.html">Quiz Zone</a></p>
                <p><a href="cosmos.html">Study Resources</a></p>
            </div>
            <div class="footer-section">
                <h3>👨‍👩‍👧‍👦 For Parents</h3>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Progress Tracking</a></p>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Parent Dashboard</a></p>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Reports & Analytics</a></p>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Safety Guidelines</a></p>
            </div>
            <div class="footer-section">
                <h3>📚 Educational Areas</h3>
                <p><a href="cosmos.html">Cosmos & Space</a></p>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Freedom Studies</a></p>
                <p><a href="#" onclick="alert('Coming Soon!'); return false;">Ethics & Morality</a></p>
                <p><a href="agenda.html">General Knowledge</a></p>
            </div>
            <div class="footer-section">
                <h3>ℹ️ About</h3>
                <p><a href="#" onclick="alert('Our Mission - Coming Soon!'); return false;">Our Mission</a></p>
                <p><a href="#" onclick="alert('How It Works - Coming Soon!'); return false;">How It Works</a></p>
                <p><a href="#" onclick="alert('Safety & Privacy - Coming Soon!'); return false;">Safety & Privacy</a></p>
                <p><a href="#" onclick="alert('Contact Us - Coming Soon!'); return false;">Contact Us</a></p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 Hazoom - Super Intelligence Educational Platform | Created by Hazem Soussi (hazem.soussi@gmail.com) | All Rights Reserved</p>
        </div>
    </footer>
`;
