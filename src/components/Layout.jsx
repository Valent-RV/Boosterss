import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { Outlet } from "react-router-dom"

function Layout(){

 return(
  <div className="home">

    <Sidebar/>

    <div className="main">

      <Topbar/>

      {/* 🔥 ОЦЕ ГОЛОВНЕ */}
      <div className="contentArea">
        <Outlet />
      </div>

    </div>

  </div>
 )
}

export default Layout