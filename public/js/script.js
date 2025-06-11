const socket = io();

const map = L.map('map').setView([0, 0], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap',
}).addTo(map);

const markers = {};
let userCount = 0;

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Sending location: ${latitude}, ${longitude}`);
        socket.emit('send-location', { latitude, longitude });
    },
    (error) => {
        console.error('Geolocation error:', error);
        alert('Geolocation error: ' + error.message);
    },
    {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    }
    );
} else {
    alert('Geolocation is not supported by your browser.');
}

socket.on('receive-location', (data) => {
    const { id, latitude, longitude } = data;
    console.log(`Received location for ${id}: ${latitude}, ${longitude}`);
  // Apply small random offset to prevent marker overlap
  const offsetLat = latitude + (Math.random() - 0.5) * 0.0001;
  const offsetLng = longitude + (Math.random() - 0.5) * 0.0001;
    if (!markers[id]) userCount++;
    if (markers[id]) {
    markers[id].setLatLng([offsetLat, offsetLng]);
    } else {
    markers[id] = L.marker([offsetLat, offsetLng])
        .bindPopup(`User ${id.slice(0, 8)}`)
        .addTo(map);
    }
    document.getElementById('user-count').textContent = `Connected Users: ${userCount}`;
    const bounds = L.latLngBounds(Object.values(markers).map((marker) => marker.getLatLng()));
    map.fitBounds(bounds, { padding: [50, 50] });
});

socket.on('user-disconnected', (id) => {
    console.log(`User disconnected: ${id}`);
    if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
    userCount--;
    document.getElementById('user-count').textContent = `Connected Users: ${userCount}`;
    }
});