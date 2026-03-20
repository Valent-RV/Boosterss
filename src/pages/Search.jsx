import { useLocation } from "react-router-dom"

function Search(){

 const location = useLocation()
 const query = location.state?.query || ""

 return(

  <div className="center">

    <h2>Search results:</h2>
    <p>{query}</p>

  </div>

 )

}

export default Search