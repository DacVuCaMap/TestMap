"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Import `react-leaflet` chỉ khi client render (tránh lỗi SSR)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function GeolocationTest() {

  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);



  useEffect(() => {
    // Xác nhận client-side render
    setIsClient(true);

    // Import Leaflet bên trong useEffect (tránh lỗi window is not defined)
    import("leaflet").then((L) => {
      setCustomIcon(
        new L.Icon({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    });

    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }

    // 🔥 Gọi API để lấy vị trí mới nhất từ server khi component mount
    async function fetchLatestLocation() {
      try {
        const res = await fetch("/api/get-location");
        const data = await res.json();
        if (data.success) {
          console.log(data.succes);
        } else {
          console.warn("Không có dữ liệu vị trí:", data.error);
        }
      } catch (error) {
        console.error("Lỗi khi lấy vị trí từ server:", error);
      }
    }

    fetchLatestLocation();



    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(newLocation);

        // Gửi dữ liệu lên server
        try {
          const response = await fetch("/api/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newLocation),
          });

          const data = await response.json();
          console.log("Vị trí đã được cập nhật:", data);
        } catch (error) {
          console.error("Lỗi khi gửi vị trí:", error);
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  if (!isClient) {
    return <div>🔄 Đang tải bản đồ...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  if (location.lat === null || location.lng === null || !customIcon) {
    return <div>Đang tải vị trí...</div>;
  }

  return (
    <MapContainer
      center={[location.lat, location.lng] as [number, number]}
      zoom={15}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker
        position={[location.lat, location.lng] as [number, number]}
        icon={customIcon}
      >
        <Popup>Vị trí của bạn!</Popup>
      </Marker>
    </MapContainer>
  );
}
