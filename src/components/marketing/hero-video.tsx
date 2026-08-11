"use client";

import { useEffect, useRef } from "react";

/*
 * The hero's moving background.
 *
 * A looping background video is the one piece of motion on this page that a
 * visitor cannot stop, so it honours "prefers-reduced-motion" properly: the
 * element keeps its poster frame and never plays. `autoPlay` is still set for
 * everyone else, and the effect pauses it on the first frame rather than
 * letting a second of footage run before the preference is read.
 *
 * `muted` and `playsInline` are both required for autoplay to be allowed at
 * all — iOS blocks it outright without them, and every desktop browser blocks
 * unmuted autoplay.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.pause();
    video.removeAttribute("autoplay");
    // Back to the first frame, so what remains matches the poster rather than
    // freezing on whichever frame happened to have decoded.
    video.currentTime = 0;
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster="/images/hero-poster.jpg"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src="/videos/hero.mp4" type="video/mp4" />
    </video>
  );
}
