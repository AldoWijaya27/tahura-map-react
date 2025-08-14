import PlaceList from './PlaceList.jsx'
import Controls from './Controls.jsx'

export default function Sidebar({ activeIndex, setActiveIndex, onTourStart, onPrev, onNext, onAnimateRoute, onStopRoute, onReset }) {
  return (
    <aside style={{ padding: '16px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', width: 320 }}>
      <h2 style={{ margin: '0.2rem 0 0' }}>Tahura Lampung</h2>
      <div className="small">
        Demo peta interaktif — klik lokasi untuk melihat media, jalankan tur untuk auto-narasi.
      </div>
      <div className="card">
        <Controls
          onTourStart={onTourStart}
          onPrev={onPrev}
          onNext={onNext}
          onAnimateRoute={onAnimateRoute}
          onStopRoute={onStopRoute}
          onReset={onReset}
        />
      </div>
      <div style={{ marginTop: 18 }}>
        <span className="badge">Daftar Lokasi</span>
        <PlaceList activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      </div>
      <div className="small" style={{ marginTop: 16 }}>
        <b>Catatan:</b> Koordinat & media masih dummy untuk demo. Ganti dengan data asli di <code>src/data/places.js</code>.
      </div>
    </aside>
  )
}
