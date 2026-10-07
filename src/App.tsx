import { useState } from "react";
import { SiteProvider } from "./context/SiteProvider";
import { useSite } from "./context/site";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { Header } from "./components/Header/Header";
import { Loader } from "./components/Loader/Loader";
import { Hero } from "./components/Hero/Hero";
import { About } from "./components/About/About";
import { Capabilities } from "./components/Capabilities/Capabilities";
import { Experience } from "./components/Experience/Experience";
import { Projects } from "./components/Projects/Projects";
import { Stack } from "./components/Stack/Stack";
import { Resume } from "./components/Resume/Resume";
import { Education } from "./components/Education/Education";
import { Contact } from "./components/Contact/Contact";
import { Footer } from "./components/Footer/Footer";
import { ScrollProgress } from "./components/Progress/ScrollProgress";

function Shell() {
  const { loaderDone, setLoaderDone, setOrbMode } = useSite();
  const [booting, setBooting] = useState(true);
  useSmoothScroll(loaderDone);

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
            }, 480);
          }}
        />
      )}
      <Header />
      <main id="content">
        <Hero />
        <About />
        <Capabilities />
        <Experience />
        <Projects />
        <Stack />
        <Resume />
        <Education />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export function App() {
  return (
    <SiteProvider>
      <Shell />
    </SiteProvider>
  );
}
