"use client";

import axios from "axios";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Car,
  Activity,
  CreditCard,
  Camera,
  UploadCloud
} from "lucide-react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://suryamishrra-traffix-ai.hf.space";

type DashboardStatus = {
  vehicle_count: number;
  traffic_status: string;
  last_plate: string;
  toll_status: string;
};

type AnalysisResult = {
  total_vehicles: number;
  cars: number;
  bikes: number;
  buses: number;
  trucks: number;
  traffic_status: string;
  processed_frames?: number;
};

type TollHistoryRow = {
  vehicle_number: string;
  entry_time: string;
  exit_time: string | null;
  status: string;
  toll_amount?: number;
};

const getErrorDetail = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
};

export default function Home() {
  const [data, setData] = useState<DashboardStatus>({
    vehicle_count: 0,
    traffic_status: "Loading...",
    last_plate: "—",
    toll_status: "—",
  });

  const [history, setHistory] = useState<TollHistoryRow[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tollPlate, setTollPlate] = useState("");
  const [tollLoading, setTollLoading] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

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
      setHistory([...(res2.data || [])].reverse());
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
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (loading) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const res = await axios.post(`${BASE_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);
    } catch (err: unknown) {
      console.error("Upload error:", getErrorDetail(err));
      alert(getErrorDetail(err) || "Upload failed.");
    } finally {
      setLoading(false);
      await fetchData();
    }
  };

  // ================= VIDEO UPLOAD =================
  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (loading) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const res = await axios.post(`${BASE_URL}/analyze-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);
    } catch (err: unknown) {
      console.error("Video upload error:", getErrorDetail(err));
      alert(getErrorDetail(err) || "Video upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // ================= CAMERA START =================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById("cam") as HTMLVideoElement | null;
      if (video) {
        video.srcObject = stream;
      }
      setVideoStream(stream);
      setCameraOn(true);
    } catch (err) {
      console.error("Camera start error:", err);
      alert("Camera access denied or unavailable.");
    }
  };

  // ================= CAMERA STOP =================
  const stopCamera = () => {
    const video = document.getElementById("cam") as HTMLVideoElement | null;
    const stream = (video?.srcObject as MediaStream | null) || videoStream;
    stream?.getTracks().forEach((track) => track.stop());
    if (video) {
      video.srcObject = null;
    }
    setVideoStream(null);
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
    } catch (err: unknown) {
      console.error("Camera analyze error:", getErrorDetail(err));
      alert(getErrorDetail(err) || "Camera analysis failed.");
    } finally {
      setLoading(false);
      await fetchData();
    }
  };

  const submitToll = async () => {
    const plate = tollPlate.trim().toUpperCase();
    if (!plate) {
      alert("Enter vehicle number first.");
      return;
    }

    setTollLoading(true);
    try {
      await axios.post(`${BASE_URL}/ai/toll`, { plate });
      setTollPlate("");
      await fetchData();
    } catch (err: unknown) {
      console.error("Toll error:", getErrorDetail(err));
      alert(getErrorDetail(err) || "Toll update failed.");
    } finally {
      setTollLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">

      <h1 className="text-4xl font-bold">🚦 TrafficAI Dashboard</h1>
      <p className="text-gray-400 mt-1">Smart Road Intelligence Control Panel</p>
      <p className="text-gray-500 mt-1 text-sm">API: {BASE_URL}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Card title="Vehicle Count" value={data.vehicle_count} icon={<Car className="text-green-400"/>}/>
        <Card title="Traffic Status" value={data.traffic_status} icon={<Activity className="text-yellow-400"/>}/>
        <Card title="Last Plate" value={data.last_plate} icon={<Camera className="text-blue-400"/>}/>
        <Card title="Toll Status" value={data.toll_status} icon={<CreditCard className="text-purple-400"/>}/>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">Analyze Media</h2>
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl w-fit">
            <UploadCloud size={20}/>
            Upload Image
            <input type="file" accept="image/*" hidden onChange={handleUpload}/>
          </label>

          <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl w-fit">
            <UploadCloud size={20}/>
            Upload Video
            <input type="file" accept="video/*" hidden onChange={handleVideoUpload}/>
          </label>
        </div>
        {loading && <p className="mt-4 text-yellow-400">Processing media...</p>}
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
          <video id="cam" autoPlay playsInline muted className="mt-4 rounded-xl w-full max-w-md"/>
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
          {analysis.processed_frames ? <p>Processed Frames: {analysis.processed_frames}</p> : null}
        </div>
      )}

      <h2 className="text-2xl font-bold mt-12 mb-4">Toll Entry / Exit</h2>
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 w-full md:w-72"
            placeholder="Vehicle Number (e.g. DL01AB1234)"
            value={tollPlate}
            onChange={(e) => setTollPlate(e.target.value)}
          />
          <button
            className="bg-emerald-600 px-4 py-2 rounded-xl"
            onClick={submitToll}
            disabled={tollLoading}
          >
            {tollLoading ? "Updating..." : "Mark Entry / Exit"}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">Toll History</h2>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">Plate</th>
              <th className="p-3 text-left">Entry</th>
              <th className="p-3 text-left">Exit</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="p-3">{h.vehicle_number}</td>
                <td className="p-3">{h.entry_time}</td>
                <td className="p-3">{h.exit_time || "—"}</td>
                <td className="p-3 text-green-400">{h.status}</td>
                <td className="p-3">{h.toll_amount ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  );
}

type CardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
};

function Card({ title, value, icon }: CardProps) {
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
