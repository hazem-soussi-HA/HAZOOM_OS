/*
 * HAZOOM OS Security Toggle Module
 * Allows users to adjust security settings when needed
 */

// Create security toggle functionality
const SecurityToggle = {
    // Toggle secure mode on/off
    toggleSecureMode: function() {
        if (window.SecurityConfig) {
            if (window.SecurityConfig.secureMode) {
                window.SecurityConfig.disableSecureMode();
                this.showNotification('Security Mode: OFF - All applications unlocked', 'success');
            } else {
                window.SecurityConfig.enableSecureMode();
                this.showNotification('Security Mode: ON - Enhanced security active', 'info');
            }
        } else {
            this.showNotification('Security configuration not available', 'error');
        }
    },

    // Temporarily disable secure mode for specific actions
    temporaryUnlock: function(durationSeconds = 300) { // 5 minutes default
        if (window.SecurityConfig && window.SecurityConfig.secureMode) {
            // Store original state
            const originalMode = window.SecurityConfig.secureMode;
            
            // Temporarily disable
            window.SecurityConfig.secureMode = false;
            window.SecurityConfig.removeSecureRestrictions();
            
            this.showNotification(`Temporary unlock activated for ${durationSeconds} seconds`, 'warning');
            
            // Re-enable after duration
            setTimeout(() => {
                window.SecurityConfig.secureMode = originalMode;
                if (originalMode) {
                    window.SecurityConfig.applySecureRestrictions();
                    this.showNotification('Security restrictions restored', 'info');
                }
            }, durationSeconds * 1000);
        }
    },

    // Show notification to user
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `security-toggle-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100000;
            min-width: 300px;
            max-width: 500px;
            padding: 15px;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
            background: ${
                type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                'linear-gradient(135deg, #3b82f6, #2563eb)'
            };
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    },

    // Add toggle button to the UI
    addSecurityToggleButton: function() {
        // Create toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'security-toggle-control';
        toggleButton.innerHTML = `
            <button id="security-mode-toggle" title="Toggle Security Mode">
                <span id="security-icon">🔒</span>
                <span id="security-label">Secure</span>
            </button>
            <button id="temporary-unlock" title="Temporary Unlock (5 min)">
                <span>🔓</span>
            </button>
        `;
        
        // Style the button container
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            gap: 10px;
            background: rgba(15, 23, 42, 0.9);
            padding: 10px;
            border-radius: 50px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        // Style individual buttons
        const buttons = toggleButton.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.cssText = `
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid #3b82f6;
                border-radius: 25px;
                color: #93c5fd;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.2s ease;
            `;
            
            button.onmouseenter = () => {
                button.style.background = 'rgba(59, 130, 246, 0.3)';
                button.style.transform = 'scale(1.05)';
            };
            
            button.onmouseleave = () => {
                button.style.background = 'rgba(59, 130, 246, 0.2)';
                button.style.transform = 'scale(1)';
            };
        });
        
        // Add event listeners
        document.getElementById('security-mode-toggle').onclick = () => {
            this.toggleSecureMode();
            this.updateToggleButton();
        };
        
        document.getElementById('temporary-unlock').onclick = () => {
            this.temporaryUnlock(300); // 5 minutes
        };
        
        document.body.appendChild(toggleButton);
        
        // Update button state
        this.updateToggleButton();
    },

    // Update the toggle button based on current security state
    updateToggleButton: function() {
        if (!window.SecurityConfig) return;
        
        const icon = document.getElementById('security-icon');
        const label = document.getElementById('security-label');
        
        if (window.SecurityConfig.secureMode) {
            icon.textContent = '🔒';
            label.textContent = 'Secure';
            label.style.color = '#f87171'; // Red for secure mode
        } else {
            icon.textContent = '🔓';
            label.textContent = 'Unlocked';
            label.style.color = '#4ade80'; // Green for unlocked
        }
    }
};

// Add CSS for animations
const securityToggleStyles = `
<style id="security-toggle-styles">
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .security-toggle-notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
    }
</style>
`;

// Add styles to document head
document.head.insertAdjacentHTML('beforeend', securityToggleStyles);

// Initialize the security toggle when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        SecurityToggle.addSecurityToggleButton();
    }, 1000);
});

// Make SecurityToggle available globally
if (typeof window !== 'undefined') {
    window.SecurityToggle = SecurityToggle;
}