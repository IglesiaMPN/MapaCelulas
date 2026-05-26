// Inicializar mapa
const map = L.map("map", { attributionControl: false }).setView(
  [-31.74118823425971, -60.50002589821816],
  16
);

const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "<h4><b>Ultima Actualizacion de celulas: 23/12/2025</b></h4>",
}).addTo(map);

L.control.attribution({ prefix: false }).addTo(map);

// Geocoder limitado a Paraná
const lon1 = -60.6;
const lat1 = -31.85;
const lon2 = -60.3;
const lat2 = -31.69;

L.Control.geocoder({
  defaultMarkGeocode: true,
  geocoder: L.Control.Geocoder.nominatim({
    geocodingQueryParams: {
      countrycodes: 'ar',
      viewbox: [lon1, lat1, lon2, lat2].join(','),
      bounded: 1
    }
  })
}).addTo(map);

// Configuración de iconos
const size = [30, 41.6];
const anchor = [15, 41.6];
const popanchor = [0, -42];

const iconMujOracion = L.icon({ iconUrl: "images/MujeresOracion.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });
const iconVarOracion = L.icon({ iconUrl: "images/VaronesOracion.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });
const iconJovOracion = L.icon({ iconUrl: "images/JovenesOracion.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });

const iconMujDiscipulado = L.icon({ iconUrl: "images/MujeresDiscipulado.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });
const iconVarDiscipulado = L.icon({ iconUrl: "images/VaronesDiscipulado.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });
const iconJovDiscipulado = L.icon({ iconUrl: "images/JovenesDiscipulado.svg", iconSize: size, iconAnchor: anchor, popupAnchor: popanchor });

const group = L.featureGroup();
let todasUbicaciones = [];
let visibleMarkers = [];

// Renderizar markers con filtros
function renderMarkers() {
  group.clearLayers();
  visibleMarkers = [];

  const tipoFiltro = document.getElementById("tipoSelect").value;
  const redFiltro = document.getElementById("redSelect").value;

  todasUbicaciones.forEach(u => {
    if (!u.lat || !u.lng) return;

    if (tipoFiltro !== "todos" && u.tipo !== tipoFiltro) return;
    if (redFiltro !== "todas" && u.red !== redFiltro) return;

    let icono;
    let nombre = u.tipo === "casa_discipulado" ? "Casa Discipulado" : "Casa de Oración";

    if (u.red === "mujeres") {
      icono = u.tipo === "casa_discipulado" ? iconMujDiscipulado : iconMujOracion;
    } else if (u.red === "varones") {
      icono = u.tipo === "casa_discipulado" ? iconVarDiscipulado : iconVarOracion;
    } else {
      icono = u.tipo === "casa_discipulado" ? iconJovDiscipulado : iconJovOracion;
    }

    const marker = L.marker([parseFloat(u.lat), parseFloat(u.lng)], { icon: icono });

    marker.bindPopup(`
      <div class="popup">
        <div class="popup-datos">
          <b class="nombre">${nombre}</b><br>
          <b>Dirección:</b> ${u.direccion}<br>
          <b>Líder:</b> ${u.lider}<br>
          <b>Tel:</b> ${formatPhone(u.telefono)}<br>
          <b>Horario:</b> ${u.horario}<br>
          <b>Anfitrión:</b> ${u.anfitrion}<br>
          <b>Observación:</b> ${u.obs}<br><br>
          ${u.preciso ? '<span style="color:green;">✔️</span>' : '<span style="color:red;">❌</span>'}
        </div>
      </div>
    `);

    marker.on("click", () => {
      map.flyTo([parseFloat(u.lat) + 0.0002, parseFloat(u.lng)], 18, {
        animate: true,
        duration: 0.8,
      });
      marker.openPopup();
    });

    marker.addTo(group);
    visibleMarkers.push({ data: u, marker });
  });

  group.addTo(map);

  if (group.getLayers().length > 0) {
    map.fitBounds(group.getBounds(), { animate: true, duration: 0.8 });
  }

  renderList();
}

// ===== SIDEBAR: Renderizar listado =====
function renderList() {
  const searchText = document.getElementById("searchInput").value.toLowerCase().trim();
  const listEl = document.getElementById("cellList");
  const countEl = document.getElementById("listCount");

  let filtered = visibleMarkers;

  if (searchText) {
    filtered = visibleMarkers.filter(item => {
      const d = item.data;
      const tipoLabel = d.tipo === "casa_discipulado" ? "casa discipulado" : "casa de oración";
      const redLabel = { mujeres: "mujeres", varones: "varones", jovenes: "jóvenes" }[d.red] || "";
      const searchFields = [
        d.direccion, d.lider, d.anfitrion, d.obs,
        d.telefono, tipoLabel, redLabel
      ];
      return searchFields.some(f => f && f.toLowerCase().includes(searchText));
    });
  }

  filtered.sort((a, b) => {
    const netOrder = { mujeres: 1, varones: 2, jovenes: 3 };
    const aNet = netOrder[a.data.red] || 99;
    const bNet = netOrder[b.data.red] || 99;
    if (aNet !== bNet) return aNet - bNet;
    const tipoOrder = { casa_oracion: 1, casa_discipulado: 2 };
    const aTipo = tipoOrder[a.data.tipo] || 99;
    const bTipo = tipoOrder[b.data.tipo] || 99;
    if (aTipo !== bTipo) return aTipo - bTipo;
    return (a.data.lider || "").localeCompare(b.data.lider || "", "es");
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="list-empty">No se encontraron células</div>';
    countEl.textContent = "0 células";
    return;
  }

  listEl.innerHTML = filtered.map((item, idx) => {
    const d = item.data;
    const tipoLabel = d.tipo === "casa_discipulado" ? "Casa Discipulado" : "Casa de Oración";
    const redLabel = { mujeres: "Mujeres", varones: "Varones", jovenes: "Jóvenes" }[d.red] || d.red;
    const phone = formatPhone(d.telefono);

    return `
      <div class="list-item" data-idx="${idx}">
        <div class="list-item-dot ${d.red}"></div>
        <div class="list-item-body">
          <div class="list-item-title">${tipoLabel}</div>
          <div class="list-item-red">${redLabel}</div>
          <div class="list-item-dir">${d.direccion}</div>
          <div class="list-item-meta">
            ${d.lider ? `<span>${d.lider}</span>` : ""}
            ${phone ? `<span>${phone}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  countEl.textContent = `${filtered.length} célula${filtered.length !== 1 ? "s" : ""}`;

  listEl.querySelectorAll(".list-item").forEach((el, idx) => {
    el.addEventListener("click", () => focusCell(filtered[idx]));
  });
}

function focusCell(item) {
  if (!item || !item.marker) return;
  const d = item.data;
  map.flyTo([parseFloat(d.lat) + 0.0002, parseFloat(d.lng)], 18, {
    animate: true,
    duration: 0.8,
  });
  item.marker.openPopup();
}

// ===== SIDEBAR: Toggle =====
let sidebarOpen = false;

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById("sidebarPanel").classList.toggle("open", sidebarOpen);
  document.getElementById("sidebarToggle").classList.toggle("active", sidebarOpen);

  if (sidebarOpen) {
    document.getElementById("searchInput").focus();
    setTimeout(() => map.invalidateSize(), 350);
  } else {
    setTimeout(() => map.invalidateSize(), 350);
  }
}

document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);
document.getElementById("sidebarClose").addEventListener("click", toggleSidebar);

// ===== SIDEBAR: Buscador con debounce =====
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", function () {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(renderList, 200);
});

// Cerrar con tecla Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && sidebarOpen) {
    toggleSidebar();
  }
});

// ===== Cargar datos =====
fetch("data/celulas.json")
  .then(res => res.json())
  .then(ubicaciones => {
    todasUbicaciones = ubicaciones;
    renderMarkers();
  });

// Filtros
document.getElementById("tipoSelect").addEventListener("change", renderMarkers);
document.getElementById("redSelect").addEventListener("change", renderMarkers);

// Botón reset
const resetControl = L.Control.extend({
  onAdd: function (map) {
    const btn = L.DomUtil.create("button", "reset-view-btn");
    btn.innerHTML = "⟲";
    btn.title = "Reiniciar Vista";
    L.DomEvent.on(btn, "click", function () {
      map.fitBounds(group.getBounds());
    });
    return btn;
  },
  onRemove: function (map) {}
});
map.addControl(new resetControl({ position: "topleft" }));

// Mostrar coords en consola.
map.on("click", function (e) {
  console.log("Click en:", e.latlng.lat, ", ", e.latlng.lng);
});

// Función para formatear número de teléfono
function formatPhone(phone) {
  if (!phone || phone.trim() === '') {
    return '';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) {
    return phone;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
