import { useRef, useState, useEffect } from 'react';
import MapView from './components/MapView.jsx';
import Sidebar from './components/Sidebar.jsx';
import { PLACES } from './data/places.js';

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tourRef = useRef(null);
  const tourInterval = useRef(null);

  useEffect(() => {
    return () => clearInterval(tourInterval.current);
  }, []);

  const startTour = () => {
    clearInterval(tourInterval.current);
    let i = activeIndex;
    setActiveIndex(i);
    tourInterval.current = setInterval(() => {
      i = (i + 1) % PLACES.length;
      setActiveIndex(i);
    }, 5500);
  };

  const stopTour = () => {
    clearInterval(tourInterval.current);
    tourInterval.current = null;
  };

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
          stopTour();
          setActiveIndex(i);
        }}
        onTourStart={startTour}
        onPrev={() =>
          setActiveIndex((activeIndex - 1 + PLACES.length) % PLACES.length)
        }
        onNext={() => setActiveIndex((activeIndex + 1) % PLACES.length)}
        onStopRoute={() => tourRef.current.stopRoute()}
        onReset={() => {
          stopTour();
          tourRef.current.resetView();
          tourRef.current.stopRoute();
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
