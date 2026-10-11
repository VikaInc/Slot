import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeById, pad, fmt, price } from '../data/places';
import { listMyBookings, deleteBooking } from '../services/bookings';

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MON_LONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const HOURS = Array.from({ length: 14 }, (_, i) => 12 + i); // 12:00 … 01:00

const STATUS = { pending: 'Ожидает', confirmed: 'Подтверждена', cancelled: 'Отменена' };
const TABS = [['all', 'Все'], ['pending', 'Ожидают'], ['confirmed', 'Подтверждены'], ['cancelled', 'Отменены']];

const dateFromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const longDate = (d) => `${d.getDate()} ${MON_LONG[d.getMonth()]}`;
// start может быть 24 или 25 — это уже после полуночи, Date сам переносит на следующие сутки
const startOf = (b) => { const d = dateFromISO(b.date); d.setHours(b.start, 0, 0, 0); return d; };
const endOf = (b) => new Date(startOf(b).getTime() + b.dur * 3600e3);

const ruPlural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

/* «через 2 дня 3 ч» / «через 40 мин» / «идёт сейчас» */
function untilLabel(b, now) {
  const s = startOf(b), e = endOf(b);
  if (now >= s && now < e) return { text: 'Идёт сейчас', live: true };
  const min = Math.max(1, Math.round((s - now) / 60000));
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d >= 1) return { text: `через ${d} ${ruPlural(d, 'день', 'дня', 'дней')}${h ? ` ${h} ч` : ''}` };
  if (h >= 1) return { text: `через ${h} ч${m ? ` ${m} мин` : ''}` };
  return { text: `через ${m} мин` };
}

/* Полоса времени 12:00–02:00: закрашены часы брони */
function Strip({ b }) {
  return (
    <div className="db-strip" role="img"
         aria-label={`Время брони: с ${pad(b.start)}:00 до ${pad(b.start + b.dur)}:00`}>
      {HOURS.map((h) => (
        <i key={h} className={h >= b.start && h < b.start + b.dur ? 'on' : ''} />
      ))}
    </div>
  );
}

function Barcode({ seed }) {
  // декоративный штрих-код из id брони, всегда один и тот же для одной брони
  const bars = useMemo(() => {
    let x = [...String(seed)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 17);
    return Array.from({ length: 34 }, () => {
      x = (Math.imul(x, 1103515245) + 12345) | 0;
      return 1 + (Math.abs(x >> 8) % 3);
    });
  }, [seed]);
  let pos = 0;
  return (
    <svg className="db-bars" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((w, i) => { const r = <rect key={i} x={pos} y="0" width={w} height="40" />; pos += w + 1.4; return r; })}
    </svg>
  );
}

export default function Dashboard() {
  const { user, ready } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('all');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr('');
    try {
      setItems(await listMyBookings(user.uid));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  // окно подтверждения: Esc закрывает, фокус сразу на «Отмена»
  useEffect(() => {
    if (!toDelete) return;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) setToDelete(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toDelete, deleting]);

  const doDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteBooking(toDelete.id);
      setItems((prev) => prev.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } catch (e) {
      setErr(e.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // всё, что можно вычислить из items, в state не храним
  const now = new Date();
  const calc = useMemo(() => {
    const n = new Date();
    const live = items.filter((b) => b.status !== 'cancelled');
    const upcomingList = live.filter((b) => endOf(b) > n).sort((a, b) => startOf(a) - startOf(b));
    return {
      next: upcomingList[0] || null,
      upcoming: upcomingList.length,
      hours: live.reduce((s, b) => s + b.dur, 0),
      spent: live.reduce((s, b) => s + price(placeById(b.placeId).r, b.dur).total, 0),
      counts: Object.fromEntries(TABS.map(([k]) => [k, k === 'all' ? items.length : items.filter((b) => b.status === k).length])),
    };
  }, [items]);

  if (loading) {
    return (
      <section className="panel pg">
        <div className="db-skel" aria-busy="true" aria-label="Загружаем брони">
          <div className="sk" style={{ height: 70, width: '55%' }} />
          <div className="sk" style={{ height: 230 }} />
          <div className="sk" style={{ height: 96 }} />
          <div className="sk" style={{ height: 96 }} />
        </div>
      </section>
    );
  }

  const sorted = items
    .filter((b) => tab === 'all' || b.status === tab)
    .sort((a, b) => startOf(a) - startOf(b));
  const isUpcoming = (b) => b.status !== 'cancelled' && endOf(b) > now;
  const sections = tab === 'all'
    ? [
        ['Предстоящие', sorted.filter(isUpcoming)],
        ['Прошедшие и отменённые', sorted.filter((b) => !isUpcoming(b)).reverse()],
      ].filter(([, l]) => l.length)
    : [[null, sorted]];

  const name = (user.displayName || user.email || '').split(/[ @]/)[0];
  const tabIdx = TABS.findIndex(([k]) => k === tab);

  const renderRow = (b, i) => {
    const p = placeById(b.placeId);
    const d = dateFromISO(b.date);
    const pr = price(p.r, b.dur);
    const past = !isUpcoming(b);
    return (
      <article className={`db-row${past ? ' past' : ''} ${b.status}`} style={{ '--i': i }} key={b.id}>
        <div className="db-date">
          <small>{WD[d.getDay()]}</small>
          <b>{d.getDate()}</b>
          <small>{MON[d.getMonth()]}</small>
        </div>

        <div className="db-main">
          <h3><Link to={`/bookings/${b.id}`}>{p.n}</Link></h3>
          <span className="db-zone">{p.zone}</span>
        </div>

        <div className="db-when">
          <span className="db-time">{pad(b.start)}:00 — {pad(b.start + b.dur)}:00<em>{b.dur} ч · {fmt(pr.total)}</em></span>
          <Strip b={b} />
        </div>

        <span className={`badge ${b.status}`}><i />{STATUS[b.status]}</span>

        <div className="db-acts">
          <Link className="pill line sm" to={`/bookings/${b.id}`}>Открыть</Link>
          <Link className="db-ic" to={`/bookings/${b.id}/edit`} aria-label={`Изменить: ${p.n}, ${longDate(d)}`} title="Изменить">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l1-4 9.5-9.5a1.8 1.8 0 012.5 2.5L6.5 15.5 3 17zM12 5l3 3" /></svg>
          </Link>
          <button type="button" className="db-ic danger" onClick={() => setToDelete(b)}
                  aria-label={`Удалить: ${p.n}, ${longDate(d)}`} title="Удалить">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M9 9v4M11 9v4" /></svg>
          </button>
        </div>
      </article>
    );
  };

  let n = 0;
  const next = calc.next;
  const nextP = next && placeById(next.placeId);
  const until = next && untilLabel(next, now);

  return (
    <section className="panel pg db">
      <div className="sec-head">
        <div>
          <h2>Привет, {name}</h2>
        </div>
        <Link className="pill solid" to="/bookings/new">+ Новая бронь</Link>
      </div>

      {err && (
        <div className="alert bad" role="alert">
          <span style={{ flex: 1 }}>{err}</span>
          <button type="button" className="pill line sm" onClick={load}>Повторить</button>
        </div>
      )}

      {/* Ближайшая игра — главный блок страницы */}
      {next ? (
        <div className="db-next">
          <div className="db-next-l">
            <span className={`db-chip${until.live ? ' live' : ''}`}><i />{until.live ? 'Идёт сейчас' : 'Ближайшая игра'}</span>
            <h3>{nextP.n}</h3>
            <p>{nextP.zone}</p>
            <div className="db-next-t">
              <b>{pad(next.start)}:00</b><span>—</span><b>{pad(next.start + next.dur)}:00</b>
              <em>{longDate(dateFromISO(next.date))}</em>
            </div>
            <div className="db-next-s"><Strip b={next} /></div>
            <div className="db-next-a">
              <Link className="pill white" to={`/bookings/${next.id}`}>Открыть билет</Link>
              <Link className="pill ghost" to={`/bookings/${next.id}/edit`}>Изменить</Link>
            </div>
          </div>
          <div className="db-next-r">
            <span className="db-cd-l">{until.live ? 'до конца' : 'начало'}</span>
            <div className="db-cd">{until.live ? `${Math.max(1, Math.round((endOf(next) - now) / 60000))} мин` : until.text.replace('через ', '')}</div>
            <Barcode seed={next.id} />
            <span className="db-code">SLOT-{String(next.id).slice(-4).toUpperCase().padStart(4, '0')}</span>
          </div>
        </div>
      ) : (
        <div className="db-next none">
          <div className="db-next-l">
            <span className="db-chip"><i />Ближайшая игра</span>
            <h3>Пока ничего не запланировано</h3>
            <p>Выберите место на плане — бронь появится здесь с обратным отсчётом.</p>
            <div className="db-next-a"><Link className="pill white" to="/bookings/new">Забронировать</Link></div>
          </div>
        </div>
      )}

      <dl className="db-stats">
        <div><dd>{items.length}</dd><dt>всего броней</dt></div>
        <div><dd>{calc.upcoming}</dd><dt>предстоящих</dt></div>
        <div><dd>{calc.hours}</dd><dt>часов в играх</dt></div>
        <div><dd>{fmt(calc.spent)}</dd><dt>на всё время</dt></div>
      </dl>

      <div className="db-bar">
        <div className="db-seg" role="group" aria-label="Фильтр по статусу"
             style={{ '--n': TABS.length, '--idx': tabIdx }}>
          <span className="db-thumb" aria-hidden="true" />
          {TABS.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}>
              {t}<sup>{calc.counts[k]}</sup>
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="db-empty">
          <svg viewBox="0 0 96 64" width="96" height="64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
            <path d="M8 14h80v12a6 6 0 000 12v12H8V38a6 6 0 000-12V14z" strokeLinejoin="round" />
            <path d="M62 14v36" strokeDasharray="3 4" />
            <path d="M24 28h26M24 36h16" opacity=".5" />
          </svg>
          <h3>{items.length ? 'Здесь пусто' : 'Пока нет броней'}</h3>
          <p>
            {items.length
              ? `Нет броней со статусом «${STATUS[tab]}».`
              : 'Выберите место на плане — первая бронь появится здесь.'}
          </p>
          {items.length
            ? <button className="pill line" onClick={() => setTab('all')}>Показать все</button>
            : <Link className="pill solid" to="/bookings/new">Создать бронь</Link>}
        </div>
      ) : (
        sections.map(([title, list]) => (
          <div className="db-group" key={title || 'all'}>
            {title && <h3 className="db-gh">{title}<span>{list.length}</span></h3>}
            <div className="db-rows">
              {list.map((b) => renderRow(b, n++))}
            </div>
          </div>
        ))
      )}

      {toDelete && (
        <div className="modal" role="presentation"
             onClick={(e) => e.target.classList.contains('modal') && !deleting && setToDelete(null)}>
          <div className="dlg db-dlg" role="alertdialog" aria-modal="true" aria-labelledby="dd-t" aria-describedby="dd-p">
            <h3 id="dd-t">Удалить бронь?</h3>
            <p id="dd-p">Это действие нельзя отменить.</p>
            <div className="db-dlg-b">
              <b>{placeById(toDelete.placeId).n}</b>
              <span>{longDate(dateFromISO(toDelete.date))}, {pad(toDelete.start)}:00 — {pad(toDelete.start + toDelete.dur)}:00</span>
            </div>
            <div className="acts">
              <button ref={cancelRef} className="pill line" onClick={() => setToDelete(null)} disabled={deleting}>Отмена</button>
              <button className="pill danger" onClick={doDelete} disabled={deleting}>
                {deleting ? <><span className="spin" style={{ width: 14, height: 14 }} /> Удаляем…</> : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}