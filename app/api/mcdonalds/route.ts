import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { origin, destination } = await request.json();
        const mcdonaldsLocations = [];

        // First, get the route from Google Directions API
        const directionsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${encodeURIComponent(origin)}&` +
            `destination=${encodeURIComponent(destination)}&` +
            `key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        const directionsData = await directionsResponse.json();

        if (directionsData.status !== 'OK') {
            throw new Error('Failed to fetch route');
        }

        // Extract waypoints from the route steps
        const steps = directionsData.routes[0].legs[0].steps;
        const waypoints = steps.map((step: any) => step.end_location);

        // Search for McDonald's locations at each waypoint
        for (const waypoint of waypoints) {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
                `location=${waypoint.lat},${waypoint.lng}&` +
                `radius=5000&` + // 5km radius around each point
                `type=restaurant&` +
                `keyword=mcdonalds&` +
                `key=${process.env.GOOGLE_MAPS_API_KEY}`
            );

            const data = await response.json();
            if (data.status === 'OK') {
                mcdonaldsLocations.push(...data.results);
            }
        }

        // Remove duplicates based on place_id
        const uniqueLocations = Array.from(
            new Map(mcdonaldsLocations.map(item => [item.place_id, item])).values()
        );

        return NextResponse.json({
            locations: uniqueLocations.map((place: any) => ({
                id: place.place_id,
                position: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                name: place.name,
                clicked: false
            }))
        });
    } catch (error) {
        console.error('Error fetching McDonald\'s locations:', error);
        return NextResponse.json({ error: 'Failed to fetch McDonald\'s locations' }, { status: 500 });
    }
}
