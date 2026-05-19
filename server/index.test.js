import { test, describe } from "node:test";
import assert from "node:assert";
import { getValue, mapCity, mapRequest, mapType, mapResponse } from "./index.js";
describe("Unit-тестування функції getValue", () => {
  
  test("повертає правильне значення, якщо ключ існує", () => {
    const row = { ID: 42, NAME: "Київ" };
    const keys = ["CITY_ID", "ID"];
    
    const result = getValue(row, keys);
    assert.strictEqual(result, 42); 
  });

  test("повертає fallback (пустоту), якщо ключа немає", () => {
    const row = { PRICE: 100 };
    const keys = ["CITY_ID", "ID"];
    
    const result = getValue(row, keys);
    assert.strictEqual(result, ""); 
  });

  test("повертає кастомний fallback, якщо його передали", () => {
    const row = { STATUS: "done" };
    const keys = ["NAME"];
    
    const result = getValue(row, keys, "Невідомо");
    assert.strictEqual(result, "Невідомо"); 
  });

});

describe("Unit-тестування мапера mapCity", () => {
  test("правильно формує об'єкт зі стандартними ключами (ID, NAME)", () => {
    const rawData = { ID: 10, NAME: "Львів" };
    const result = mapCity(rawData);
    
    assert.strictEqual(result.id, "10");
    assert.strictEqual(result.name, "Львів");
  });

  test("розпізнає альтернативні ключі Oracle (KODCITY, NAME_CITY)", () => {
    const rawData = { KODCITY: 99, NAME_CITY: "Київ" };
    const result = mapCity(rawData);
    
    assert.strictEqual(result.id, "99");
    assert.strictEqual(result.name, "Київ");
  });

  test("повертає порожні рядки, якщо даних немає", () => {
    const rawData = { SOMETHING_ELSE: "test" };
    const result = mapCity(rawData);
    
    assert.strictEqual(result.id, "");
    assert.strictEqual(result.name, "");
  });
});

describe("Unit-тестування мапера mapRequest", () => {
  test("правильно об'єднує заявку з містом та категорією", () => {
    // фейкові дані, наче з бази
    const rawRequest = {
      ID: 100,
      NAMEZAM: "Полагодити кран",
      PRICEZAM: 500,
      KODCITY: 1,
      TYPEFIRM: 2
    };
    
    // Готуємо довідники
    const mockCities = [{ id: "1", name: "Львів" }];
    const mockTypes = [{ id: "2", name: "Сантехніка" }];
    const mockResponses = [];

    // Виклик функції, яку тестуємо
    const result = mapRequest(rawRequest, mockCities, mockTypes, mockResponses);

    // Перевіряємо результат
    assert.strictEqual(result.id, "100", "Неправильний ID");
    assert.strictEqual(result.title, "Полагодити кран", "Неправильна назва");
    assert.strictEqual(result.price, 500, "Неправильна ціна");
    assert.strictEqual(result.cityName, "Львів", "Не підтягнуло назву міста");
    assert.strictEqual(result.typeName, "Сантехніка", "Не підтягнуло назву категорії");
    assert.strictEqual(result.responseCount, 0, "Неправильно рахує відгуки");
  });
});

// --- Тести для mapType ---
describe("Unit-тестування мапера mapType", () => {
  test("правильно формує об'єкт категорії зі стандартними ключами", () => {
    const rawData = { ID: 1, NAME: "Електрика" };
    const result = mapType(rawData);
    
    assert.strictEqual(result.id, "1");
    assert.strictEqual(result.name, "Електрика");
  });

  test("розпізнає специфічні ключі Oracle (TYPEFIRM_ID, NAME_TYPEFIRM)", () => {
    const rawData = { TYPEFIRM_ID: 99, NAME_TYPEFIRM: "Сантехніка" };
    const result = mapType(rawData);
    
    assert.strictEqual(result.id, "99");
    assert.strictEqual(result.name, "Сантехніка");
  });
});


// --- Тести для mapResponse ---
describe("Unit-тестування мапера mapResponse", () => {
  test("правильно мапить базові дані та підставляє значення за замовчуванням", () => {
    const rawData = {
      ID: 55,
      ZAM_ID: 100,
      FIRM_ID: 7,
      TEXT: "Готові виконати роботу завтра",
      CREATED_AT: "2026-05-19" // Просто тестова дата
    };
    
    const result = mapResponse(rawData);
    
    // Перевіряємо базові поля
    assert.strictEqual(result.id, "55");
    assert.strictEqual(result.zamId, "100");
    assert.strictEqual(result.firmId, "7");
    assert.strictEqual(result.text, "Готові виконати роботу завтра");
    assert.strictEqual(result.createdAt, "2026-05-19");
    
    // Перевіряємо значення ЗА ЗАМОВЧУВАННЯМ (fallback)
    assert.strictEqual(result.status, "pending", "Статус за замовчуванням має бути pending");
    assert.strictEqual(result.fromType, "company", "Тип за замовчуванням має бути company");
    assert.strictEqual(result.companyName, "Компанія", "Назва за замовчуванням має бути 'Компанія'");
  });

  test("правильно зчитує змінені статуси та назву компанії", () => {
    const rawData = {
      ID: 56,
      STATUS: "accepted",
      FROM_TYPE: "user",
      FIRMNAMEUKR: "ТОВ БудСервіс"
    };
    
    const result = mapResponse(rawData);
    
    assert.strictEqual(result.status, "accepted");
    assert.strictEqual(result.fromType, "user");
    assert.strictEqual(result.companyName, "ТОВ БудСервіс");
  });
});