import { useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// npm i @fontsource-variable/geist @fontsource-variable/geist-mono
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
const MONO =
  '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

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

// Small mono label with a tennis-green dot.
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-[color:var(--muted)]"
      style={{ fontFamily: MONO }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#c8f31d] ring-1 ring-black/20" />
      {children}
    </p>
  );
}

// Intro paragraph: larger, darker.
function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="text-[clamp(1.125rem,1.45vw,1.375rem)] font-normal leading-[1.45] tracking-[-0.014em] text-[color:var(--lede)] [text-wrap:pretty]">
      {children}
    </p>
  );
}

// Running text: quieter, comfortable measure.
function Body({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 max-w-[36rem] text-[clamp(0.9375rem,1.05vw,1.0625rem)] font-normal leading-[1.7] tracking-[-0.006em] text-[color:var(--body)] [text-wrap:pretty]">
      {children}
    </p>
  );
}

// Numbered subsection with a hairline above it.
function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-14 border-t border-[color:var(--hairline)] pt-5">
      <div className="flex items-baseline gap-3">
        <span
          className="text-[11px] font-medium leading-none tracking-[0.08em] text-[color:var(--muted)]"
          style={{ fontFamily: MONO }}
        >
          {index}
        </span>
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

      // The mask clips each word to its line box. With tight display leading
      // that would shave the descenders (y, g), so extend the clip area
      // downward and cancel it with a negative margin so layout is unchanged.
      gsap.set(split.masks, {
        paddingBottom: "0.16em",
        marginBottom: "-0.16em",
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

      // The scrim only exists to keep the hero text readable, so it fades out
      // over the same scroll range while the video shrinks into its slot.
      gsap.to(".hero-video-scrim", {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
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

          <p className="mt-6 max-w-[27rem] text-[clamp(1rem,1.2vw,1.1875rem)] font-normal leading-[1.5] tracking-[-0.012em] text-white/80 [text-wrap:pretty]">
            A premium padel court built for fast rallies, good people, and long
            evenings.
          </p>
        </div>
      </section>

      {/* ABOUT: exactly 100vh, #eeeeee, flex row. Video (65vw) on the left,
          scrolling copy on the right. */}
      <section className="about relative flex h-[100vh] flex-row gap-6 bg-[#eeeeee] px-6 text-[color:var(--ink)]">
        {/* The video is a child of About, so it is above the About background
            (z-20), but below the About copy (z-30).
            CSS values are only the pre-JS fallback; GSAP drives them. */}
        <div className="hero-video pointer-events-none absolute left-0 top-[-100vh] z-20 h-[100vh] w-full overflow-hidden bg-black">
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
            <Eyebrow>The court</Eyebrow>

            <h2 className="mt-5 text-[clamp(2.25rem,3.9vw,4.25rem)] font-semibold leading-[1] tracking-[-0.045em] text-[color:var(--ink)] [text-wrap:balance]">
              About the court
            </h2>

            <div className="mt-8 max-w-[36rem]">
              <Lede>
                Padel Point is a modern court designed around pace, precision,
                and community. Whether you are learning the basics or chasing
                competitive matches, the court is built to keep you playing.
              </Lede>
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

      {/* SECOND SECTION: flex row, heading left and copy right at all sizes */}
      <section className="flex min-h-screen flex-row items-start justify-between gap-10 bg-white px-6 py-24 text-[color:var(--ink)]">
        <div className="min-w-0 flex-1">
          <Eyebrow>Community</Eyebrow>

          <h2 className="mt-6 max-w-[11ch] text-[clamp(2.5rem,6vw,6.5rem)] font-semibold leading-[0.97] tracking-[-0.055em] [text-wrap:balance]">
            Built for rallies, made for people.
          </h2>
        </div>

        <div className="min-w-0 flex-1 pt-[2.4rem]">
          <div className="max-w-[36rem]">
            <Lede>
              Padel is fast, social, and endlessly replayable. The glass walls
              keep the ball alive, the smaller court keeps every point within
              reach, and the doubles format makes every game feel like a
              conversation.
            </Lede>
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
