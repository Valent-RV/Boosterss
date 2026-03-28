import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function RequestDetails(){
  const { id } = useParams();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/request/${id}`)
      .then(res => res.json())
      .then(data => setRequest(data))
      .catch(err => console.error("Помилка:", err));
  }, [id]);

  if (!request) {
    return <div className="center">Завантаження...</div>;
  }

  return (
    <div className="center">

      <div className="requestDetails">

        {/* TITLE */}
        <h2>{request.title}</h2>

        {/* INFO */}
        <div className="requestMeta">
          <span>📅 {request.date}</span>
          <span>💰 {request.price}</span>
        </div>

        {/* DESCRIPTION */}
        <div className="requestDescription">
          {request.description}
        </div>

        {/* RESPONSES */}
        <div className="responsesBlock">
          <h3>Пропозиції ({request.responses?.length || 0})</h3>

          {(request.responses || []).map(res => (
            <div key={res.id} className="responseItem">
              <div className="company">{res.company}</div>
              <div className="text">{res.text}</div>

              <button
                className="replyBtn"
                onClick={() => alert(`Відправлено підтвердження: ${res.company}`)}
              >
                Відповісти
              </button>
            </div>
          ))}

        </div>

      </div>

    </div>
  )
}