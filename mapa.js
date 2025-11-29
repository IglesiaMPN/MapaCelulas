// Inicializar mapa
const map = L.map("map", { attributionControl: false }).setView(
  [-31.74118823425971, -60.50002589821816],
  16
);

const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "Ultima Actualizacion de celulas: 28/11/2025",
}).addTo(map);

L.control.attribution({ prefix: false }).addTo(map);

// Geocoder limitado a Paraná
const lon1 = -60.6;   // oeste
const lat1 = -31.85;  // sur
const lon2 = -60.3;   // este
const lat2 = -31.69;  // norte

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

// Renderizar markers con filtros
function renderMarkers() {
  group.clearLayers();

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
          <b>Tel:</b> ${u.telefono}<br>
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
  });

  group.addTo(map);

  if (group.getLayers().length > 0) {
    map.fitBounds(group.getBounds(), { animate: true, duration: 0.8 });
  }
}

// Cargar datos
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
