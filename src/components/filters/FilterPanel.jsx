import { useApp } from "../../context/AppContext.jsx";

export default function FilterPanel({ open, onClose }) {
  const {
    categories,
    clearFilters,
    filters,
    isCompany,
    setFilters,
    subcategoryOptions
  } = useApp();

  const updateField = (field) => (event) => {
    const value = event.target.value;

    setFilters((current) => {
      if (field !== "category") {
        return { ...current, [field]: value };
      }

      return {
        ...current,
        category: value,
        subcategory: "Усі"
      };
    });
  };

  return (
    <aside className={`filter-panel ${open ? "filter-panel--open" : ""}`}>
      <div className="filter-panel__header">
        <div>
          <h3>Фільтри</h3>
          <p>
            {isCompany
              ? "Звужуйте активні запити клієнтів за бюджетом, датою та рубрикою."
              : "Уточнюйте шаблони та готові послуги компаній, не залишаючи сторінку."}
          </p>
        </div>
      </div>

      <div className="filter-panel__content">
        <label className="field">
          <span>Мінімальна ціна</span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={filters.priceMin}
            onChange={updateField("priceMin")}
          />
        </label>

        <label className="field">
          <span>Максимальна ціна</span>
          <input
            type="number"
            min="0"
            placeholder="20000"
            value={filters.priceMax}
            onChange={updateField("priceMax")}
          />
        </label>

        <label className="field">
          <span>Категорія</span>
          <select value={filters.category} onChange={updateField("category")}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Підкатегорія</span>
          <select value={filters.subcategory} onChange={updateField("subcategory")}>
            {subcategoryOptions.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </label>

        {isCompany ? (
          <label className="field">
            <span>Дата</span>
            <input type="date" value={filters.date} onChange={updateField("date")} />
          </label>
        ) : null}
      </div>

      <div className="filter-panel__actions">
        <button className="button button--soft" type="button" onClick={clearFilters}>
          Скинути фільтри
        </button>
      </div>
    </aside>
  );
}
