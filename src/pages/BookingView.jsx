import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeById, pad, fmt, price } from '../data/places';
import { getBooking, deleteBooking } from '../services/bookings';

const MON = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

const dateFromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const longDate = (d) => `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;

const STATUS = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
};

export default function BookingView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, ready } = useAuth();

  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;

    (async () => {
      try {
        const data = await getBooking(id);
        if (data.ownerId !== user.uid) {
          return nav('/403', { replace: true });
        }
        setB(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, ready, nav]);

  if (loading) {
    return (
      <section className="panel pg">
        <div className="center"><span className="spin"></span>Загружаем бронь…</div>
      </section>
    );
  }

  if (err || !b) {
    return (
      <section className="panel pg">
        <div className="err-pg">
          <span className="eyebrow">Ошибка</span>
          <div className="big">404</div>
          <h2 className="md">Бронь не найдена</h2>
          <p>{err || 'Возможно, её удалили или ссылка устарела.'}</p>
          <Link className="pill solid" to="/dashboard">Мои брони</Link>
        </div>
      </section>
    );
  }

  const p = placeById(b.placeId);
  const d = dateFromISO(b.date);
  const pr = price(p.r, b.dur);
  const code = 'SLOT-' + String(b.id).slice(-6).toUpperCase();

  const doDelete = async () => {
    try {
      await deleteBooking(b.id);
      nav('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <section className="panel pg">
      <div className="crumbs">
        <Link to="/dashboard">Мои брони</Link> / {code}
      </div>

      <div className="detail">
        <div>
          <span className="eyebrow">Бронь</span>
          <h2 className="md">{p.n}</h2>

          <dl className="detail-specs">
            <dt>Зона</dt><dd>{p.zone}</dd>
            <dt>День</dt><dd>{longDate(d)}</dd>
            <dt>Время</dt><dd>{pad(b.start)}:00 — {pad(b.start + b.dur)}:00 ({b.dur} ч)</dd>
            <dt>Место</dt><dd>{p.n} · до {p.cap} чел.</dd>
            <dt>Телефон</dt><dd>{b.phone}</dd>
            <dt>Комментарий</dt><dd>{b.comment || '—'}</dd>
            <dt>Статус</dt><dd>{STATUS[b.status] || b.status}</dd>
          </dl>

          <div className="acts" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
            <Link className="pill solid" to={`/bookings/${b.id}/edit`}>Изменить</Link>
            <button className="pill danger" onClick={() => setConfirming(true)}>Удалить</button>
          </div>
        </div>

        <aside className="sum ticket">
          <h3>{b.status === 'cancelled' ? 'Бронь отменена' : 'Бронь принята'}</h3>
          <div className="tcode">{code}</div>
          <svg viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, i) => {
              const w = 1 + ((i * 7) % 3);
              const x = i * 4.1;
              return i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="56" fill="#fff" /> : null;
            })}
          </svg>
          <p>
            {p.n}, {longDate(d)}, {pad(b.start)}:00–{pad(b.start + b.dur)}:00.
            <br />
            Итого <b>{fmt(pr.total)}</b>
            {pr.disc ? ` (скидка ${fmt(pr.disc)})` : ''}, оплата на месте.
            <br />
            Назовите код на входе.
          </p>

          <Link className="pill white" to="/dashboard" style={{ marginTop: 18 }}>
            К списку броней
          </Link>
        </aside>
      </div>

      {confirming && (
        <div className="modal" role="presentation" onClick={(e) => e.target.classList.contains('modal') && setConfirming(false)}>
          <div className="dlg" role="alertdialog" aria-modal="true">
            <h3>Удалить бронь?</h3>
            <p>{p.n}, {longDate(d)}, {pad(b.start)}:00. Это действие нельзя отменить.</p>
            <div className="acts">
              <button className="pill line" onClick={() => setConfirming(false)}>Отмена</button>
              <button className="pill danger" onClick={doDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}