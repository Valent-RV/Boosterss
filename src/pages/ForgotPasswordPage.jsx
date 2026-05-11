import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormCard from "../components/auth/AuthFormCard.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function ForgotPasswordPage() {
  const { authLoading, showToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    showToast("Інформація", "Для цієї версії відновлення пароля поки спрощене.");
    navigate("/login");
  };

  return (
    <AuthFormCard
      title="Відновлення пароля"
      subtitle="У студентській версії це проста заглушка без окремого бекенд-роута."
      submitLabel="Повернутися до входу"
      disabled={!email.trim()}
      loading={authLoading}
      onSubmit={handleSubmit}
      footer={
        <>
          <Link to="/login">Повернутися до входу</Link>
          <Link to="/register">Створити акаунт</Link>
        </>
      }
    >
      <label className="field field--auth">
        <span>Електронна пошта</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
    </AuthFormCard>
  );
}
