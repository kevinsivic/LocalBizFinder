import { useEffect, useRef, useState } from "react";
import { Business } from "@shared/schema";
import "leaflet/dist/leaflet.css";

type MapProps = {
  businesses: Business[];
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  onBusinessSelect?: (business: Business) => void;
  center?: [number, number];
  zoom?: number;
};

const Map = ({ 
  businesses, 
  onBoundsChange, 
  onBusinessSelect,
  center = [37.7749, -122.4194], // Default to San Francisco
  zoom = 13
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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

      // Create map
      const map = L.map(mapRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Set up bounds change event
      if (onBoundsChange) {
        map.on('moveend', () => {
          const bounds = map.getBounds();
          onBoundsChange([
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast()
          ]);
        });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
            onBusinessSelect(business);
          });
        }
        
        markersRef.current.push(marker);
      });
    });
  }, [businesses, onBusinessSelect]);

  return (
    <div ref={mapRef} className="w-full h-full bg-neutral-100 relative z-0" />
  );
};

export default Map;
