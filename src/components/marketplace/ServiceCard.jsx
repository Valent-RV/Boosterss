import { formatCurrency, formatShortDate, truncateText } from "../../utils/formatters.js";

export default function ServiceCard({ request, buttonLabel, onAction, children }) {
  return (
    <article className="service-card">
      <div className="service-card__top">
        <div className="request-card__badges">
          <span className="badge badge--soft">{request.typeName || "Без категорії"}</span>
          <span className="badge badge--outline">{request.cityName || "Без міста"}</span>
        </div>
        <span className="request-card__responses">
          {request.firmId ? "Заявка вже в роботі" : "Нова заявка"}
        </span>
      </div>

      <div className="service-card__body">
        <h3>{request.title}</h3>
        <p>{truncateText(request.description, 160)}</p>
      </div>

      <div className="service-card__meta">
        <div>
          <span>Ціна</span>
          <strong>{formatCurrency(request.price)}</strong>
        </div>
        <div>
          <span>Дата</span>
          <strong>{formatShortDate(request.date)}</strong>
        </div>
      </div>

      {children ? <div className="response-list">{children}</div> : null}

      {onAction ? (
        <div className="request-card__actions">
          <button className="button button--soft" type="button" onClick={onAction}>
            {buttonLabel || "Відгукнутись"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
