import { useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import TennisBallSvg from "./TennisBallSvg";

gsap.registerPlugin(useGSAP);

type PreloaderProps = {
  onFinish: () => void;
};

const BALL_SIZE = 24; // h-6 w-6

// Smallest scale that still covers the whole screen from the ball's centre.
// (The old value of 500 made the ball ~12,000px wide, which is what made the
// last part of the animation choppy.)
const coverScale = () => {
  const b = document.querySelector(".preloader-ball")!.getBoundingClientRect();
  const cx = b.left + b.width / 2;
  const cy = b.top + b.height / 2;

  const farthestCorner = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(innerWidth - cx, cy),
    Math.hypot(cx, innerHeight - cy),
    Math.hypot(innerWidth - cx, innerHeight - cy),
  );

  return (farthestCorner / (BALL_SIZE / 2)) * 1.15; // 15% safety margin
};

export default function Preloader({ onFinish }: PreloaderProps) {
  const [isHidden, setIsHidden] = useState(false);

  useGSAP(() => {
    document.body.style.overflow = "hidden";

    const timeline = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        onFinish();
        setIsHidden(true);
      },
    });

    timeline
      // 1. Words fade in joined together
      .fromTo(
        ".preloader-word",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        },
      )

      // 2. Spacer grows, pushing words apart
      .fromTo(
        ".preloader-ball-slot",
        { width: 0 },
        {
          width: 30,
          duration: 0.6,
          ease: "power3.out",
        },
      )

      // 3. Ball scales from 0 to normal
      .fromTo(
        ".preloader-ball",
        { scale: 0 },
        {
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
        },
        "<",
      )

      // 4. Anticipation dip
      .to(".preloader-ball", {
        scale: 0.7,
        duration: 0.5,
        ease: "power2.inOut",
      })

      // 5. Words fade out
      .to(
        ".preloader-word",
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        },
        "-=0.15",
      )

      // 6. Ball expands fullscreen (only as far as it needs to cover the screen)
      .to(
        ".preloader-ball",
        {
          scale: coverScale,
          rotate: 90,
          duration: 1,
          ease: "power4.inOut",
        },
        "-=0.3",
      )

      // 7. Fade preloader away
      .to(".preloader", {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
  });

  if (isHidden) return null;

  return (
    <div className="preloader fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#0b2a4a]">
      <div className="flex items-center justify-center">
        <span className="preloader-word text-[20px] font-extrabold tracking-tight text-[#c8f31d]">
          PADEL
        </span>

        <div className="preloader-ball-slot relative h-6 w-0">
          <TennisBallSvg className="preloader-ball absolute left-1 top-0 h-6 w-6" />
        </div>

        <span className="preloader-word text-[20px] font-extrabold tracking-tight text-[#c8f31d]">
          POINT
        </span>
      </div>
    </div>
  );
}
