import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/home.css"

function Topbar(){

 const [text,setText] = useState("")
 const [city,setCity] = useState("м.Львів")
 const [open,setOpen] = useState(false)

 const navigate = useNavigate()

 const cities = [
  "Київ",
  "Львів",
  "Одеса",
  "Харків",
  "Дніпро",
  "Запоріжжя",
  "Івано-Франківськ",
  "Тернопіль",
  "Луцьк",
  "Рівне",
  "Житомир",
  "Вінниця",
  "Хмельницький",
  "Чернівці",
  "Ужгород",
  "Черкаси",
  "Полтава",
  "Суми",
  "Чернігів",
  "Кропивницький",
  "Миколаїв",
  "Херсон"
 ]

 const handleSearch = () => {
  if(text){
    navigate("/search", {state:{query:text}})
  }
 }

 return(

  <div className="topbar">

    <div className="searchBox">
      <input
        placeholder="Search..."
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />
      <button onClick={handleSearch}>🔍</button>
    </div>

    <div className="locationBox">

      <div 
        className="location"
        onClick={()=>setOpen(!open)}
      >
        📍 {city}
      </div>

      {open && (
        <div className="cityDropdown">

          {cities.map((c,i)=>(
            <div
              key={i}
              className="cityItem"
              onClick={()=>{
                setCity("м."+c)
                setOpen(false)
              }}
            >
              {c}
            </div>
          ))}

        </div>
      )}

    </div>

  </div>

 )

}

export default Topbar