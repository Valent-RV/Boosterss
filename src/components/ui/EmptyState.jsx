export default function EmptyState({ title, description, action, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && actionLabel ? (
        <button className="button button--primary" type="button" onClick={action}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
