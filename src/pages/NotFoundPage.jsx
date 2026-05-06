import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function NotFoundPage() {
  const { isAuthenticated } = useApp();

  return (
    <div className="not-found">
      <div className="surface-card not-found__card">
        <span className="badge badge--soft">404</span>
        <h1>Сторінку не знайдено</h1>
        <p>Такого маршруту немає в маркетплейсі, тож повернімо вас до чогось корисного.</p>
        <Link className="button button--primary" to={isAuthenticated ? "/" : "/login"}>
          {isAuthenticated ? "На головну" : "До входу"}
        </Link>
      </div>
    </div>
  );
}
