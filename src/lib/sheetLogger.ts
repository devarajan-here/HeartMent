// Browser calls our local backend bridge, which then forwards to Google Sheets
export const logToSheet = (payload: object) => {
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Front log error:", err));
  } catch (err) {
    console.error("Critical log error:", err);
  }
};
