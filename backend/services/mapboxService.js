/**
 * HEAT & TREATS - MAPBOX SERVICE
 * Utility service for geocoding (converting address texts into coordinates) and reverse geocoding.
 * Includes elegant fallbacks for cases where no valid Mapbox token is provided.
 */

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

class MapboxService {
    constructor() {
        const token = process.env.MAPBOX_ACCESS_TOKEN;
        const isPlaceholder = !token || token === 'your_token_here' || token.trim() === '';
        
        if (isPlaceholder) {
            console.warn('Mapbox Service: MAPBOX_ACCESS_TOKEN is missing or set to placeholder. Operating in fallback mode.');
            this.geocodingClient = null;
        } else {
            try {
                this.geocodingClient = mbxGeocoding({ accessToken: token });
            } catch (err) {
                console.error('Mapbox Service: Initialization failed, falling back to mock mode.', err.message);
                this.geocodingClient = null;
            }
        }
    }

    /**
     * Converts an address text into geographic coordinates.
     * @param {string} address - Address description (e.g., "Nairobi, Kenya")
     * @returns {Promise<Object>} - Geocoding response body
     */
    async forwardGeocode(address) {
        if (!this.geocodingClient) {
            console.log(`Mapbox Service [Mock]: Forward geocoding query "${address}"`);
            // Mock Nairobi CBD coords [36.8219, -1.2921] with slight variance based on query length
            const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const latOffset = (hash % 100) / 10000 - 0.005;
            const lngOffset = (hash % 70) / 10000 - 0.0035;
            const center = [36.8219 + lngOffset, -1.2921 + latOffset];

            return {
                type: 'FeatureCollection',
                query: [address],
                features: [
                    {
                        id: `mock.geocode.${hash}`,
                        type: 'Feature',
                        place_type: ['place'],
                        relevance: 1,
                        properties: {},
                        text: address,
                        place_name: `${address}, (Mocked Coordinate)`,
                        center: center,
                        geometry: {
                            type: 'Point',
                            coordinates: center
                        }
                    }
                ]
            };
        }

        try {
            const response = await this.geocodingClient
                .forwardGeocode({
                    query: address,
                    limit: 1
                })
                .send();
            return response.body;
        } catch (error) {
            console.error('Mapbox forward geocoding failed. Using mock fallback.', error);
            return this.forwardGeocodeMockFallback(address);
        }
    }

    /**
     * Converts geographic coordinates into a human-readable address.
     * @param {Array<number>} coordinates - [longitude, latitude]
     * @returns {Promise<Object>} - Geocoding response body
     */
    async reverseGeocode(coordinates) {
        if (!this.geocodingClient) {
            console.log(`Mapbox Service [Mock]: Reverse geocoding coordinates [${coordinates.join(', ')}]`);
            return {
                type: 'FeatureCollection',
                query: coordinates,
                features: [
                    {
                        id: `mock.reverse.${Date.now()}`,
                        type: 'Feature',
                        place_type: ['address'],
                        relevance: 1,
                        properties: {},
                        text: 'Nairobi CBD',
                        place_name: `Nairobi CBD, Kenya (Mocked Reverse Geocode from [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}])`,
                        center: coordinates,
                        geometry: {
                            type: 'Point',
                            coordinates: coordinates
                        }
                    }
                ]
            };
        }

        try {
            const response = await this.geocodingClient
                .reverseGeocode({
                    query: coordinates,
                    limit: 1
                })
                .send();
            return response.body;
        } catch (error) {
            console.error('Mapbox reverse geocoding failed. Using mock fallback.', error);
            return this.reverseGeocodeMockFallback(coordinates);
        }
    }

    forwardGeocodeMockFallback(address) {
        return {
            type: 'FeatureCollection',
            query: [address],
            features: [
                {
                    id: 'fallback.geocode',
                    type: 'Feature',
                    place_type: ['place'],
                    relevance: 1,
                    properties: {},
                    text: address,
                    place_name: `${address} (Fallback Nairobi)`,
                    center: [36.8219, -1.2921],
                    geometry: {
                        type: 'Point',
                        coordinates: [36.8219, -1.2921]
                    }
                }
            ]
        };
    }

    reverseGeocodeMockFallback(coordinates) {
        return {
            type: 'FeatureCollection',
            query: coordinates,
            features: [
                {
                    id: 'fallback.reverse',
                    type: 'Feature',
                    place_type: ['address'],
                    relevance: 1,
                    properties: {},
                    text: 'Nairobi',
                    place_name: `Nairobi, Kenya (Fallback Reverse Geocode from [${coordinates.join(', ')}])`,
                    center: coordinates,
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                }
            ]
        };
    }
}

module.exports = new MapboxService();
