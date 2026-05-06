import {
  formatCurrency,
  formatFullDate,
  formatShortDate,
  truncateText
} from "../../utils/formatters.js";

export default function RequestCard({
  request,
  footer,
  renderResponse,
  responses = [],
  showClient = false,
  showResponses = false,
  responseEmptyText = "Поки немає пропозицій від компаній."
}) {
  const visibleResponses = responses.length ? responses : request.responses || [];

  return (
    <article className="request-card">
      <div className="request-card__top">
        <div className="request-card__badges">
          <span className="badge badge--soft">{request.category}</span>
          <span className="badge badge--outline">{request.subcategory}</span>
          <span className="badge badge--outline">{request.city}</span>
        </div>
        <span className="request-card__responses">
          Пропозицій: {request.responses.length}
        </span>
      </div>

      <div className="request-card__body">
        <h3>{request.title}</h3>
        <p>{truncateText(request.description, 160)}</p>
      </div>

      <div className="request-card__meta">
        <div>
          <span>Бюджет</span>
          <strong>{formatCurrency(request.price)}</strong>
        </div>
        <div>
          <span>Бажана дата</span>
          <strong>{formatFullDate(request.date)}</strong>
        </div>
        {showClient ? (
          <div>
            <span>Клієнт</span>
            <strong>{request.clientName || "Клієнт"}</strong>
          </div>
        ) : null}
      </div>

      {showResponses ? (
        <div className="response-list">
          {visibleResponses.length ? (
            visibleResponses.map((response) => (
              <div className="response-list__item" key={response.id}>
                {renderResponse ? (
                  renderResponse(response)
                ) : (
                  <>
                    <div className="response-list__summary">
                      <strong>{response.companyName}</strong>
                      <p>{response.message}</p>
                    </div>
                    <div className="response-list__meta">
                      <span>{formatCurrency(response.proposedPrice)}</span>
                      <span>{formatShortDate(response.availableFrom)}</span>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="response-list__empty">{responseEmptyText}</div>
          )}
        </div>
      ) : null}

      {footer ? <div className="request-card__actions">{footer}</div> : null}
    </article>
  );
}
