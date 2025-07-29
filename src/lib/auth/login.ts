export async function loginUser(email: string, password: string) {
  const response = await fetch('https://n8n.smartbiz.org.il/webhook/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: {
        event: "login",
        email,
        password,
        timestamp: new Date().toISOString()
      }
    })
  });

  if (!response.ok) throw new Error('.שגיאה בהתחברות');
  return await response.json();
} 