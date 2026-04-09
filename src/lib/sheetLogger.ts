// Browser calls our local backend bridge directly
export const logToSheet = async (payload: object) => {
  console.log("Attempting to log to sheet:", (payload as any).type);
  try {
    const response = await fetch('http://localhost:3000/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error("Sheet log failed at server:", await response.text());
    } else {
      console.log("Sheet log success!");
    }
  } catch (err) {
    console.error("Browser-to-Server log error (Make sure server is running on port 3000):", err);
  }
};
