import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-ant-path";
import "leaflet-kmz";
import { PLACES } from "../data/places.js";

// Marker biru default
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Marker merah aktif
const ActiveIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function createPopupHTML(p, idx) {
  // Video
  const videoHTML = p.video
    ? `<div style="width:100%;max-width:320px;margin:.5rem 0">
         <iframe src="${p.video}" allowfullscreen loading="lazy"
           style="width:100%;border:0;border-radius:12px;aspect-ratio:16/9"></iframe>
       </div>`
    : "";

  // Images grid (3 kolom, square crop)
  const imagesHTML = p.images
    ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:320px;margin:.5rem 0">
         ${p.images
           .map(
             (img, i) => `
           <img src="${img}" 
             alt="${p.name} ${i + 1}"
             style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px;cursor:pointer"
             onclick="openImagePopup('${img}')"
           />
         `
           )
           .join("")}
       </div>`
    : "";

  return `
    <div style="min-width:260px;max-width:360px">
      <h3 style="margin:.2rem 0;font-size:1.1rem">${p.name}</h3>
      ${videoHTML}
      ${imagesHTML}
    </div>
  `;
}

// Tambahkan script global untuk popup fullscreen
if (typeof window !== "undefined" && !window.__imagePopupInjected) {
  window.__imagePopupInjected = true;
  const style = document.createElement("style");
  style.innerHTML = `
    .image-popup-overlay {
      position:fixed;inset:0;
      background:rgba(0,0,0,0.9);
      display:flex;align-items:center;justify-content:center;
      z-index:99999;
    }
    .image-popup-overlay img {
      max-width:90%;max-height:90%;
      border-radius:12px;
      box-shadow:0 0 20px rgba(0,0,0,0.5);
    }
  `;
  document.head.appendChild(style);

  window.openImagePopup = function (src) {
    const overlay = document.createElement("div");
    overlay.className = "image-popup-overlay";
    overlay.innerHTML = `<img src="${src}" />
                         <div style="position:fixed;top:1rem;right:1rem;font-size:2rem;color:white;cursor:pointer">&times;</div>`;
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
  };
}

const MapView = forwardRef(function MapView(
  { activeIndex, setActiveIndex, tourControl },
  _ref
) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const groupRef = useRef(null);
  const routeRef = useRef({ antPath: null, footstep: null });

  useEffect(() => {
    const map = L.map("map", {
      zoomControl: false,
      scrollWheelZoom: true,
      worldCopyJump: true,
    }).setView([-5.435, 105.21], 12);
    mapRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);

    // Base layers
    const esriImagery = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 17, attribution: "&copy; Esri" }
    ).addTo(map);

    const googleStreets = L.tileLayer(
      "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      { maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"] }
    );

    const googleSat = L.tileLayer(
      "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      { maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"] }
    ).addTo(map);

    const googleHybrid = L.tileLayer(
      "http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      { maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"] }
    );

    L.control
      .layers(
        {
          Esri: esriImagery,
          "Google Satellite": googleSat,
          "Google Streets": googleStreets,
          "Google Hybrid": googleHybrid,
        },
        {}
      )
      .addTo(map);

    const group = L.featureGroup().addTo(map);
    groupRef.current = group;

    markersRef.current = [];

    // Tambahkan semua marker
    PLACES.forEach((p, idx) => {
      const m = L.marker([p.lat, p.lng], {
        title: p.name,
        icon: DefaultIcon,
      })
        .addTo(group)
        .bindPopup(createPopupHTML(p, idx), { maxWidth: 420 })
        .on("click", () => {
          setActiveIndex(idx);
        })
        .on("popupopen", () => {
          if (p.panoramaUrl) {
            pannellum.viewer(`pano-${idx}`, {
              type: "equirectangular",
              panorama: p.panoramaUrl,
              autoLoad: true,
            });
          }
        });

      markersRef.current.push(m);
    });

    // KMZ loader
    const kmz = L.kmzLayer().addTo(map);
    kmz.on("load", (e) => {
      e.layer.eachLayer((layer) => {
        layer.unbindPopup();
        const defaultColor = layer.options.color || "#FFFFFF";

        layer.on("click", () => {
          e.layer.eachLayer((l) => {
            const c = l.options.color || "#FFFFFF";
            l.setStyle({
              fillColor: "#FFFFFF",
              fillOpacity: 0.1,
              color: c,
              weight: 2,
            });
          });

          layer.setStyle({
            fillColor: defaultColor,
            fillOpacity: 0.02,
            color: defaultColor,
            weight: 3,
          });
        });
      });
    });
    kmz.load("/PetaTahura.kmz");
    // kmz.load('/TrackTropongBintang.kmz');

    return () => {
      map.remove();
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeIndex == null || activeIndex < 0) {
      markersRef.current.forEach((m) => {
        if (!m) return;
        m.setIcon(DefaultIcon);
        m.closePopup();
      });
      return;
    }
    const p = PLACES[activeIndex];
    if (!p) return;

    // Fokus ke marker aktif
    map.flyTo([p.lat, p.lng], 16, { duration: 1.6 });

    // Update semua marker
    markersRef.current.forEach((m, idx) => {
      if (!m) return;
      if (idx === activeIndex) {
        m.setIcon(ActiveIcon);
        m.openPopup();
      } else {
        m.setIcon(DefaultIcon);
        m.closePopup();
      }
    });
  }, [activeIndex]);

  const stopRoute = () => {
    const { antPath, footstep } = routeRef.current;
    if (antPath) mapRef.current.removeLayer(antPath);
    if (footstep) mapRef.current.removeLayer(footstep);
    routeRef.current = { antPath: null, footstep: null };
  };

  const resetView = () => {
    const group = groupRef.current;
    if (group && mapRef.current) {
      mapRef.current.fitBounds(group.getBounds().pad(0.2));
    }
  };

  useImperativeHandle(tourControl, () => ({
    stopRoute,
    resetView,
  }));

  return <div id="map" style={{ width: "100%", height: "100%" }} />;
});

export default MapView;
