import 'dotenv/config';

const webhookUrl = process.env.SHEETS_WEBHOOK_URL;

async function testLog() {
  console.log("Testing Webhook URL:", webhookUrl);
  if (!webhookUrl) {
    console.error("Error: SHEETS_WEBHOOK_URL is missing in .env");
    return;
  }

  try {
    const payload = {
      type: 'session_start',
      patientName: 'Test Patient (Manual Test)',
      partnerName: 'Ex Partner',
      duration: '5 years',
      whoEnded: 'Mutual',
      story: 'This is a test story from the script.',
      feeling: 'Testing',
      mode: 'CALM DOWN',
      language: 'English',
      sessionId: 'test-id-' + Date.now()
    };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.text();
    console.log("Response Status:", response.status);
    console.log("Result from Google Sheets:", result);
  } catch (error) {
    console.error("Test Failed:", error.message);
  }
}

testLog();
