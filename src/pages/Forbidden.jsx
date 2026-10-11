import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <section className="panel pg">
      <div className="err-pg">
        <span className="eyebrow">Ошибка доступа</span>
        <div className="big" aria-hidden="true">403</div>
        <h2 className="md">Нет доступа</h2>

        <div className="cta">
          <Link className="pill solid" to="/dashboard">В мои брони</Link>
          <Link className="pill line" to="/">На главную</Link>
        </div>
      </div>
    </section>
  );
}