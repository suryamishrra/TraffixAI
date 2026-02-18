"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  Car,
  Activity,
  CreditCard,
  Camera,
  UploadCloud
} from "lucide-react";

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

  // ================= DASHBOARD FETCH =================
  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/status`);
      setData(res.data);
    } catch (err) {
      console.error("Status fetch error:", err);
    }

    try {
      const res2 = await axios.get(`${BASE_URL}/toll-history`);
      setHistory(res2.data.reverse());
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // ================= IMAGE UPLOAD =================
  const handleUpload = async (e: any) => {
    if (loading) return;

    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const res = await axios.post(`${BASE_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);

      await axios.post(`${BASE_URL}/ai/toll`, {
        plate: "DL01AB1234"
      });

      fetchData();

    } catch (err: any) {
      console.error("Upload error:", err?.response?.data || err.message);
      alert("Upload failed.");
    }

    setLoading(false);
  };

  // ================= VIDEO UPLOAD =================
  const handleVideoUpload = async (e: any) => {
    if (loading) return;

    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const res = await axios.post(`${BASE_URL}/analyze-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);

    } catch (err: any) {
      console.error("Video upload error:", err?.response?.data || err.message);
      alert("Video upload failed.");
    }

    setLoading(false);
  };

  // ================= CAMERA START =================
  const startCamera = async () => {
    setCameraOn(true);
    const video = document.getElementById("cam") as HTMLVideoElement;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  };

  // ================= CAMERA STOP =================
  const stopCamera = () => {
    const video = document.getElementById("cam") as HTMLVideoElement;
    const stream = video?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setCameraOn(false);
  };

  // ================= CAMERA CAPTURE + ANALYZE =================
  const captureAndAnalyze = async () => {
    if (loading) return;

    const video = document.getElementById("cam") as HTMLVideoElement;
    if (!video || video.videoWidth === 0) {
      alert("Camera not ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    if (!blob || blob.size === 0) {
      alert("Invalid captured image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);

      await axios.post(`${BASE_URL}/ai/toll`, {
        plate: "DL99XY0001"
      });

      fetchData();

    } catch (err: any) {
      console.error("Camera analyze error:", err?.response?.data || err.message);
      alert("Camera analysis failed.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">

      <h1 className="text-4xl font-bold">🚦 TrafficAI Dashboard</h1>
      <p className="text-gray-400 mt-1">Smart Road Intelligence Control Panel</p>

      <div className="grid grid-cols-4 gap-6 mt-8">
        <Card title="Vehicle Count" value={data.vehicle_count} icon={<Car className="text-green-400"/>}/>
        <Card title="Traffic Status" value={data.traffic_status} icon={<Activity className="text-yellow-400"/>}/>
        <Card title="Last Plate" value={data.last_plate} icon={<Camera className="text-blue-400"/>}/>
        <Card title="Toll Status" value={data.toll_status} icon={<CreditCard className="text-purple-400"/>}/>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">Analyze Image</h2>
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl w-fit">
          <UploadCloud size={20}/>
          Upload Image
          <input type="file" hidden onChange={handleUpload}/>
        </label>
        {loading && <p className="mt-4 text-yellow-400">Processing...</p>}
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-3">Analyze Video</h2>
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <input type="file" accept="video/*" onChange={handleVideoUpload}/>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-3">Live Camera</h2>
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <button className="bg-blue-600 px-4 py-2 rounded-xl mr-3" onClick={startCamera}>
          Start Camera
        </button>

        <button className="bg-red-600 px-4 py-2 rounded-xl mr-3" onClick={stopCamera}>
          Stop Camera
        </button>

        <button className="bg-green-600 px-4 py-2 rounded-xl" onClick={captureAndAnalyze}>
          Capture & Analyze
        </button>

        {cameraOn && (
          <video id="cam" autoPlay className="mt-4 rounded-xl w-full max-w-md"/>
        )}
      </div>

      {analysis && (
        <div className="mt-6 bg-gray-900 p-6 rounded-2xl space-y-2">
          <p>Total Vehicles: {analysis.total_vehicles}</p>
          <p>Cars: {analysis.cars}</p>
          <p>Bikes: {analysis.bikes}</p>
          <p>Buses: {analysis.buses}</p>
          <p>Trucks: {analysis.trucks}</p>
          <p className="font-bold text-xl">
            Traffic Status: {analysis.traffic_status}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold mt-12 mb-4">Toll History</h2>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
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
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800">
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
    <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl hover:scale-105 transition">
      <div className="flex justify-between">
        <h2>{title}</h2>
        {icon}
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
    </div>
  );
}
