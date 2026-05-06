import { formatCurrency, truncateText } from "../../utils/formatters.js";

export default function TemplateCard({ template, onUseTemplate }) {
  return (
    <article className="template-card">
      <div className="request-card__badges">
        <span className="badge badge--soft">{template.category}</span>
        <span className="badge badge--outline">{template.subcategory}</span>
      </div>

      <div className="template-card__body">
        <h4>{template.title}</h4>
        <p>{truncateText(template.description, 130)}</p>
      </div>

      <div className="template-card__footer">
        <div>
          <span>Рекомендований бюджет</span>
          <strong>{formatCurrency(template.price)}</strong>
        </div>

        <button className="button button--soft" type="button" onClick={() => onUseTemplate(template)}>
          Використати шаблон
        </button>
      </div>
    </article>
  );
}
