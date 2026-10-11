import { useEffect, useRef, useState } from 'react';

const URL_API = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=24&sortBy=Metacritic&onSale=1';

export default function Explore() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [minSave, setMinSave] = useState(0);
  const [sort, setSort] = useState('rating');
  const ctrlRef = useRef(null);

  const load = async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setStatus('loading');
    setErr('');

    try {
      const r = await fetch(URL_API, { signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('Сервис ответил ошибкой ' + r.status);
      const raw = await r.json();
      const list = raw.map(d => ({
        id: d.dealID,
        title: d.title,
        thumb: d.thumb,
        sale: +d.salePrice,
        normal: +d.normalPrice,
        save: Math.round(+d.savings),
        score: +d.metacriticScore || 0,
      }));
      setItems(list);
      setStatus('ok');
    } catch (e) {
      if (e.name === 'AbortError') return;
      setErr(e.message === 'Failed to fetch'
        ? 'Не удалось связаться с сервером. Проверьте интернет и повторите.'
        : e.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
    return () => ctrlRef.current && ctrlRef.current.abort();
  }, []);

  const filtered = items
    .filter(d =>
      d.title.toLowerCase().includes(q.trim().toLowerCase()) &&
      d.save >= minSave
    )
    .sort((a, b) =>
      sort === 'price' ? a.sale - b.sale :
      sort === 'save'  ? b.save - a.save :
                         b.score - a.score
    );

  return (
    <section className="panel pg">
      <div className="sec-head">
        <div>
          <span className="eyebrow">Внешний API · CheapShark</span>
          <h2>Во что играть</h2>
        </div>
        <p>Свежие скидки на игры в Steam — подсказка, что попробовать в зоне и что взять домой.</p>
      </div>

      <div className="toolbar">
        <label className="search">
          <span className="sr">Поиск игры</span>
          <input className="inp" type="search" placeholder="Название игры"
            value={q} onChange={e => setQ(e.target.value)} />
        </label>

        <div className="chips">
          {[[0, 'Любая скидка'], [50, 'от 50%'], [75, 'от 75%']].map(([v, t]) => (
            <button key={v} type="button" className="chip"
              aria-pressed={minSave === v}
              onClick={() => setMinSave(v)}>
              {t}
            </button>
          ))}
        </div>

        <label className="sr" htmlFor="sort">Сортировка</label>
        <select id="sort" className="inp" style={{ width: 'auto', height: 36, padding: '0 16px', fontSize: 13 }}
          value={sort} onChange={e => setSort(e.target.value)}>
          <option value="rating">По оценке</option>
          <option value="save">По скидке</option>
          <option value="price">Сначала дешёвые</option>
        </select>

        <span className="count">{status === 'ok' ? `Показано ${filtered.length} из ${items.length}` : ''}</span>
      </div>

      {status === 'loading' && (
        <div className="grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 300 }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="empty" role="alert">
          <h3>Не получилось загрузить</h3>
          <p>{err}</p>
          <button className="pill solid" onClick={load}>Повторить</button>
        </div>
      )}

      {status === 'ok' && filtered.length === 0 && (
        <div className="empty">
          <h3>{items.length ? 'Ничего не подошло' : 'Пока ничего нет'}</h3>
          <p>{items.length ? 'Попробуйте другое название или уменьшите порог скидки.' : 'Загляните позже.'}</p>
          {items.length > 0 && (
            <button className="pill line" onClick={() => { setQ(''); setMinSave(0); }}>
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {status === 'ok' && filtered.length > 0 && (
        <div className="grid">
          {filtered.map(d => (
            <article className="deal" key={d.id}>
              <img src={d.thumb} alt={`Обложка «${d.title}»`} loading="lazy" />
              <div className="in">
                <h3>{d.title}</h3>
                <div className="row">
                  <span className="badge sale">−{d.save}%</span>
                  {d.score ? <span>Metacritic {d.score}</span> : <span>без оценки</span>}
                </div>
                <div className="pr">
                  <b>${d.sale.toFixed(2)}</b>
                  <s>${d.normal.toFixed(2)}</s>
                </div>
                <a className="pill line sm"
                  href={`https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(d.id)}`}
                  target="_blank" rel="noopener noreferrer">
                  В магазин
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 26 }}>
        Данные: <a href="https://www.cheapshark.com" target="_blank" rel="noopener noreferrer">CheapShark API</a>. Цены в долларах.
      </p>
    </section>
  );
}