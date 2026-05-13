import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormCard from "../components/auth/AuthFormCard.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function LoginPage() {
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
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.log(data);
        showToast("Помилка входу", data.message || "Не вдалося увійти. Перевірте логін, пароль і сервер.", "error");
        return;
      }

      setUser(data.user);
      showToast("Успіх", "Ви увійшли як користувач.");
      navigate("/");
    } catch (error) {
      console.log(error);
      showToast("Помилка входу", "Сервер не відповідає. Запустіть проєкт через npm run dev.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const disabled = !form.email.trim() || !form.password.trim();

  return (
    <AuthFormCard
      title="Вхід користувача"
      subtitle="Увійдіть у просту версію сайту, де можна створювати заявки і дивитися відповіді."
      submitLabel="Увійти"
      disabled={disabled}
      loading={authLoading}
      onSubmit={handleSubmit}
      footer={
        <>
          <Link to="/forgot-password">Забули пароль?</Link>
          <Link to="/register">Створити акаунт</Link>
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
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
      </label>
    </AuthFormCard>
  );
}
