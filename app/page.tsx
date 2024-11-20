'use client'

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

const containerStyle = {
  width: '100%',
  height: '80vh'
};

const mcdonaldsIcon = {
  path: "M10.5,0C4.7,0,0,4.7,0,10.5S4.7,21,10.5,21S21,16.3,21,10.5S16.3,0,10.5,0z M15.3,15.8H5.7v-1.2h9.6V15.8z M15.3,13.4H5.7v-1.2h9.6V13.4z M15.3,11H5.7V9.8h9.6V11z M15.3,8.6H5.7V7.4h9.6V8.6z",
  fillColor: "#FF0000",
  fillOpacity: 1,
  strokeWeight: 0,
  scale: 1.5
};

// Add interface for McDonald's location
interface McdonaldsLocation {
  lat: number;
  lng: number;
}

// Add new interface for coordinates
interface RouteCoordinate {
  lat: number;
  lng: number;
}

export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mcdonaldsLocations, setMcdonaldsLocations] = useState<McdonaldsLocation[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Add ref for the map element
  const mapRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Wait for custom elements to be defined
    if (mapRef.current) {
      customElements.whenDefined('gmp-map-3d').then(() => {
        // Initialize map settings here if needed
      });
    }
  }, []);

  const startGame = async () => {
    if (!origin || !destination) return;

    setGameActive(true);
    setTimeLeft(60);
    setScore(0);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMarkerClick = (index: number) => {
    if (!gameActive) return;

    setScore(prev => prev + 1);
    setMcdonaldsLocations(prev =>
      prev.filter((_, idx) => idx !== index)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock route coordinates (replace with actual API call)
    const mockRoute = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 40.7580, lng: -73.9855 },
      // Add more coordinates as needed
    ];
    setRouteCoordinates(mockRoute);

    // Here you would make API calls to:
    // 1. Get directions
    // 2. Search for McDonald's along the route
    // For demo, using mock data:
    const mockLocations = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 40.7580, lng: -73.9855 },
      // Add more mock locations
    ];
    setMcdonaldsLocations(mockLocations);
    startGame();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="p-4">
      {/* Add the Maps JavaScript API script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`}
        strategy="afterInteractive"
      />

      <div className="mb-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Origin"
            className="border p-2"
          />
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            className="border p-2"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Start Game
          </button>
        </form>
      </div>

      <div className="mb-4">
        <p>Time Left: {timeLeft}s</p>
        <p>Score: {score}</p>
      </div>

      <style jsx>{`
        gmp-map-3d {
          width: 100%;
          height: 80vh;
          display: block;
        }
      `}</style>

      <gmp-map-3d
        ref={mapRef}
        center="37.819852, -122.478549"
        tilt="67.5"
        zoom="15"
      >
        {/* Markers will need to be added as gmp-advanced-marker elements */}
      </gmp-map-3d>

      {!gameActive && score > 0 && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h2>Game Over!</h2>
          <p>Your score: {score}</p>
          <p>Voucher Code: MCDGAME{score}2024</p>
        </div>
      )}
    </div>
  );
}
{
  isLoaded && (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={{ lat: 40.7128, lng: -74.006 }}
      zoom={12}
      onLoad={(map: google.maps.Map) => {
        setMap(map);
        // Enable 45-degree imagery
        map.setTilt(45);
      }}
      options={{
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID, // Add your photorealistic map ID
        tilt: 45,
        heading: 25,
        mapTypeId: 'satellite',
        disableDefaultUI: false,
      }}
    >
      {routeCoordinates.length > 0 && (
        <Polyline
          path={routeCoordinates}
          options={{
            strokeColor: '#1966D2',
            strokeOpacity: 0.75,
            strokeWeight: 10,
          }}
        />
      )}
      {mcdonaldsLocations.map((location, index) => (
        <Marker
          key={index}
          position={location}
          icon={mcdonaldsIcon}
          onClick={() => handleMarkerClick(index)}
        />
      ))}
    </GoogleMap>
  )
}

{
  !gameActive && score > 0 && (
    <div className="mt-4 p-4 bg-green-100 rounded">
      <h2>Game Over!</h2>
      <p>Your score: {score}</p>
      <p>Voucher Code: MCDGAME{score}2024</p>
    </div>
  )
}
    </div >
  );
}