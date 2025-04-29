/**
 * Shared geocoding utility for converting addresses to coordinates
 * Can be used in both client and server environments
 */

// Function to convert an address string to latitude and longitude
export async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    // Add user-agent to comply with Nominatim usage policy
    const headers = {
      'User-Agent': 'LocalSpot Business Directory Application',
      'Accept-Language': 'en'
    };
    
    let response;
    // Check if we're in a browser or Node environment
    if (typeof window !== 'undefined') {
      // Browser environment
      response = await fetch(url, { headers });
    } else {
      // Node environment
      // Using dynamic import to avoid issues with SSR
      const nodeFetch = await import('node-fetch');
      response = await nodeFetch.default(url, { headers });
    }
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`No geocoding results found for address: ${address}`);
      return null;
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Add delay to avoid rate limiting with Nominatim
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to handle geocoding with retries and delay
export async function geocodeAddressWithRetry(
  address: string, 
  retries = 3, 
  delayMs = 1000
): Promise<{ lat: number, lon: number } | null> {
  let lastError = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Wait between attempts to respect rate limits
      if (attempt > 0) {
        await delay(delayMs);
      }
      
      const result = await geocodeAddress(address);
      if (result) {
        return result;
      }
    } catch (error) {
      console.error(`Geocoding attempt ${attempt + 1} failed:`, error);
      lastError = error;
    }
  }
  
  console.error(`Geocoding failed after ${retries} attempts for address: ${address}`);
  return null;
}