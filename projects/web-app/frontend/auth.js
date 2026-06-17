/**
 * Hazoom Authentication System
 * Handles login, registration, and user session management
 */

// Configuration - Use environment variable or fallback to localhost
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
                    (window.location.hostname === 'localhost' ? 'http://localhost:8002' : `http://${window.location.hostname}:8002`);
const API_VERSION = '/api/v1';

// Token management - Using sessionStorage for better security
const TokenManager = {
    get: () => sessionStorage.getItem('token'),
    set: (token) => sessionStorage.setItem('token', token),
    remove: () => sessionStorage.removeItem('token'),
    exists: () => !!sessionStorage.getItem('token')
};

// User management - Using sessionStorage for better security
const UserManager = {
    get: () => JSON.parse(sessionStorage.getItem('user') || 'null'),
    set: (user) => sessionStorage.setItem('user', JSON.stringify(user)),
    remove: () => sessionStorage.removeItem('user'),
    exists: () => !!sessionStorage.getItem('user')
};

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // UI Loading state
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    errorDiv.textContent = '';

    try {
        const response = await fetch(`${BACKEND_URL}${API_VERSION}/auth/access-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: email,
                password: password
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        // Store token and user data
        TokenManager.set(data.access_token);
        
        // Fetch user profile
        await fetchUserProfile();
        
        // Redirect to dashboard
        window.location.href = '/cosmos.html';
    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

/**
 * Handle registration form submission
 */
async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('errorMessage');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    // UI Loading state
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    errorDiv.textContent = '';

    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}${API_VERSION}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }

        // Automatically login after successful registration
        await handleLoginSubmit(email, password);
    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

/**
 * Internal login helper
 */
async function handleLoginSubmit(email, password) {
    const response = await fetch(`${BACKEND_URL}${API_VERSION}/auth/access-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            username: email,
            password: password
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
    }

    TokenManager.set(data.access_token);
    await fetchUserProfile();
    window.location.href = '/cosmos.html';
}

/**
 * Fetch user profile
 */
async function fetchUserProfile() {
    try {
        const response = await fetch(`${BACKEND_URL}${API_VERSION}/users/me`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.get()}`,
            },
        });

        if (response.ok) {
            const userData = await response.json();
            UserManager.set(userData);
        }
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return TokenManager.exists() && UserManager.exists();
}

/**
 * Require authentication - redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
    }
}

/**
 * Logout user
 */
function logout() {
    TokenManager.remove();
    UserManager.remove();
    window.location.href = '/login.html';
}

/**
 * Initialize authentication on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if current page requires authentication
    const requiresAuth = window.location.pathname !== '/login.html' && 
                         window.location.pathname !== '/register.html' &&
                         window.location.pathname !== '/' &&
                         window.location.pathname !== '/index.html';
    
    if (requiresAuth && !isAuthenticated()) {
        requireAuth();
    }
});
