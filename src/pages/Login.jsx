import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Modal from "../components/Modal"
import "../styles/auth.css"

function Login(){

 const navigate = useNavigate()

 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")
 const [show,setShow] = useState(false)

 const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
 }

 const validatePassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
  return regex.test(password)
 }

 const handleClick = async () => {
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, password: password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Успішний вхід!"); 
        navigate("/"); 
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error("Помилка з'єднання:", error);
      alert("Не вдалося з'єднатися з сервером");
    }
  }

 return(

  <div className="authPage">

   {show && <Modal message="Успішно"/>}

   <div className="authLeft"></div>

   <div className="authRight">

    <div className="authBox">

      <h1>Login</h1>

      <input 
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input 
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button 
        onClick={handleClick}
        disabled={!validateEmail(email) || !validatePassword(password)}
      >
        Login
      </button>

      {!validateEmail(email) && email && (
        <p className="error">Введіть правильну email адресу</p>
      )}

      {!validatePassword(password) && password && (
        <p className="error">
          Пароль має містити 8 символів, 1 велику букву і 1 цифру
        </p>
      )}

      <p>
        Don't have an account? 
        <span 
          className="link"
          onClick={()=>navigate("/register")}
        >
          Register
        </span>
      </p>

      <p 
        className="link"
        onClick={()=>navigate("/forgot")}
      >
        Forgot password?
      </p>

    </div>

   </div>

  </div>

 )

}

export default Login