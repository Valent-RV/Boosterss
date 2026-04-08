import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Inbox() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/requests")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(item => ({
          ...item,
          responses: item.responses?.length || 0,
          hasResponse: (item.responses?.length || 0) > 0,
          favorite: false
        }));
        setItems(formatted);
      })
      .catch(err => console.error("Помилка:", err));
  }, []);

  const toggleFavorite = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    ));
  };

  return (
    <div className="center">

      <h2>Inbox</h2>

      {items.map(item => (
        <div
          key={item.id}
          className="inboxItem"
          onClick={() => navigate(`/request/${item.id}`)}
        >

          {/* RESPONSE STATUS */}
          <div className={`statusDot ${item.hasResponse ? "active" : ""}`}></div>

          {/* FAVORITE */}
          <div
            className={`star ${item.favorite ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            ★
          </div>

          {/* INFO */}
          <div className="inboxInfo">
            <div className="title">{item.title}</div>
            <div className="date">{item.date}</div>
          </div>

          {/* RESPONSES */}
          <div className="responses">
            {item.responses} відповіді
          </div>

        </div>
      ))}

    </div>
  );
}

export default Inbox;