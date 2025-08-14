import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-ant-path';
import { PLACES } from '../data/places.js';

// Fix default icon paths in bundlers (use CDN)
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

function createPopupHTML(p) {
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

    const base = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(map);

    const dark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        attribution: '&copy; CartoDB',
      }
    );

    L.control.layers({ OSM: base, Dark: dark }).addTo(map);

    const group = L.featureGroup().addTo(map);
    groupRef.current = group;

    PLACES.forEach((p, idx) => {
      const m = L.marker([p.lat, p.lng], { title: p.name })
        .addTo(group)
        .bindPopup(createPopupHTML(p), { maxWidth: 420 })
        .on('click', () => {
          map.flyTo([p.lat, p.lng], 15, { duration: 1.6 });
          setActiveIndex(idx);
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

  const animateRoute = () => {
    const map = mapRef.current;
    const coords = PLACES.map((p) => [p.lat, p.lng]);
    routeRef.current.antPath = L.polyline
      .antPath(coords, {
        paused: false,
        reverse: false,
        delay: 800,
        dashArray: [10, 20],
        weight: 5,
        opacity: 0.7,
      })
      .addTo(map);

    const footIcon = L.divIcon({ className: 'footstep', html: '👣' });
    routeRef.current.footstep = L.marker(coords[0], {
      icon: footIcon,
      interactive: false,
    }).addTo(map);

    let segIndex = 0,
      t = 0;
    const path = L.polyline(coords);
    const total = path.getLatLngs();

    const step = () => {
      const seg = [total[segIndex], total[segIndex + 1]];
      if (!seg[1]) return;
      t += 0.01;
      if (t >= 1) {
        t = 0;
        segIndex++;
      }
      const cur = L.latLng(
        seg[0].lat + (seg[1].lat - seg[0].lat) * t,
        seg[0].lng + (seg[1].lng - seg[0].lng) * t
      );
      routeRef.current.footstep.setLatLng(cur);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

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

  // expose controls to parent
  useImperativeHandle(tourControl, () => ({
    animateRoute,
    stopRoute,
    resetView,
  }));

  return <div id="map" style={{ width: '100%', height: '100%' }} />;
});

export default MapView;
