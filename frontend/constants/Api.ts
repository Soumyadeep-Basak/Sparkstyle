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