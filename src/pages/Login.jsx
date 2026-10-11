import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const f = {};
    if (!form.email) f.email = 'Введите email';
    if (!form.password) f.password = 'Введите пароль';
    setErrs(f);
    setTop('');
    if (Object.keys(f).length) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      nav(from, { replace: true });
    } catch (err) {
      setTop('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel pg">
      <div className="auth">
        <div>
          <h2>Вход</h2>
        </div>

        <form className="formcard" onSubmit={submit} noValidate>
          {loc.state?.from && (
            <div className="alert info">
              Войдите, чтобы открыть Кабинет.
            </div>
          )}
          {top && <div className="alert bad">{top}</div>}

          <label className="field">
            <span>Email</span>
            <input className="inp" type="email" value={form.email} onChange={set('email')} aria-invalid={!!errs.email}/>
            <span className="err">{errs.email}</span>
          </label>

          <label className="field">
            <span>Пароль</span>
            <input className="inp" type="password" value={form.password} onChange={set('password')} aria-invalid={!!errs.password}/>
            <span className="err">{errs.password}</span>
          </label>

          <button className="pill solid" disabled={loading}>
            {loading ? <span className="spin" style={{ width: 16, height: 16 }}/> : 'Войти'}
          </button>

          <p className="alt">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
        </form>
      </div>
    </section>
  );
}