import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import Modal from "../ui/Modal.jsx";

const initialState = {
  message: "",
  proposedPrice: "",
  availableFrom: ""
};

export default function CompanyResponseModal({ open, onClose, request }) {
  const { profile, respondToRequest, user } = useApp();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!request) {
      return;
    }

    setSubmitting(true);
    await respondToRequest(request.id, form);
    setSubmitting(false);
  };

  const companyName = profile?.company || user?.name || "Ваша компанія";
  const disabled = !form.message.trim() || submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Надіслати пропозицію компанії"
      description={
        request
          ? `Дайте відповідь на «${request.title}», надішліть пропозицію та відкрийте короткий чат для уточнень.`
          : ""
      }
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inline-note">
          <strong>{companyName}</strong>
          <span>Пропозицію буде надіслано від активного профілю компанії.</span>
        </div>

        <label className="field">
          <span>Текст пропозиції</span>
          <textarea
            rows="5"
            placeholder="Опишіть пропозицію, терміни та чому саме ваша послуга підходить."
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Вартість</span>
            <input
              type="number"
              min="0"
              placeholder="4200"
              value={form.proposedPrice}
              onChange={(event) =>
                setForm((current) => ({ ...current, proposedPrice: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Доступно з</span>
            <input
              type="date"
              value={form.availableFrom}
              onChange={(event) =>
                setForm((current) => ({ ...current, availableFrom: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="modal-panel__actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button className="button button--primary" type="submit" disabled={disabled}>
            {submitting ? "Надсилаємо..." : "Надіслати пропозицію"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
