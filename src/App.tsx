import { useState } from "react";
import Preloader from "./components/Preloader";
import "./App.css";
import Hero from "./components/Hero";

export default function App() {
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  return (
    <>
      <Preloader onFinish={() => setPreloaderFinished(true)} />

      <Hero startAnimations={preloaderFinished} />
    </>
  );
}
