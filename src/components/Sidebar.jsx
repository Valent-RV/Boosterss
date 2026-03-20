import { useNavigate } from "react-router-dom"

function Sidebar(){

 const navigate = useNavigate()

 return(
  <div className="sidebar">

    <div 
      className="avatar"
      onClick={()=>navigate("/register")}
    ></div>

    <div className="menu">

      <div onClick={()=>navigate("/")} className="menuItem">Home</div>
      <div onClick={()=>navigate("/inbox")} className="menuItem">Inbox</div>
      <div onClick={()=>navigate("/search")} className="menuItem">Search</div>
      <div onClick={()=>navigate("/explore")} className="menuItem">Explore</div>
      <div onClick={()=>navigate("/history")} className="menuItem">History</div>
      <div onClick={()=>navigate("/settings")} className="menuItem">Settings</div>

    </div>

  </div>
 )
}

export default Sidebar