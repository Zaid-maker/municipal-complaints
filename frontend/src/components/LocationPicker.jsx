import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Roughly the centre of Pakistan; the pin starts here until the citizen picks
// a spot or shares their location.
const DEFAULT_CENTER = [30.3753, 69.3451];
const DEFAULT_ZOOM = 5;
const PIN_ZOOM = 16;

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: marker2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const tileLayerUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileLayerAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function LocationPicker({
  label,
  hint,
  value,
  onChange,
  readOnly = false,
  heightClass = "h-72"
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    });

    L.tileLayer(tileLayerUrl, {
      maxZoom: 19,
      attribution: tileLayerAttribution
    }).addTo(map);

    map.attributionControl.setPrefix(false);

    if (!readOnly) {
      map.on("click", (event) => {
        onChangeRef.current?.({
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const latlng = [value.lat, value.lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, {
        icon: pinIcon,
        draggable: !readOnly,
        keyboard: false
      }).addTo(map);

      markerRef.current.on("dragend", () => {
        const position = markerRef.current?.getLatLng();

        if (position) {
          onChangeRef.current?.({ lat: position.lat, lng: position.lng });
        }
      });
    }

    map.setView(latlng, Math.max(map.getZoom(), PIN_ZOOM));
  }, [value, readOnly]);

  function locate() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("This browser cannot share a location. Tap the map instead.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChangeRef.current?.({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setLocating(false);
        setMessage(
          error.code === 1
            ? "Location permission was denied. Tap the map instead."
            : "Could not get your location. Tap the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearPin() {
    setMessage("");
    onChangeRef.current?.(null);
  }

  return (
    <div>
      {(label || !readOnly) && (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          {label ? (
            <p className="text-sm font-medium text-slate-700">{label}</p>
          ) : (
            <span />
          )}

          {!readOnly && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                className="text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900 disabled:opacity-60"
              >
                {locating ? "Finding…" : "Use my location"}
              </button>

              {value && (
                <button
                  type="button"
                  onClick={clearPin}
                  className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                >
                  Clear pin
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        role="application"
        aria-label="Map for choosing the complaint location"
        className={`w-full overflow-hidden rounded-lg border border-slate-200 ${heightClass}`}
      />

      {message && <p className="mt-1.5 text-xs text-red-600">{message}</p>}

      <p className={`mt-1.5 text-xs ${value ? "text-slate-600" : "text-slate-500"}`}>
        {value
          ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : hint ?? "Tap the map to drop a pin, or use your current location."}
      </p>
    </div>
  );
}
