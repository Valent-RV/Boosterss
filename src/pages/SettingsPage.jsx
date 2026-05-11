import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function SettingsPage() {
  const { isCompany, setUser, showToast, user } = useApp();
  const storageKey = `taskero_profile_${user?.email || "guest"}`;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    city: "",
    phone: "",
    bio: "",
    company: "",
    emailNotifications: true,
    pushNotifications: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setForm({
          fullName: saved.fullName || user?.name || "",
          email: saved.email || user?.email || "",
          city: saved.city || "",
          phone: saved.phone || "",
          bio: saved.bio || "",
          company: saved.company || "",
          emailNotifications: saved.emailNotifications ?? true,
          pushNotifications: saved.pushNotifications ?? true
        });
        return;
      } catch {
      }
    }

    setForm((current) => ({
      ...current,
      fullName: user?.name || "",
      email: user?.email || ""
    }));
  }, [storageKey, user?.email, user?.name]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaving(true);

    const nextProfile = {
      ...form
    };

    window.localStorage.setItem(storageKey, JSON.stringify(nextProfile));

    setUser((current) => ({
      ...current,
      name: form.fullName || current?.name,
      email: form.email || current?.email
    }));

    showToast("Успіх", "Налаштування збережено.");
    setSaving(false);
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <h1>Налаштування</h1>
          <p>
            {isCompany
              ? "Тут можна змінити дані кабінету компанії."
              : "Тут можна змінити дані кабінету користувача."}
          </p>
        </div>
      </section>

      <div className="settings-layout">
        <form className="surface-card settings-form" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Основні дані</h2>
              <p>Проста локальна форма без складної синхронізації.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>{isCompany ? "Назва" : "Ім’я"}</span>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Місто</span>
              <input
                type="text"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Телефон</span>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
          </div>

          {isCompany ? (
            <label className="field">
              <span>Компанія</span>
              <input
                type="text"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Про себе</span>
            <textarea
              rows="4"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </label>

          <div className="section-header">
            <div>
              <h2>Сповіщення</h2>
              <p>Зберігаються локально в цьому браузері.</p>
            </div>
          </div>

          <div className="settings-switches">
            <label className="switch-field">
              <div>
                <strong>Email-сповіщення</strong>
                <p>Отримувати базові оновлення по заявках.</p>
              </div>
              <input
                type="checkbox"
                checked={form.emailNotifications}
                onChange={(event) =>
                  setForm({ ...form, emailNotifications: event.target.checked })
                }
              />
            </label>

            <label className="switch-field">
              <div>
                <strong>Push-сповіщення</strong>
                <p>Локальний перемикач для тестової версії.</p>
              </div>
              <input
                type="checkbox"
                checked={form.pushNotifications}
                onChange={(event) =>
                  setForm({ ...form, pushNotifications: event.target.checked })
                }
              />
            </label>
          </div>

          <div className="settings-form__actions">
            <button
              className="button button--primary"
              type="submit"
              disabled={saving || !form.fullName.trim() || !form.email.trim()}
            >
              {saving ? "Зберігаємо..." : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
