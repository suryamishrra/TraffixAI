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
  const [cameraOn, setCameraOn] = useState(false);
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

  // Reduced polling (performance fix)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
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

  const handleVideoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${BASE_URL}/analyze-video`, formData);
      setAnalysis(res.data);
    } catch {
      alert("Video upload failed.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">

      <h1 className="text-4xl font-bold">🚦 TrafficAI Dashboard</h1>
      <p className="text-gray-400 mt-1">Smart Road Intelligence Control Panel</p>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-6 mt-8">
        <Card title="Vehicle Count" value={data.vehicle_count} icon={<Car className="text-green-400"/>}/>
        <Card title="Traffic Status" value={data.traffic_status} icon={<Activity className="text-yellow-400"/>}/>
        <Card title="Last Plate" value={data.last_plate} icon={<Camera className="text-blue-400"/>}/>
        <Card title="Toll Status" value={data.toll_status} icon={<CreditCard className="text-purple-400"/>}/>
      </div>

      {/* IMAGE UPLOAD */}
      <h2 className="text-2xl font-bold mt-12 mb-4">Analyze Image</h2>

      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg">
        <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl w-fit transition">
          <UploadCloud size={20}/>
          <span>Upload Image</span>
          <input type="file" className="hidden" onChange={handleUpload}/>
        </label>

        {loading && <p className="mt-4 text-yellow-400">Processing...</p>}

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

      {/* VIDEO UPLOAD */}
      <h2 className="text-2xl font-bold mt-10 mb-3">Analyze Video</h2>

      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <input type="file" accept="video/*" onChange={handleVideoUpload}/>
      </div>

      {/* CAMERA */}
      <h2 className="text-2xl font-bold mt-10 mb-3">Live Camera</h2>

      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">

        <button
          className="bg-blue-600 px-4 py-2 rounded-xl mr-3"
          onClick={async () => {
            setCameraOn(true);
            const video = document.getElementById("cam") as HTMLVideoElement;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
          }}
        >
          Start Camera
        </button>

        <button
          className="bg-red-600 px-4 py-2 rounded-xl"
          onClick={() => {
            const video = document.getElementById("cam") as HTMLVideoElement;
            const stream = video?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setCameraOn(false);
          }}
        >
          Stop Camera
        </button>

        {cameraOn && (
          <video
            id="cam"
            autoPlay
            className="mt-4 rounded-xl w-full max-w-md"
          />
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
