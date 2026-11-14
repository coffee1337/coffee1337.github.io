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
import { Reviews } from "./components/Reviews/Reviews";
import { Contact } from "./components/Contact/Contact";
import { Resume } from "./components/Resume/Resume";
import { Footer } from "./components/Footer/Footer";
import { ScrollProgress } from "./components/Progress/ScrollProgress";
import { Assistant } from "./components/Assistant/Assistant";

function Shell() {
  const { loaderDone, setLoaderDone, setOrbMode } = useSite();
  const [booting, setBooting] = useState(false);
  useSmoothScroll(loaderDone);

  useEffect(() => {
    setBooting(true);
  }, []);

  return (
    <>
      <ScrollProgress />
      {booting && (
        <Loader
          onDone={() => {
            setOrbMode("hero");
            setLoaderDone(true);
            const hash = window.location.hash.replace("#", "");
            window.setTimeout(() => {
              setBooting(false);
              if (hash && hash !== "top") document.getElementById(hash)?.scrollIntoView({ block: "start" });
              else window.scrollTo(0, 0);
            }, 200);
          }}
        />
      )}
      <Header />
      <main id="content">
        <Hero />
        <Entry />
        <About />
        <Stack />
        <Projects />
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
