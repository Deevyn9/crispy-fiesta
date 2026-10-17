import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type HeroProps = {
  startAnimations: boolean;
};

// Gap between the top of the screen and the video / About text.
// One value drives both, so they always line up. Nav is about 3.25rem tall.
const TOP_GAP = "4rem";

// 65vw wide, but never taller than the space between the top gap and an equal
// bottom gap (16:9), so the video can never touch the bottom of the 100vh About.
const VIDEO_WIDTH = `min(65vw, calc((100vh - ${TOP_GAP} - ${TOP_GAP}) * 16 / 9))`;

export default function Hero({ startAnimations }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!startAnimations) return;

      const root = containerRef.current!;
      const hero = root.querySelector<HTMLElement>(".hero")!;
      const slot = root.querySelector<HTMLElement>(".about-video-slot")!;
      const copyPort = root.querySelector<HTMLElement>(".about-copy")!;
      const copyInner = root.querySelector<HTMLElement>(".about-copy-inner")!;

      // ---------- Intro (runs once after the preloader) ----------
      // Scales the INNER wrapper so it never fights the scroll animation,
      // which owns the size/position of the outer .hero-video.
      const intro = gsap.timeline();

      intro.fromTo(
        ".hero-video-inner",
        { scale: 0.9 },
        { scale: 1, duration: 1, ease: "power3.out" },
      );

      intro.fromTo(
        ".navbar",
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
        "-=0.4",
      );

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

      // ---------- 1. Hero scroll: full screen -> 65vw beside the About text ----------
      // The video lives INSIDE the About section (absolutely positioned), so it
      // always sits above the About background and travels with the section.
      // The About section's top is at the hero's bottom edge, so a hero-sized
      // video starts at top = -heroHeight (exactly covering the hero) and
      // ends at the empty slot next to the About text. The slot's left edge is
      // on the same px-6 line as the nav and hero text.
      gsap.fromTo(
        ".hero-video",
        {
          top: () => -hero.offsetHeight,
          left: 0,
          width: () => root.clientWidth,
          height: () => hero.offsetHeight,
        },
        {
          top: () => slot.offsetTop,
          left: () => slot.offsetLeft,
          width: () => slot.offsetWidth,
          height: () => slot.offsetHeight,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top", // ends exactly when About reaches the top
            scrub: 1, // 1s of smoothing for a silky, eased follow
            invalidateOnRefresh: true,
          },
        },
      );

      // ---------- 2. About: pinned at 100vh, copy scrolls, video stays ----------
      // While About is pinned, the long copy slides up inside its clipped
      // column. When the last line is reached, the pin releases and the whole
      // section (video included) scrolls away together, revealing the next
      // section.
      const copyOverflow = () =>
        Math.max(0, copyInner.offsetHeight - copyPort.clientHeight);

      gsap.to(".about-copy-inner", {
        y: () => -copyOverflow(),
        ease: "none",
        scrollTrigger: {
          trigger: ".about",
          start: "top top",
          end: () => `+=${Math.max(copyOverflow(), 1)}`,
          pin: true,
          anticipatePin: 1,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Fonts change text height, so re-measure once they are ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
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

      {/* HERO: exactly 100vh */}
      <section className="hero relative h-[100vh]">
        {/* z-30 so the text sits above the video */}
        <div className="relative z-30 flex h-full flex-col justify-end px-6 pb-16">
          <h1 className="hero-title max-w-3xl text-5xl font-extrabold leading-tight text-[#c8f31d] md:text-7xl">
            Play where the game feels alive.
          </h1>

          <p className="mt-4 max-w-md text-white">
            A premium padel court built for fast rallies, good people, and long
            evenings.
          </p>
        </div>
      </section>

      {/* ABOUT: exactly 100vh, #eeeeee, flex row. Video (65vw) on the left,
          scrolling copy on the right. */}
      <section className="about relative flex h-[100vh] flex-row gap-6 bg-[#eeeeee] px-6 text-black">
        {/* The video is a child of About, so it is above the About background
            (z-20), but below the About copy (z-30).
            CSS values are only the pre-JS fallback; GSAP drives them. */}
        <div className="hero-video pointer-events-none absolute left-0 top-[-100vh] z-20 h-[100vh] w-full overflow-hidden bg-black">
          <div className="hero-video-inner h-full w-full">
            <video
              className="h-full w-full object-cover"
              src="https://www.pexels.com/download/video/33444758/"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>

        {/* Empty space where the video lands (65vw, 16:9, no radius) */}
        <div
          className="about-video-slot aspect-video shrink-0"
          style={{ marginTop: TOP_GAP, width: VIDEO_WIDTH }}
        />

        {/* Clipped column; the inner block is translated by GSAP */}
        <div className="about-copy relative z-30 h-full min-w-0 flex-1 overflow-hidden">
          <div
            className="about-copy-inner pb-24"
            style={{ paddingTop: TOP_GAP }}
          >
            <h2 className="text-[clamp(2rem,3.2vw,3.5rem)] font-extrabold leading-tight">
              About the court
            </h2>

            <p className="mt-6 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Padel Point is a modern court designed around pace, precision, and
              community. Whether you are learning the basics or chasing
              competitive matches, the court is built to keep you playing.
            </p>

            <p className="mt-6 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Every detail starts with the game. The surface is laid for true,
              predictable bounce, so a good shot is always rewarded. The glass
              walls are crystal clear, which keeps the ball in play and the
              crowd close to the action. The lighting is tuned so the last match
              of the night feels as sharp as the first one of the morning.
            </p>

            <h3 className="mt-12 text-[clamp(1.25rem,1.8vw,1.75rem)] font-extrabold">
              Easy to start
            </h3>

            <p className="mt-4 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              We keep things simple for newcomers. Rackets and balls are
              available to borrow, coaches are on hand for first-timer sessions,
              and our community nights match you with players at your level, so
              you are never stuck waiting for a fourth. Most people are rallying
              within ten minutes of their first visit.
            </p>

            <p className="mt-6 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Padel is forgiving by design. You can use the walls, the serve is
              underarm, and the court is small enough that every point stays
              within reach. That means beginners enjoy it right away, and
              experienced players still find plenty to master.
            </p>

            <h3 className="mt-12 text-[clamp(1.25rem,1.8vw,1.75rem)] font-extrabold">
              Room to compete
            </h3>

            <p className="mt-4 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              For regulars, there are weekly leagues, ladder challenges, and
              private bookings for friends, teams, and companies. Whatever your
              level, there is always a game worth showing up for and someone
              ready to play it with you.
            </p>

            <p className="mt-6 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Our coaches run clinics on serves, the bandeja, and reading the
              glass, along with small-group sessions that focus on one part of
              your game at a time. Progress is tracked, celebrated, and always
              shared with the people you play with.
            </p>

            <h3 className="mt-12 text-[clamp(1.25rem,1.8vw,1.75rem)] font-extrabold">
              Made to linger
            </h3>

            <p className="mt-4 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Off the court, the space is built to stay in. Cold drinks, good
              music, and shaded seating make it easy to remain after the final
              point, talk through the rallies you almost won, and plan the
              rematch. Evenings here tend to run long, and nobody minds.
            </p>

            <p className="mt-6 text-[clamp(1rem,1.2vw,1.2rem)] leading-relaxed text-black/70">
              Padel Point opens early and closes late, with floodlit evening
              sessions all week. Book a slot, bring a friend, and find out why
              so many people call it the best hour of their day.
            </p>
          </div>
        </div>
      </section>

      {/* SECOND SECTION: flex row, heading left and copy right at all sizes */}
      <section className="flex min-h-screen flex-row items-start justify-between gap-10 bg-white px-6 py-24 text-black">
        <div className="min-w-0 flex-1">
          <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-tight">
            Built for rallies,
            <br />
            made for people.
          </h2>
        </div>

        <div className="min-w-0 flex-1 pt-4">
          <p className="text-[clamp(1rem,1.3vw,1.25rem)] text-black/70">
            Padel is fast, social, and endlessly replayable. The glass walls
            keep the ball alive, the smaller court keeps every point within
            reach, and the doubles format makes every game feel like a
            conversation.
          </p>

          <p className="mt-6 text-[clamp(1rem,1.3vw,1.25rem)] text-black/70">
            At Padel Point, the court is only the beginning. Come for the
            training sessions, stay for the community matches, and leave with a
            new favourite way to spend an evening.
          </p>
        </div>
      </section>
    </div>
  );
}
