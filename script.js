const deliveries = {
  'XP-1024': {
    id: 'XP-1024',
    status: 'In Transit',
    eta: 'Today, 6:30 PM',
    hub: 'Dallas Distribution Hub',
    coords: [32.7767, -96.797],
  },
  'XP-2048': {
    id: 'XP-2048',
    status: 'Out for Delivery',
    eta: 'Today, 2:15 PM',
    hub: 'Austin Final-Mile Center',
    coords: [30.2672, -97.7431],
  },
};

const defaultDelivery = deliveries['XP-1024'];
let activeDelivery = { ...defaultDelivery };

const statusText = document.getElementById('status-text');
const etaText = document.getElementById('eta-text');
const hubText = document.getElementById('hub-text');
const trackingForm = document.getElementById('tracking-form');
const trackingInput = document.getElementById('tracking-id');
const adminForm = document.getElementById('admin-form');
const supportForm = document.getElementById('support-form');
const supportResponse = document.getElementById('support-response');

const map = L.map('map').setView(activeDelivery.coords, 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const marker = L.marker(activeDelivery.coords).addTo(map);
marker.bindPopup('Package XP-1024 current location').openPopup();

function syncUi() {
  statusText.textContent = activeDelivery.status;
  etaText.textContent = activeDelivery.eta;
  hubText.textContent = activeDelivery.hub;

  marker.setLatLng(activeDelivery.coords);
  marker
    .bindPopup(`Package ${activeDelivery.id} • ${activeDelivery.hub}`)
    .openPopup();
  map.setView(activeDelivery.coords, 10);

  document.getElementById('admin-lat').value = activeDelivery.coords[0].toFixed(6);
  document.getElementById('admin-lng').value = activeDelivery.coords[1].toFixed(6);
  document.getElementById('admin-hub').value = activeDelivery.hub;
  document.getElementById('admin-eta').value = activeDelivery.eta;
}

trackingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const trackingId = trackingInput.value.trim().toUpperCase();
  const record = deliveries[trackingId];

  if (!record) {
    statusText.textContent = 'Tracking ID not found';
    etaText.textContent = '--';
    hubText.textContent = 'Please verify your code';
    return;
  }

  activeDelivery = { ...record };
  syncUi();
});

adminForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nextLat = Number.parseFloat(document.getElementById('admin-lat').value);
  const nextLng = Number.parseFloat(document.getElementById('admin-lng').value);
  const nextHub = document.getElementById('admin-hub').value.trim();
  const nextEta = document.getElementById('admin-eta').value.trim();

  if (Number.isNaN(nextLat) || Number.isNaN(nextLng) || !nextHub || !nextEta) {
    return;
  }

  activeDelivery.coords = [nextLat, nextLng];
  activeDelivery.hub = nextHub;
  activeDelivery.eta = nextEta;
  activeDelivery.status = 'Location Updated by Admin';

  deliveries[activeDelivery.id] = { ...activeDelivery };
  syncUi();
});

supportForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('support-name').value.trim();
  const email = document.getElementById('support-email').value.trim();
  const message = document.getElementById('support-message').value.trim();

  if (!name || !email || !message) {
    supportResponse.textContent = 'Please complete all support fields before submitting.';
    return;
  }

  supportResponse.textContent = `Thanks ${name}, support has received your request and will contact ${email} shortly.`;
  supportForm.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
syncUi();
