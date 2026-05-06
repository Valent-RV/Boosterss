import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormCard from "../components/auth/AuthFormCard.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function CompanyLoginPage() {
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
      const response = await fetch("/company/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        return;
      }

      setUser(data.user);
      showToast("Успіх", "Компанія увійшла в систему.");
      navigate("/");
    } catch (error) {
      console.log(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const disabled = !form.email.trim() || !form.password.trim();

  return (
    <AuthFormCard
      title="Вхід компанії"
      subtitle="Компанія тільки входить у систему, переглядає заявки і надсилає відповіді."
      submitLabel="Увійти"
      disabled={disabled}
      loading={authLoading}
      onSubmit={handleSubmit}
      footer={
        <>
          <Link to="/login">Вхід користувача</Link>
          <Link to="/register">Реєстрація користувача</Link>
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
