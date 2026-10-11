import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
 
const ZONES = [
  { t: 'pc',   label: 'ПК',     name: 'PC Arena',       n: 6, min: 350,  img: '/pc.jpg',   note: 'RTX 4070 · 240 Гц' },
  { t: 'ps',   label: 'PS5',    name: 'Console lounge', n: 2, min: 500,  img: '/ps.jpg',   note: 'OLED 65″ · 4 контроллера' },
  { t: 'vr',   label: 'VR',     name: 'VR',             n: 2, min: 700,  img: '/vr.jpg',   note: 'Quest 3 · зона 3×3 м' },
  { t: 'room', label: 'Приват', name: 'Приват-комната', n: 1, min: 1800, img: '/room.jpg', note: 'до 8 человек · проектор' },
];
 
const plural = (n) => (n === 1 ? 'место' : n < 5 ? 'места' : 'мест');
 
function ZoneCard({ z, index }) {
  const [imgOk, setImgOk] = useState(true);
 
  // подсветка следует за курсором внутри карточки
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px');
    e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px');
  };
 
  return (
    <Link
      className={`zsc${imgOk ? '' : ' noimg'}`}
      to={`/places?type=${z.t}`}
      style={{ '--i': index }}
      onPointerMove={onMove}
      aria-label={`${z.name}: ${z.n} ${plural(z.n)}, от ${z.min} рублей в час`}
    >
      <img className="zsc-img" src={z.img} alt="" loading="lazy" onError={() => setImgOk(false)} />
      <div className="zsc-veil" />
 
      <div className="zsc-top">
        <span className="zsc-idx">{String(index + 1).padStart(2, '0')} / 04</span>
        <span className="zsc-arrow" aria-hidden="true">→</span>
      </div>
 
      <div className="zsc-center" aria-hidden="true">
        <b className="zsc-label">{z.label}</b>
      </div>
 
      <div className="zsc-bottom">
        <span className="zsc-count">{z.n} {plural(z.n)}</span>
        <h3 className="zsc-name">{z.name}</h3>
        <div className="zsc-meta">
          <span className="zsc-note">{z.note}</span>
          <span className="zsc-price">от {z.min.toLocaleString('ru-RU')} ₽/час</span>
        </div>
      </div>
    </Link>
  );
}
 
export default function ZoneShowcase() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
 
  // карточки появляются по очереди, когда секция доезжает до экрана
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return setSeen(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
 
  return (
    <section className="panel band band-dots">
      <div className="sec-head">
        <div>
          <span className="eyebrow">Обзор каталога</span>
          <h2 className="md">Четыре зоны</h2>
        </div>
        <p>Наведите на зону, чтобы раскрыть. Внутри — все места и свободные часы.</p>
        <Link className="pill line" to="/places">Все места</Link>
      </div>
 
      <div ref={ref} className={`zones-showcase${seen ? ' in' : ''}`}>
        {ZONES.map((z, i) => <ZoneCard z={z} index={i} key={z.t} />)}
      </div>
    </section>
  );
}