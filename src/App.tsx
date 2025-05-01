import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Sliding Trigram</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Welcome to Sliding Trigram! This is where the game will be
          implemented.
        </p>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
