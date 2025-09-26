import { useNavigate } from "react-router-dom";
import {AiOutlineEye, AiOutlineEyeInvisible} from "react-icons/ai"
import React, {useState} from "react"

function Signup() {
  const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password,setPassword] = useState("")
    const [showPassword,setShowPassword] = useState("false")



    //LOOK OVER========
    const handleSignin = async (e) => {
        e.preventDefault(); // prevent page reload
      
        if (!email || !password) {
          alert("Please fill in all fields");
          return;
        }
      
        try {
          const res = await fetch("http://localhost:8000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
      
          if (!res.ok) {
            const data = await res.json();
            alert(data.detail || "Signup failed");
            return;
          }
      
          alert("Signup successful!");
          navigate("/"); // go to home page
        } catch (err) {
          console.error(err);
          alert("Network error");
        }
      };
      //=====================

  return(<div>
    <h1>Create an Account!</h1>
    <form onSubmit={handleSignin}>


        <div>
            <label>Email: </label>
            <input
                type = "email"
                value = {email}
                onChange = {(e)=>setEmail(e.target.value)}

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



        <button type="submit">Sign Up</button>
    </form>
  </div>
  );
}

export default Signup;