export const API_BASE_URL = 'http://192.168.29.38:8000';

export async function mockVirtualTryOn(imageUri: string): Promise<{ success: boolean; tryOnImageUrl: string; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    success: true,
    tryOnImageUrl: 'https://myntra.myntassets.com/w_400,q_90/assets/images/2023/3/10/tryon-mock.png',
    message: 'Virtual try-on successful! Here is your preview.'
  };
}

export async function getProductById(productId: number) {
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to fetch product');
  }
  return res.json();
}

export async function tryOnWithProduct(userId: number, productId: number) {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('product_id', productId.toString());

  const response = await fetch(`${API_BASE_URL}/api/tryon/product`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Try-on failed');
  }
  
  const result = await response.json();
  return `data:image/jpeg;base64,${result.image_base64}`;
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

export async function getUserImages(userId: number) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/images`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to fetch user images');
  }
  return res.json();
}