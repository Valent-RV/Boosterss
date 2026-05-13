import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormCard from "../components/auth/AuthFormCard.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function RegisterPage() {
  const { authLoading, setAuthLoading, setUser, showToast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.log(data);
        showToast("Помилка реєстрації", data.message || "Не вдалося створити акаунт.", "error");
        return;
      }

      setUser(data.user);
      showToast("Успіх", data.message || "Реєстрація завершена.");
      navigate("/");
    } catch (error) {
      console.log(error);
      showToast("Помилка реєстрації", "Сервер не відповідає. Запустіть проєкт через npm run dev.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const disabled = !form.email.trim() || !form.password.trim() || authLoading;

  return (
    <AuthFormCard
      title="Реєстрація користувача"
      subtitle="Компанії не реєструються через сайт. Тут створюється тільки акаунт користувача."
      submitLabel="Зареєструватися"
      disabled={disabled}
      loading={authLoading}
      onSubmit={handleSubmit}
      footer={
        <>
          <Link to="/login">Повернутися до входу</Link>
          <Link to="/company/login">Вхід для компанії</Link>
        </>
      }
    >
      <label className="field field--auth">
        <span>Електронна пошта</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </label>

      <label className="field field--auth">
        <span>Пароль</span>
        <input
          type="password"
          minLength="6"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
      </label>
    </AuthFormCard>
  );
}
