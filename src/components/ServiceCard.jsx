function ServiceCard({title, price}){

  return(

    <div className="card">

      <div className="image"></div>

      <h3>{title}</h3>

      <p className="price">{price}</p>

    </div>

  )

}

export default ServiceCard