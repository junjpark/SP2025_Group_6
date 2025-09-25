import { useEffect, useState } from "react";
import Library from "./pages/LIbrary/Library";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:8000")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error: " + err));
  });
  return (
    Library()
  )
}
export default App;