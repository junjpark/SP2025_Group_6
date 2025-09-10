import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:8000")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error: " + err));
  });
  return (
    <div>
      <h1>FastAPI + React</h1>
      <p>{ message }</p>
    </div>
  )
}
export default App;