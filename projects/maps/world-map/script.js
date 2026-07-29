// Initialize the map
var map = L.map('world-map').setView([20, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// Add markers for major cities
var cities = [
    {name: 'New York', coords: [40.7128, -74.0060]},
    {name: 'London', coords: [51.5074, -0.1278]},
    {name: 'Tokyo', coords: [35.6762, 139.6503]},
    {name: 'Paris', coords: [48.8566, 2.3522]},
    {name: 'Beijing', coords: [39.9042, 116.4074]},
    {name: 'Sydney', coords: [-33.8688, 151.2093]},
    {name: 'Rio de Janeiro', coords: [-22.9068, -43.1729]},
    {name: 'Cairo', coords: [30.0444, 31.2357]}
];

cities.forEach(function(city) {
    L.marker(city.coords).addTo(map)
        .bindPopup(city.name);
});

// Add click event to map
map.on('click', function(e) {
    console.log('Map clicked at:', e.latlng);
});

// Responsive map resize
window.addEventListener('resize', function() {
    map.invalidateSize();
});