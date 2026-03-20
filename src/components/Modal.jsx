import "../styles/modal.css"

function Modal({message}){

 return(
  <div className="modalOverlay">

    <div className="modalBox">
      {message}
    </div>

  </div>
 )

}

export default Modal