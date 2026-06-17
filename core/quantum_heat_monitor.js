// quantum_heat_monitor.js

/**
 * Creates and manages the Quantum Heat Monitor window.
 * This function is called by the app launcher.
 */
function launchQuantumHeatMonitor() {
    const appId = 'quantum-heat-monitor';

    // Check if window already exists and focus it if it does
    const existingWindow = Array.from(document.querySelectorAll('.window')).find(w => w.dataset.appId === appId);
    if (existingWindow) {
        WindowManager.makeActive(existingWindow.id);
        return;
    }

    // Define the window configuration, now with direct HTML content
    const windowConfig = {
        appId: appId,
        title: 'Quantum Heat Monitor',
        width: 600,
        height: 400,
        content: `
            <div id="heat-monitor-container" class="heat-monitor-container">
                <div class="heat-monitor-header">
                    <h2>System Component Strain</h2>
                    <span id="heat-monitor-status" class="status-dot status-offline"></span>
                </div>
                <div id="heat-display-area" class="heat-display-area">
                    <!-- Bars will be generated here by JavaScript -->
                </div>
            </div>
        `
    };

    // Create the window using the low-level WindowManager
    const windowId = WindowManager.create(windowConfig);

    // Get the window element from the DOM
    const winElement = document.getElementById(windowId);

    if (winElement) {
        // Start fetching data for the new window
        startHeatDataUpdates(winElement);
    } else {
        console.error('Failed to create Quantum Heat Monitor window element.');
    }
}

/**
 * Fetches data from the /heat endpoint and updates the UI.
 * @param {HTMLElement} windowElement - The window element containing the monitor.
 */
async function updateHeatData(windowElement) {
    const displayArea = windowElement.querySelector('#heat-display-area');
    const statusDot = windowElement.querySelector('#heat-monitor-status');

    // If elements aren't found, the window might be closing; stop processing.
    if (!displayArea || !statusDot) return;

    try {
        const response = await fetch('/heat');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        statusDot.classList.remove('status-offline', 'status-warning');
        statusDot.classList.add('status-online');

        // Use a document fragment for efficient DOM updates
        const fragment = document.createDocumentFragment();

        data.components.forEach((name, index) => {
            let barContainer = displayArea.querySelector(`#heat-bar-container-${index}`);
            if (!barContainer) {
                barContainer = document.createElement('div');
                barContainer.className = 'heat-bar-container';
                barContainer.id = `heat-bar-container-${index}`;

                const bar = document.createElement('div');
                bar.className = 'heat-bar';

                const label = document.createElement('div');
                label.className = 'heat-bar-label';
                label.textContent = name;

                barContainer.appendChild(bar);
                barContainer.appendChild(label);
                fragment.appendChild(barContainer);
            }

            const bar = barContainer.querySelector('.heat-bar');
            const percentage = Math.max(0, Math.min(100, data.heat_vector[index]));
            bar.style.height = `${percentage}%`;
            // Color transitions from blue (cool) to red (hot)
            const hue = 240 * (1 - (percentage / 100));
            bar.style.backgroundColor = `hsl(${hue}, 90%, 60%)`;
        });

        if (fragment.hasChildNodes()) {
            displayArea.innerHTML = ''; // Clear only if we need to rebuild
            displayArea.appendChild(fragment);
        }

    } catch (error) {
        console.error('Quantum Heat Monitor Error:', error);
        statusDot.classList.remove('status-online');
        statusDot.classList.add('status-warning');
    }
}

/**
 * Starts a recurring timer to update the heat data.
 * @param {HTMLElement} windowElement - The window element for the monitor.
 */
function startHeatDataUpdates(windowElement) {
    updateHeatData(windowElement);

    const intervalId = setInterval(() => {
        if (!document.body.contains(windowElement)) {
            clearInterval(intervalId);
            return;
        }
        updateHeatData(windowElement);
    }, 1500); // Update every 1.5 seconds
}

// ============================================
// SELF-REGISTRATION
// ============================================
if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp('quantum-heat-monitor', {
        title: 'Quantum Heat Monitor',
        icon: '🔥',
        launch: launchQuantumHeatMonitor
    });
} else if (typeof window !== 'undefined') {
    // Retry if AppRegistry not ready (though it should be given load order)
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof AppRegistry !== 'undefined') {
            AppRegistry.registerApp('quantum-heat-monitor', {
                title: 'Quantum Heat Monitor',
                icon: '🔥',
                launch: launchQuantumHeatMonitor
            });
        }
    });
}
