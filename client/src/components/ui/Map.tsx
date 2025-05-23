import { useEffect, useRef, useState } from "react";
import { Business } from "@shared/schema";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import "leaflet/dist/leaflet.css";

type MapProps = {
  businesses: Business[];
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  onBusinessSelect?: (business: Business) => void;
  onUserLocationChange?: (location: [number, number] | null) => void;
  center?: [number, number];
  zoom?: number;
  useGeolocation?: boolean;
};

const Map = ({ 
  businesses, 
  onBoundsChange, 
  onBusinessSelect,
  onUserLocationChange,
  center = [37.7749, -122.4194], // Default to San Francisco
  zoom = 13,
  useGeolocation = true // Default to using the user's location
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(useGeolocation);

  // Get user's location
  useEffect(() => {
    if (!useGeolocation) {
      setLocationLoading(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User location:", latitude, longitude);
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          
          // Notify parent component
          if (onUserLocationChange) {
            onUserLocationChange(newLocation);
          }
          
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationLoading(false);
          
          // Notify parent component about location failure
          if (onUserLocationChange) {
            onUserLocationChange(null);
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      
      // Notify parent component about lack of geolocation support
      if (onUserLocationChange) {
        onUserLocationChange(null);
      }
    }
  }, [useGeolocation, onUserLocationChange]);

  // Initialize map
  useEffect(() => {
    // Load leaflet dynamically
    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix marker icon issue
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = defaultIcon;

      // Determine initial center - use user location if available, otherwise use provided center
      const initialCenter = userLocation || center;
      const initialZoom = userLocation ? 14 : zoom; // Zoom in closer if using user location

      // Create map
      const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Track map view event
      trackEvent(AnalyticsEvent.MAP_VIEW, {
        initialLatitude: initialCenter[0].toString(),
        initialLongitude: initialCenter[1].toString(),
        initialZoom: initialZoom.toString(),
        hasUserLocation: userLocation ? 'true' : 'false'
      });

      // Add user location marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>`,
          className: "user-location-marker",
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup("Your location");
      }

      // Set up bounds change event
      if (onBoundsChange) {
        map.on('moveend', () => {
          const bounds = map.getBounds();
          const center = map.getCenter();
          
          // Track map drag event
          if (map.getZoom() === initialZoom) {
            trackEvent(AnalyticsEvent.MAP_DRAG, {
              latitude: center.lat.toFixed(4),
              longitude: center.lng.toFixed(4)
            });
          }
          
          onBoundsChange([
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast()
          ]);
        });
        
        // Track zoom events
        map.on('zoomend', () => {
          const zoom = map.getZoom();
          const center = map.getCenter();
          
          if (zoom !== initialZoom) {
            trackEvent(AnalyticsEvent.MAP_ZOOM, {
              zoomLevel: zoom.toString(),
              latitude: center.lat.toFixed(4),
              longitude: center.lng.toFixed(4)
            });
          }
        });
        
        // Trigger the initial bounds change
        const bounds = map.getBounds();
        onBoundsChange([
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast()
        ]);
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, locationLoading]);

  // Update markers when businesses change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    import('leaflet').then(L => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      businesses.forEach(business => {
        const marker = L.marker([business.latitude, business.longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${business.name}</b><br>${business.category}`);
        
        if (onBusinessSelect) {
          marker.on('click', () => {
            // Track business view from map event
            trackEvent(AnalyticsEvent.BUSINESS_VIEW, {
              businessId: business.id.toString(),
              businessName: business.name,
              source: 'map_marker',
              category: business.category
            });
            
            onBusinessSelect(business);
          });
        }
        
        markersRef.current.push(marker);
      });
    });
  }, [businesses, onBusinessSelect]);

  return (
    <div className="w-full h-full bg-neutral-100 relative">
      <div ref={mapRef} className="w-full h-full relative z-0" />
      
      {locationLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3 shadow-lg">
            <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-primary rounded-full"></div>
            <span>Getting your location...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
