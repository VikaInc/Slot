import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="panel pg">
      <div className="err-pg">

        <div className="big" aria-hidden="true">404</div>
        <h2 className="md">Тут пусто</h2>
        <p>Такой страницы нет. Возможно, ссылка устарела.</p>
        <div className="cta">
          <Link className="pill solid" to="/">На главную</Link>
          <Link className="pill line" to="/places">Смотреть места</Link>
        </div>
      </div>
    </section>
  );
}