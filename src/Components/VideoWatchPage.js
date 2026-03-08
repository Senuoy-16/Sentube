import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./VideoWatchPage.css";
import { supabase } from "../client";
import { AuthContext } from "../Context/AuthContext";
import toast from "react-hot-toast";


function VideoWatchPage({ video_url, thumbnail_url, video_id }) {
  const { user } = useContext(AuthContext);
  const [viewed, setViewed] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const watchTimerRef = useRef(null);

  /* -------------------- Video.js options -------------------- */
  const videoJsOptions = useMemo(
    () => ({
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      poster: thumbnail_url,
      skipButtons: {
        forward: 5,
        backward: 5
      },
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      sources: [
        {
          src: video_url,
          type: "video/mp4",
        },
      ],
    }),
    [video_url, thumbnail_url]
  );

  /* -------------------- Save watch history -------------------- */
  const saveWatch = useCallback(async () => {
    if (viewed || !user?.id) return;

    setViewed(true);

    const {erreur} = await supabase
      .from("watch_history")
      .upsert(
        {
          user_id: user.id,
          video_id,
        },
        { onConflict: ["user_id", "video_id"] }
      );
    if(erreur){toast.error(erreur.message)}

    await supabase
      .from("video_views")
      .upsert(
        {
          user_id: user.id,
          video_id,
        },
        { onConflict: ["user_id", "video_id"] }
      );
  }, [viewed, user, video_id]);

  /* -------------------- Player ready -------------------- */
  const handlePlayerReady = useCallback(
    (player) => {
      playerRef.current = player;

      player.on("play", () => {
        if (viewed || !user?.id) return;

        // start 5s watch timer
        watchTimerRef.current = setTimeout(saveWatch, 5000);
      });

      player.on("pause", () => {
        if (watchTimerRef.current) {
          clearTimeout(watchTimerRef.current);
          watchTimerRef.current = null;
        }
      });

      player.on("ended", () => {
        saveWatch();
      });
    },
    [saveWatch, viewed, user]
  );

  /* -------------------- Init Video.js -------------------- */
  useEffect(() => {
    if (!videoRef.current || playerRef.current) return;

    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-big-play-centered";
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, videoJsOptions, () => {
      handlePlayerReady(player);
    });

    playerRef.current = player;
  }, [videoJsOptions, handlePlayerReady]);

  /* -------------------- Update source -------------------- */
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !video_url) return;

    player.poster(thumbnail_url);
    player.src({ src: video_url, type: "video/mp4" });
  }, [video_url, thumbnail_url]);

  /* -------------------- Cleanup -------------------- */
  useEffect(() => {
    return () => {
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
      }
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
}

export default VideoWatchPage;
