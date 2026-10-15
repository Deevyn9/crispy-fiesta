import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type HeroProps = {
  startAnimations: boolean;
};

export default function Hero({ startAnimations }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!startAnimations) return;

      // Intro timeline: runs once after the preloader
      const intro = gsap.timeline();

      // 1. Video starts slightly smaller, then fills the screen
      intro.fromTo(
        ".hero-video",
        { width: "90vw", height: "90vh" },
        {
          width: "100vw",
          height: "100vh",
          duration: 1,
          ease: "power3.out",
        },
      );

      // 2. Navbar drops down
      intro.fromTo(
        ".navbar",
        { y: -80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.4",
      );

      // 3. Hero heading splits and reveals
      const split = SplitText.create(".hero-title", {
        type: "words",
        mask: "words",
      });

      intro.from(
        split.words,
        {
          yPercent: 110,
          opacity: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
        },
        "-=0.3",
      );

      // Scroll animation: video shrinks into About
      gsap.fromTo(
        ".hero-video",
        {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          borderRadius: 0,
        },
        {
          top: "50vh",
          left: "6vw",
          width: "44vw",
          height: "24.75vw", // 16:9
          borderRadius: 16,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: containerRef, dependencies: [startAnimations] },
  );

  return (
    <div ref={containerRef}>
      <nav className="navbar fixed top-0 left-0 z-40 flex w-full items-center justify-between px-6 py-4 text-white">
        <span className="font-extrabold tracking-tight">PADEL POINT</span>

        <div className="flex gap-6 text-sm">
          <a href="#">Court</a>
          <a href="#">Book</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      <section className="hero relative h-screen">
        <div className="hero-video absolute left-0 top-0 overflow-hidden">
          {/* <video
            className="h-full w-full object-cover"
            src="/hero-video.mp4"
            autoPlay
            muted
            loop
            playsInline
          /> */}
          <div className="bg-red-500 w-full h-full"></div>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 text-white">
          <h1 className="hero-title max-w-3xl text-5xl font-extrabold leading-tight md:text-7xl">
            Play where the game feels alive.
          </h1>

          <p className="mt-4 max-w-md text-white/80">
            A premium padel court built for fast rallies, good people, and long
            evenings.
          </p>
        </div>
      </section>

      <section className="about relative flex min-h-screen items-center gap-10 bg-transparent px-[6vw] py-24 text-white">
        {/* Empty space where the video will land */}
        <div className="about-video-slot h-[24.75vw] w-[44vw] shrink-0 rounded-2xl" />

        <div className="about-copy max-w-xl">
          <h2 className="text-4xl font-extrabold">About the court</h2>

          <p className="mt-4 text-white/80">
            Padel Point is a modern court designed around pace, precision, and
            community. Whether you are learning the basics or chasing
            competitive matches, the court is built to keep you playing.
          </p>
        </div>
      </section>
    </div>
  );
}
