import { useSite } from "../../context/site";
import { SECTION_ORDER } from "../../context/SiteProvider";

const TOTAL = SECTION_ORDER.length;

export function ScrollProgress() {
  const { sectionIndex, reduced } = useSite();
  const n = sectionIndex < 0 ? 0 : sectionIndex;
  const label = `${String(Math.min(TOTAL, n + 1)).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}`;
  const scale = (n + 1) / TOTAL;

  return (
    <>
      <div className="progress-line" aria-hidden>
        <span style={{ transform: reduced ? `scaleX(${scale})` : `scaleX(${scale})` }} />
      </div>
      <p className="progress-index mono" aria-hidden>
        {label}
      </p>
    </>
  );
}
