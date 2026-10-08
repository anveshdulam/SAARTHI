import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.SAARTHI_AUTH_TOKEN || ""}` },
      body: JSON.stringify({ message: "Hello", history: [] })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.log("Fetch Error:", err);
  }
}
run();
