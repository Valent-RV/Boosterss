import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatCurrency, formatFullDate } from "../utils/formatters.js";
import { useApp } from "../context/AppContext.jsx";

export default function HistoryPage() {
  const { isCompany, showToast, user } = useApp();
  const [requests, setRequests] = useState([]);
  const [responsesByRequest, setResponsesByRequest] = useState({});
  const [loading, setLoading] = useState(true);

  const storageKey = `taskero_requests_${user?.email || "guest"}`;
  const [myRequestIds] = useState(() => {
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
      const params = new URLSearchParams();

      if (isCompany && user?.firmId) {
        params.set("firmId", user.firmId);
        params.set("myResponses", "1");
      }

      const response = await fetch(`/requests?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        setLoading(false);
        return;
      }

      let list = data.requests || [];

      if (!isCompany) {
        list = list.filter((item) => myRequestIds.includes(item.id));
      }

      setRequests(list);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getResponses = async (list) => {
    const nextMap = {};

    for (const request of list) {
      try {
        const params = new URLSearchParams();

        if (isCompany && user?.firmId) {
          params.set("firmId", user.firmId);
        }

        const response = await fetch(`/responses/${request.id}?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          console.log(data);
          continue;
        }

        nextMap[request.id] = data.responses || [];
      } catch (error) {
        console.log(error);
      }
    }

    setResponsesByRequest(nextMap);
  };

  useEffect(() => {
    getRequests();
  }, [isCompany, user?.firmId]);

  useEffect(() => {
    if (requests.length) {
      getResponses(requests);
      return;
    }

    setResponsesByRequest({});
  }, [requests, isCompany, user?.firmId]);

  const handleDecision = async (url, id) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        return;
      }

      showToast("Успіх", "Статус відповіді змінено.");
      getRequests();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <h1>{isCompany ? "Мої відповіді" : "Відповіді компаній"}</h1>
          <p>
            {isCompany
              ? "Тут видно заявки, на які компанія вже відгукнулась."
              : "Тут видно ваші заявки і прості відповіді від компаній без чату."}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="surface-card">Завантаження...</div>
      ) : requests.length ? (
        <div className="section-block">
          {requests.map((request) => {
            const responseList = responsesByRequest[request.id] || [];

            return (
              <section className="surface-card section-block" key={request.id}>
                <div className="section-header">
                  <div>
                    <h2>{request.title}</h2>
                    <p>{request.description}</p>
                  </div>
                </div>

                <div className="history-request-meta">
                  <span>{request.cityName}</span>
                  <span>{request.typeName}</span>
                  <span>{formatCurrency(request.price)}</span>
                  <span>{formatFullDate(request.date)}</span>
                </div>

                {responseList.length ? (
                  <div className="response-list">
                    {responseList.map((response) => (
                      <div className="response-list__item" key={response.id}>
                        <div className="response-list__summary">
                          <strong>{response.companyName}</strong>
                          <p>{response.text}</p>
                        </div>

                        <div className="response-list__meta">
                          <span>{formatFullDate(response.createdAt)}</span>
                          <span className={`badge ${response.status === "accepted" ? "badge--success" : "badge--outline"}`}>
                            {response.status === "accepted"
                              ? "Прийнято"
                              : response.status === "rejected"
                                ? "Відхилено"
                                : "Очікує"}
                          </span>
                        </div>

                        {!isCompany && response.status === "pending" ? (
                          <div className="request-card__actions">
                            <button
                              className="button button--primary"
                              type="button"
                              onClick={() => handleDecision("/responses/accept", response.id)}
                            >
                              Прийняти
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => handleDecision("/responses/reject", response.id)}
                            >
                              Відхилити
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Поки немає відповідей"
                    description="Відповіді компаній з’являться тут під цією заявкою."
                  />
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={isCompany ? "Компанія ще не відгукувалась" : "Історія поки порожня"}
          description={
            isCompany
              ? "Після першої відповіді тут з’являться ваші заявки."
              : "Створіть заявку на головній сторінці, щоб бачити відповіді тут."
          }
        />
      )}
    </div>
  );
}
