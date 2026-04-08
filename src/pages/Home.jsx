import { useState } from "react";
import { useEffect } from "react";
import Toast from "../components/Toast";
import Modal from "../components/Modal";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [useDateTime, setUseDateTime] = useState(false);
  const [usePrice, setUsePrice] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [dateError, setDateError] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("₴");

  const handleSave = async () => {
    if (!title || !description) {
      setFormError(true);
      return;
    }

    if (useDateTime) {
      const selected = new Date(dateTime);
      const now = new Date();

      if (!dateTime || selected < now) {
        setDateError(true);
        return;
      }
    }

    try {
      await fetch("http://localhost:3000/create-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          date: useDateTime ? dateTime : null,
          price: usePrice ? `${price} ${currency}` : null
        })
      });

      setFormError(false);
      setDateError(false);
      setShowForm(false);
      setShowToast(true);

      setTitle("");
      setDescription("");
      setDateTime("");
      setPrice("");

      setTimeout(() => {
        setShowToast(false);
      }, 2000);

    } catch (err) {
      console.error("Помилка:", err);
    }
  };

  return (
    <div className="center">

      {/* КНОПКА */}
      {!showForm && (
        <button className="createBtn" onClick={() => setShowForm(true)}>
          + Створити заявку
        </button>
      )}

      {/* МОДАЛКА */}
      {showForm && (
        <Modal>
          <div className="createForm">
            <h3>Створити заявку</h3>
            <input
              placeholder="Введіть назву послуги"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError(false);
              }}
              className={formError && !title ? "errorInput" : ""}
            />
            <textarea
              placeholder="Опишіть послугу детальніше"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFormError(false);
              }}
              className={formError && !description ? "errorInput" : ""}
            ></textarea>
            {formError && (
              <span className="errorText">Заповніть обовʼязкові поля</span>
            )}

            <label className="fileUpload">
              <span>Перетягни файл або натисни для вибору</span>
              <input type="file" hidden />
            </label>

            {/* DATE & TIME */}
            <div className="optionalField">
              <label>
                <input
                  type="checkbox"
                  checked={useDateTime}
                  onChange={() => setUseDateTime(!useDateTime)}
                />
                Вказати дату і час
              </label>

              {useDateTime && (
                <>
                  <input
                    type="datetime-local"
                    className={`extraInput ${dateError ? "errorInput" : ""}`}
                    value={dateTime}
                    onChange={(e) => {
                      setDateTime(e.target.value);
                      setDateError(false);
                    }}
                  />
                  {dateError && (
                    <span className="errorText">Некоректна дата</span>
                  )}
                </>
              )}
            </div>

            {/* PRICE */}
            <div className="optionalField">
              <label>
                <input
                  type="checkbox"
                  checked={usePrice}
                  onChange={() => setUsePrice(!usePrice)}
                />
                Вказати суму
              </label>

              {usePrice && (
                <div className="priceRow">
                  <input
                    type="number"
                    placeholder="Сума"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option>₴</option>
                    <option>$</option>
                    <option>€</option>
                  </select>
                </div>
              )}
            </div>

            <div className="formButtons">
              <button
                className="cancelBtn"
                onClick={() => setShowForm(false)}
              >
                Скасувати
              </button>

              <button className="saveBtn" onClick={handleSave}>
                Зберегти
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showToast && <Toast text="Успішно створено!" />}
    </div>
  );
}