import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/auth.css"

function ForgotPassword(){

 const navigate = useNavigate()

 const [email,setEmail] = useState("")
 const [step,setStep] = useState(1)
 const [code,setCode] = useState("")

 const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
 }

 return(

  <div className="authPage">

    <div className="authLeft"></div>

    <div className="authRight">

      <div className="authBox">

        <h1>Forgot password</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <>

            <input
              placeholder="Email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button
              onClick={()=>setStep(2)}
              disabled={!validateEmail(email)}
            >
              Далі
            </button>

            {!validateEmail(email) && email && (
              <p className="error">Введіть правильну email адресу</p>
            )}

          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>

            <p>Введіть код з пошти</p>

            <input
              placeholder="123456"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              maxLength={6}
            />

          </>
        )}

        {/* НАЗАД */}
        <p>
          Back to 
          <span 
            className="link"
            onClick={()=>navigate("/login")}
          >
            Login
          </span>
        </p>

      </div>

    </div>

  </div>

 )

}

export default ForgotPassword