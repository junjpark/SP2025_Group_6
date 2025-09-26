import { useEffect, useState } from "react";

import { BrowserRouter as Router, Route, Routes} from "react-router-dom"
import LoginForm from "./Login.jsx"
import Signup from "./Signup.jsx"



function App() {



  return (
    <div>
      <Router>


        <Routes>
          <Route path = "/login" element = {<LoginForm/>}></Route>
          <Route path = '/signup' element = {<Signup></Signup>}></Route>
        </Routes>
      </Router>
      
    </div>
  )
}
export default App;