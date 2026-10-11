import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="panel foot">
      <div className="foot-top">
        <h3>Приходите за пять минут до начала. Остальное мы подготовим.</h3>

        <dl>
          <dt>Адрес</dt><dd>ул. Примерная, 12, вход со двора</dd>
          <dt>Часы</dt><dd>Каждый день, 12:00–02:00</dd>
          <dt>Телефон</dt><dd>+7 (900) 000-00-00</dd>
          <dt>Чат</dt><dd>@slot_zone</dd>
        </dl>
      </div>

      <nav aria-label="Нижняя навигация">
        <Link to="/">Главная</Link>
        <Link to="/places">Места</Link>
        <Link to="/explore">Во что играть</Link>
        <Link to="/dashboard">Мои брони</Link>
      </nav>

      <div className="wm" aria-hidden="true">slot</div>
    </footer>
  );
}