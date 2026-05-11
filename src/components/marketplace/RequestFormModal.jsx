import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import Modal from "../ui/Modal.jsx";

const initialState = {
  title: "",
  description: "",
  price: "",
  date: "",
  category: "Дім і побут",
  subcategory: "Сантехніка",
  city: "Київ"
};

export default function RequestFormModal({ open, onClose }) {
  const {
    categories,
    catalog,
    cities,
    createRequest,
    profile,
    requestModalState,
    selectedCity
  } = useApp();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const currentDraft = requestModalState.draft;

  useEffect(() => {
    if (!open) {
      return;
    }

    const draftCategory = currentDraft?.category || initialState.category;
    const categoryEntry = catalog.find((entry) => entry.name === draftCategory);
    const fallbackSubcategory = categoryEntry?.subcategories[0]?.name || initialState.subcategory;

    setForm({
      title: currentDraft?.title || "",
      description: currentDraft?.description || "",
      price: currentDraft?.price || "",
      date: currentDraft?.date || "",
      category: draftCategory,
      subcategory: currentDraft?.subcategory || fallbackSubcategory,
      city:
        selectedCity && selectedCity !== "Вся Україна"
          ? selectedCity
          : profile?.city || "Київ"
    });
    setSubmitting(false);
  }, [catalog, currentDraft, open, profile?.city, selectedCity]);

  const availableSubcategories =
    catalog.find((entry) => entry.name === form.category)?.subcategories || [];

  const updateField = (field) => (event) => {
    const nextValue = event.target.value;

    setForm((current) => {
      if (field !== "category") {
        return { ...current, [field]: nextValue };
      }

      const nextCategory = catalog.find((entry) => entry.name === nextValue);
      return {
        ...current,
        category: nextValue,
        subcategory: nextCategory?.subcategories[0]?.name || ""
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const success = await createRequest(form);
    if (success) {
      setForm(initialState);
    }
    setSubmitting(false);
  };

  const isDisabled = !form.title.trim() || !form.description.trim() || submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Створити новий запит"
      description="Опублікуйте B2C-запит, отримуйте відповіді від компаній і продовжуйте спілкування в короткому чаті."
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Назва</span>
          <input
            type="text"
            placeholder="У чому потрібна допомога?"
            value={form.title}
            onChange={updateField("title")}
          />
        </label>

        <label className="field">
          <span>Опис</span>
          <textarea
            rows="5"
            placeholder="Опишіть бажаний результат, терміни та важливі деталі."
            value={form.description}
            onChange={updateField("description")}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Бюджет</span>
            <input
              type="number"
              min="0"
              placeholder="5000"
              value={form.price}
              onChange={updateField("price")}
            />
          </label>

          <label className="field">
            <span>Бажана дата</span>
            <input type="date" value={form.date} onChange={updateField("date")} />
          </label>

          <label className="field">
            <span>Категорія</span>
            <select value={form.category} onChange={updateField("category")}>
              {categories
                .filter((category) => category !== "Усі")
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
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

          <label className="field">
            <span>Місто</span>
            <select value={form.city} onChange={updateField("city")}>
              {cities
                .filter((city) => city !== "Вся Україна")
                .map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="modal-panel__actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button className="button button--primary" type="submit" disabled={isDisabled}>
            {submitting ? "Створюємо..." : "Створити запит"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
