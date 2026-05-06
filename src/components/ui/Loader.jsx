export default function Loader({ label = "Завантаження..." }) {
  return (
    <div className="loader">
      <span className="loader__spinner" />
      <p>{label}</p>
    </div>
  );
}
