import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero__badge">Маркетплейс Taskero</div>
        <h1>Створюємо майбутнє послуг</h1>
        

       
      </section>

      <section className="auth-panel">
        <Outlet />
      </section>
    </div>
  );
}
