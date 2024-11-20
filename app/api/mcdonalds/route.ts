import { NextResponse } from 'next/server';

// Expected Output Format:
/*
{
  "franchises": [
    {
      "name": string,
      "address": string,
      "location": {
        "lat": number,
        "lng": number
      }
    }
  ]
}
*/

export async function POST(request: Request) {
    try {
        const { source, destination, franchise = "McDonald's" } = await request.json();

        if (!source || !destination) {
            return NextResponse.json({ error: "Source and destination are required" }, { status: 400 });
        }

        // Get route from Directions API
        const directionsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${encodeURIComponent(source)}&` +
            `destination=${encodeURIComponent(destination)}&` +
            `key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        const directionsData = await directionsResponse.json();

        if (directionsData.status !== 'OK') {
            return NextResponse.json({ error: "Failed to fetch route", details: directionsData }, { status: 500 });
        }

        // Extract waypoints from route
        const waypoints = directionsData.routes[0].legs[0].steps.map((step: any) => ({
            lat: step.end_location.lat,
            lng: step.end_location.lng
        }));

        // Search for franchises along the route
        const franchises = [];
        for (const waypoint of waypoints) {
            const placesResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
                `location=${waypoint.lat},${waypoint.lng}&` +
                `radius=5000&` + // 5km radius
                `keyword=${encodeURIComponent(franchise)}&` +
                `key=${process.env.GOOGLE_MAPS_API_KEY}`
            );

            const placesData = await placesResponse.json();

            if (placesData.status === 'OK') {
                franchises.push(...placesData.results.map((place: any) => ({
                    name: place.name,
                    address: place.vicinity,
                    location: place.geometry.location
                })));
            }
        }

        // Remove duplicates based on address
        const uniqueFranchises = Array.from(
            new Map(franchises.map(item => [item.address, item])).values()
        );

        return NextResponse.json({ franchises: uniqueFranchises });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
