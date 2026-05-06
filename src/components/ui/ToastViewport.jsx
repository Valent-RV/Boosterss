import { useApp } from "../../context/AppContext.jsx";

export default function ToastViewport() {
  const { removeToast, toasts } = useApp();

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className="toast__body">
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>

          <button type="button" onClick={() => removeToast(toast.id)}>
            Закрити
          </button>
        </div>
      ))}
    </div>
  );
}
