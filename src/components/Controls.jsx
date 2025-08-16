export default function Controls({ onPrev, onNext, onAnimateRoute, onReset }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={onPrev}>
          ⏮️ Sebelum
        </button>
        <button className="btn" onClick={onNext}>
          ⏭️ Lanjut
        </button>
      </div>
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button className="btn" onClick={onAnimateRoute}>
          🦶 Animasi Rute
        </button>
        <button className="btn" onClick={onReset}>
          🗺️ Reset
        </button>
      </div>
    </div>
  );
}
