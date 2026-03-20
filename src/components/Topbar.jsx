import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Topbar(){

 const [text,setText] = useState("")
 const navigate = useNavigate()

 return(
  <div className="topbar">

    <div className="searchBox">
      <input 
        value={text}
        onChange={(e)=>setText(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={()=>navigate("/search")}>🔍</button>
    </div>

    <div className="location">м.Львів</div>

  </div>
 )
}

export default Topbar