import { useEffect, useState } from "react";
import { useSite } from "./context/site";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { Header } from "./components/Header/Header";
import { Loader } from "./components/Loader/Loader";
import { Hero } from "./components/Hero/Hero";
import { Entry } from "./components/Entry/Entry";
import { About } from "./components/About/About";
import { Stack } from "./components/Stack/Stack";
import { Projects } from "./components/Projects/Projects";
import { Certificates } from "./components/Certificates/Certificates";
import { Reviews } from "./components/Reviews/Reviews";
import { Contact } from "./components/Contact/Contact";
import { Resume } from "./components/Resume/Resume";
import { Footer } from "./components/Footer/Footer";
import { ScrollProgress } from "./components/Progress/ScrollProgress";
import { Assistant } from "./components/Assistant/Assistant";
import { markLoaderDone } from "./analytics";

function Shell() {
  const { loaderDone, setLoaderDone, dict } = useSite();
  const [booting, setBooting] = useState(false);
  useSmoothScroll(loaderDone);

  useEffect(() => {
    // При reduced motion вступительный экран не показываем вовсе (0 мс).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLoaderDone(true);
      return;
    }
    setBooting(true);
  }, [setLoaderDone]);

  return (
    <>
      <ScrollProgress />
      {booting && (
        <Loader
          onDone={() => {
            setLoaderDone(true);
            // Секционные IntersectionObserver'ы стартуют только после сплэша.
            markLoaderDone();
            const hash = window.location.hash.replace("#", "");
            window.setTimeout(() => {
              setBooting(false);
              if (hash && hash !== "top") document.getElementById(hash)?.scrollIntoView({ block: "start" });
              else window.scrollTo(0, 0);
            }, 200);
          }}
        />
      )}
      <a className="skip-link" href="#content">{dict.a11y.skip}</a>
      <Header />
      <main id="content">
        <Hero />
        <Entry />
        <About />
        <Stack />
        <Projects />
        <Certificates />
        <Reviews />
        <Resume />
        <Contact />
      </main>
      <Footer />
      <Assistant />
    </>
  );
}

export function App() {
  return <Shell />;
}
