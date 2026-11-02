"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { shortMoney } from "@/lib/format";

export type MapPin = { id: number; lat: number; lng: number; price: number; street: string; photo: string };

function pinIcon(price: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;transform:translate(-50%,-50%);padding:3px 8px;font:600 13px/1.4 var(--font-inter),system-ui,sans-serif;border-radius:999px;white-space:nowrap;box-shadow:0 1px 3px rgba(17,24,39,.25);background:${active ? "var(--accent)" : "var(--ink)"};color:${active ? "var(--accent-ink)" : "var(--ground)"}">${shortMoney(price)}</span>`, // taste-skill-ignore: price pins float over the map, a real overlay
    iconSize: [0, 0],
  });
}

/**
 * Fits the map to the pins. On phones the map starts hidden (0×0), so it also
 * watches its own size and re-measures and re-fits once it becomes visible.
 */
function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      if (!pins.length) return;
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 });
    };
    fit();
    let wasEmpty = map.getContainer().clientWidth === 0;
    const observer = new ResizeObserver(([entry]) => {
      const empty = entry.contentRect.width === 0 || entry.contentRect.height === 0;
      map.invalidateSize();
      if (wasEmpty && !empty) fit();
      wasEmpty = empty;
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, pins]);
  return null;
}

export default function ListingMap({ pins, activeId, slug }: { pins: MapPin[]; activeId: number | null; slug: string }) {
  const center = useMemo<[number, number]>(() => (pins[0] ? [pins[0].lat, pins[0].lng] : [41.2565, -95.9345]), [pins]);
  return (
    <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pins={pins} />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.price, p.id === activeId)} zIndexOffset={p.id === activeId ? 1000 : 0}>
          <Popup>
            <a href={`/s/${slug}/homes/${p.id}`} style={{ display: "block", width: 180, color: "inherit", textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt="" width={240} height={100} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6 }} />
              <strong style={{ display: "block", marginTop: 6, fontSize: 15 }}>{shortMoney(p.price)}</strong>
              <span style={{ fontSize: 12 }}>{p.street}</span>
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
