const orders = {
  SD123456: {
    status: "In Transit",
    eta: "Today, 6:30 PM",
    location: "Distribution Hub - Downtown",
    route: ["Warehouse", "Airport Hub", "Downtown Hub", "Out for Delivery", "Delivered"],
    step: 2,
    tone: "warning",
  },
  SD654321: {
    status: "Delivered",
    eta: "Delivered at 11:18 AM",
    location: "Signed by: J. Miller",
    route: ["Warehouse", "Linehaul", "City Hub", "Out for Delivery", "Delivered"],
    step: 4,
    tone: "success",
  },
  SD111222: {
    status: "Order Created",
    eta: "Awaiting pickup",
    location: "Warehouse - North Sector",
    route: ["Order Created", "Picked Up", "Sorting Hub", "Out for Delivery", "Delivered"],
    step: 0,
    tone: "warning",
  },
};

const form = document.getElementById("tracking-form");
const input = document.getElementById("trackingId");
const result = document.getElementById("result");
const year = document.getElementById("year");
const mapId = document.getElementById("map-id");
const mapMarker = document.getElementById("map-marker");
const mapStops = document.getElementById("map-stops");
const routeList = document.getElementById("route-list");

year.textContent = new Date().getFullYear();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = input.value.trim().toUpperCase();

  if (!id) {
    renderMessage("Please enter a valid tracking ID.", "danger");
    clearMap();
    return;
  }

  const order = orders[id];

  if (!order) {
    renderMessage(
      `No shipment found for ID \"${id}\". Double-check and try again.`,
      "danger"
    );
    clearMap(id);
    return;
  }

  result.innerHTML = `
    <div class="result-card ${order.tone}">
      <p class="status">Status: ${order.status}</p>
      <p><strong>ETA:</strong> ${order.eta}</p>
      <p><strong>Latest update:</strong> ${order.location}</p>
    </div>
  `;

  renderMap(id, order);
});

function renderMessage(message, tone) {
  result.innerHTML = `
    <div class="result-card ${tone}">
      <p class="status">Tracking update</p>
      <p>${message}</p>
    </div>
  `;
}

function renderMap(id, order) {
  const stopCount = order.route.length;
  const progress = stopCount > 1 ? (order.step / (stopCount - 1)) * 84 + 8 : 8;

  mapId.textContent = `Tracking ${id} • Current checkpoint: ${order.route[order.step]}`;
  mapMarker.style.left = `${progress}%`;

  mapStops.innerHTML = order.route
    .map((_, index) => {
      const left = stopCount > 1 ? (index / (stopCount - 1)) * 84 + 8 : 8;
      const stateClass = index <= order.step ? "map-stop active" : "map-stop";
      return `<span class="${stateClass}" style="left:${left}%" aria-hidden="true"></span>`;
    })
    .join("");

  routeList.innerHTML = order.route
    .map((stop, index) => {
      const className = index === order.step ? "current" : "";
      return `<li class="${className}">${stop}</li>`;
    })
    .join("");
}

function clearMap(id = "") {
  mapId.textContent = id
    ? `No map data found for ${id}. Try a sample ID.`
    : "Enter a tracking ID to see package movement.";
  mapMarker.style.left = "8%";
  mapStops.innerHTML = "";
  routeList.innerHTML = "";
}
