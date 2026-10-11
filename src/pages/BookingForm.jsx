import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLACES, placeById, HOURS, H0, H1, pad, fmt, price } from '../data/places';
import {
  createBooking, getBooking, updateBooking, listAllBookings,
} from '../services/bookings';

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const longDate = (d) => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const TYPE_LABEL = { pc: 'ПК', ps: 'PS5', vr: 'VR', room: 'VIP' };

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

/* +7 (900) 123-45-67 — маска телефона */
const fmtPhone = (v) => {
  let d = String(v).replace(/\D/g, '');
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  let r = '+7';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 4) r += ')';
  if (d.length > 4) r += ' ' + d.slice(4, 7);
  if (d.length > 7) r += '-' + d.slice(7, 9);
  if (d.length > 9) r += '-' + d.slice(9, 11);
  return r;
};

export default function BookingForm({ edit = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [day, setDay] = useState(0);
  const [start, setStart] = useState(19);
  const [dur, setDur] = useState(2);
  const [placeId, setPlaceId] = useState(null);
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');

  const dateISO = iso(DAYS[day]);

  const busyOn = (dISO, pid, hr) =>
    all.some(b =>
      b.placeId === pid &&
      b.date === dISO &&
      b.status !== 'cancelled' &&
      hr >= b.start && hr < b.start + b.dur &&
      (!edit || b.id !== id)
    );
  const busy = (pid, hr) => busyOn(dateISO, pid, hr);

  const freeCount = (hr) => PLACES.filter(p => !busy(p.id, hr)).length;

  // доля свободных мест вечером — для полоски под датой
  const freeShare = (i) => {
    const d = iso(DAYS[i]);
    let f = 0;
    [16, 18, 20, 22].forEach(h => { f += PLACES.filter(p => !busyOn(d, p.id, h)).length; });
    return Math.round(f / (4 * PLACES.length) * 100);
  };

  useEffect(() => {
    (async () => {
      try {
        const bookings = await listAllBookings();
        setAll(bookings);
        if (edit) {
          const b = await getBooking(id);
          if (b.ownerId !== user.uid) return nav('/403', { replace: true });
          const di = DAYS.findIndex(d => iso(d) === b.date);
          setDay(di < 0 ? 0 : di);
          setStart(b.start);
          setDur(b.dur);
          setPlaceId(b.placeId);
          setPhone(fmtPhone(b.phone || ''));
          setComment(b.comment || '');
        }
      } catch (e) {
        setTop('Не удалось загрузить: ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [edit, id, user.uid, nav]);

  if (loading) {
    return (
      <section className="panel pg">
        <div className="bf-skel" aria-busy="true" aria-label="Загружаем">
          <div className="sk" style={{ height: 96 }} />
          <div className="sk" style={{ height: 120 }} />
          <div className="sk" style={{ height: 320 }} />
        </div>
      </section>
    );
  }

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 11;

  const validate = () => {
    const f = {};
    if (!placeId) f.placeId = 'Выберите место на плане';
    if (!(dur >= 1 && dur <= 5)) f.dur = 'От 1 до 5 часов';
    else if (start + dur > H1) f.dur = 'Зона закрывается в 02:00';
    if (!phoneOk) f.phone = 'Введите телефон полностью';
    if (comment.length > 200) f.comment = 'Не больше 200 символов';
    return f;
  };

  const onPhone = (e) => {
    const raw = e.target.value;
    const d = raw.replace(/\D/g, '');
    const prev = phone.replace(/\D/g, '');
    // удаление «служебного» символа маски должно стирать цифру, а не зацикливаться
    setPhone(raw.length < phone.length && d === prev ? fmtPhone(prev.slice(0, -1)) : fmtPhone(raw));
    if (errs.phone) setErrs({ ...errs, phone: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const f = validate();
    setErrs(f);
    setTop('');
    if (Object.keys(f).length) return;

    const data = {
      placeId, date: dateISO, start, dur,
      phone: phone.trim(), comment: comment.trim(),
    };

    setSaving(true);
    try {
      if (edit) {
        await updateBooking(id, data);
        nav('/dashboard');
      } else {
        const newId = await createBooking(data, user);
        nav('/bookings/' + newId);
      }
    } catch (e) {
      setTop('Ошибка сохранения: ' + e.message);
      setSaving(false);
    }
  };

  const p = placeId ? placeById(placeId) : null;
  const pr = p ? price(p.r, dur) : null;

  const checks = [
    ['Дата и время выбраны', true],
    ['Место выбрано на плане', !!p],
    ['Телефон указан', phoneOk],
  ];
  const doneCount = checks.filter(c => c[1]).length;
  const activeStep = checks.findIndex(c => !c[1]);
  const STEPS = ['Дата и время', 'Место', 'Контакты'];

  return (
    <section className="panel pg">
      <div className="crumbs">
        <Link to="/dashboard">Мои брони</Link> / {edit ? 'Редактирование' : 'Новая бронь'}
      </div>

      <div className="sec-head">
        <div>
          <span className="eyebrow">{edit ? 'Изменить бронь' : 'Новая бронь'}</span>
          <h2 className="md">{edit ? 'Изменить' : 'Выберите место'}</h2>
        </div>
        <p>Высота столбика — сколько мест свободно в этот час. Нажмите на место на плане.</p>
      </div>

      <ol className="bf-steps" aria-label="Шаги брони">
        {STEPS.map((s, i) => (
          <li key={s} className={checks[i][1] ? 'done' : i === activeStep ? 'on' : ''}>
            <b>{checks[i][1] ? '✓' : i + 1}</b><span>{s}</span>
          </li>
        ))}
      </ol>

      {top && <div className="alert bad" role="alert">{top}</div>}

      <form className="b-grid bf" onSubmit={submit} noValidate>
        <div>
          <div className="ctl">
            <h4><span>День</span><span>{longDate(DAYS[day])}</span></h4>
            <div className="dates">
              {DAYS.map((d, i) => (
                <button type="button" key={i} className="date" aria-pressed={i === day}
                  aria-label={longDate(d)}
                  onClick={() => { setDay(i); setErrs({}); }}>
                  <small>{i === 0 ? 'сегодня' : WD[d.getDay()]}</small>
                  <b>{d.getDate()}</b>
                  <u style={{ '--free': freeShare(i) + '%' }} />
                </button>
              ))}
            </div>
          </div>

          <div className="ctl">
            <h4>
              <span>Начало</span>
              <span>в {pad(start)}:00 свободно {freeCount(start)} из {PLACES.length}</span>
            </h4>
            <div className="hours">
              {HOURS.map(h => {
                const fc = freeCount(h);
                const inRange = h >= start && h < start + dur;
                return (
                  <button type="button" key={h} className={'hr' + (inRange ? ' in' : '')}
                    disabled={fc === 0}
                    aria-label={`${pad(h)}:00, свободно мест: ${fc}`}
                    onClick={() => { setStart(h); if (h + dur > H1) setDur(H1 - h); }}>
                    <i style={{ height: Math.max(3, fc / PLACES.length * 58) + 'px' }}></i>
                    {pad(h)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ctl2">
            <div className="ctl">
              <h4><span>Сколько играем</span><span>до {pad(start + dur)}:00</span></h4>
              <div className="durrow">
                {[1,2,3,4,5].map(d => (
                  <button type="button" key={d} className="chip" aria-pressed={d === dur}
                    disabled={start + d > H1}
                    onClick={() => setDur(d)}>
                    {d} ч
                  </button>
                ))}
                <em>От 3 часов скидка 10%</em>
              </div>
              {errs.dur && <span className="err" role="alert">{errs.dur}</span>}
            </div>

            <div className="ctl">
              <h4>Вместимость места</h4>
              <div className="party">
                <b>{p ? p.cap : '—'}</b>
                <em>{p ? `До ${p.cap} человек` : 'Сначала выберите место'}</em>
              </div>
            </div>
          </div>

          <div className="mapbox">
            <Plan
              placeId={placeId}
              setPlaceId={(v) => { setPlaceId(v); setErrs(e => ({ ...e, placeId: undefined })); }}
              dateISO={dateISO}
              start={start}
              dur={dur}
              all={all}
              editId={edit ? id : null}
              user={user}
            />
            {errs.placeId && <span className="err" role="alert">{errs.placeId}</span>}
          </div>

          <div className="ctl" style={{ marginTop: 14 }}>
            <label className="field">
              <span>Телефон для связи</span>
              <input className="inp" value={phone} onChange={onPhone}
                type="tel" inputMode="tel" autoComplete="tel"
                placeholder="+7 (___) ___-__-__" aria-invalid={!!errs.phone} />
              {errs.phone && <span className="err" role="alert">{errs.phone}</span>}
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="bf-lbl">Комментарий (необязательно)
                <em className={comment.length > 200 ? 'over' : ''}>{comment.length}/200</em>
              </span>
              <textarea className="inp" value={comment} onChange={e => setComment(e.target.value)}
                maxLength={220} placeholder="Например: день рождения, нужна приглушённая подсветка" />
              {errs.comment && <span className="err" role="alert">{errs.comment}</span>}
            </label>
          </div>
        </div>

        <aside className="sum">
          <h3>Ваша бронь</h3>
          <div className="when">
            {longDate(DAYS[day])}
            <b>{pad(start)}:00 — {pad(start + dur)}:00</b>
          </div>

          {p ? (
            <div className="sum-place">
              <span className="sum-ico">{TYPE_LABEL[p.t]}</span>
              <div><b>{p.n}</b><small>{p.zone} · до {p.cap} чел.</small></div>
            </div>
          ) : (
            <div className="sum-place off">
              <span className="sum-ico">?</span>
              <div><b>Место не выбрано</b><small>Нажмите на план слева</small></div>
            </div>
          )}

          <ul className="lines">
            {p && <li><span>{fmt(p.r)} × {dur} ч</span><span>{fmt(pr.sum)}</span></li>}
            {pr && pr.disc > 0 && <li className="sum-disc"><span>Скидка 10% за 3+ часа</span><span>−{fmt(pr.disc)}</span></li>}
          </ul>

          <div className="sum-perf" aria-hidden="true" />

          <div className="total">
            <span>Итого</span>
            <b>{pr ? fmt(pr.total) : '0 ₽'}</b>
          </div>

          <div className="sum-meter" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={doneCount}
               aria-label="Готовность брони">
            <i style={{ width: (doneCount / 3 * 100) + '%' }} />
          </div>
          <ul className="sum-checks">
            {checks.map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}>{t}</li>)}
          </ul>

          <button className="pill white" type="submit" disabled={saving}>
            {saving
              ? <><span className="spin" style={{ width: 16, height: 16 }} /> Сохраняем…</>
              : edit ? 'Сохранить изменения' : 'Забронировать'}
          </button>
          <Link className="pill ghost" to="/dashboard" style={{ marginTop: 8 }}>Отмена</Link>
          <p className="note">Оплата на месте. Бронь на имя: {user.displayName || user.email}.</p>
        </aside>
      </form>
    </section>
  );
}

/* ---------- План этажа ---------- */
function Plan({ placeId, setPlaceId, dateISO, start, dur, all, editId, user }) {
  const [hint, setHint] = useState('');

  const busy = (pid, hr) =>
    all.some(b =>
      b.placeId === pid && b.date === dateISO && b.status !== 'cancelled' &&
      hr >= b.start && hr < b.start + b.dur && b.id !== editId
    );
  const mineAt = (pid, hr) =>
    all.some(b =>
      b.ownerId === user.uid && b.placeId === pid && b.date === dateISO &&
      b.status !== 'cancelled' && hr >= b.start && hr < b.start + b.dur && b.id !== editId
    );
  const state = (pid) => {
    for (let h = start; h < start + dur; h++) {
      if (busy(pid, h)) return 'busy';
      if (mineAt(pid, h)) return 'mine';
    }
    return 'free';
  };

  const seat = (id, inner) => {
    const st = state(id);
    const pl = placeById(id);
    const pick = () => {
      if (st === 'busy') return setHint(`${pl.n} занято на это время`);
      if (st === 'mine') return setHint('У вас уже есть бронь на это время');
      setPlaceId(placeId === id ? null : id);
    };
    return (
      <g key={id}
        className={'unit ' + (placeId === id ? 'sel ' : '') + (st === 'busy' ? 'busy ' : '') + (st === 'mine' ? 'mine' : '')}
        onClick={pick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}
        onMouseEnter={() => setHint(`${pl.n} · ${fmt(pl.r)}/час`)}
        onMouseLeave={() => setHint('')}
        onFocus={() => setHint(`${pl.n} · ${fmt(pl.r)}/час`)}
        onBlur={() => setHint('')}
        tabIndex={0} role="button" aria-pressed={placeId === id}
        aria-label={`${pl.n}, ${st === 'busy' ? 'занято' : st === 'mine' ? 'ваша бронь' : 'свободно'}, ${fmt(pl.r)} в час`}>
        {inner}
      </g>
    );
  };

  const pcXs = [52, 166, 280];

  return (
    <>
    <svg viewBox="0 0 720 470" role="group" aria-label="План игровой зоны">
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect className="hp-bg" width="6" height="6"/>
          <line className="hp-ln" x1="0" y1="0" x2="0" y2="6"/>
        </pattern>
      </defs>

      <path className="wall" d="M60 456 H14 V14 H706 V456 H150"/>
      <path d="M60 456 A90 90 0 0 1 150 366" fill="none" stroke="var(--silver)" strokeWidth="1" strokeDasharray="3 4"/>
      <text className="zt2" x="80" y="446">вход</text>

      <rect className="zone" x="30" y="30" width="356" height="216" rx="18"/>
      <text className="zt2" x="46" y="52">PC Arena</text>
      <rect className="zone" x="404" y="30" width="286" height="216" rx="18"/>
      <text className="zt2" x="420" y="52">Console lounge</text>
      <rect className="zone" x="256" y="274" width="222" height="166" rx="18"/>
      <text className="zt2" x="272" y="296">VR</text>
      <rect className="zone" x="494" y="266" width="196" height="174" rx="18"/>
      <text className="zt2" x="510" y="288">Приват-комната</text>
      <rect x="34" y="290" width="160" height="46" rx="10" fill="var(--hair)" stroke="var(--ink)" strokeWidth="1.3"/>
      <text className="zt2" x="46" y="318" style={{ fill: 'var(--ink)' }}>стойка и бар</text>

      {Array.from({ length: 6 }).map((_, i) => {
        const x = pcXs[i % 3];
        const y = i < 3 ? 70 : 156;
        const cy = y + 44 + 19;
        return seat('pc' + (i + 1), (
          <>
            <rect x={x - 6} y={y - 8} width="98" height="105" fill="transparent"/>
            <rect className="sh" x={x} y={y} width="86" height="44" rx="8"/>
            <line className="dt" x1={x + 22} y1={y + 11} x2={x + 64} y2={y + 11}/>
            <circle className="sh" cx={x + 43} cy={cy} r="12"/>
            <text className="id" x={x + 43} y={y + 31} textAnchor="middle">
              {String(i + 1).padStart(2, '0')}
            </text>
          </>
        ));
      })}

      {[[424, 'ps1'], [556, 'ps2']].map(([x, pid], k) => seat(pid, (
        <>
          <rect x={x - 4} y="66" width="128" height="160" fill="transparent"/>
          <rect className="sh" x={x + 6} y="76" width="100" height="10" rx="3"/>
          <rect className="sh" x={x + 30} y="124" width="52" height="24" rx="8"/>
          <rect className="sh" x={x} y="170" width="112" height="46" rx="16"/>
          <line className="dt" x1={x + 14} y1="182" x2={x + 98} y2="182"/>
          <text className="id" x={x + 56} y="204" textAnchor="middle">0{k + 1}</text>
        </>
      )))}

      {[[318, 'vr1'], [416, 'vr2']].map(([cx, pid], k) => seat(pid, (
        <>
          <circle className="sh dash" cx={cx} cy="368" r="44"/>
          <rect className="sh" x={cx - 16} y="358" width="32" height="14" rx="6"/>
          <line className="dt" x1={cx - 9} y1="365" x2={cx + 9} y2="365"/>
          <text className="id" x={cx} y="398" textAnchor="middle">0{k + 1}</text>
        </>
      )))}

      {seat('room', (
        <>
          <rect x="504" y="296" width="176" height="134" fill="transparent"/>
          <rect className="sh" x="552" y="340" width="82" height="38" rx="10"/>
          {[[566,326],[592,326],[618,326],[566,392],[592,392],[618,392],[540,359],[644,359]].map(([x, y], i) => (
            <circle className="sh" key={i} cx={x} cy={y} r="9"/>
          ))}
          <line className="dt" x1="566" y1="349" x2="620" y2="349"/>
          <text className="id" x="593" y="364" textAnchor="middle">8</text>
        </>
      ))}
    </svg>

    <div className="legend">
      <span><i></i>свободно</span>
      <span><i className="b"></i>занято</span>
      <span><i className="s"></i>ваш выбор</span>
      <span><i className="m"></i>ваша бронь</span>
      <div id="hint" aria-live="polite">{hint}</div>
    </div>
    </>
  );
}