import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import Modal from "../ui/Modal.jsx";

const initialState = {
  title: "",
  description: "",
  priceFrom: "",
  turnaround: "",
  category: "Дім і побут",
  subcategory: "Сантехніка",
  cities: ["Київ"]
};

export default function ServiceFormModal({ open, onClose }) {
  const { catalog, cities, createService, profile } = useApp();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      ...initialState,
      cities: [profile?.city || "Київ"]
    });
    setSubmitting(false);
  }, [open, profile?.city]);

  const availableSubcategories =
    catalog.find((entry) => entry.name === form.category)?.subcategories || [];

  const updateField = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => {
      if (field !== "category") {
        return { ...current, [field]: value };
      }

      const nextCategory = catalog.find((entry) => entry.name === value);
      return {
        ...current,
        category: value,
        subcategory: nextCategory?.subcategories[0]?.name || ""
      };
    });
  };

  const updateCities = (event) => {
    const nextCities = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((current) => ({ ...current, cities: nextCities }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const success = await createService(form);
    if (success) {
      setForm(initialState);
    }
    setSubmitting(false);
  };

  const disabled =
    !form.title.trim() ||
    !form.description.trim() ||
    !form.turnaround.trim() ||
    !form.cities.length ||
    submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Опублікувати постійну послугу"
      description="Створіть готову B2C-послугу, на яку клієнти зможуть звернутися одразу."
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Назва послуги</span>
          <input
            type="text"
            placeholder="Термінові виїзди сантехніка додому"
            value={form.title}
            onChange={updateField("title")}
          />
        </label>

        <label className="field">
          <span>Опис</span>
          <textarea
            rows="5"
            placeholder="Опишіть, що входить у послугу, як швидко ви можете почати та чого очікувати клієнту."
            value={form.description}
            onChange={updateField("description")}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Стартова ціна</span>
            <input
              type="number"
              min="0"
              placeholder="1200"
              value={form.priceFrom}
              onChange={updateField("priceFrom")}
            />
          </label>

          <label className="field">
            <span>Терміни</span>
            <input
              type="text"
              placeholder="Вільні слоти в Києві сьогодні"
              value={form.turnaround}
              onChange={updateField("turnaround")}
            />
          </label>

          <label className="field">
            <span>Категорія</span>
            <select value={form.category} onChange={updateField("category")}>
              {catalog.map((categoryEntry) => (
                <option key={categoryEntry.name} value={categoryEntry.name}>
                  {categoryEntry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Підкатегорія</span>
            <select value={form.subcategory} onChange={updateField("subcategory")}>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory.name} value={subcategory.name}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Міста покриття</span>
          <select
            className="field__multiselect"
            multiple
            size="7"
            value={form.cities}
            onChange={updateCities}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <div className="modal-panel__actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button className="button button--primary" type="submit" disabled={disabled}>
            {submitting ? "Публікуємо..." : "Опублікувати послугу"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
