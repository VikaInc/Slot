import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setQ, setType, setSort, setOnlyFree, reset as resetFilters } from '../store/filtersSlice';
import { PLACES } from '../data/places';

const TYPE = { all: 'Все', pc: 'ПК', ps: 'PS5', vr: 'VR', room: 'Приват' };
const SORTS = [
  ['default', 'По порядку'],
  ['asc', 'Сначала дешёвые'],
  ['desc', 'Сначала дорогие'],
  ['name', 'По названию'],
];
const HOURS = Array.from({ length: 14 }, (_, i) => 12 + i);

const IMG = {
  pc:   '/place-pc.jpg',
  ps:   '/place-ps.jpg',
  vr:   '/place-vr.jpg',
  room: '/place-room.jpg',
};

const hash = (s) => [...s].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7);
const isBusy = (id, h) => {
  const x = Math.abs(Math.imul(hash(id) ^ (h * 2654435761), 1274126177) >>> 8) % 100;
  return x < (h >= 19 ? 55 : h >= 16 ? 35 : 15);
};
const nowStatus = (id) => {
  const h = new Date().getHours();
  if (h >= 2 && h < 12) return 'closed';
  return isBusy(id, h < 12 ? h + 24 : h) ? 'busy' : 'free';
};
const STATUS = { free: 'Свободно сейчас', busy: 'Занято сейчас', closed: 'Закрыто' };

const plural = (n) => (n === 1 ? 'место' : n < 5 ? 'места' : 'мест');
const bigLabel = (p) => {
  const m = p.n.match(/(\d+)\D*$/);
  return m ? m[1].padStart(2, '0') : 'VIP';
};

function PlaceCard({ p, i }) {
  const status = nowStatus(p.id);
  const nowH = new Date().getHours();
  const cur = nowH < 12 ? nowH + 24 : nowH;

  return (
    <Link
      className="pl-card"
      to={`/places/${p.id}`}
      style={{ '--i': i }}
      aria-label={`${p.n}, ${STATUS[status]}, ${p.r} рублей в час`}
    >
      <div className="pl-art">
        <img
          className="pl-img"
          src={IMG[p.t]}
          alt=""
          loading="lazy"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="pl-veil" />
        <span className={`pl-live ${status}`}><i />{STATUS[status]}</span>
        <span className="pl-big" aria-hidden="true">{bigLabel(p)}</span>
      </div>

      <div className="pl-body">
        <span className="pl-zone">{p.zone}</span>
        <h3>{p.n}</h3>

        <div className="pl-strip" role="img" aria-label="Занятость сегодня по часам">
          {HOURS.map((h) => (
            <i key={h} className={`${isBusy(p.id, h) ? 'b' : ''}${h === cur ? ' now' : ''}`} />
          ))}
        </div>
        <div className="pl-axis"><span>12</span><span>16</span><span>20</span><span>00</span><span>02</span></div>

        <div className="pl-foot">
          <span className="pl-cap">до {p.cap} гост.</span>
          <span className="pl-price"><b>{p.r.toLocaleString('ru-RU')}</b> ₽/час</span>
          <span className="pl-go" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function Places() {
  const dispatch = useDispatch();
  const { q, type, sort, onlyFree } = useSelector(state => state.filters);

  const counts = useMemo(() => {
    const c = { all: PLACES.length };
    PLACES.forEach((p) => { c[p.t] = (c[p.t] || 0) + 1; });
    return c;
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const res = PLACES.filter((p) =>
      (type === 'all' || p.t === type) &&
      (p.n + ' ' + p.zone).toLowerCase().includes(s) &&
      (!onlyFree || nowStatus(p.id) === 'free')
    );
    if (sort === 'asc') res.sort((a, b) => a.r - b.r);
    if (sort === 'desc') res.sort((a, b) => b.r - a.r);
    if (sort === 'name') res.sort((a, b) => a.n.localeCompare(b.n, 'ru', { numeric: true }));
    return res;
  }, [q, type, sort, onlyFree]);

  const grouped = type === 'all' && !q.trim() && sort === 'default' && !onlyFree;
  const groups = grouped
    ? list.reduce((acc, p) => {
        (acc[p.zone] ||= []).push(p);
        return acc;
      }, {})
    : null;

  const stats = [
    [PLACES.length, 'мест в зале'],
    [new Set(PLACES.map((p) => p.zone)).size, 'зоны'],
    ['от ' + Math.min(...PLACES.map((p) => p.r)), '₽ за час'],
    [PLACES.filter((p) => nowStatus(p.id) === 'free').length, 'свободно сейчас'],
  ];
  const keys = Object.keys(TYPE);

  let n = 0;

  return (
    <section className="panel pg pl">
      <div className="sec-head">
        <div>
          <h2>Места</h2>
        </div>
        <p>Выберите, где будете играть. На каждой карточке видно, когда место свободно сегодня.</p>
      </div>

      <dl className="pl-stats">
        {stats.map(([v, l]) => (
          <div key={l}><dt>{l}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="pl-bar">
        <label className="pl-search">
          <span className="sr">Поиск по названию</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" />
          </svg>
          <input
            className="inp"
            type="search"
            placeholder="Например, «ПК 3» или «диван»"
            value={q}
            onChange={(e) => dispatch(setQ(e.target.value))}
            autoComplete="off"
          />
        </label>

        <div className="pl-seg" role="group" aria-label="Тип места"
             style={{ '--n': keys.length, '--idx': keys.indexOf(type) }}>
          <span className="pl-thumb" aria-hidden="true" />
          {keys.map((k) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => dispatch(setType(k))}>
              {TYPE[k]}<sup>{counts[k] || 0}</sup>
            </button>
          ))}
        </div>

        <div className="pl-opts">
          <button
            type="button"
            className="chip"
            aria-pressed={onlyFree}
            onClick={() => dispatch(setOnlyFree(!onlyFree))}
          >
            Только свободные
          </button>
          <label className="sr" htmlFor="pl-sort">Сортировка</label>
          <select
            id="pl-sort"
            className="inp pl-sort"
            value={sort}
            onChange={(e) => dispatch(setSort(e.target.value))}
          >
            {SORTS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
      </div>

      <p className="pl-count" aria-live="polite">Найдено: {list.length} из {PLACES.length}</p>

      {list.length === 0 ? (
        <div className="empty pl-empty">
          <svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" strokeWidth="1.4"
               strokeLinecap="round" aria-hidden="true">
            <circle cx="28" cy="28" r="16" strokeDasharray="3 5" /><path d="M40 40l14 14" /><path d="M22 28h12" />
          </svg>
          <h3>Ничего не нашли</h3>
          <p>{q.trim() ? <>По запросу «{q}» </> : <>С такими фильтрами </>}мест нет.</p>
          <button className="pill line" onClick={() => dispatch(resetFilters())}>Сбросить фильтры</button>
        </div>
      ) : grouped ? (
        Object.entries(groups).map(([zone, items]) => (
          <div className="pl-group" key={zone}>
            <h3 className="pl-gh">{zone}<span>{items.length} {plural(items.length)}</span></h3>
            <div className="pl-grid">
              {items.map((p) => <PlaceCard p={p} i={n++} key={p.id} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="pl-grid" key={type + sort + onlyFree}>
          {list.map((p, i) => <PlaceCard p={p} i={i} key={p.id} />)}
        </div>
      )}
    </section>
  );
}