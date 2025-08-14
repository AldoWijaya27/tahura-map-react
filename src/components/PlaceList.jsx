import { PLACES } from '../data/places.js'

export default function PlaceList({ activeIndex, setActiveIndex }) {
  return (
    <ul className="list" id="placeList">
      {PLACES.map((p, i) => (
        <li
          key={p.id}
          onClick={() => setActiveIndex(i)}
          style={{ background: i === activeIndex ? '#eef2ff' : 'transparent' }}
        >
          <b>{i + 1}. {p.name}</b>
          <div className="small">{p.desc}</div>
        </li>
      ))}
    </ul>
  )
}
