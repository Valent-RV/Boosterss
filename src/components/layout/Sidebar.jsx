import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";

export default function Sidebar() {
  const { isCompany, logout, user } = useApp();
  const navigate = useNavigate();
  const navItems = [
    { label: "Головна", path: "/" },
    { label: isCompany ? "Надіслані відповіді" : "Мої відповіді", path: "/history" },
    { label: "Налаштування", path: "/settings" }
  ];

  return (
    <aside className="sidebar">
      <button className="sidebar__brand" onClick={() => navigate("/")}>
        <span className="sidebar__brand-mark">T</span>
        <div>
          <strong>Taskero</strong>
          <span>Маркетплейс послуг</span>
        </div>
      </button>

      <button
        className="sidebar__profile"
        type="button"
        onClick={() => navigate("/settings")}
      >
        <span className="sidebar__avatar">{isCompany ? "CO" : "US"}</span>
        <div>
          <strong>{user?.name || user?.email || "Гість"}</strong>
          <span>{isCompany ? "Кабінет компанії" : "Кабінет користувача"}</span>
        </div>
      </button>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
            to={item.path}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="button button--ghost button--full" onClick={logout}>
          Вийти
        </button>
      </div>

      <div className="sidebar__note">
        <strong>Проста версія</strong>
        <span>Користувачі створюють заявки, компанії відгукуються на них.</span>
      </div>
    </aside>
  );
}
