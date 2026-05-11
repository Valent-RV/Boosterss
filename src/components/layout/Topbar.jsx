import { useApp } from "../../context/AppContext.jsx";

export default function Topbar() {
  const { isCompany, user } = useApp();

  return (
    <header className="topbar">
      <div>
        <strong>{isCompany ? "Панель компанії" : "Панель користувача"}</strong>
        <p className="topbar__subtitle">{user?.email || "Локальна сесія"}</p>
      </div>

      <div className="topbar__actions">
        <span className="badge badge--outline">{isCompany ? "Компанія" : "Користувач"}</span>
      </div>
    </header>
  );
}
