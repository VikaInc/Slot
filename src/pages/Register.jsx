import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' });
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const f = {};
    if (!form.name || form.name.trim().length < 2) f.name = 'Минимум 2 символа';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) f.email = 'Введите email в формате name@mail.ru';
    if (!form.password || form.password.length < 6) f.password = 'Минимум 6 символов';
    if (form.password2 !== form.password) f.password2 = 'Пароли не совпадают';
    return f;
  };

  const submit = async (e) => {
    e.preventDefault();
    const f = validate();
    setErrs(f);
    setTop('');
    if (Object.keys(f).length) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name.trim() });
      nav('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrs({ email: 'Этот email уже зарегистрирован' });
      } else {
        setTop('Ошибка: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel pg">
      <div className="auth">
        <div>
          <h2>Регистрация</h2>
          <p className="muted" style={{ maxWidth: 380, marginTop: 20 }}>
            Аккаунт нужен, чтобы создавать брони и управлять ими.
          </p>
        </div>

        <form className="formcard" onSubmit={submit} noValidate>
          {top && <div className="alert bad">{top}</div>}

          <label className="field">
            <span>Имя</span>
            <input className="inp" value={form.name} onChange={set('name')} aria-invalid={!!errs.name}/>
            <span className="err">{errs.name}</span>
          </label>

          <label className="field">
            <span>Email</span>
            <input className="inp" type="email" value={form.email} onChange={set('email')} aria-invalid={!!errs.email}/>
            <span className="err">{errs.email}</span>
          </label>

          <label className="field">
            <span>Пароль (минимум 6 символов)</span>
            <input className="inp" type="password" value={form.password} onChange={set('password')} aria-invalid={!!errs.password}/>
            <span className="err">{errs.password}</span>
          </label>

          <label className="field">
            <span>Повторите пароль</span>
            <input className="inp" type="password" value={form.password2} onChange={set('password2')} aria-invalid={!!errs.password2}/>
            <span className="err">{errs.password2}</span>
          </label>

          <button className="pill solid" disabled={loading}>
            {loading ? <span className="spin" style={{ width: 16, height: 16 }}/> : 'Создать аккаунт'}
          </button>

          <p className="alt">Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </form>
      </div>
    </section>
  );
}