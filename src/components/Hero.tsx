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

      // 1. Video enters slightly smaller, then fills the screen
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

      // Scroll animation: video shrinks to 70vw,
      // keeping its left edge at the 24px page padding.
      const videoScroll = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,

          // Hero has fully scrolled away:
          // the video becomes part of the About layout
          // and scrolls away with it.
          onLeave: () => {
            gsap.set(".hero-video", {
              position: "absolute",
              top: "calc(100vh + 24px)", // hero height + About top padding
              left: 24,
              width: "70vw",
              height: "39.375vw",
              borderRadius: 16,
            });
          },

          // Scrolling back up returns it to fixed full-screen.
          onEnterBack: () => {
            gsap.set(".hero-video", {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              borderRadius: 0,
            });
          },
        },
      });

      videoScroll.fromTo(
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
          // Final fixed position matches the About video slot:
          // 24px from the left, 24px from the top, 70vw wide.
          top: 24,
          left: 24,
          width: "70vw",
          height: "39.375vw", // 70vw at 16:9
          borderRadius: 16,
          ease: "none",
        },
      );
    },
    {
      scope: containerRef,
      dependencies: [startAnimations],
    },
  );

  return (
    <div ref={containerRef}>
      <nav className="navbar fixed top-0 left-0 z-40 flex w-full items-center justify-between px-6 py-4 text-white mix-blend-difference">
        <span className="font-extrabold tracking-tight">PADEL POINT</span>

        <div className="flex gap-6 text-sm">
          <a href="#">Court</a>
          <a href="#">Book</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      <section className="hero relative h-screen">
        <div className="hero-video absolute left-0 top-0 overflow-hidden">
          <video
            className="h-full w-full object-cover"
            src="https://www.pexels.com/download/video/33444758/"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16">
          <h1 className="hero-title max-w-3xl text-5xl font-extrabold leading-tight text-[#c8f31d] md:text-7xl">
            Play where the game feels alive.
          </h1>

          <p className="mt-4 max-w-md text-lg text-[#c8f31d]/90">
            A premium padel court built for fast rallies, good people, and long
            evenings.
          </p>
        </div>
      </section>

      {/* About: flex row, video left, copy right, top aligned */}
      <section className="about relative flex flex-row items-start gap-10 bg-white px-6 pb-24 pt-6 text-black">
        {/* Empty space where the video lands */}
        <div className="about-video-slot h-[39.375vw] w-[70vw] shrink-0 rounded-2xl" />

        <div className="about-copy max-w-xl pt-10">
          <h2 className="text-4xl font-extrabold">About the court</h2>

          <p className="mt-4 text-black/70">
            Padel Point is a modern court designed around pace, precision, and
            community. Whether you are learning the basics or chasing
            competitive matches, the court is built to keep you playing.
          </p>
        </div>
      </section>

      {/* Next section: flex row, heading left, description right */}
      <section className="flex flex-row items-start gap-10 bg-white px-6 pb-24 pt-24 text-black">
        <div className="w-1/2">
          <h2 className="text-5xl font-extrabold leading-tight md:text-6xl">
            Built for rallies,
            <br />
            made for people.
          </h2>
        </div>

        <div className="w-1/2 max-w-xl pt-4">
          <p className="text-lg leading-relaxed text-black/70">
            Padel is one of the fastest-growing sports in the world because it
            is easy to start but difficult to master. The glass walls keep the
            ball in play, the smaller court keeps every point within reach, and
            the doubles format turns every rally into a shared conversation
            between teammates.
          </p>

          <p className="mt-6 text-lg leading-relaxed text-black/70">
            At Padel Point, the court is only the beginning. Come for the
            training sessions, stay for the community matches, and leave with a
            new favourite way to spend an evening. Whether you are picking up a
            racket for the first time or preparing for competitive play, the
            court is designed to meet you at your level and push you one rally
            further.
          </p>

          <p className="mt-6 text-lg leading-relaxed text-black/70">
            Book a court, bring a partner, and experience the game the way it
            was meant to be played: fast, social, and full of energy.
          </p>
        </div>
      </section>
    </div>
  );
}
