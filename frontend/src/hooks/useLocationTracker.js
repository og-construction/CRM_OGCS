import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";

const EVERY_30_MIN = 30 * 60 * 1000;

function isMobileDevice() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

export default function useLocationTracker({ enabled }) {
  const timerRef = useRef(null);
  const retryRef = useRef(null);
  const watchIdRef = useRef(null);

  const latestRef = useRef(null); // { lat,lng,accuracy,capturedAt }
  const lastSentAtRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | starting | waiting | running | denied | error
  const [lastPingAt, setLastPingAt] = useState(null);
  const [lastError, setLastError] = useState("");

  const mobile = useMemo(() => isMobileDevice(), []);

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (retryRef.current) clearInterval(retryRef.current);
    retryRef.current = null;

    if (watchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {}
      watchIdRef.current = null;
    }

    latestRef.current = null;
    lastSentAtRef.current = null;
  };

  const canSendNow = () => {
    const last = lastSentAtRef.current?.getTime?.() || 0;
    return Date.now() - last >= EVERY_30_MIN;
  };

  const postLatest = async ({ force = false } = {}) => {
    setLastError("");

    if (!latestRef.current) {
      // Not an error — just waiting for a fix from device
      setStatus((s) => (s === "idle" ? "starting" : s));
      return;
    }

    if (!force && !canSendNow()) return;

    try {
      await axiosClient.post("/locations/ping", latestRef.current);
      lastSentAtRef.current = new Date();
      setStatus("running");
      setLastPingAt(new Date());
    } catch (e) {
      setStatus("error");
      setLastError(
        e?.response?.data?.message || e?.message || "Failed to send location to server."
      );
    }
  };

  const setFromPos = (pos) => {
    latestRef.current = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      capturedAt: new Date().toISOString(),
    };
  };

  const getOnce = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  const startPositionFlow = async () => {
    // Try to get a location quickly (so UI doesn’t stay “starting”)
    // 1) fast, low accuracy
    // 2) if failed, try high accuracy
    const low = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    };
    const high = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 10000,
    };

    try {
      const pos = await getOnce(low);
      setFromPos(pos);
      await postLatest({ force: true });
      return;
    } catch {}

    try {
      const pos = await getOnce(high);
      setFromPos(pos);
      await postLatest({ force: true });
    } catch (err) {
      // Don’t hard fail here; watchPosition + retry will keep trying
      setStatus("waiting");
      if (err?.code === 1) {
        setStatus("denied");
        setLastError("Location permission denied. Please allow location.");
      } else if (err?.code === 2) {
        setLastError("Location unavailable. Turn ON Location / GPS / Wi-Fi.");
      } else if (err?.code === 3) {
        setLastError("Waiting for location signal…");
      } else {
        setLastError(err?.message || "Waiting for location…");
      }
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopAll();
      setStatus("idle");
      setLastError("");
      setLastPingAt(null);
      return;
    }

    setStatus("starting");
    setLastError("");

    if (!("geolocation" in navigator)) {
      setStatus("error");
      setLastError("Geolocation not supported in this browser/device.");
      return;
    }

    // Permission check (Safari may not support this)
    (async () => {
      try {
        if (navigator.permissions?.query) {
          const p = await navigator.permissions.query({ name: "geolocation" });
          if (p.state === "denied") {
            setStatus("denied");
            setLastError("Location permission denied. Please allow location in browser settings.");
            return;
          }
        }
      } catch {
        // ignore
      }

      // Start with one-time attempts (helps desktops + first fix)
      startPositionFlow();

      // Start watching continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setFromPos(pos);
          setStatus("running");

          // Send immediately first time; later only per 30 min or manual
          if (!lastSentAtRef.current) postLatest({ force: true });
        },
        (err) => {
          // Don’t stop on timeout/unavailable; keep retrying
          if (err?.code === 1) {
            setStatus("denied");
            setLastError("Location permission denied by user.");
            stopAll();
            return;
          }

          setStatus("waiting");

          if (err?.code === 2) {
            setLastError("Location unavailable. Turn ON Location / GPS / Wi-Fi.");
          } else if (err?.code === 3) {
            // On PC this is common; it will recover when location becomes available
            setLastError(
              mobile
                ? "Waiting for GPS… Please move to open area / enable Location."
                : "Waiting for location… (PC may not have GPS. Turn ON Windows Location / Wi-Fi.)"
            );
          } else {
            setLastError(err?.message || "Waiting for location…");
          }
        },
        {
          // Mobile: GPS is okay; Desktop: high accuracy can cause timeouts; choose smart defaults
          enableHighAccuracy: mobile,
          maximumAge: mobile ? 5000 : 60000,
          timeout: mobile ? 20000 : 15000,
        }
      );

      // Every 30 minutes: send latest
      timerRef.current = setInterval(() => {
        postLatest({ force: false });
      }, EVERY_30_MIN);

      // Retry every 20 seconds if still no fix (helps desktops)
      retryRef.current = setInterval(() => {
        if (!latestRef.current && enabled) startPositionFlow();
      }, 20000);
    })();

    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    status,
    lastPingAt,
    lastError,
    sendLocationOnce: () => postLatest({ force: true }),
  };
}
