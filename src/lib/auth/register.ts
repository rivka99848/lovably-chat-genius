export async function registerUser(email: string, name: string, category: string, password: string) {
  const response = await fetch('https://n8n.smartbiz.org.il/webhook/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: "register",
      email,
      name,
      category,
      password,
      phone: "",
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) throw new Error('.שגיאה ברישום');
  return await response.json();
} 