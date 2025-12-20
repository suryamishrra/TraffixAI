"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Car, Activity, CreditCard, Camera } from "lucide-react";

export default function Home() {

  const [data, setData] = useState<any>({
    vehicle_count: 0,
    traffic_status: "Loading...",
    last_plate: "—",
    toll_status: "—"
  });

  const [history, setHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/status");
      setData(res.data);
    } catch {}
    
    try {
      const res2 = await axios.get("http://127.0.0.1:8000/toll-history");
      setHistory(res2.data.reverse());
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        🚦 TrafficAI Dashboard
      </h1>
      <p className="text-gray-400 mt-1">
        Smart Road Intelligence Control Panel
      </p>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-6 mt-8">

        {/* Vehicles */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between">
            <h2 className="text-lg">Vehicle Count</h2>
            <Car className="text-green-400"/>
          </div>
          <p className="text-4xl font-bold mt-3">{data.vehicle_count}</p>
        </div>

        {/* Traffic */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between">
            <h2 className="text-lg">Traffic Status</h2>
            <Activity className="text-yellow-400"/>
          </div>
          <p className="text-3xl font-bold mt-3">{data.traffic_status}</p>
        </div>

        {/* Plate */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between">
            <h2 className="text-lg">Last Plate</h2>
            <Camera className="text-blue-400"/>
          </div>
          <p className="text-3xl font-bold mt-3">{data.last_plate}</p>
        </div>

        {/* Toll */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between">
            <h2 className="text-lg">Toll Status</h2>
            <CreditCard className="text-purple-400"/>
          </div>
          <p className="text-2xl font-bold mt-3">{data.toll_status}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-3">Toll History</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">Plate</th>
              <th className="p-3 text-left">Entry</th>
              <th className="p-3 text-left">Exit</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h: any, idx) => (
              <tr key={idx} className="border-t border-gray-700">
                <td className="p-3">{h.vehicle_number}</td>
                <td className="p-3">{h.entry_time}</td>
                <td className="p-3">{h.exit_time || "—"}</td>
                <td className="p-3 text-green-400">{h.status}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </main>
  );
}
