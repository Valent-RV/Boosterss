export default function AuthFormCard({
  title,
  subtitle,
  submitLabel,
  disabled,
  loading,
  footer,
  onSubmit,
  children,
  hint
}) {
  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {children}
        {hint ? <div className="auth-card__hint">{hint}</div> : null}

        <button
          className="button button--primary button--full"
          type="submit"
          disabled={disabled || loading}
        >
          {loading ? "Зачекайте..." : submitLabel}
        </button>
      </form>

      {footer ? <div className="auth-card__footer">{footer}</div> : null}
    </div>
  );
}
