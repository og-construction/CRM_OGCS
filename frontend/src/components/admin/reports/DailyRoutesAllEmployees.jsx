import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const haversineKm = (pts) => {
  let m = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    m += 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  return m.toFixed(2);
};

export default function DailyRoutesAllEmployees() {
  const [date, setDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/locations/daily-routes", {
        params: { date },
      });
      setData(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-xl px-3 py-2"
        />
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white"
        >
          Load
        </button>
      </div>

      {loading && <div>Loading routes...</div>}

      {data.map((emp) => {
        const pts = emp.points || [];
        if (pts.length < 2) return null;

        const polyline = pts.map((p) => [p.lat, p.lng]);
        const distance = haversineKm(pts);
        const start = new Date(pts[0].capturedAt).toLocaleTimeString();
        const end = new Date(pts[pts.length - 1].capturedAt).toLocaleTimeString();

        return (
          <div key={emp.user._id} className="bg-white border rounded-2xl p-4">
            <div className="mb-2">
              <div className="font-semibold">{emp.user.name}</div>
              <div className="text-xs text-slate-500">
                {start} → {end} • {distance} km
              </div>
            </div>

            <MapContainer
              center={polyline[0]}
              zoom={14}
              style={{ height: 350, width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={polyline[0]} />
              <Marker position={polyline[polyline.length - 1]} />
              <Polyline positions={polyline} pathOptions={{ color: "red" }} />
            </MapContainer>
          </div>
        );
      })}
    </div>
  );
}
