import { useRef, useState, useEffect } from 'react';
import MapView from './components/MapView.jsx';
import Sidebar from './components/Sidebar.jsx';
import { PLACES } from './data/places.js';

export default function App() {
  const [activeIndex, setActiveIndex] = useState(null);
  const tourRef = useRef(null);
  const tourInterval = useRef(null);

  useEffect(() => {
    return () => clearInterval(tourInterval.current);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: '100vh',
      }}
    >
      <Sidebar
        activeIndex={activeIndex}
        setActiveIndex={(i) => {
          setActiveIndex(i);
        }}
        onPrev={() =>
          setActiveIndex((activeIndex - 1 + PLACES.length) % PLACES.length)
        }
        onNext={() =>
          setActiveIndex(
            (activeIndex !== null ? activeIndex + 1 : 0) % PLACES.length
          )
        }
        onStopRoute={() => tourRef.current.stopRoute()}
        onReset={() => {
          tourRef.current.resetView();
          tourRef.current.stopRoute();
          setActiveIndex(null);
        }}
      />
      <MapView
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        tourControl={tourRef}
      />
    </div>
  );
}
