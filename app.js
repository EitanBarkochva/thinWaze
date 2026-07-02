const ISRAEL_CENTER = [31.7, 34.95];

const cityData = {
  "תל אביב-יפו": {
    center: [32.0853, 34.7818],
    streets: {
      "אבן גבירול": [
        [32.0645, 34.7812],
        [32.0748, 34.7813],
        [32.0876, 34.7816],
        [32.0974, 34.7819],
      ],
      "דיזנגוף": [
        [32.0731, 34.7744],
        [32.0802, 34.7741],
        [32.0912, 34.7752],
        [32.1009, 34.7762],
      ],
      "דרך נמיר": [
        [32.0744, 34.7907],
        [32.0896, 34.7931],
        [32.1057, 34.7973],
        [32.1213, 34.803],
      ],
    },
  },
  "ירושלים": {
    center: [31.7683, 35.2137],
    streets: {
      "יפו": [
        [31.7831, 35.2124],
        [31.782, 35.2191],
        [31.7811, 35.2257],
        [31.7782, 35.2294],
      ],
      "הרצל": [
        [31.7738, 35.1858],
        [31.7682, 35.1903],
        [31.7617, 35.197],
        [31.7568, 35.2017],
      ],
      "דרך חברון": [
        [31.7609, 35.2228],
        [31.7494, 35.2201],
        [31.7367, 35.2182],
        [31.7246, 35.2173],
      ],
    },
  },
  "חיפה": {
    center: [32.794, 34.9896],
    streets: {
      "שדרות מוריה": [
        [32.787, 34.986],
        [32.7931, 34.9848],
        [32.8003, 34.9842],
        [32.8077, 34.9844],
      ],
      "העצמאות": [
        [32.8189, 34.9997],
        [32.8214, 35.0033],
        [32.8246, 35.0068],
        [32.8278, 35.0101],
      ],
      "דרך יד לבנים": [
        [32.7782, 35.003],
        [32.7844, 35.0042],
        [32.7908, 35.0067],
        [32.7972, 35.0093],
      ],
    },
  },
  "באר שבע": {
    center: [31.2529, 34.7915],
    streets: {
      "רגר": [
        [31.2428, 34.7814],
        [31.2514, 34.7871],
        [31.2591, 34.7934],
        [31.2673, 34.8003],
      ],
      "שדרות טוביהו": [
        [31.2451, 34.7669],
        [31.2478, 34.7778],
        [31.2508, 34.788],
        [31.2538, 34.7984],
      ],
      "דרך מצדה": [
        [31.2637, 34.7739],
        [31.2581, 34.7808],
        [31.2525, 34.7889],
        [31.2461, 34.7968],
      ],
    },
  },
  "נתניה": {
    center: [32.3215, 34.8532],
    streets: {
      "הרצל": [
        [32.3189, 34.8494],
        [32.3231, 34.8526],
        [32.3275, 34.8564],
        [32.3322, 34.8602],
      ],
      "בן גוריון": [
        [32.2942, 34.8438],
        [32.3077, 34.8467],
        [32.321, 34.8499],
        [32.3352, 34.8541],
      ],
      "ויצמן": [
        [32.3199, 34.8629],
        [32.3242, 34.8661],
        [32.3295, 34.8704],
        [32.3346, 34.8741],
      ],
    },
  },
};

const state = {
  pickMode: "origin",
  origin: null,
  destination: null,
  activeStreetLayers: [],
  routeLayer: null,
};

const map = L.map("map", { zoomControl: false }).setView(ISRAEL_CENTER, 8);
L.control.zoom({ position: "bottomleft" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const originIcon = L.divIcon({
  className: "custom-marker origin-marker",
  html: markerHtml("#188a55", "מ"),
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const destinationIcon = L.divIcon({
  className: "custom-marker destination-marker",
  html: markerHtml("#c77800", "י"),
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

let originMarker = null;
let destinationMarker = null;

const controls = {
  originCity: document.getElementById("originCity"),
  originStreet: document.getElementById("originStreet"),
  destinationCity: document.getElementById("destinationCity"),
  destinationStreet: document.getElementById("destinationStreet"),
  originReadout: document.getElementById("originReadout"),
  destinationReadout: document.getElementById("destinationReadout"),
  travelDay: document.getElementById("travelDay"),
  travelTime: document.getElementById("travelTime"),
  calculateBtn: document.getElementById("calculateBtn"),
  result: document.getElementById("result"),
  pickOrigin: document.getElementById("pickOrigin"),
  pickDestination: document.getElementById("pickDestination"),
  openWaze: document.getElementById("openWaze"),
};

init();

function init() {
  fillCitySelect(controls.originCity);
  fillCitySelect(controls.destinationCity);
  controls.destinationCity.value = "ירושלים";
  syncStreetSelect("origin");
  syncStreetSelect("destination");
  drawSelectedStreets();

  controls.originCity.addEventListener("change", () => handleCityChange("origin"));
  controls.originStreet.addEventListener("change", () => handleStreetChange("origin"));
  controls.destinationCity.addEventListener("change", () => handleCityChange("destination"));
  controls.destinationStreet.addEventListener("change", () => handleStreetChange("destination"));
  controls.calculateBtn.addEventListener("click", calculateRoute);
  controls.pickOrigin.addEventListener("click", () => setPickMode("origin"));
  controls.pickDestination.addEventListener("click", () => setPickMode("destination"));

  map.on("click", (event) => setEndpointFromClick(state.pickMode, event.latlng));
  map.fitBounds(getIsraelBounds(), { padding: [20, 20] });
}

function fillCitySelect(select) {
  select.innerHTML = "";
  Object.keys(cityData).forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    select.appendChild(option);
  });
}

function syncStreetSelect(endpoint) {
  const citySelect = controls[`${endpoint}City`];
  const streetSelect = controls[`${endpoint}Street`];
  streetSelect.innerHTML = "";
  Object.keys(cityData[citySelect.value].streets).forEach((street) => {
    const option = document.createElement("option");
    option.value = street;
    option.textContent = street;
    streetSelect.appendChild(option);
  });
}

function handleCityChange(endpoint) {
  syncStreetSelect(endpoint);
  handleStreetChange(endpoint);
}

function handleStreetChange(endpoint) {
  state[endpoint] = null;
  updateReadout(endpoint);
  drawSelectedStreets();
  clearRoute();
  setPickMode(endpoint);

  const city = controls[`${endpoint}City`].value;
  const street = controls[`${endpoint}Street`].value;
  map.fitBounds(L.latLngBounds(cityData[city].streets[street]), { padding: [70, 70], maxZoom: 15 });
}

function drawSelectedStreets() {
  state.activeStreetLayers.forEach((layer) => layer.remove());
  state.activeStreetLayers = [];

  ["origin", "destination"].forEach((endpoint) => {
    const city = controls[`${endpoint}City`].value;
    const street = controls[`${endpoint}Street`].value;
    const color = endpoint === "origin" ? "#188a55" : "#c77800";
    const line = L.polyline(cityData[city].streets[street], {
      color,
      weight: 7,
      opacity: 0.78,
    }).addTo(map);
    line.on("click", (event) => setEndpointFromClick(endpoint, event.latlng));
    state.activeStreetLayers.push(line);
  });
}

function setPickMode(mode) {
  state.pickMode = mode;
  controls.pickOrigin.classList.toggle("active", mode === "origin");
  controls.pickDestination.classList.toggle("active", mode === "destination");
}

function setEndpointFromClick(endpoint, latlng) {
  const city = controls[`${endpoint}City`].value;
  const street = controls[`${endpoint}Street`].value;
  const snapped = closestPointOnStreet(latlng, cityData[city].streets[street]);
  state[endpoint] = { city, street, latlng: snapped };

  if (endpoint === "origin") {
    if (!originMarker) {
      originMarker = L.marker(snapped, { icon: originIcon }).addTo(map);
    } else {
      originMarker.setLatLng(snapped);
    }
    setPickMode("destination");
  } else {
    if (!destinationMarker) {
      destinationMarker = L.marker(snapped, { icon: destinationIcon }).addTo(map);
    } else {
      destinationMarker.setLatLng(snapped);
    }
  }

  updateReadout(endpoint);
  clearRoute();
  updateWazeLink();
}

function updateReadout(endpoint) {
  const point = state[endpoint];
  const readout = controls[`${endpoint}Readout`];

  if (!point) {
    readout.textContent = "בחר נקודה על הרחוב במפה";
    return;
  }

  readout.textContent = `${point.city}, ${point.street} - ${point.latlng.lat.toFixed(5)}, ${point.latlng.lng.toFixed(5)}`;
}

function calculateRoute() {
  if (!state.origin || !state.destination) {
    controls.result.innerHTML = `
      <div class="result-label">חסר מיקום</div>
      <strong>צריך לבחור מקור ויעד</strong>
      <p>בחר נקודה על רחוב המקור ועל רחוב היעד במפה.</p>
    `;
    return;
  }

  const distanceKm = haversineKm(state.origin.latlng, state.destination.latlng) * routeFactor(state.origin, state.destination);
  const multiplier = trafficMultiplier(Number(controls.travelDay.value), controls.travelTime.value);
  const baseSpeed = distanceKm > 35 ? 72 : 34;
  const minutes = Math.max(5, Math.round((distanceKm / baseSpeed) * 60 * multiplier));
  const range = [Math.max(3, minutes - Math.ceil(minutes * 0.12)), minutes + Math.ceil(minutes * 0.18)];
  const dayName = controls.travelDay.options[controls.travelDay.selectedIndex].textContent;

  drawRoute();
  controls.result.innerHTML = `
    <div class="result-label">אומדן דמו מוכן לחיבור Waze</div>
    <strong>${formatMinutes(range[0])} - ${formatMinutes(range[1])}</strong>
    <p>${state.origin.city} אל ${state.destination.city}, ${distanceKm.toFixed(1)} ק"מ משוערים, יום ${dayName} בשעה ${controls.travelTime.value}.</p>
  `;
}

function drawRoute() {
  clearRoute();
  state.routeLayer = L.polyline([state.origin.latlng, state.destination.latlng], {
    color: "#0877d1",
    weight: 5,
    opacity: 0.8,
    dashArray: "10 10",
  }).addTo(map);
  map.fitBounds(state.routeLayer.getBounds(), { padding: [80, 80] });
}

function clearRoute() {
  if (state.routeLayer) {
    state.routeLayer.remove();
    state.routeLayer = null;
  }
}

function updateWazeLink() {
  if (!state.destination) {
    controls.openWaze.classList.add("disabled");
    controls.openWaze.href = "#";
    return;
  }

  const { lat, lng } = state.destination.latlng;
  controls.openWaze.href = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  controls.openWaze.classList.remove("disabled");
}

function trafficMultiplier(day, time) {
  const [hour, minute] = time.split(":").map(Number);
  const decimalHour = hour + minute / 60;
  const isWeekend = day === 5 || day === 6;

  if (isWeekend && decimalHour < 18) return 0.82;
  if (decimalHour >= 7 && decimalHour <= 9.5) return 1.55;
  if (decimalHour >= 15.5 && decimalHour <= 18.5) return 1.65;
  if (decimalHour >= 22 || decimalHour <= 5) return 0.72;
  return isWeekend ? 0.95 : 1.12;
}

function routeFactor(origin, destination) {
  if (origin.city === destination.city) return 1.45;
  return 1.28;
}

function closestPointOnStreet(latlng, points) {
  let best = L.latLng(points[0]);
  let bestDistance = Infinity;

  points.forEach((point) => {
    const candidate = L.latLng(point);
    const distance = map.distance(latlng, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  });

  return best;
}

function haversineKm(a, b) {
  return map.distance(a, b) / 1000;
}

function formatMinutes(total) {
  if (total < 60) return `${total} דקות`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} ש' ${minutes} דק'` : `${hours} שעות`;
}

function markerHtml(color, text) {
  return `<span style="
    display:grid;
    place-items:center;
    width:34px;
    height:34px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:${color};
    color:white;
    border:3px solid white;
    box-shadow:0 6px 16px rgba(0,0,0,.25);
    font-weight:800;
  "><span style="transform:rotate(45deg)">${text}</span></span>`;
}

function getIsraelBounds() {
  return L.latLngBounds([
    [29.45, 34.18],
    [33.35, 35.9],
  ]);
}
