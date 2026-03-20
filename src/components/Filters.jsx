import {useState} from "react"
import "../styles/home.css"

function Filters(){

 const [open,setOpen] = useState(false)

 return(

  <div className="filtersPanel">

    <div 
      className="filtersHeader"
      onClick={()=>setOpen(!open)}
    >
      Filters
    </div>

    {open && (

      <div className="filtersContent">

        <label>
          <input type="checkbox"/>
          Cheap
        </label>

        <label>
          <input type="checkbox"/>
          Popular
        </label>

        <label>
          <input type="checkbox"/>
          Nearby
        </label>

      </div>

    )}

  </div>

 )

}

export default Filters