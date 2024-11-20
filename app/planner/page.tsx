'use client';

// types.ts
interface Location {
    lat: number;
    lng: number;
}

interface McDonalds {
    id: string;
    position: Location;
    name: string;
    clicked: boolean;
}

// components/McdonaldsGame.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input, Button, Card } from "@nextui-org/react";

const McdonaldsGame = () => {
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
    const [mcdonalds, setMcdonalds] = useState<McDonalds[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [voucher, setVoucher] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center] = useState<Location>({
        lat: 51.5074, // Default to London or your preferred location
        lng: -0.1278
    });
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ['places', 'maps'],
        mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID as string],
    });

    useEffect(() => {
        // Load the Maps JavaScript API with 3D libraries
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (mapContainerRef.current) {
                const mapElement = document.createElement('gmp-map-3d');
                mapElement.setAttribute('center', `${center.lat},${center.lng}`);
                mapElement.setAttribute('tilt', '45');
                mapElement.setAttribute('zoom', '18');
                mapElement.style.width = '100%';
                mapElement.style.height = '100%';

                // Add polyline element
                const polyline = document.createElement('gmp-polyline-3d');
                polyline.setAttribute('altitude-mode', 'relative-to-ground');
                polyline.setAttribute('stroke-color', 'rgba(25, 102, 210, 0.75)');
                polyline.setAttribute('stroke-width', '10');
                mapElement.appendChild(polyline);

                mapContainerRef.current.innerHTML = '';
                mapContainerRef.current.appendChild(mapElement);
            }
        };

        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, [center]);

    const findMcDonalds = useCallback(async (route: google.maps.DirectionsResult) => {
        if (!map) return;
        const service = new google.maps.places.PlacesService(map);
        const bounds = route.routes[0].bounds;

        const searchRequest = {
            bounds: bounds,
            type: 'restaurant',
            keyword: 'mcdonalds',
            rankBy: google.maps.places.RankBy.DISTANCE
        };

        service.nearbySearch(searchRequest, (results, status) => {
            console.log('Places API Response:', { status, results });
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const mcLocations = results.slice(0, 10).map(place => ({
                    id: place.place_id!,
                    position: {
                        lat: place.geometry!.location!.lat(),
                        lng: place.geometry!.location!.lng()
                    },
                    name: place.name!,
                    clicked: false
                }));
                setMcdonalds(mcLocations);
                console.log('Processed McDonald\'s locations:', mcLocations);
            }
        });
    }, [map]);

    const calculateRoute = async () => {
        try {
            const directionsService = new google.maps.DirectionsService();

            console.log('Geocoding addresses:', { startAddress, endAddress });
            const [startResults, endResults] = await Promise.all([
                getGeocode({ address: startAddress }),
                getGeocode({ address: endAddress })
            ]);

            const [startLocation, endLocation] = await Promise.all([
                getLatLng(startResults[0]),
                getLatLng(endResults[0])
            ]);

            console.log('Geocoded coordinates:', { startLocation, endLocation });

            const result = await directionsService.route({
                origin: startLocation,
                destination: endLocation,
                travelMode: google.maps.TravelMode.DRIVING
            });

            console.log('Directions API Response:', result);

            // Update polyline with route coordinates
            const polyline = document.querySelector('gmp-polyline-3d');
            if (polyline) {
                customElements.whenDefined(polyline.localName).then(() => {
                    const path = result.routes[0].overview_path;
                    const coordinates = path.map(point => ({
                        lat: point.lat(),
                        lng: point.lng()
                    }));
                    // @ts-ignore (coordinates property exists but isn't typed)
                    polyline.coordinates = coordinates;
                });
            }

            setRoute(result);
            await findMcDonalds(result);
        } catch (error) {
            console.error('Error calculating route:', error);
        }
    };

    const handleMarkerClick = (id: string) => {
        if (!gameStarted) return;

        setMcdonalds(prev => prev.map(mc => {
            if (mc.id === id && !mc.clicked) {
                setScore(s => s + 10);
                return { ...mc, clicked: true };
            }
            return mc;
        }));
    };

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
            return () => clearInterval(timer);
        }

        if (timeLeft === 0) {
            const voucherValue = score >= 100 ? "20%" : score >= 50 ? "10%" : "5%";
            setVoucher(`Congratulations! You've earned a ${voucherValue} discount at any McDonald's along this route!`);
        }
    }, [gameStarted, timeLeft, score]);

    // Add custom overlay for McDonald's locations
    const McdonaldsOverlay = ({ position, clicked, onClick }: {
        position: Location;
        clicked: boolean;
        onClick: () => void
    }) => {
        if (clicked) return null;

        return (
            <div
                onClick={onClick}
                style={{
                    position: 'absolute',
                    width: '30px',
                    height: '30px',
                    backgroundColor: 'rgba(0, 255, 0, 0.5)',
                    border: '2px solid white',
                    cursor: 'pointer',
                    transform: 'translate(-50%, -50%)'
                }}
            />
        );
    };

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <div className="max-w-[1400px] mx-auto p-6">
            <Card className="p-6">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                        McDonald's Route Game
                    </h1>
                </div>

                <div>
                    {!route && (
                        <div className="space-y-4 bg-gray-100 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Enter Your Route</h2>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Starting Location</label>
                                <Input
                                    isClearable
                                    variant="bordered"
                                    classNames={{
                                        input: "w-full",
                                        base: "bg-white",
                                    }}
                                    size="lg"
                                    placeholder="Enter starting address"
                                    value={startAddress}
                                    onChange={(e) => setStartAddress(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Destination</label>
                                <Input
                                    isClearable
                                    variant="bordered"
                                    classNames={{
                                        input: "w-full",
                                        base: "bg-white",
                                    }}
                                    size="lg"
                                    placeholder="Enter destination address"
                                    value={endAddress}
                                    onChange={(e) => setEndAddress(e.target.value)}
                                />
                            </div>
                            <Button
                                color="primary"
                                size="lg"
                                className="w-full"
                                onClick={calculateRoute}
                            >
                                Calculate Route
                            </Button>
                        </div>
                    )}

                    <div
                        ref={mapContainerRef}
                        className="mt-6 h-[600px] w-full"
                    />

                    {route && !gameStarted && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                            <Button
                                color="success"
                                size="lg"
                                className="px-8 py-6 text-xl font-bold animate-pulse shadow-lg"
                                onClick={() => setGameStarted(true)}
                            >
                                🎮 Click to Start the McDonald's Hunt! 🎮
                            </Button>
                        </div>
                    )}

                    {mcdonalds.map(mc => (
                        <McdonaldsOverlay
                            key={mc.id}
                            position={mc.position}
                            clicked={mc.clicked}
                            onClick={() => handleMarkerClick(mc.id)}
                        />
                    ))}

                    {gameStarted && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <h3 className="text-xl font-bold">Score: {score}</h3>
                                <h4 className="text-lg">Time Left: {timeLeft}s</h4>
                            </div>
                        </div>
                    )}

                    {voucher && (
                        <Card className="mt-4 bg-green-500">
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-white">
                                    {voucher}
                                </h3>
                            </div>
                        </Card>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default McdonaldsGame;