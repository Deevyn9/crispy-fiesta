import { useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

// npm i lenis @fontsource-variable/geist @fontsource-variable/geist-mono
import "lenis/dist/lenis.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type HeroProps = {
  startAnimations: boolean;
};

// ---------- Layout ----------
// Gap between the top of the screen and the video / About text.
// One value drives both, so they always line up. Nav is about 3.25rem tall.
const TOP_GAP = "4rem";

// 65vw wide, but never taller than the space between the top gap and an equal
// bottom gap (16:9), so the video can never touch the bottom of the 100vh About.
const VIDEO_WIDTH = `min(65vw, calc((100vh - ${TOP_GAP} - ${TOP_GAP}) * 16 / 9))`;

// ---------- Type system ----------
// Geist for text and display, Geist Mono for small labels.
const SANS =
  '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

// Ink scale (all pass WCAG AA on #eeeeee and white):
//   ink   #0a0a09  headings
//   lede  #232321  intro paragraphs
//   body  #4f4f4a  running text
//   muted #66665f  labels and indices
const ROOT_VARS = {
  fontFamily: SANS,
  "--ink": "#0a0a09",
  "--lede": "#232321",
  "--body": "#4f4f4a",
  "--muted": "#66665f",
  "--hairline": "rgba(10, 10, 9, 0.12)",
} as CSSProperties;

// Running text: quieter, comfortable measure.
function Body({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 font-semibold max-w-[36rem] text-[clamp(0.9375rem,1.05vw,1.0625rem)] font-normal leading-[1.7] tracking-[-0.006em] text-[color:var(--body)] [text-wrap:pretty]">
      {children}
    </p>
  );
}

// Numbered subsection with a hairline above it.
function Block({
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-14  pt-5">
      <div className="flex items-baseline gap-3">
        <h3 className="text-[clamp(1.25rem,1.55vw,1.5rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-[color:var(--ink)]">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function Hero({ startAnimations }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Built while the preloader is still covering the page, played later.
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const readyRef = useRef<Promise<unknown> | null>(null);

  // ---------- Phase 1: prepare the intro (runs on mount, under the preloader) ----------
  // The hero is rendered immediately, so without this it would sit there fully
  // visible while the preloader plays, then snap to its "from" state when the
  // intro begins and animate in again. That reads as a glitch.
  //
  // Instead, everything the intro animates is put in its START state here,
  // before the first paint, so the hero is already hidden under the preloader.
  // Phase 2 then only ever plays the timeline forward, once.
  useGSAP(
    (_context, contextSafe) => {
      const root = containerRef.current!;
      const nav = root.querySelector<HTMLElement>(".navbar")!;
      const videoInner = root.querySelector<HTMLElement>(".hero-video-inner")!;
      const title = root.querySelector<HTMLElement>(".hero-title")!;
      const sub = root.querySelector<HTMLElement>(".hero-sub")!;

      gsap.set(nav, { y: -80, opacity: 0 });
      gsap.set(videoInner, { scale: 0.9 });
      // Keep the text hidden until it has been split, so unsplit text never shows.
      gsap.set([title, sub], { visibility: "hidden" });

      let cancelled = false;
      let titleSplit: SplitText | undefined;
      let subSplit: SplitText | undefined;

      // Split only after the font has loaded, otherwise the line breaks are
      // measured with the fallback font and come out wrong.
      readyRef.current = (document.fonts?.ready ?? Promise.resolve()).then(
        contextSafe!(() => {
          if (cancelled) return;

          titleSplit = SplitText.create(title, {
            type: "words",
            mask: "words",
          });
          subSplit = SplitText.create(sub, {
            type: "lines",
            mask: "lines",
          });

          // The mask clips each word to its line box. With tight display leading
          // that would shave the descenders (y, g), so extend the clip area
          // downward and cancel it with a negative margin so layout is unchanged.
          gsap.set(titleSplit.masks, {
            paddingBottom: "0.16em",
            marginBottom: "-0.16em",
          });

          gsap.set(titleSplit.words, { yPercent: 110, opacity: 0 });
          gsap.set(subSplit.lines, { yPercent: 110, opacity: 0 });
          gsap.set([title, sub], { visibility: "visible" });

          introRef.current = gsap
            .timeline({
              paused: true,
              defaults: { ease: "power3.out" },
              // Back to plain text once the intro is done, so the paragraph
              // reflows normally when the window is resized.
              onComplete: () => {
                titleSplit?.revert();
                subSplit?.revert();
              },
            })
            .to(videoInner, { scale: 1, duration: 1 })
            .to(nav, { y: 0, opacity: 1, duration: 0.7 }, "-=0.4")
            .to(
              titleSplit.words,
              { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06 },
              "-=0.3",
            )
            .to(
              subSplit.lines,
              { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08 },
              "-=0.5",
            );
        }),
      );

      return () => {
        cancelled = true;
        introRef.current?.kill();
        introRef.current = null;
        titleSplit?.revert();
        subSplit?.revert();
      };
    },
    { scope: containerRef },
  );

  // ---------- Phase 2: scrolling + play the intro (after the preloader) ----------
  useGSAP(
    () => {
      if (!startAnimations) return;

      const root = containerRef.current!;
      const video = root.querySelector<HTMLElement>(".hero-video")!;
      const slot = root.querySelector<HTMLElement>(".about-video-slot")!;
      const copyPort = root.querySelector<HTMLElement>(".about-copy")!;
      const copyInner = root.querySelector<HTMLElement>(".about-copy-inner")!;

      // Play the prepared intro (waits for the font + split if they are not
      // ready yet).
      let cancelled = false;
      readyRef.current?.then(() => {
        if (!cancelled) introRef.current?.play();
      });

      // ---------- Smooth scrolling (Lenis, driven by GSAP's ticker) ----------
      // Lenis eases the page scroll itself, and ScrollTrigger is told about every
      // Lenis frame, so scrubbed animations follow the eased position. Because
      // Lenis already does the smoothing, scrubs below are 1:1 (scrub: true);
      // stacking a second ease on top is what makes scrubs feel laggy and mushy.
      // Users who prefer reduced motion keep native scrolling.
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      let lenis: Lenis | undefined;
      let tick: ((time: number) => void) | undefined;

      if (!reduceMotion) {
        const instance = new Lenis({ lerp: 0.09 });
        lenis = instance;
        instance.on("scroll", ScrollTrigger.update);
        tick = (time) => instance.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      // Without Lenis, fall back to a short GSAP-side smoothing.
      const scrub = lenis ? true : 0.6;

      // ---------- 1. Hero scroll: full screen -> beside the About text ----------
      // The video lives INSIDE the About section (absolutely positioned, one
      // hero-height above it), so it always sits above the About background and
      // travels with the section.
      //
      // It is animated with transform (translate + scale) and clip-path ONLY.
      // Those run on the compositor and never trigger layout. The previous
      // version tweened width/height/top/left, which forces a full layout pass
      // on every scroll frame, and that is what felt jerky.
      //
      // The video keeps its full-screen layout box. We scale it uniformly so it
      // covers the slot, then clip away whatever overflows the slot (centred),
      // so the footage is never stretched or squashed.
      gsap.set(video, { transformOrigin: "0 0", force3D: true });

      const fit = () => {
        const vw = video.offsetWidth;
        const vh = video.offsetHeight;
        const sw = slot.offsetWidth;
        const sh = slot.offsetHeight;

        const s = Math.max(sw / vw, sh / vh); // cover-fit scale
        const cropX = Math.max(0, vw - sw / s) / 2; // clipped per side (local px)
        const cropY = Math.max(0, vh - sh / s) / 2;

        return {
          s,
          cropX,
          cropY,
          // The video box starts one hero-height above About (top: -100vh), so
          // y has to cover that distance plus the slot's offset.
          x: slot.offsetLeft - cropX * s,
          y: slot.offsetTop + vh - cropY * s,
        };
      };

      gsap.fromTo(
        video,
        { x: 0, y: 0, scale: 1, clipPath: "inset(0px 0px 0px 0px)" },
        {
          x: () => fit().x,
          y: () => fit().y,
          scale: () => fit().s,
          clipPath: () => {
            const { cropX, cropY } = fit();
            return `inset(${cropY}px ${cropX}px ${cropY}px ${cropX}px)`;
          },
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top", // ends exactly when About reaches the top
            scrub,
            invalidateOnRefresh: true,
          },
        },
      );

      // The scrim only exists to keep the hero text readable, so it fades out
      // over the same scroll range while the video shrinks into its slot.
      gsap.to(".hero-video-scrim", {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub,
        },
      });

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
          scrub,
          invalidateOnRefresh: true,
        },
      });

      // Fonts change text height, so re-measure once they are ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        cancelled = true;
        if (tick) gsap.ticker.remove(tick);
        lenis?.destroy();
        gsap.ticker.lagSmoothing(500, 33); // GSAP's default
      };
    },
    {
      scope: containerRef,
      dependencies: [startAnimations],
    },
  );

  return (
    <div
      ref={containerRef}
      className="antialiased [text-rendering:optimizeLegibility]"
      style={ROOT_VARS}
    >
      <nav className="navbar fixed top-0 left-0 z-40 flex w-full items-center justify-between px-6 py-4 text-white mix-blend-difference">
        <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.1em]">
          Padel Point
        </span>

        <div className="flex gap-6 text-[13px] font-medium leading-none tracking-[-0.01em]">
          <a
            href="#"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            Court
          </a>
          <a
            href="#"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            Book
          </a>
          <a
            href="#"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* HERO: exactly 100vh */}
      <section className="hero relative h-[100vh]">
        {/* z-30 so the text sits above the video */}
        <div className="relative z-30 flex h-full flex-col justify-end px-6 pb-16">
          <h1 className="hero-title max-w-[14ch] text-[clamp(3rem,7.4vw,8.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-[#c8f31d] [text-wrap:balance]">
            Play where the game feels alive.
          </h1>

          <p className="hero-sub mt-6 max-w-[27rem] text-[clamp(1rem,1.2vw,1.1875rem)] font-normal leading-[1.5] tracking-[-0.012em] text-white/80 [text-wrap:pretty]">
            A premium padel court built for fast rallies, good people, and long
            evenings.
          </p>
        </div>
      </section>

      {/* ABOUT: exactly 100vh, #eeeeee, flex row. Video (65vw) on the left,
          scrolling copy on the right. */}
      <section className="about relative flex h-[100vh] flex-row gap-6 bg-[#f9f9f9] px-6 text-[color:var(--ink)]">
        {/* The video is a child of About, so it is above the About background
            (z-20), but below the About copy (z-30).
            This is its full-screen starting box; GSAP moves it with transform
            and clip-path only (never width/height/top/left). */}
        <div className="hero-video pointer-events-none absolute left-0 top-[-100vh] z-20 h-[100vh] w-full overflow-hidden bg-black will-change-transform">
          <div className="hero-video-inner relative h-full w-full">
            <video
              className="h-full w-full object-cover"
              src="https://www.pexels.com/download/video/33444758/"
              autoPlay
              muted
              loop
              playsInline
            />

            {/* Scrim lives ON the video, so it resizes and moves with it
                (a separate div in the hero would slide across the video as
                you scroll). It fades out while the video shrinks. */}
            <div className="hero-video-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        </div>

        {/* Empty space where the video lands (65vw, 16:9, no radius).
            self-start is required: flex items stretch to the full row height by
            default, which overrides aspect-video and made the slot (and so the
            video) run all the way down to the bottom edge of About. */}
        <div
          className="about-video-slot aspect-video shrink-0 self-start"
          style={{ marginTop: TOP_GAP, width: VIDEO_WIDTH }}
        />

        {/* Clipped column; the inner block is translated by GSAP.
            The mask fades text out just before it slides under the nav. */}
        <div className="about-copy relative z-30 h-full min-w-0 flex-1 overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,transparent_2rem,#000_4rem)] [mask-image:linear-gradient(to_bottom,transparent_0,transparent_2rem,#000_4rem)]">
          <div
            className="about-copy-inner pb-24"
            style={{ paddingTop: TOP_GAP }}
          >
            {/* <Eyebrow>The court</Eyebrow> */}

            <h2 className="mt-5 text-[clamp(2.25rem,3.9vw,4.25rem)] font-semibold leading-[1] tracking-[-0.045em] text-[color:var(--ink)] [text-wrap:balance]">
              About the court
            </h2>

            <div className="mt-8 max-w-[36rem]">
              <Body>
                Padel Point is a modern court designed around pace, precision,
                and community. Whether you are learning the basics or chasing
                competitive matches, the court is built to keep you playing.
              </Body>
            </div>

            <Body>
              Every detail starts with the game. The surface is laid for true,
              predictable bounce, so a good shot is always rewarded. The glass
              walls are crystal clear, which keeps the ball in play and the
              crowd close to the action. The lighting is tuned so the last match
              of the night feels as sharp as the first one of the morning.
            </Body>

            <Block index="01" title="Easy to start">
              <Body>
                We keep things simple for newcomers. Rackets and balls are
                available to borrow, coaches are on hand for first-timer
                sessions, and our community nights match you with players at
                your level, so you are never stuck waiting for a fourth. Most
                people are rallying within ten minutes of their first visit.
              </Body>
              <Body>
                Padel is forgiving by design. You can use the walls, the serve
                is underarm, and the court is small enough that every point
                stays within reach. That means beginners enjoy it right away,
                and experienced players still find plenty to master.
              </Body>
            </Block>

            <Block index="02" title="Room to compete">
              <Body>
                For regulars, there are weekly leagues, ladder challenges, and
                private bookings for friends, teams, and companies. Whatever
                your level, there is always a game worth showing up for and
                someone ready to play it with you.
              </Body>
              <Body>
                Our coaches run clinics on serves, the bandeja, and reading the
                glass, along with small-group sessions that focus on one part of
                your game at a time. Progress is tracked, celebrated, and always
                shared with the people you play with.
              </Body>
            </Block>

            <Block index="03" title="Made to linger">
              <Body>
                Off the court, the space is built to stay in. Cold drinks, good
                music, and shaded seating make it easy to remain after the final
                point, talk through the rallies you almost won, and plan the
                rematch. Evenings here tend to run long, and nobody minds.
              </Body>
              <Body>
                Padel Point opens early and closes late, with floodlit evening
                sessions all week. Book a slot, bring a friend, and find out why
                so many people call it the best hour of their day.
              </Body>
            </Block>
          </div>
        </div>
      </section>

      {/* SECOND SECTION: flex row, heading left and copy right at all sizes.
          Sized by its content: 96px on top, 100px on the bottom. */}
      <section className="flex flex-row items-start justify-between gap-10 bg-white px-6 pb-[100px] pt-24 text-[color:var(--ink)]">
        <div className="min-w-0 flex-1">
          <h2 className="mt-6 max-w-[11ch] text-[clamp(2.5rem,6vw,6.5rem)] font-semibold leading-[0.97] tracking-[-0.055em] [text-wrap:balance]">
            Built for rallies, made for people.
          </h2>
        </div>

        <div className="min-w-0 flex-1 pt-[2.4rem]">
          <div className="max-w-[36rem]">
            <Body>
              Padel is fast, social, and endlessly replayable. The glass walls
              keep the ball alive, the smaller court keeps every point within
              reach, and the doubles format makes every game feel like a
              conversation.
            </Body>
          </div>

          <Body>
            At Padel Point, the court is only the beginning. Come for the
            training sessions, stay for the community matches, and leave with a
            new favourite way to spend an evening.
          </Body>
        </div>
      </section>
    </div>
  );
}
