import PlaceList from './PlaceList.jsx';
import Controls from './Controls.jsx';

export default function Sidebar({
  activeIndex,
  setActiveIndex,
  onPrev,
  onNext,
  onReset,
}) {
  return (
    <aside
      style={{
        padding: '16px',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
      }}
    >
      <h2 className="text-lg font-semibold">Tahura WAR Lampung</h2>
      <div className="small">
        Peta Interaktif Wisata di kawasan Tahura Wan Abdul Rahma Lampung
      </div>

      <div className="card">
        <Controls onPrev={onPrev} onNext={onNext} onReset={onReset} />
      </div>

      <div className="mt-5">
        <span className="font-medium text-sm text-green-700">
          Daftar Lokasi
        </span>

        {/* Daftar tempat */}
        <PlaceList
          activeIndex={activeIndex}
          setActiveIndex={(i) => {
            setActiveIndex(i); // update index aktif
          }}
        />
      </div>
    </aside>
  );
}