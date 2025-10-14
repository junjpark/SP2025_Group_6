import React, { useEffect, useRef } from "react";
import "./CustomVideoPlayer.css"

// Minimal set of MediaPipe Pose connections (indices correspond to MediaPipe Pose landmarks)
const POSE_CONNECTIONS = [
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 12], // shoulders
    [23, 24], // hips
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28], // right leg
    [11, 23], [12, 24], // torso
    [0, 11], [0, 12] // head to shoulders
];

const CustomVideoPlayer = React.forwardRef(({ url, start = 0, end = Infinity, onPause, onPlay, landmarks = [] }, ref) => {
    CustomVideoPlayer.displayName = 'CustomVideoPlayer'

    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const video = ref.current;
        if (!video) return;

        const resetClip = () => {
            if (video.currentTime >= end) {
                video.currentTime = start;
            }
        };

        // ensure video starts at the requested start time
        try { video.currentTime = start; } catch (e) { /* ignore if not ready */ }
        video.addEventListener('timeupdate', resetClip);

        return () => {
            video.removeEventListener('timeupdate', resetClip);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, end, ref]);

    useEffect(() => {
        const video = ref.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !landmarks) return;

        const ctx = canvas.getContext('2d');

        // Resize canvas to match video display size (handle devicePixelRatio)
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const vw = video.clientWidth;
            const vh = video.clientHeight;
            // CSS size
            canvas.style.width = `${vw}px`;
            canvas.style.height = `${vh}px`;
            // Actual pixel buffer size
            canvas.width = Math.round(vw * dpr);
            canvas.height = Math.round(vh * dpr);
            // Scale drawing so coordinates are in CSS pixels
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);

        let rafId = null;

        const draw = () => {
            // Clear using CSS pixel coords
            const cssW = canvas.width / (window.devicePixelRatio || 1);
            const cssH = canvas.height / (window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, cssW, cssH);

            const t = video.currentTime;
            // Find nearest landmark entry by time
            let nearest = null;
            let bestDelta = Infinity;
            for (const entry of landmarks) {
                const delta = Math.abs(entry.time - t);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    nearest = entry;
                }
            }

            if (nearest && nearest.landmarks) {
                // Map normalized landmarks to the actual rendered video area inside the video element.
                // Video element may letterbox the video; use video.videoWidth/video.videoHeight to compute
                // rendered size and offsets.
                const intrinsicW = video.videoWidth || 0;
                const intrinsicH = video.videoHeight || 0;
                let renderedW = video.clientWidth;
                let renderedH = video.clientHeight;
                let offsetX = 0;
                let offsetY = 0;

                if (intrinsicW > 0 && intrinsicH > 0) {
                    const scale = Math.min(video.clientWidth / intrinsicW, video.clientHeight / intrinsicH);
                    renderedW = intrinsicW * scale;
                    renderedH = intrinsicH * scale;
                    offsetX = (video.clientWidth - renderedW) / 2;
                    offsetY = (video.clientHeight - renderedH) / 2;
                }

                // draw skeleton lines first
                ctx.strokeStyle = 'rgba(0,150,255,0.95)';
                ctx.lineWidth = 2;
                let drewAny = false;
                for (const pair of POSE_CONNECTIONS) {
                    const aIdx = pair[0];
                    const bIdx = pair[1];
                    if (aIdx < nearest.landmarks.length && bIdx < nearest.landmarks.length) {
                        const a = nearest.landmarks[aIdx];
                        const b = nearest.landmarks[bIdx];
                        const ax = offsetX + a.x * renderedW;
                        const ay = offsetY + a.y * renderedH;
                        const bx = offsetX + b.x * renderedW;
                        const by = offsetY + b.y * renderedH;
                        if (Number.isFinite(ax) && Number.isFinite(ay) && Number.isFinite(bx) && Number.isFinite(by)) {
                            ctx.beginPath();
                            ctx.moveTo(ax, ay);
                            ctx.lineTo(bx, by);
                            ctx.stroke();
                            drewAny = true;
                        }
                    }
                }

                // Fallback: if no standard connections drawn, connect subsequent valid landmarks
                if (!drewAny) {
                    let prev = null;
                    for (let i = 0; i < nearest.landmarks.length; i++) {
                        const lm = nearest.landmarks[i];
                        const x = offsetX + lm.x * renderedW;
                        const y = offsetY + lm.y * renderedH;
                        if (Number.isFinite(x) && Number.isFinite(y)) {
                            if (prev) {
                                ctx.beginPath();
                                ctx.moveTo(prev.x, prev.y);
                                ctx.lineTo(x, y);
                                ctx.stroke();
                            }
                            prev = { x, y };
                        }
                    }
                }

                // Draw landmarks
                const r = 4;
                for (let i = 0; i < nearest.landmarks.length; i++) {
                    const lm = nearest.landmarks[i];
                    const x = offsetX + lm.x * renderedW;
                    const y = offsetY + lm.y * renderedH;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        // Start drawing when video plays, stop when paused
        const onPlayFn = () => {
            if (!rafId) {
                draw();
            }
        };
        const onPauseFn = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        video.addEventListener('play', onPlayFn);
        video.addEventListener('pause', onPauseFn);

        // If already playing start drawing
        if (!video.paused) onPlayFn();

        return () => {
            window.removeEventListener('resize', resize);
            video.removeEventListener('play', onPlayFn);
            video.removeEventListener('pause', onPauseFn);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [landmarks, ref]);

    return (
        <div className="video-container" ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
            <video
                controls
                width={400}
                id="myVideo"
                ref={ref}
                src={url}
                onError={(e) => console.error('Video error:', e, 'Video URL:', url)}
                onPlay={onPlay}
                onPause={onPause}
                style={{ display: 'block' }}
            >
                <track kind="captions" />
                Not working
            </video>
            <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
        </div>
    );
});

export default CustomVideoPlayer;