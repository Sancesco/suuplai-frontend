'use client'

import { useEffect, useRef } from 'react'

interface MapPoint {
  id: string
  name: string
  slots: number
  lat: number
  lng: number
}

const mapPoints: MapPoint[] = [
  { id: 'condesa',  name: 'Condesa',    slots: 4, lat: 19.4111, lng: -99.1769 },
  { id: 'roma',     name: 'Roma Norte', slots: 3, lat: 19.4185, lng: -99.1629 },
  { id: 'polanco',  name: 'Polanco',    slots: 3, lat: 19.4330, lng: -99.1978 },
  { id: 'coyoacan', name: 'Coyoacán',   slots: 2, lat: 19.3479, lng: -99.1613 },
  { id: 'santafe',  name: 'Santa Fe',   slots: 2, lat: 19.3572, lng: -99.2650 },
  { id: 'narvarte', name: 'Narvarte',   slots: 3, lat: 19.3971, lng: -99.1628 },
  { id: 'doctores', name: 'Doctores',   slots: 3, lat: 19.4134, lng: -99.1473 },
]

// Which map point IDs belong to each zone filter
const ZONE_MAP: Record<string, string[]> = {
  'Roma/Condesa': ['roma', 'condesa'],
  'Polanco':      ['polanco'],
  'Coyoacán':     ['coyoacan'],
  'Santa Fe':     ['santafe'],
  'Norte':        [],
  'Sur':          ['narvarte', 'doctores'],
}

interface MapaLeafletProps {
  activeZone?: string | null
}

export function MapaLeaflet({ activeZone }: MapaLeafletProps) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<import('leaflet').Map | null>(null)
  const markersRef  = useRef<Map<string, import('leaflet').CircleMarker>>(new Map())

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return

    let destroyed = false

    import('leaflet').then((L) => {
      if (destroyed || !mapRef.current || mapInstance.current) return
      // Fix default icon path issue with webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [19.39, -99.18],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      })

      mapInstance.current = map

      // CartoDB Dark tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      // Create circle markers and store refs for later filtering
      mapPoints.forEach((point) => {
        const circleMarker = L.circleMarker([point.lat, point.lng], {
          radius: 10,
          fillColor: '#FF6B35',
          color: '#FF9A73',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map)

        markersRef.current.set(point.id, circleMarker)

        circleMarker.bindPopup(
          `<div style="
            background: #13131A;
            border: 1px solid #FF6B35;
            border-radius: 8px;
            padding: 10px 14px;
            font-family: 'DM Sans', sans-serif;
            min-width: 140px;
          ">
            <p style="color: #F0EFE8; font-weight: 600; font-size: 14px; margin: 0 0 4px;">${point.name}</p>
            <p style="color: #FF6B35; font-size: 14px; margin: 0;">${point.slots} espacios disponibles</p>
          </div>`,
          {
            className: 'suuplai-popup',
            closeButton: false,
          }
        )

        circleMarker.on('mouseover', () => {
          circleMarker.openPopup()
          circleMarker.setStyle({ radius: 14, fillColor: '#FF9A73' })
        })
        circleMarker.on('mouseout', () => {
          circleMarker.closePopup()
          circleMarker.setStyle({ radius: 10, fillColor: '#FF6B35' })
        })
      })
    })

    return () => {
      destroyed = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
      markersRef.current.clear()
    }
  }, [])

  // Filter markers when activeZone changes
  useEffect(() => {
    if (markersRef.current.size === 0) return

    const activeIds = activeZone ? (ZONE_MAP[activeZone] ?? []) : null

    markersRef.current.forEach((marker, id) => {
      const isHighlighted = !activeIds || activeIds.includes(id)
      marker.setStyle({
        fillColor:   isHighlighted ? '#FF6B35' : '#4a4a5a',
        color:       isHighlighted ? '#FF9A73' : '#3a3a4a',
        fillOpacity: isHighlighted ? 0.9 : 0.25,
        opacity:     isHighlighted ? 1   : 0.35,
      })
    })
  }, [activeZone])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: 'clamp(280px, 50vw, 420px)', borderRadius: '12px' }}
      aria-label="Mapa de CDMX con espacios disponibles"
    />
  )
}
