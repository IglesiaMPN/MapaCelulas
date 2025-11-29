const map = L.map("map", { attributionControl: false }).setView(
  [-31.74118823425971, -60.50002589821816],
  16
);

const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "Ultima Actualizacion de celulas: 28/11/2025",
}).addTo(map);

L.control
  .attribution({
    prefix: false,
  })
  .addTo(map);

const size = [30, 41.6];
const anchor = [15, 41.6];
const popanchor = [0, -42];

//Iconos casas oracion
const iconMujOracion = L.icon({
  iconUrl: "images/MujeresOracion.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

const iconVarOracion = L.icon({
  iconUrl: "images/VaronesOracion.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

const iconJovOracion = L.icon({
  iconUrl: "images/JovenesOracion.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

//Iconos casas discipulado
const iconMujDiscipulado = L.icon({
  iconUrl: "images/MujeresDiscipulado.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

const iconVarDiscipulado = L.icon({
  iconUrl: "images/VaronesDiscipulado.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

const iconJovDiscipulado = L.icon({
  iconUrl: "images/JovenesDiscipulado.svg",
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popanchor,
});

const group = L.featureGroup();

fetch("data/celulas.json")
  .then((res) => res.json())
  .then((ubicaciones) => {
    ubicaciones.forEach((u) => {
      if (!u.lat || !u.lng) {
        return; // equivalente a "continue"
      }

      let icono;
      let nombre =
        u.tipo === "casa_discipulado" ? "Casa Discipulado" : "Casa de Oracion";

      if (u.red === "mujeres") {
        icono =
          u.tipo === "casa_discipulado" ? iconMujDiscipulado : iconMujOracion;
      } else if (u.red === "varones") {
        icono =
          u.tipo === "casa_discipulado" ? iconVarDiscipulado : iconVarOracion;
      } else {
        icono =
          u.tipo === "casa_discipulado" ? iconJovDiscipulado : iconJovOracion;
      }

      const marker = L.marker([u.lat, u.lng], { icon: icono });

      marker.bindPopup(`
                <div class="popup">
					<div class="popup-datos">
						<b class= "nombre">${nombre}</b><br>
						<b>Direccion:</b> ${u.direccion}<br>
						<b>Lider:</b> ${u.lider}<br>
						<b>Tel:</b> ${u.telefono}<br>
						${u.preciso
        				? '<span style="color:green;">✔️</span>'
        				: '<span style="color:red;">❌</span>'}
					</div>
                </div>
            `);

      marker.on("click", () => {
        map.flyTo([u.lat - -0.0002, u.lng], 18, {
          animate: true,
          duration: 0.8,
        });

        marker.openPopup();
      });

      marker.addTo(group);
    });
    group.addTo(map);

    map.fitBounds(group.getBounds(), { animate: true, duration: 0.8 });
  });

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
  onRemove: function (map) {},
});

map.addControl(new resetControl({ position: "topleft" }));

//Coords en consola
map.on("click", function (e) {
  let lat = e.latlng.lat.toFixed(2);
  let lng = e.latlng.lng.toFixed(2);
  console.log("Click en:", e.latlng.lat, ", ", e.latlng.lng);
});
