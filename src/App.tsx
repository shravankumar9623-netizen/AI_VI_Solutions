import { useState } from "react";

export default function App() {
  const [script, setScript] = useState("");

  const generateScript = () => {
    const demoScript = `
Chalo bacchon, aaj ek important JEE concept samajhte hain.

Step 1: Question ko dhyaan se read karo  
Step 2: Concept identify karo (bonding / electrons)  
Step 3: Apply karo logic  

Final Answer: Option match ho jaata hai.

Yeh approach exam mein bahut useful hai.
    `;
    setScript(demoScript);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Video Generator (Working Build)</h1>

      <button onClick={generateScript}>
        Generate Script
      </button>

      <pre style={{ marginTop: 20, background: "#eee", padding: 10 }}>
        {script}
      </pre>
    </div>
  );
}
