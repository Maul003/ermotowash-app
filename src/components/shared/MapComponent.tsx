'use client'

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

interface MapComponentProps {
  onLocationChange: (lat: number, lng: number, distanceKm: number) => void
}

const BASE_LAT = -7.010653091542733
const BASE_LNG = 106.57877713520065

export default function MapComponent({ onLocationChange }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // 1. Initialize Map
    const map = L.map(mapContainerRef.current).setView([BASE_LAT, BASE_LNG], 15)
    mapRef.current = map

    // 2. Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // 3. Create Steam Basecamp Marker (Blue Store Icon SVG)
    const basecampIcon = L.divIcon({
      html: `
        <div class="text-blue-600 bg-white p-1.5 rounded-full shadow-md border border-blue-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4-4h12l4 4"/>
            <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/>
            <path d="M12 22v-9"/>
          </svg>
        </div>`,
      className: 'bg-transparent',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
    
    L.marker([BASE_LAT, BASE_LNG], { icon: basecampIcon })
      .addTo(map)
      .bindPopup("<b>ER Basecamp</b><br/>Tempat pencucian motor.")
      .openPopup()

    // 4. Create Draggable Bike Marker (Red Pin Icon SVG)
    const bikeIcon = L.divIcon({
      html: `
        <div class="text-red-500 drop-shadow-lg flex items-center justify-center animate-bounce-short">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
          </svg>
        </div>`,
      className: 'bg-transparent',
      iconSize: [34, 40],
      iconAnchor: [17, 40]
    })

    // Initialize marker a bit offset from basecamp
    const initialLatLng = L.latLng(BASE_LAT + 0.002, BASE_LNG + 0.002)
    const marker = L.marker(initialLatLng, {
      icon: bikeIcon,
      draggable: true
    }).addTo(map)
    markerRef.current = marker

    // 5. Update coordinates & distance
    const updateLocation = (latlng: L.LatLng) => {
      const distance = map.distance([BASE_LAT, BASE_LNG], latlng)
      const distanceKm = distance / 1000
      onLocationChange(latlng.lat, latlng.lng, distanceKm)
    }

    // Trigger initial check
    updateLocation(initialLatLng)

    // Events
    marker.on('dragend', () => {
      const position = marker.getLatLng()
      updateLocation(position)
    })

    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      updateLocation(e.latlng)
    })

    // Autoinvalidate map to fix grey area bugs
    setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onLocationChange])

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full rounded-2xl shadow-inner border-2 border-gray-200 z-0 relative overflow-hidden bg-gray-100"
    />
  )
}
