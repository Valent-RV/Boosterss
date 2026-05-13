import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ServiceCard from "../components/marketplace/ServiceCard.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useApp } from "../context/AppContext.jsx";

const emptyRequestForm = {
  title: "",
  description: "",
  price: "",
  cityId: "",
  typeId: "",
  clientName: ""
};

const defaultCities = [
  { id: "1", name: "Київ" },
  { id: "2", name: "Львів" },
  { id: "3", name: "Одеса" }
];

const defaultTypes = [
  { id: "1", name: "Прибирання" },
  { id: "2", name: "Ремонт" },
  { id: "3", name: "Перевезення" }
];

export default function HomePage() {
  const { isCompany, showToast, user } = useApp();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [cities, setCities] = useState(defaultCities);
  const [types, setTypes] = useState(defaultTypes);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [requestForm, setRequestForm] = useState({
    ...emptyRequestForm,
    clientName: user?.name || user?.email || ""
  });
  const [responseForm, setResponseForm] = useState({
    zamId: "",
    text: ""
  });

  const storageKey = `taskero_requests_${user?.email || "guest"}`;
  const [myRequestIds, setMyRequestIds] = useState(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  const getRequests = async () => {
    setLoading(true);

    try {
      const response = await fetch("/requests");
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        setLoading(false);
        return;
      }

      setRequests(data.requests || []);
      setCities(data.cities?.length ? data.cities : defaultCities);
      setTypes(data.types?.length ? data.types : defaultTypes);
    } catch (error) {
      console.log(error);
      showToast("Помилка", "Не вдалося завантажити заявки. Перевірте, чи запущений сервер.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRequests();
  }, []);

  useEffect(() => {
    setRequestForm((current) => ({
      ...current,
      clientName: current.clientName || user?.name || user?.email || ""
    }));
  }, [user]);

  const baseList = isCompany
    ? requests.filter((item) => !item.firmId)
    : requests.filter((item) => {
        const ownerNames = [user?.name, user?.email].filter(Boolean);

        return (
          myRequestIds.includes(item.id) ||
          item.clientEmail === user?.email ||
          ownerNames.includes(item.clientName)
        );
      });

  const filteredRequests = baseList.filter((item) => {
    const matchesSearch = String(item.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesCity = !cityId || item.cityId === cityId;
    const matchesType = !typeId || item.typeId === typeId;

    return matchesSearch && matchesCity && matchesType;
  });

  const handleCreateRequest = async (event) => {
    event.preventDefault();

    if (!requestForm.title.trim() || !requestForm.description.trim() || !requestForm.cityId || !requestForm.typeId) {
      showToast("Заповніть форму", "Назва, опис, місто і категорія обов’язкові.", "error");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...requestForm,
          email: user?.email || ""
        })
      });
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        showToast("Помилка", data.message || "Не вдалося створити заявку.", "error");
        return;
      }

      const nextIds = [data.request.id, ...myRequestIds];
      window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
      setMyRequestIds(nextIds);
      setRequestForm({
        ...emptyRequestForm,
        clientName: user?.name || user?.email || ""
      });
      setFormOpen(false);
      showToast("Успіх", "Заявку створено.");
      getRequests();
    } catch (error) {
      console.log(error);
      showToast("Помилка", "Не вдалося створити заявку. Перевірте, чи запущений сервер.", "error");
    } finally {
      setCreating(false);
    }
  };

  const sendResponse = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          zamId: responseForm.zamId,
          firmId: user?.firmId,
          text: responseForm.text
        })
      });
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        showToast("Помилка", data.message || "Не вдалося надіслати відповідь.", "error");
        return;
      }

      setResponseForm({
        zamId: "",
        text: ""
      });
      showToast("Успіх", "Відповідь надіслано.");
      getRequests();
    } catch (error) {
      console.log(error);
      showToast("Помилка", "Не вдалося надіслати відповідь.", "error");
    }
  };

  return (
    <div className="page">
      <section className="hero-banner">
        <div>
          <span className="hero-banner__eyebrow">
            {isCompany ? "Панель компанії" : "Панель користувача"}
          </span>
          <h1>{isCompany ? "Заявки клієнтів" : "Мої заявки"}</h1>
          <p>
            {isCompany
              ? "Компанія дивиться заявки і залишає просту текстову відповідь."
              : "Користувач створює заявку і потім дивиться прості відповіді від компаній."}
          </p>
        </div>

        {!isCompany ? (
          <button
            className="button button--primary button--large"
            type="button"
            onClick={() => setFormOpen((current) => !current)}
          >
            {formOpen ? "Сховати форму" : "Створити заявку"}
          </button>
        ) : null}
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>{isCompany ? "Доступні заявки" : "Мої заявки"}</span>
          <strong>{filteredRequests.length}</strong>
          <p>{isCompany ? "Після простого локального фільтра." : "Створені з цього браузера."}</p>
        </article>
      </section>

      <section className="surface-card section-block">
        <div className="section-header">
          <div>
            <h2>Простий фільтр</h2>
            <p>Пошук тільки тут, прямо на головній сторінці.</p>
          </div>
        </div>

        <div className="filters-simple">
          <label className="field">
            <span>Пошук по назві</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Місто</span>
            <select value={cityId} onChange={(event) => setCityId(event.target.value)}>
              <option value="">Усі міста</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Категорія</span>
            <select value={typeId} onChange={(event) => setTypeId(event.target.value)}>
              <option value="">Усі категорії</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {!isCompany && formOpen ? (
        <section className="surface-card section-block">
          <div className="section-header">
            <div>
              <h2>Нова заявка</h2>
              <p>Без модалок і без зайвої логіки.</p>
            </div>
          </div>

          <form className="simple-form" onSubmit={handleCreateRequest}>
            <label className="field">
              <span>Назва</span>
              <input
                type="text"
                required
                value={requestForm.title}
                onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Опис</span>
              <textarea
                rows="4"
                required
                value={requestForm.description}
                onChange={(event) =>
                  setRequestForm({ ...requestForm, description: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Ціна</span>
              <input
                type="number"
                min="0"
                value={requestForm.price}
                onChange={(event) => setRequestForm({ ...requestForm, price: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Ім’я</span>
              <input
                type="text"
                value={requestForm.clientName}
                onChange={(event) =>
                  setRequestForm({ ...requestForm, clientName: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Місто</span>
              <select
                value={requestForm.cityId}
                required
                onChange={(event) => setRequestForm({ ...requestForm, cityId: event.target.value })}
              >
                <option value="">Оберіть місто</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Категорія</span>
              <select
                value={requestForm.typeId}
                required
                onChange={(event) => setRequestForm({ ...requestForm, typeId: event.target.value })}
              >
                <option value="">Оберіть категорію</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="button button--primary" type="submit" disabled={creating}>
              {creating ? "Збереження..." : "Зберегти заявку"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-header">
          <div>
            <h2>{isCompany ? "Список заявок" : "Ваші заявки"}</h2>
            <p>
              {isCompany
                ? "Натисніть кнопку і напишіть одну відповідь."
                : "Перейдіть в історію, щоб подивитися відповіді компаній."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="surface-card">Завантаження...</div>
        ) : filteredRequests.length ? (
          <div className="request-grid">
            {filteredRequests.map((request) => (
              <ServiceCard
                key={request.id}
                request={request}
                buttonLabel={isCompany ? "Відгукнутись" : "Переглянути відповіді"}
                onAction={
                  isCompany
                    ? () => setResponseForm({ zamId: request.id, text: "" })
                    : () => navigate(`/history?requestId=${request.id}`)
                }
              >
                {isCompany && responseForm.zamId === request.id ? (
                  <form className="simple-form simple-form--response" onSubmit={sendResponse}>
                    <label className="field">
                      <span>Текст відповіді</span>
                      <textarea
                        rows="3"
                        value={responseForm.text}
                        onChange={(event) =>
                          setResponseForm({ ...responseForm, text: event.target.value })
                        }
                      />
                    </label>

                    <div className="request-card__actions">
                      <button className="button button--primary" type="submit">
                        Надіслати
                      </button>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => setResponseForm({ zamId: "", text: "" })}
                      >
                        Скасувати
                      </button>
                    </div>
                  </form>
                ) : null}
              </ServiceCard>
            ))}
          </div>
        ) : (
          <EmptyState
            title={isCompany ? "Нічого не знайдено" : "У вас ще немає заявок"}
            description={
              isCompany
                ? "Спробуйте змінити пошук або місто."
                : "Створіть першу заявку на цій сторінці."
            }
            action={!isCompany ? () => setFormOpen(true) : undefined}
            actionLabel={!isCompany ? "Створити заявку" : undefined}
          />
        )}
      </section>
    </div>
  );
}
