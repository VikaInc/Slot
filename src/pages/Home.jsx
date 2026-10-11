import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import ZoneShowcase from '../components/ZoneShowcase';

const HERO_RINGS = (
  <svg className="rings" viewBox="0 0 400 400" fill="none" stroke="var(--ink)" aria-hidden="true">
    <circle cx="200" cy="200" r="186" strokeWidth="1" opacity=".5"/>
    <circle cx="200" cy="200" r="140" strokeWidth="1" strokeDasharray="3 6" opacity=".5"/>
    <circle cx="200" cy="200" r="92" strokeWidth="1.2"/>
    <circle cx="200" cy="200" r="30" fill="var(--ink)" stroke="none"/>
    <circle cx="340" cy="120" r="7" fill="var(--sig)" stroke="none"/>
  </svg>
);

const MG = (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="6" fill="var(--ink)"/>
    <circle cx="20" cy="20" r="16" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
  </svg>
);

const ZONES = [
  {
    t: 'pc',
    label: 'ПК',
    name: 'PC Arena',
    n: 6,
    min: 350,
    img: '/pc.jpg',
    note: 'RTX 4070 · 240 Гц',
  },
  {
    t: 'ps',
    label: 'PS5',
    name: 'Console lounge',
    n: 2,
    min: 500,
    img: '/ps.jpg',
    note: 'OLED 65″ · 4 контроллера',
  },
  {
    t: 'vr',
    label: 'VR',
    name: 'VR',
    n: 2,
    min: 700,
    img: '/vr.jpg',
    note: 'Quest 3 · зона 3×3 м',
  },
  {
    t: 'room',
    label: 'Приват',
    name: 'Приват-комната',
    n: 1,
    min: 1800,
    img: '/room.jpg',
    note: 'до 8 человек · проектор',
  },
];

const MARQ_GROUP = (
  <div className="mgrp">
    <span>ПК</span>{MG}
    <span className="o">PS5</span>{MG}
    <span>VR</span>{MG}
    <span className="o">Приват</span>{MG}
  </div>
);

export default function Home() {

  useEffect(() => {
    const spot = document.getElementById('spot');
    if (!spot) return;
    const onMove = (e) => {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <header className="panel hero">
        <div className="hgrid"></div>
        <div className="hspot" id="spot"></div>
        <div className="hglow"></div>
        {HERO_RINGS}

        <div className="hero-main">
          <h1 aria-label="Мир подождёт">
            <span className="ln" aria-hidden="true">
              {'Мир'.split('').map((c, i) => (
                <span key={i} className="ch" style={{ '--i': i }}>{c}</span>
              ))}
            </span>
            <span className="ln" aria-hidden="true">
              {'подождёт'.split('').map((c, i) => (
                <span key={i} className="ch" style={{ '--i': i + 3 }}>{c}</span>
              ))}
            </span>
          </h1>
        </div>

        <div className="live gl" aria-live="polite">
          <i></i>Свободно сегодня в 19:00
          <b>11 из 11</b>
        </div>

        <div className="hero-copy">
          <div>
            <p>Игровая зона на 11 мест: мощные ПК, PS5, VR и приватная комната для компании. Выберите место на плане — бронь займёт минуту.</p>
            <div className="cta">
              <Link className="pill solid" to="/bookings/new">Выбрать место</Link>
              <Link className="pill line" to="/places">Смотреть места</Link>
            </div>
          </div>
          <div className="stat">
            <b>14 000+</b>
            <span>часов сыграно с открытия. Каждый час — чья-то бронь.</span>
          </div>
        </div>
      </header>

      <div className="marq" aria-hidden="true">
        <div className="mtrack">
          {MARQ_GROUP}{MARQ_GROUP}{MARQ_GROUP}{MARQ_GROUP}
        </div>
      </div>

      <ZoneShowcase />

      <section className="panel band">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Как это работает</span>
            <h2 className="md">Три шага</h2>
          </div>
        </div>

        <ol className="steps">
          <li>
            <h4>Войдите</h4>
            <p>Регистрация занимает полминуты: имя, email и пароль.</p>
          </li>
          <li>
            <h4>Выберите на плане</h4>
            <p>День, время, длительность и место. Занятые места на плане заштрихованы.</p>
          </li>
          <li>
            <h4>Приходите</h4>
            <p>Бронь появится в кабинете с кодом. Изменить или отменить можно там же.</p>
          </li>
        </ol>

        <div className="cta" style={{ marginTop: 26 }}>
          <Link className="pill solid" to="/register">Создать аккаунт</Link>
          <Link className="pill line" to="/explore">Во что поиграть</Link>
        </div>
      </section>
    </>
  );
}