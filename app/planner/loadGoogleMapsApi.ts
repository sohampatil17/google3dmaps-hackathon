let isLoading = false;
let isLoaded = false;

export function loadGoogleMapsApi(): Promise<void> {
    if (isLoaded) return Promise.resolve();
    if (isLoading) return new Promise((resolve) => {
        const checkIfLoaded = setInterval(() => {
            if (isLoaded) {
                clearInterval(checkIfLoaded);
                resolve();
            }
        }, 100);
    });

    isLoading = true;

    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`;
            script.async = true;
            script.onload = () => {
                isLoaded = true;
                isLoading = false;
                resolve();
            };
            script.onerror = (error) => {
                isLoading = false;
                reject(error);
            };
            document.head.appendChild(script);
        } catch (error) {
            isLoading = false;
            reject(error);
        }
    });
}