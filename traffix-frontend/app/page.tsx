"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Car, Activity, CreditCard, Camera, UploadCloud } from "lucide-react";

const BASE_URL = "https://suryamishrra-traffix-ai.hf.space";

export default function Home() {

  const [data, setData] = useState<any>({
    vehicle_count: 0,
    traffic_status: "Loading...",
    last_plate: "—",
    toll_status: "—"
  });

  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/status`);
      setData(res.data);
    } catch {}

    try {
      const res2 = await axios.get(`${BASE_URL}/toll-history`);
      setHistory(res2.data.reverse());
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // less frequent refresh
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${BASE_URL}/analyze`, formData);
      setAnalysis(res.data);
    } catch {
      alert("Upload failed.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">

      <h1 className="text-4xl font-bold tracking-tight">
        🚦 TrafficAI Dashboard
      </h1>
      <p className="text-gray-400 mt-1">
        Smart Road Intelligence Control Panel
      </p>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-6 mt-8">

        <Card title="Vehicle Count" value={data.vehicle_count} icon={<Car className="text-green-400"/>}/>
        <Card title="Traffic Status" value={data.traffic_status} icon={<Activity className="text-yellow-400"/>}/>
        <Card title="Last Plate" value={data.last_plate} icon={<Camera className="text-blue-400"/>}/>
        <Card title="Toll Status" value={data.toll_status} icon={<CreditCard className="text-purple-400"/>}/>

      </div>

      {/* AI UPLOAD SECTION */}
      <h2 className="text-2xl font-bold mt-12 mb-4">Analyze Traffic</h2>

      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg">

        <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl w-fit transition">
          <UploadCloud size={20}/>
          <span>Upload Image</span>
          <input type="file" className="hidden" onChange={handleUpload}/>
        </label>

        {loading && (
          <p className="mt-4 text-yellow-400">Analyzing image...</p>
        )}

        {analysis && (
          <div className="mt-6 space-y-2 text-lg">
            <p>Total Vehicles: {analysis.total_vehicles}</p>
            <p>Cars: {analysis.cars}</p>
            <p>Bikes: {analysis.bikes}</p>
            <p>Buses: {analysis.buses}</p>
            <p>Trucks: {analysis.trucks}</p>
            <p className="font-bold text-xl mt-3">
              Traffic Status: {analysis.traffic_status}
            </p>
          </div>
        )}

      </div>

      {/* TOLL HISTORY */}
      <h2 className="text-2xl font-bold mt-12 mb-4">Toll History</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-sm">
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
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800 transition">
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

function Card({ title, value, icon }: any) {
  return (
    <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl hover:scale-105 transition">
      <div className="flex justify-between">
        <h2 className="text-lg">{title}</h2>
        {icon}
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
    </div>
  );
}
