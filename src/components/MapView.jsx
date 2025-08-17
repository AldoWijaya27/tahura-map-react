import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-ant-path';
import { PLACES } from '../data/places.js';
import 'pannellum/build/pannellum.js';
import 'pannellum/build/pannellum.css';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function createPopupHTML(p, idx) {
  if (p.panoramaUrl) {
    return `<div style="width:320px;height:200px" id="pano-${idx}"></div>`;
  }
  const media =
    p.mediaType === 'video'
      ? `<div style="width:280px;max-width:80vw"><iframe src="${p.mediaUrl}" allowfullscreen loading="lazy" style="width:100%;border:0;border-radius:12px;aspect-ratio:16/9"></iframe></div>`
      : `<div style="width:280px;max-width:80vw"><img src="${p.mediaUrl}" alt="${p.name}" loading="lazy" style="width:100%;border-radius:12px"/></div>`;
  return `<div style="min-width:280px;max-width:360px">
    <h3 style="margin:.2rem 0">${p.name}</h3>
    <div style="font-size:.9rem;color:#6b7280;margin-bottom:.5rem">${p.desc}</div>
    ${media}
  </div>`;
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
    const map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: true,
      worldCopyJump: true,
    }).setView([-5.435, 105.21], 12);
    mapRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    // const base = L.tileLayer(
    //   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    //   {
    //     maxZoom: 17,
    //   }
    // ).addTo(map);

    // const topo = L.tileLayer(
    //   'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    //   {
    //     maxZoom: 17,
    //   }
    // ).addTo(map);

    // const esriImagery = L.tileLayer(
    //   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    //   { maxZoom: 17, attribution: '&copy; Esri' }
    // ).addTo(map);

    const googleStreets = L.tileLayer(
      'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    );

    const googleSat = L.tileLayer(
      'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    ).addTo(map);

    const googleHybrid = L.tileLayer(
      'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    );

    L.control
      .layers({
        // OSM: base,
        // Topografi: topo,
        // Esri: esriImagery,
        'Google Satellite': googleSat,
        'Google Streets': googleStreets,
        'Google Hybrid': googleHybrid,
      })
      .addTo(map);

    const group = L.featureGroup().addTo(map);
    groupRef.current = group;

    PLACES.forEach((p, idx) => {
      const m = L.marker([p.lat, p.lng], { title: p.name })
        .addTo(group)
        .bindPopup(createPopupHTML(p, idx), { maxWidth: 420 })
        .on('click', () => {
          map.flyTo([p.lat, p.lng], 15, { duration: 1.6 });
          setActiveIndex(idx);
        })
        .on('popupopen', () => {
          if (p.panoramaUrl) {
            pannellum.viewer(`pano-${idx}`, {
              type: 'equirectangular',
              panorama: p.panoramaUrl,
              autoLoad: true,
              // compass: true,
              // minPitch: -30, // batas bawah
              // maxPitch: 30, // batas atas
              // minYaw: 0, // batas kiri
              // maxYaw: 360,
            });
          }
        });
      markersRef.current.push(m);
    });

    map.fitBounds(group.getBounds().pad(0.2));

    const onMoveEnd = () => {
      const p = PLACES[activeIndex];
      if (!p) return;
      const center = map.getCenter();
      const d = map.distance(center, L.latLng(p.lat, p.lng));
      if (d < 120) markersRef.current[activeIndex]?.openPopup();
    };
    map.on('moveend', onMoveEnd);

    return () => {
      map.off('moveend', onMoveEnd);
      map.remove();
    };
  }, []);

  // focus on active place
  useEffect(() => {
    const map = mapRef.current;
    const p = PLACES[activeIndex];
    if (map && p) {
      map.flyTo([p.lat, p.lng], 15, { duration: 1.6 });
    }
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

  return <div id="map" style={{ width: '100%', height: '100%' }} />;
});

export default MapView;
