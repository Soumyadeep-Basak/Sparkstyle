export const API_BASE_URL = 'http://192.168.29.38:8000';

// Mock API for Virtual Try-On
export async function mockVirtualTryOn(imageUri: string): Promise<{ success: boolean; tryOnImageUrl: string; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));
  // Return a mocked try-on result (replace with real API later)
  return {
    success: true,
    tryOnImageUrl: 'https://myntra.myntassets.com/w_400,q_90/assets/images/2023/3/10/tryon-mock.png', // Placeholder image
    message: 'Virtual try-on successful! Here is your preview.'
  };
}

export async function signup({ name, email, password }: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Signup failed');
  }
  return res.json();
}

export async function login({ email, password }: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Login failed');
  }
  return res.json();
}