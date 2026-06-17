// hazoom-os/showtime/static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('results-list');
    let eventSource;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        // Clear previous results
        resultsList.innerHTML = '';

        if (eventSource) {
            eventSource.close();
        }

        if (query) {
            eventSource = new EventSource(`/search/${query}`);
            eventSource.onmessage = (event) => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = event.data;
                resultsList.appendChild(li);
            };
        }
    });
});
