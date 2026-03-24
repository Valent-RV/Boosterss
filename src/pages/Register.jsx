import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Modal from "../components/Modal"
import "../styles/auth.css"

function Register(){

 const navigate = useNavigate()

 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")
 const [repeat,setRepeat] = useState("")
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

    if(
      validateEmail(email) &&
      validatePassword(password) &&
      password === repeat
    ){
      try {
        const response = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
          setShow(true) 
          
          setTimeout(()=>{
            setShow(false)
            navigate("/login") 
          }, 2000)
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error("Помилка:", error);
        alert("Не вдалося з'єднатися з сервером");
      }
    }
  }

 return(

  <div className="authPage">

   {show && <Modal message="Успішно"/>}

   <div className="authLeft"></div>

   <div className="authRight">

    <div className="authBox">

      <h1>Register</h1>

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

      <input 
        type="password"
        placeholder="Repeat password"
        value={repeat}
        onChange={(e)=>setRepeat(e.target.value)}
      />

      <button 
        onClick={handleClick}
        disabled={
          !validateEmail(email) ||
          !validatePassword(password) ||
          password !== repeat
        }
      >
        Create account
      </button>

      {!validateEmail(email) && email && (
        <p className="error">Введіть правильну email адресу</p>
      )}

      {!validatePassword(password) && password && (
        <p className="error">
          Пароль має містити 8 символів, 1 велику букву і 1 цифру
        </p>
      )}

      {password !== repeat && repeat && (
        <p className="error">Паролі не співпадають</p>
      )}

      <p>
        Already have an account? 
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

export default Register