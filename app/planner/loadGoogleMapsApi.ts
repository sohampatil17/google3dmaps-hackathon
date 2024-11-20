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
import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const McdonaldsGame = () => {
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
    const [mcdonalds, setMcdonalds] = useState<McDonalds[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [voucher, setVoucher] = useState<string | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ['places', 'routes'] as ['places', 'routes'],
    });

    const findMcDonalds = useCallback(async (route: google.maps.DirectionsResult) => {
        const mapRef = document.createElement('div');
        const service = new google.maps.places.PlacesService(mapRef);
        const path = route.routes[0].overview_path;

        // Search for McDonald's along route
        const searchRequest = {
            location: path[Math.floor(path.length / 2)],
            radius: 2000,
            keyword: 'mcdonalds'
        };

        service.nearbySearch(searchRequest, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const mcLocations = results.map(place => ({
                    id: place.place_id!,
                    position: {
                        lat: place.geometry!.location!.lat(),
                        lng: place.geometry!.location!.lng()
                    },
                    name: place.name!,
                    clicked: false
                }));
                setMcdonalds(mcLocations);
            }
        });
    }, []);

    const calculateRoute = async () => {
        const directionsService = new google.maps.DirectionsService();
        const [startResults, endResults] = await Promise.all([
            getGeocode({ address: startAddress }),
            getGeocode({ address: endAddress })
        ]);

        const [startLocation, endLocation] = await Promise.all([
            getLatLng(startResults[0]),
            getLatLng(endResults[0])
        ]);

        const result = await directionsService.route({
            origin: startLocation,
            destination: endLocation,
            travelMode: google.maps.TravelMode.DRIVING
        });

        setRoute(result);
        await findMcDonalds(result);
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

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <div className= "game-container" >
        <div className="inputs" >
            <input 
                    value={ startAddress }
    onChange = {(e) => setStartAddress(e.target.value)}
placeholder = "Start address"
    />
    <input 
                    value={ endAddress }
onChange = {(e) => setEndAddress(e.target.value)}
placeholder = "End address"
    />
    <button onClick={ calculateRoute }> Calculate Route </button>
        </div>

        < GoogleMap
mapContainerStyle = {{ width: '100%', height: '600px' }}
options = {{
    mapId: 'YOUR_3D_MAP_ID',
        tilt: 45,
            heading: 0,
                }}
            >
    { route && (
        <>
        <DirectionsRenderer directions={ route } />
{
    !gameStarted && (
        <button onClick={ () => setGameStarted(true) }>
            Get my Voucher!
                </button>
                        )
}
</>
                )}

{
    mcdonalds.map(mc => (
        <MarkerF
                        key= { mc.id }
                        position = { mc.position }
                        icon = {{
        url: mc.clicked ? '/fries-icon.png' : '/burger-icon.png',
        scaledSize: new google.maps.Size(30, 30)
    }}
onClick = {() => handleMarkerClick(mc.id)}
                    />
                ))}
</GoogleMap>

{
    gameStarted && (
        <div className="game-stats" >
            <div>Time Left: { timeLeft } s </div>
                < div > Score: { score } </div>
                    </div>
            )
}

{
    voucher && (
        <div className="voucher" >
            { voucher }
            </div>
            )
}
</div>
    );
};

export default McdonaldsGame;