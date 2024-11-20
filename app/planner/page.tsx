'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'gmp-map-3d': any;
        }
    }
}

export default function PlannerPage() {
    const mapRef = useRef<HTMLElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [map, setMap] = useState<any>(null);
    const [markerPosition, setMarkerPosition] = useState<{ x: number, y: number } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d,places`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (mapRef.current) {
                const mapInstance = mapRef.current;
                setMap(mapInstance);

                mapInstance.addEventListener('click', (e: any) => {
                    // Get click coordinates relative to the map element
                    const rect = mapInstance.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    setMarkerPosition({ x, y });
                    setSelectedLocation({ lat: e.detail.lat, lng: e.detail.lng });
                });
            }
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue || !map) return;

        const geocoder = new google.maps.Geocoder();

        try {
            const response = await geocoder.geocode({ address: searchValue });
            if (response.results[0]) {
                const { lat, lng } = response.results[0].geometry.location;
                const latitude = lat();
                const longitude = lng();

                map.setAttribute('center', `${latitude}, ${longitude}`);

                // Center marker in viewport when searching
                const rect = map.getBoundingClientRect();
                setMarkerPosition({
                    x: rect.width / 2,
                    y: rect.height / 2
                });
                setSelectedLocation({ lat: latitude, lng: longitude });
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    return (
        <div className="w-full h-screen relative">
            <form
                onSubmit={handleSearch}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-[90%]"
            >
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search location..."
                    className="w-full px-4 py-2 rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </form>

            {/* Custom Marker */}
            {markerPosition && (
                <div
                    className="absolute z-20 pointer-events-none"
                    style={{
                        left: `${markerPosition.x}px`,
                        top: `${markerPosition.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg" />
                        <div className="w-4 h-4 bg-red-500 rotate-45 -mt-2" />
                    </div>
                </div>
            )}

            {selectedLocation && (
                <button
                    onClick={() => console.log('Selected:', selectedLocation)}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 
                             bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg
                             hover:bg-blue-600 transition-colors duration-200
                             flex items-center space-x-2"
                >
                    <span>Continue</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            <gmp-map-3d
                ref={mapRef}
                center="40.7128, -74.0060"
                range="20000"
                className="w-full h-full"
            />
        </div>
    );
}
