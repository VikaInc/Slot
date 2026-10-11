import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { placeById, PLACES } from '../data/places';

const HOURS = Array.from({ length: 14 }, (_, i) => 12 + i);
const IMG = {
  pc:   '/place-pc.jpg',
  ps:   '/place-ps.jpg',
  vr:   '/place-vr.jpg',
  room: '/place-room.jpg',
};
const SPEC = {
  pc:   [['Видеокарта', 'RTX 4070'], ['Экран', '240 Гц'], ['Периферия', 'механика, наушники']],
  ps:   [['Консоль', 'PS5'], ['Экран', 'OLED 65″'], ['Контроллеров', '4']],
  vr:   [['Шлем', 'Quest 3'], ['Зона', '3×3 м'], ['Инструктор', 'на месте']],
  room: [['Техника', 'ПК и консоль'], ['Свет', 'регулируется'], ['Экран', 'проектор 120″']],
};
const DESC = {
  pc:   'Монитор 240 Гц, механическая клавиатура и закрытые наушники. Между столами оставлено расстояние, чтобы не мешать соседу.',
  ps:   'Диван напротив OLED-телевизора. PS5 и четыре контроллера, рядом столик под напитки.',
  vr:   'Кабина со свободной зоной 3×3 метра. Инструктор поможет надеть шлем и подберёт игру под уровень.',
  room: 'Отдельная комната на восьмерых: большой экран, своя акустика и приглушаемый свет. Подходит для дней рождения.',
};

const isBusy = (id, h) =>
  (h >= 19 ? 55 : h >= 16 ? 35 : 15) >
  (Math.abs(
    [...id].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) ^ (h * 2654435761)
  ) >>> 8) % 100;

export default function PlaceDetail() {
  const { id } = useParams();
  const p = placeById(id);

  if (!p) {
    return (
      <section className="panel pg">
        <div className="err-pg">
          <span className="eyebrow">404</span>
          <div className="big">404</div>
          <h2 className="md">Такого места нет</h2>
          <p>Проверьте адрес или вернитесь к списку.</p>
          <Link className="pill solid" to="/places">Все места</Link>
        </div>
      </section>
    );
  }

  const others = PLACES.filter(x => x.t === p.t && x.id !== p.id).slice(0, 3);
  const nowH = new Date().getHours();
  const busyNow = isBusy(p.id, nowH < 12 ? nowH + 24 : nowH);

  return (
    <section className="panel pg">
      <div className="crumbs">
        <Link to="/places">Места</Link> / {p.zone} / {p.n}
      </div>

      <div className="detail">
        <div>
          <div className="detail-hero">
            <img
              className="detail-img"
              src={IMG[p.t]}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="detail-badge">{p.zone}</span>
            <b className="detail-big" aria-hidden="true">{p.n.split(' ')[0]}</b>
          </div>

          <div style={{ marginTop: 28 }}>
            <span className="eyebrow">/places/{p.id}</span>
            <h2 className="md">{p.n}</h2>
            <p className="muted" style={{ maxWidth: 520, marginTop: 16, fontSize: 14, lineHeight: 1.55 }}>
              {DESC[p.t]}
            </p>

            <dl className="detail-specs">
              <dt>Зона</dt><dd>{p.zone}</dd>
              {SPEC[p.t].map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt><dd>{v}</dd>
                </React.Fragment>
              ))}
              <dt>Вместимость</dt><dd>до {p.cap} чел.</dd>
              <dt>Цена</dt><dd>{p.r.toLocaleString('ru-RU')} ₽/час</dd>
            </dl>

            {others.length > 0 && (
              <>
                <h4 className="muted" style={{ fontWeight: 500, fontSize: 12, margin: '24px 0 10px' }}>
                  Другие места зоны
                </h4>
                <div className="chips">
                  {others.map(o => (
                    <Link key={o.id} className="chip" to={`/places/${o.id}`}>{o.n}</Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="sum">
          <h3>Сегодня</h3>
          <div className="when">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            <b>12:00 — 02:00</b>
          </div>
          <div className="strip" role="img" aria-label="Занятость сегодня">
            {HOURS.map(h => (
              <i key={h} className={isBusy(p.id, h) ? 'b' : ''} title={`${h % 24}:00`} />
            ))}
          </div>
          <div className="strip-l"><span>12</span><span>16</span><span>20</span><span>00</span><span>02</span></div>

          <div className="total">
            <span>Цена</span>
            <b>{p.r.toLocaleString('ru-RU')} ₽</b>
          </div>
          <div className="disc">От 3 часов скидка 10%</div>

          <Link className="pill white" to={`/bookings/new?place=${p.id}`}>
            Забронировать
          </Link>

          <p className="note">
            {busyNow ? 'Сейчас место занято, но есть свободные часы.' : 'Место свободно — можно бронировать.'}
          </p>
        </aside>
      </div>
    </section>
  );
}