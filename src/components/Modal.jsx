import "../styles/modal.css";

export default function Modal({ children }) {
  return (
    <div className="modalOverlay">
      <div className="modalBox">
        {children}
      </div>
    </div>
  );
}