import { useNavigate } from "react-router-dom"
import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";


function LoginForm() {
  const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState("false")

  const handleLogin = async (e) => {

    navigate("/"); //reroutes to root



  };

  return (<div>
    <h1>Login</h1>
    <form onSubmit={handleLogin}>
        <div>
            <label>Email: </label>
            <input
                type = "email"
                value = {email}
                onChange = {(e) =>setEmail(e.target.value)} required
            />
        </div>

        <div>
            <label>Password: </label>
            <input 
                type = {showPassword ? "text" : "password"}
                value = {password}
                onChange = {(e) => setPassword(e.target.value)} required
            />
            <button
                onClick = {() => setShowPassword((prev)=>!(prev))}
            >{showPassword ? <AiOutlineEye/> : <AiOutlineEyeInvisible/>}</button>
        </div>
        
        <button type="submit">Login</button>
    </form>
  </div>
  );
}

export default LoginForm;