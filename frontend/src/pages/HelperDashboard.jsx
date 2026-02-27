// HelperDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
} from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import Silk from "../PagesUI/Silk.jsx";
import LogoutButton from "../PagesUI/LogoutButton.jsx";
import BlurText from "../PagesUI/BlurText.jsx";

/* ================= MAPBOX TOKEN ================= */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const API_URL      = "http://127.0.0.1:5000";

/* ================= CONSTANTS ================= */
const FALLBACK_HOSPITAL = {
  name: "Osmania General Hospital",
  lat: 17.375,
  lng: 78.48,
  distance: "N/A",
  contact: "+91 40 2460 0146",
};

/* ================= UTILS ================= */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  if (mins > 60) { const hrs = Math.floor(mins / 60); return `${hrs}h ${mins % 60}m`; }
  return `${mins} min`;
};
const formatDist       = (m) => (m / 1000).toFixed(1) + " km";
const cleanInstruction = (t) => t.replace(/undefined/g, "");

/* ================= PROFILE PANEL ================= */
const ProfilePanel = ({ helper, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={P.overlay} onClick={onClose}>
      <div style={P.panel} onClick={(e) => e.stopPropagation()}>
        <div style={P.header}>
          <h3 style={P.title}>👤 MY PROFILE</h3>
          <button style={P.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={P.avatar}>
          <span style={P.avatarText}>{helper?.name?.charAt(0) || "H"}</span>
          <div style={P.onlineDot}></div>
        </div>
        <span style={P.badge}>🚑 EMERGENCY ASSISTANT</span>
        {[
          ["NAME",       helper?.name          || "N/A"],
          ["USER ID",    helper?.id            || "N/A"],
          ["EMAIL",      helper?.email         || "N/A"],
          ["VEHICLE NO", helper?.vehicleNumber || "N/A"],
          ["CONTACT",    helper?.contactNumber || "N/A"],
        ].map(([label, value]) => (
          <div key={label} style={P.row}>
            <span style={P.rowLabel}>{label}</span>
            <span style={P.rowValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const P = {
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'flex-start', padding:'80px 0 0 20px', backdropFilter:'blur(4px)' },
  panel:      { background:'linear-gradient(145deg,rgba(25,10,10,0.98),rgba(40,15,15,0.98))', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:28, width:300, boxShadow:'0 20px 60px rgba(0,0,0,0.8)', animation:'profileSlideIn 0.3s ease' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:15 },
  title:      { margin:0, color:'#ff8585', fontSize:'1rem', fontWeight:800, letterSpacing:'1px' },
  closeBtn:   { background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:'1rem' },
  avatar:     { width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#ff4d4d,#cc0000)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px auto', position:'relative', boxShadow:'0 0 20px rgba(255,77,77,0.4)' },
  avatarText: { fontSize:'2rem', fontWeight:900, color:'#fff' },
  onlineDot:  { position:'absolute', bottom:4, right:4, width:14, height:14, background:'#00ff9d', borderRadius:'50%', border:'2px solid #1a0a0a', boxShadow:'0 0 8px #00ff9d' },
  badge:      { display:'block', textAlign:'center', fontSize:'0.7rem', fontWeight:800, letterSpacing:'1px', color:'#ffaa00', background:'rgba(255,170,0,0.1)', border:'1px solid rgba(255,170,0,0.3)', borderRadius:6, padding:'4px 10px', margin:'0 0 20px 0' },
  row:        { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  rowLabel:   { fontSize:'0.75rem', color:'#888', fontWeight:700, letterSpacing:'0.5px' },
  rowValue:   { fontSize:'0.85rem', color:'#e0e0e0', fontWeight:600, textAlign:'right', maxWidth:'60%', wordBreak:'break-all' },
};

/* ================= WAITING PANEL ================= */
const WaitingPanel = () => (
  <div style={W.wrap}>
    <div style={W.iconRing}>
      <div style={W.spinner}></div>
      <span style={W.icon}>🚑</span>
    </div>
    <h3 style={W.title}>WAITING FOR ASSIGNMENT</h3>
    <p style={W.sub}>Polling database every 4 seconds for incoming accident requests...</p>
    <div style={W.dots}>
      {[0, 0.3, 0.6].map((d, i) => (
        <span key={i} style={{ ...W.dot, animationDelay: `${d}s` }}>●</span>
      ))}
    </div>
    <div style={W.statusRow}>
      <span style={W.statusDot}></span>
      <span style={W.statusText}>SYSTEM ONLINE • LISTENING</span>
    </div>
  </div>
);

const W = {
  wrap:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'30px 20px', textAlign:'center', height:'100%' },
  iconRing:   { position:'relative', width:90, height:90, marginBottom:24 },
  spinner:    { position:'absolute', inset:0, border:'3px solid rgba(255,77,77,0.15)', borderTop:'3px solid #ff4d4d', borderRadius:'50%', animation:'spin 1.2s linear infinite' },
  icon:       { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' },
  title:      { fontSize:'1rem', fontWeight:900, letterSpacing:'2px', color:'#ff8585', margin:'0 0 10px 0' },
  sub:        { color:'#555', fontSize:'0.82rem', margin:'0 0 20px 0', lineHeight:1.6, maxWidth:220 },
  dots:       { display:'flex', gap:8, justifyContent:'center', marginBottom:24 },
  dot:        { color:'#ff4d4d', animation:'pulse 1.2s infinite', fontSize:'1rem' },
  statusRow:  { display:'flex', alignItems:'center', gap:8, background:'rgba(0,255,157,0.05)', border:'1px solid rgba(0,255,157,0.2)', padding:'6px 14px', borderRadius:8 },
  statusDot:  { width:8, height:8, background:'#00ff9d', borderRadius:'50%', boxShadow:'0 0 6px #00ff9d' },
  statusText: { fontSize:'0.72rem', color:'#00ff9d', fontWeight:700, letterSpacing:'1px' },
};

/* ================= MAIN COMPONENT ================= */
export default function HelperDashboard() {
  const navigate = useNavigate();
  const mapRef   = useRef(null);

  const [status, setStatus]                   = useState("Pending");
  const [routeGeoJSON, setRouteGeoJSON]       = useState(null);
  const [routeDetails, setRouteDetails]       = useState(null);
  const [popupType, setPopupType]             = useState(null);
  const [accidentData, setAccidentData]       = useState(null);
  const [accidentId, setAccidentId]           = useState(null);
  const [profileOpen, setProfileOpen]         = useState(false);
  const [viewState, setViewState]             = useState({ latitude: 17.385, longitude: 78.4867, zoom: 13 });
  const [nearestHospital, setNearestHospital] = useState(FALLBACK_HOSPITAL);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [helperLocation, setHelperLocation]   = useState(null);

  const isActiveRef = useRef(false);

  const storedUser = localStorage.getItem("user");
  const helper     = storedUser ? JSON.parse(storedUser) : null;

  /* ── LIVE GPS WATCHER for helper's own location ── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setHelperLocation(loc);
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ── PUSH HELPER GPS TO BACKEND every 5s when on active mission ── */
  useEffect(() => {
    if (!helper?.id || !helperLocation) return;
    if (!accidentData || !isActiveRef.current) return;

    const pushLocation = async () => {
      try {
        await fetch(`${API_URL}/api/helper-location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            helperId:  helper.id,
            latitude:  helperLocation.lat,
            longitude: helperLocation.lng,
          }),
        });
      } catch (_) {}
    };

    pushLocation();
    const interval = setInterval(pushLocation, 5000);
    return () => clearInterval(interval);
  }, [helperLocation, helper?.id, accidentData, isActiveRef.current]);

  const handleLogout = () => navigate("/");

  /* ── FETCH NEAREST HOSPITAL using Mapbox Search Box API ── */
  const fetchNearestHospital = async (lat, lng) => {
    setHospitalLoading(true);

    const haversine = (hLat, hLng) => {
      const R    = 6371;
      const dLat = (hLat - lat) * Math.PI / 180;
      const dLng = (hLng - lng) * Math.PI / 180;
      const a    = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(hLat*Math.PI/180)*Math.sin(dLng/2)**2;
      return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
    };

    const VET_KEYWORDS = [
      "vet", "veterin", "animal", "pet", "zoo", "livestock",
      "cattle", "veterinary", "farm", "canine", "feline", "equine",
      "dog", "cat", "bird", "fish", "rabbit", "goat", "sheep"
    ];
    const HUMAN_KEYWORDS = [
      "hospital", "medical", "health", "clinic", "care", "nursing",
      "apollo", "yashoda", "kims", "rainbow", "aiims", "govt", "government",
      "general", "district", "community", "primary", "PHC", "CHC"
    ];

    const isHumanHospital = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      if (VET_KEYWORDS.some(k => lower.includes(k))) return false;
      return HUMAN_KEYWORDS.some(k => lower.includes(k));
    };

    try {
      // ── STRATEGY 1: OpenStreetMap Overpass API ──────────────────
      const radius = 10000;
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          way["amenity"="hospital"](around:${radius},${lat},${lng});
        );
        out center 10;
      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const ovRes  = await fetch(overpassUrl);
      const ovData = await ovRes.json();

      if (ovData.elements && ovData.elements.length > 0) {
        const hospitals = ovData.elements.map(el => ({
          name: el.tags?.name || el.tags?.["name:en"] || "Hospital",
          lat:  el.lat || el.center?.lat,
          lng:  el.lon || el.center?.lon,
          phone: el.tags?.phone || el.tags?.contact_phone || "Not Available",
        })).filter(h => h.lat && h.lng);

        hospitals.sort((a, b) => parseFloat(haversine(a.lat, a.lng)) - parseFloat(haversine(b.lat, b.lng)));
        const nearest = hospitals[0];
        const dist    = haversine(nearest.lat, nearest.lng);

        console.log(`✅ OSM hospital: ${nearest.name} (${dist}km)`);
        setNearestHospital({ ...nearest, distance: `${dist} km` });
        setHospitalLoading(false);
        return;
      }

      // ── STRATEGY 2: Mapbox Search Box ──────────────────────────
      console.warn("Overpass returned nothing, trying Mapbox...");
      const mbUrl  = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=10&access_token=${MAPBOX_TOKEN}`;
      const mbRes  = await fetch(mbUrl);
      const mbData = await mbRes.json();

      if (mbData.features && mbData.features.length > 0) {
        const filtered = mbData.features.filter(f => isHumanHospital(f.properties?.name));
        const h = filtered[0];

        if (h) {
          const hLng = h.geometry.coordinates[0];
          const hLat = h.geometry.coordinates[1];
          const dist = haversine(hLat, hLng);
          const name = h.properties?.name || "Hospital";
          console.log(`✅ Mapbox hospital: ${name} (${dist}km)`);
          setNearestHospital({ name, lat: hLat, lng: hLng, distance: `${dist} km`, contact: h.properties?.metadata?.phone || "Not Available" });
          setHospitalLoading(false);
          return;
        }
      }

      // ── STRATEGY 3: Mapbox Geocoding ────────────────────────────
      console.warn("Mapbox category search failed, trying geocoding...");
      const queries = ["government hospital", "general hospital", "district hospital", "medical college hospital"];
      for (const q of queries) {
        const gcUrl  = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?proximity=${lng},${lat}&types=poi&limit=5&access_token=${MAPBOX_TOKEN}`;
        const gcRes  = await fetch(gcUrl);
        const gcData = await gcRes.json();
        if (gcData.features && gcData.features.length > 0) {
          const filtered = gcData.features.filter(f => isHumanHospital(f.text) || isHumanHospital(f.place_name));
          const h = filtered[0] || gcData.features[0];
          if (h) {
            const hLng = h.center[0];
            const hLat = h.center[1];
            const dist = haversine(hLat, hLng);
            console.log(`✅ Geocoding hospital: ${h.text} (${dist}km)`);
            setNearestHospital({ name: h.text || h.place_name, lat: hLat, lng: hLng, distance: `${dist} km`, contact: "Not Available" });
            setHospitalLoading(false);
            return;
          }
        }
      }

      console.warn("All strategies exhausted, using fallback");
      setNearestHospital(FALLBACK_HOSPITAL);

    } catch (err) {
      console.error("Hospital search failed:", err);
      setNearestHospital(FALLBACK_HOSPITAL);
    }
    setHospitalLoading(false);
  };

  /* ── POLL DB every 4s ── */
  useEffect(() => {
    if (!helper?.id) return;

    // ================================================================
    //  SNIPPET 2 — Improved fetchAssigned
    //  FIX: Uses != null instead of truthy check for lat/lng (handles 0,0)
    //  FIX: Shows accident card even when GPS unavailable (0,0 coords)
    //  FIX: Populates trigger field and uses it as address fallback
    // ================================================================
    const fetchAssigned = async () => {
      try {
        const res = await fetch(`${API_URL}/api/accident-for-helper?helperId=${helper.id}`);
        if (!res.ok) {
          if (res.status === 404 && !isActiveRef.current) {
            setAccidentData(null);
            setAccidentId(null);
            setStatus("Pending");
            setRouteGeoJSON(null);
            setRouteDetails(null);
          }
          return;
        }
        const data = await res.json();
        // Backend returned a message-only object (no accident)
        if (data.message && data.latitude == null) {
          if (!isActiveRef.current) {
            setAccidentData(null);
            setAccidentId(null);
            setStatus("Pending");
            setRouteGeoJSON(null);
            setRouteDetails(null);
          }
          return;
        }
        // Always reset on cancelled/completed
        if (data.status === "CANCELLED" || data.status === "COMPLETED") {
          isActiveRef.current = false;
          setAccidentData(null);
          setAccidentId(null);
          setStatus("Pending");
          setRouteGeoJSON(null);
          setRouteDetails(null);
          return;
        }
        // FIX: Use != null instead of truthy — latitude/longitude can be 0 when GPS has no lock
        // We allow 0,0 coords (GPS unavailable) to still show the accident card
        if (data.latitude == null || data.longitude == null) return;
        const newLat = parseFloat(data.latitude);
        const newLng = parseFloat(data.longitude);
        setAccidentData({
          latitude:       data.latitude,
          longitude:      data.longitude,
          name:           data.name           || "Unknown",
          vehicle:        data.vehicle        || "Unknown",
          bloodGroup:     data.bloodGroup     || "NA",
          conditions:     data.conditions     || "Not Available",
          allergies:      data.allergies      || "NA",
          emergencyPhone: data.emergencyPhone || "",
          vehicleModel:   data.vehicleModel   || "",
          severity:       data.severity       || "CRITICAL",
          trigger:        data.trigger        || "",
          // FIX: Show trigger type as address when GPS not available
          address:        (newLat === 0 && newLng === 0)
                            ? `GPS Unavailable — Trigger: ${data.trigger || "Unknown"}`
                            : "Live GPS Location",
        });
        setAccidentId(data.accidentId);
        // Only update map view if we have a real GPS fix
        if (newLat !== 0 || newLng !== 0) {
          setViewState({ latitude: newLat, longitude: newLng, zoom: 13 });
          fetchNearestHospital(newLat, newLng);
        }
      } catch (_) {
        // Network error — keep current state
      }
    };

    fetchAssigned();
    const poll = setInterval(fetchAssigned, 4000);
    return () => clearInterval(poll);
  }, [helper?.id]);

  /* ── ROUTING ── */
  const fetchRoute = async (start, end) => {
    try {
      const url  = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.longitude || end.lng},${end.latitude || end.lat}?overview=full&geometries=geojson&steps=true`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteGeoJSON({ type: "Feature", geometry: route.geometry });
        setRouteDetails({ duration: route.duration, distance: route.distance, steps: route.legs[0].steps });
        const coords = route.geometry.coordinates;
        const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
        mapRef.current?.fitBounds(bounds, { padding: 80, duration: 1200 });
      }
    } catch {
      setRouteGeoJSON({ type: "Feature", geometry: { type: "LineString", coordinates: [[start.lng, start.lat], [end.longitude || end.lng, end.latitude || end.lat]] } });
      setRouteDetails(null);
    }
  };

  /* ── STATUS CHANGE ── */
  const handleStatusChange = async (newStatus) => {
    if (newStatus === "Accepted") {
      isActiveRef.current = true;
    }
    if (newStatus === "Mission Complete") {
      isActiveRef.current = false;
    }

    setStatus(newStatus);
    if (!accidentData) return;

    if (accidentId) {
      try {
        const statusMap = {
          "Accepted":        "ASSIGNED",
          "On Route":        "EN_ROUTE",
          "Arrived":         "ARRIVED",
          "Picked Up":       "PICKED_UP",
          "Hospital Route":  "HOSPITAL_ROUTE",
          "Arrived Hospital":"ARRIVED_HOSPITAL",
          "Mission Complete":"COMPLETED",
        };
        const dbStatus = statusMap[newStatus] || newStatus;
        await fetch(`${API_URL}/api/accident-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accidentId, status: dbStatus, helperId: helper?.id }),
        });
        console.log(`✅ Accident ${accidentId} → DB status: ${dbStatus}`);
      } catch (_) {}
    }

    if (newStatus === "Accepted")         fetchRoute(helperLocation || { lat: viewState.latitude, lng: viewState.longitude }, { latitude: accidentData.latitude, longitude: accidentData.longitude });
    if (newStatus === "Arrived")          { setRouteGeoJSON(null); setRouteDetails(null); }
    if (newStatus === "Hospital Route")   fetchRoute({ lat: parseFloat(accidentData.latitude), lng: parseFloat(accidentData.longitude) }, { latitude: nearestHospital.lat, longitude: nearestHospital.lng });
    if (newStatus === "Arrived Hospital") { setRouteGeoJSON(null); setRouteDetails(null); }
    if (newStatus === "Mission Complete") {
      setTimeout(() => {
        setAccidentData(null);
        setAccidentId(null);
        setStatus("Pending");
        setRouteGeoJSON(null);
        setRouteDetails(null);
      }, 3000);
    }
  };

  const routeLayer = {
    id: "route", type: "line",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": (status === "On Route" || status === "Hospital Route") ? "#00ff9d" : "#00aaff", "line-width": 6 },
  };

  /* ── RENDER ── */
  return (
    <div style={S.container}>
      <style>{`
        @keyframes slideUp        { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin           { to{transform:rotate(360deg)} }
        @keyframes pulse          { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulseRed       { 0%{box-shadow:0 0 0 0 rgba(255,77,77,0.7)} 70%{box-shadow:0 0 0 15px rgba(255,77,77,0)} 100%{box-shadow:0 0 0 0 rgba(255,77,77,0)} }
        @keyframes profileSlideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-marker   { from{transform:scale(1)} to{transform:scale(1.1)} }
        @keyframes onlinePulse    { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,157,0.5)} 50%{box-shadow:0 0 0 6px rgba(0,255,157,0)} }
        .anim-panel   { animation: slideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
        .anim-delay-1 { animation-delay:0.2s; }
        .anim-delay-2 { animation-delay:0.4s; }
        .interactive-row { transition:all 0.3s ease; padding:8px; border-radius:8px; }
        .interactive-row:hover { background:rgba(255,255,255,0.05); transform:translateX(5px); }
        .action-btn { transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover  { transform:scale(1.05); letter-spacing:1px; }
        .action-btn:active { transform:scale(0.95); }
        .pulsing-marker { filter:drop-shadow(0 0 10px rgba(255,0,0,0.6)); animation:pulse-marker 1.5s infinite alternate; }
        .profile-trigger:hover { background:rgba(255,255,255,0.12) !important; transform:scale(1.03); }
        .steps-list::-webkit-scrollbar { width:6px; }
        .steps-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:4px; }
        .steps-list::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      {/* BG */}
      <div style={S.bgWrap}><Silk speed={5} scale={1} color="#2b0000" noiseIntensity={1.5} /></div>

      {/* LOGOUT */}
      <div style={S.logoutPos}><LogoutButton onClick={handleLogout} /></div>

      {/* PROFILE TRIGGER */}
      <button className="profile-trigger" onClick={() => setProfileOpen(true)} style={S.profileBtn} title="View Profile">
        <div style={S.profileAvatar}>{helper?.name?.charAt(0) || "H"}</div>
        <div style={S.profileInfo}>
          <span style={S.profileName}>{helper?.name || "Helper"}</span>
          <span style={S.profileRole}>Emergency Assistant</span>
        </div>
        <div style={S.onlineDot}></div>
      </button>

      {/* PROFILE PANEL */}
      <ProfilePanel helper={helper} isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerText}>
          <BlurText text="EMERGENCY RESPONSE DASHBOARD" delay={150} animateBy="letters" direction="top" />
        </div>
        <div style={S.statusWrapper}>
          <p style={S.subHeader}>CURRENT STATUS</p>
          <div style={{ ...S.statusBadge(status), ...(status === 'Pending' ? { animation: 'pulseRed 2s infinite' } : {}) }}>
            {accidentData ? status : "STANDBY"}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div style={S.contentWrap}>
        <div style={S.grid}>

          {/* ── LEFT PANEL ── */}
          <div className="anim-panel anim-delay-1" style={S.panelLeft}>

            {!accidentData ? (
              <WaitingPanel />
            ) : (
              <>
                <div style={S.panelHeader}>
                  <h3 style={S.sectionTitle}>🚨 Victim Details</h3>
                  <span style={S.liveIndicator}>● LIVE</span>
                </div>

                {[
                  ["Victim Name",   accidentData.name],
                  ["Vehicle No",    accidentData.vehicle],
                  ["Vehicle Model", accidentData.vehicleModel || "N/A"],
                  ["Severity",      accidentData.severity],
                  ["Location",      accidentData.address],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="interactive-row" style={S.detailRow}>
                    <span style={S.label}>{lbl}</span>
                    <span style={lbl === "Severity" ? S.criticalValue : S.value}>{val}</span>
                  </div>
                ))}

                {accidentData.emergencyPhone && (
                  <div className="interactive-row" style={S.detailRow}>
                    <span style={S.label}>Emergency Contact</span>
                    <a href={`tel:${accidentData.emergencyPhone}`} style={{ ...S.value, color:'#4cc9f0', textDecoration:'none' }}>
                      📞 {accidentData.emergencyPhone}
                    </a>
                  </div>
                )}

                <div style={S.medicalSection}>
                  <h4 style={S.medicalTitle}>⚕️ Medical Profile</h4>
                  <div style={S.detailRow}><span style={S.label}>Blood Group</span><span style={S.bloodValue}>{accidentData.bloodGroup}</span></div>
                  <div style={S.detailRow}><span style={S.label}>Conditions</span><span style={S.value}>{accidentData.conditions}</span></div>
                  <div style={S.detailRow}><span style={S.label}>Allergies</span><span style={S.alertValue}>{accidentData.allergies}</span></div>
                </div>

                <hr style={S.divider} />

                {routeDetails && (
                  <div style={S.navStatsContainer}>
                    <h3 style={S.sectionTitle}>🧭 Navigation</h3>
                    <div style={S.navGrid}>
                      <div style={S.navItem}><span style={S.navLabel}>ETA</span><span style={S.navValue}>{formatTime(routeDetails.duration)}</span></div>
                      <div style={S.navItem}><span style={S.navLabel}>Distance</span><span style={S.navValue}>{formatDist(routeDetails.distance)}</span></div>
                    </div>
                    <div className="steps-list" style={S.stepsList}>
                      {routeDetails.steps.map((step, idx) => (
                        <div key={idx} style={S.stepItem}>
                          <span style={{ color:'#00ff9d', marginRight:8 }}>➥</span>
                          {cleanInstruction(step.maneuver.type)} {step.name || "road"}
                          <span style={{ opacity:0.5, fontSize:'0.8em', marginLeft:'auto' }}>({Math.round(step.distance)}m)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!routeDetails && (
                  <>
                    <h3 style={S.sectionTitle}>
                      🏥 Nearest Hospital
                      {hospitalLoading && <span style={{ fontSize:'0.7rem', color:'#ffaa00', marginLeft:8, fontWeight:400 }}>locating...</span>}
                    </h3>
                    <div className="interactive-row" style={S.hospitalCard}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <h4 style={{ margin:0, color:'#ff6b6b', fontSize:'1.1rem' }}>{nearestHospital.name}</h4>
                        <span style={S.distanceBadge}>{nearestHospital.distance}</span>
                      </div>
                      <p style={{ margin:'5px 0 0 0', color:'#ccc', fontSize:'0.9rem' }}>📞 {nearestHospital.contact}</p>
                    </div>
                  </>
                )}

                <div style={S.actionButtons}>
                  {status === 'Pending'          && <button className="action-btn" style={S.btnAccept}   onClick={() => handleStatusChange('Accepted')}>ACCEPT REQUEST</button>}
                  {status === 'Accepted'         && <button className="action-btn" style={S.btnRoute}    onClick={() => handleStatusChange('On Route')}>START ROUTE</button>}
                  {status === 'On Route'         && <button className="action-btn" style={S.btnArrive}   onClick={() => handleStatusChange('Arrived')}>ARRIVED AT SCENE</button>}
                  {status === 'Arrived'          && <button className="action-btn" style={S.btnPickedUp} onClick={() => handleStatusChange('Picked Up')}>VICTIM PICKED UP</button>}
                  {status === 'Picked Up'        && <button className="action-btn" style={S.btnRoute}    onClick={() => handleStatusChange('Hospital Route')}>NAVIGATE TO HOSPITAL</button>}
                  {status === 'Hospital Route'   && <button className="action-btn" style={S.btnArrive}   onClick={() => handleStatusChange('Arrived Hospital')}>ARRIVED AT HOSPITAL</button>}
                  {status === 'Arrived Hospital' && <button className="action-btn" style={S.btnComplete} onClick={() => handleStatusChange('Mission Complete')}>COMPLETE MISSION</button>}
                  {status === 'Mission Complete' && <div style={S.completedMsg}>✅ MISSION COMPLETED</div>}
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT PANEL — MAP ── */}
          <div className="anim-panel anim-delay-2" style={S.panelRight}>
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/navigation-night-v1"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width:"100%", height:"100%", borderRadius:16 }}
            >
              <NavigationControl position="top-right" />

              {accidentData && (
                <Marker latitude={parseFloat(accidentData.latitude)} longitude={parseFloat(accidentData.longitude)} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); setPopupType("accident"); }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" width="45" alt="Accident" className="pulsing-marker" style={{ cursor:'pointer' }} />
                </Marker>
              )}

              <Marker latitude={nearestHospital.lat} longitude={nearestHospital.lng} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); setPopupType("hospital"); }}>
                <img src="https://cdn-icons-png.flaticon.com/512/4320/4320371.png" width="40" alt="Hospital" style={{ cursor:'pointer' }} />
              </Marker>

              {accidentData && helperLocation && status !== "Pending" && status !== "Arrived" && status !== "Arrived Hospital" && status !== "Mission Complete" && (
                <Marker latitude={helperLocation.lat} longitude={helperLocation.lng} anchor="bottom">
                  <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" width="45" alt="Helper" />
                </Marker>
              )}

              {routeGeoJSON && <Source type="geojson" data={routeGeoJSON}><Layer {...routeLayer} /></Source>}

              {popupType === "accident" && accidentData && (
                <Popup latitude={parseFloat(accidentData.latitude)} longitude={parseFloat(accidentData.longitude)} closeButton={false} onClose={() => setPopupType(null)} maxWidth="220px">
                  <div style={{ color:'black', textAlign:'center' }}>
                    <strong style={{ color:"red", display:'block', marginBottom:4 }}>CRITICAL ACCIDENT</strong>
                    <span style={{ fontSize:'0.8rem' }}>Victim: {accidentData.name}</span><br />
                    <span style={{ fontSize:'0.8rem' }}>Vehicle: {accidentData.vehicle}</span>
                  </div>
                </Popup>
              )}
              {popupType === "hospital" && (
                <Popup latitude={nearestHospital.lat} longitude={nearestHospital.lng} closeButton={false} onClose={() => setPopupType(null)}>
                  <div style={{ color:'black', fontWeight:'bold' }}>{nearestHospital.name}</div>
                </Popup>
              )}
            </Map>

            <div style={S.mapOverlay}>
              <span style={{ color:(status === 'On Route' || status === 'Hospital Route') ? '#00ff9d' : '#fff' }}>
                ● {(status === 'On Route' || status === 'Hospital Route') ? 'NAVIGATION ACTIVE' : accidentData ? 'GPS READY' : 'STANDBY'}
              </span>
              <span style={{ marginLeft:'auto', marginRight:15, fontSize:'0.75rem', color: helperLocation ? '#00ff9d' : '#ffaa00' }}>
                {helperLocation ? `📍 YOUR GPS LOCKED` : '⏳ ACQUIRING YOUR GPS...'}
              </span>
              <span>
                {routeDetails ? `ETA: ${formatTime(routeDetails.duration)} (${formatDist(routeDetails.distance)})` : accidentData ? `Victim: ${accidentData.name}` : 'Waiting for assignment...'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const S = {
  container:    { minHeight:'100vh', color:'#fff', fontFamily:'"Poppins",sans-serif', position:'relative', overflow:'hidden' },
  bgWrap:       { position:'fixed', inset:0, zIndex:0 },
  logoutPos:    { position:'fixed', top:20, right:20, zIndex:50 },

  profileBtn:   { position:'fixed', top:20, left:20, zIndex:50, display:'flex', alignItems:'center', gap:10, background:'rgba(20,10,10,0.88)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:50, padding:'6px 16px 6px 6px', cursor:'pointer', backdropFilter:'blur(10px)', transition:'all 0.2s ease', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' },
  profileAvatar:{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#ff4d4d,#cc0000)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'1rem', color:'#fff', flexShrink:0 },
  profileInfo:  { display:'flex', flexDirection:'column', gap:1 },
  profileName:  { fontSize:'0.8rem', fontWeight:700, color:'#fff', lineHeight:1.2 },
  profileRole:  { fontSize:'0.65rem', color:'#ffaa00', fontWeight:600, letterSpacing:'0.5px' },
  onlineDot:    { width:9, height:9, background:'#00ff9d', borderRadius:'50%', boxShadow:'0 0 6px #00ff9d', animation:'onlinePulse 2s infinite', flexShrink:0 },

  header:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:25, position:'relative', zIndex:2, width:'100%' },
  headerText:   { fontSize:'2.8rem', fontWeight:900, letterSpacing:'3px', color:'#fff', textShadow:'0 0 20px rgba(255,77,77,0.6)', textAlign:'center', marginBottom:10 },
  statusWrapper:{ display:'flex', alignItems:'center', gap:15, background:'rgba(0,0,0,0.4)', padding:'8px 20px', borderRadius:50, border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(5px)' },
  subHeader:    { fontSize:'0.9rem', color:'#aaa', letterSpacing:'1px', margin:0 },
  statusBadge:  (s) => {
    const m = { Pending:['#ff4d4d','rgba(255,77,77,0.2)'], Accepted:['#ffaa00','rgba(255,170,0,0.2)'], 'On Route':['#00ccff','rgba(0,204,255,0.2)'], 'Picked Up':['#d946ef','rgba(217,70,239,0.2)'], 'Hospital Route':['#f472b6','rgba(244,114,182,0.2)'], 'Arrived Hospital':['#a3e635','rgba(163,230,53,0.2)'] };
    const [color,bg] = m[s] || ['#00ff9d','rgba(0,255,157,0.2)'];
    return { fontSize:'0.9rem', fontWeight:'bold', padding:'5px 15px', borderRadius:20, textTransform:'uppercase', transition:'all 0.3s ease', backgroundColor:bg, color, border:`1px solid ${color}` };
  },
  contentWrap:  { position:'relative', zIndex:2, padding:'30px 50px', height:'calc(100vh - 140px)' },
  grid:         { display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:30, height:'100%' },
  panelLeft:    { background:'linear-gradient(145deg,rgba(20,10,10,0.9),rgba(40,10,10,0.95))', borderRadius:24, padding:28, backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', overflowY:'auto' },
  panelRight:   { background:'linear-gradient(145deg,rgba(20,10,10,0.9),rgba(40,10,10,0.95))', borderRadius:24, padding:12, backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', position:'relative' },
  panelHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:15 },
  sectionTitle: { fontSize:'1.4rem', color:'#ff8585', margin:0, display:'flex', alignItems:'center', gap:10 },
  liveIndicator:{ fontSize:'0.8rem', color:'#ff4d4d', fontWeight:'bold', animation:'pulseRed 2s infinite', padding:'4px 8px', background:'rgba(255,0,0,0.1)', borderRadius:4 },
  detailRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, fontSize:'1rem', borderBottom:'1px solid rgba(255,255,255,0.03)' },
  label:        { color:'#888', fontSize:'0.95rem' },
  value:        { fontWeight:'600', color:'#e0e0e0', textAlign:'right' },
  criticalValue:{ fontWeight:'bold', color:'#ff4d4d', textTransform:'uppercase', textShadow:'0 0 10px rgba(255,77,77,0.4)', padding:'2px 8px', background:'rgba(255,0,0,0.1)', borderRadius:4 },
  medicalSection:{ marginTop:25, padding:20, background:'linear-gradient(145deg,rgba(255,50,50,0.05),rgba(0,0,0,0.2))', borderRadius:16, border:'1px dashed rgba(255,80,80,0.3)' },
  medicalTitle: { margin:'0 0 15px 0', color:'#ffcccc', fontSize:'1.1rem', textTransform:'uppercase', letterSpacing:'1px', opacity:0.9 },
  bloodValue:   { fontWeight:'900', color:'#ff4d4d', fontSize:'1.3rem', background:'#fff', padding:'2px 8px', borderRadius:6 },
  alertValue:   { fontWeight:'600', color:'#ffaa00', textAlign:'right' },
  divider:      { border:'0', borderTop:'1px solid rgba(255,255,255,0.1)', margin:'25px 0' },
  hospitalCard: { background:'rgba(255,255,255,0.03)', padding:16, borderRadius:12, marginBottom:25, border:'1px solid rgba(255,255,255,0.05)' },
  distanceBadge:{ fontSize:'0.8rem', background:'rgba(0,255,157,0.1)', color:'#00ff9d', padding:'2px 6px', borderRadius:4 },
  navStatsContainer:{ marginBottom:20 },
  navGrid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, marginBottom:15, marginTop:15 },
  navItem:      { background:'rgba(0,255,157,0.05)', border:'1px solid rgba(0,255,157,0.2)', padding:12, borderRadius:12, textAlign:'center' },
  navLabel:     { display:'block', fontSize:'0.8rem', color:'#00aaff', marginBottom:4, textTransform:'uppercase' },
  navValue:     { fontSize:'1.4rem', fontWeight:'bold', color:'#fff' },
  stepsList:    { maxHeight:150, overflowY:'auto', background:'rgba(0,0,0,0.3)', borderRadius:12, padding:10, border:'1px solid rgba(255,255,255,0.05)' },
  stepItem:     { display:'flex', alignItems:'center', padding:8, borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:'0.9rem', color:'#ddd' },
  actionButtons:{ marginTop:'auto', textAlign:'center', paddingTop:10 },
  btnAccept:    { width:'100%', padding:16, borderRadius:12, border:'none', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', background:'linear-gradient(90deg,#ff4d4d,#cc0000)', color:'#fff', boxShadow:'0 10px 30px rgba(255,77,77,0.3)' },
  btnRoute:     { width:'100%', padding:16, borderRadius:12, border:'none', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', background:'linear-gradient(90deg,#ffaa00,#ff8800)', color:'#1a0500', boxShadow:'0 10px 30px rgba(255,170,0,0.3)' },
  btnArrive:    { width:'100%', padding:16, borderRadius:12, border:'none', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', background:'linear-gradient(90deg,#00ff9d,#00cc7a)', color:'#00331f', boxShadow:'0 10px 30px rgba(0,255,157,0.3)' },
  btnPickedUp:  { width:'100%', padding:16, borderRadius:12, border:'none', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', background:'linear-gradient(90deg,#d946ef,#a21caf)', color:'#fff', boxShadow:'0 10px 30px rgba(217,70,239,0.3)' },
  btnComplete:  { width:'100%', padding:16, borderRadius:12, border:'none', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', background:'linear-gradient(90deg,#fff,#ccc)', color:'#000', boxShadow:'0 10px 30px rgba(255,255,255,0.3)' },
  completedMsg: { padding:15, borderRadius:12, background:'rgba(0,255,157,0.15)', color:'#00ff9d', fontWeight:'bold', textAlign:'center', fontSize:'1.2rem', border:'1px solid rgba(0,255,157,0.3)', letterSpacing:'1px' },
  mapOverlay:   { position:'absolute', bottom:25, left:25, right:25, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', padding:'10px 20px', borderRadius:10, color:'#fff', fontSize:'0.8rem', fontFamily:'monospace', zIndex:1000, display:'flex', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.1)' },
};