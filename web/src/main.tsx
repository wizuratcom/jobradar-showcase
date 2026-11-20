import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Archive, RotateCcw, BriefcaseBusiness } from "lucide-react";
import { Badge, Button, Card } from "./ui";
import "./styles.css";

type Status = "new" | "interested" | "applied" | "interview" | "archived";
type Analysis = {
  score: number;
  conclusion: "strong_fit" | "worth_considering" | "weak_fit";
  summary: string;
  strengths: string[];
  risks: string[];
  unverified: string[];
};
type Vacancy = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  status: Status;
  analysis: Analysis;
};
type Profile = {
  name: string;
  role: string;
  core_skills: string[];
  secondary_skills: string[];
  languages: string[];
  projects: { title: string; detail: string }[];
};
const labels = {
  strong_fit: "Strong fit",
  worth_considering: "Worth considering",
  weak_fit: "Weak fit",
};
const tones = {
  strong_fit: "green",
  worth_considering: "yellow",
  weak_fit: "red",
} as const;
const statuses: Status[] = [
  "new",
  "interested",
  "applied",
  "interview",
  "archived",
];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok)
    throw new Error(
      `Request failed (${response.status}). Start the demo backend and retry.`,
    );
  return response.json();
}

function App() {
  const [items, setItems] = useState<Vacancy[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"vacancies" | "profile" | "normalizer">(
    "vacancies",
  );
  const [detailTab, setDetailTab] = useState<"analysis" | "source">("analysis");
  const [query, setQuery] = useState("");
  const [archive, setArchive] = useState(false);
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(
    "<p>Python &amp; PostgreSQL</p><p>Remote work</p>",
  );
  const [normalized, setNormalized] = useState("");
  useEffect(() => {
    Promise.all([
      request<Vacancy[]>("/vacancies"),
      request<Profile>("/profile"),
    ])
      .then(([jobs, candidate]) => {
        setItems(jobs);
        setProfile(candidate);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const active = items.find((item) => item.id === selected);
  async function update(item: Vacancy, status: string) {
    setBusy(true);
    setError("");
    try {
      const updated = await request<Vacancy>(`/vacancies/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4"
          aria-label="Main navigation"
        >
          <span className="mr-6 flex items-center gap-2 font-bold text-cyan-300">
            <BriefcaseBusiness size={20} />
            JobRadar
          </span>
          {(["vacancies", "profile", "normalizer"] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setSelected(null);
              }}
              className={`rounded px-3 py-2 text-sm capitalize ${tab === value ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              {value}
            </button>
          ))}
          <span className="ml-auto text-xs text-amber-300">
            Synthetic demo · no AI calls
          </span>
        </nav>
      </header>
      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-8">
        {error && (
          <p
            role="alert"
            className="rounded border border-red-800 bg-red-950/30 p-4"
          >
            {error}
          </p>
        )}
        {loading && <p role="status">Loading demo…</p>}
        {tab === "vacancies" && !active && (
          <>
            <div>
              <p className="text-sm text-cyan-300">Job search workspace</p>
              <h1 className="mt-1 text-3xl font-bold">Your next opportunity</h1>
              <p className="mt-2 text-sm text-slate-400">
                Explore saved analysis, compare opportunities and track
                applications.
              </p>
            </div>
            <Card className="flex flex-wrap gap-4 p-4">
              <label className="min-w-48 flex-1">
                Search
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title or company"
                />
              </label>
              <label>
                Queue
                <select
                  aria-label="Queue"
                  value={String(archive)}
                  onChange={(e) => setArchive(e.target.value === "true")}
                >
                  <option value="false">Active vacancies</option>
                  <option value="true">Archive</option>
                </select>
              </label>
              <label>
                Sort
                <select
                  aria-label="Sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="score">Best fit first</option>
                </select>
              </label>
            </Card>
            {items
              .filter(
                (item) =>
                  (item.status === "archived") === archive &&
                  `${item.title} ${item.company}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .sort((a, b) =>
                sort === "score"
                  ? b.analysis.score - a.analysis.score
                  : b.id - a.id,
              )
              .map((item) => (
                <Card
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      setSelected(item.id);
                      setDetailTab("analysis");
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{item.title}</h2>
                      <Badge tone={tones[item.analysis.conclusion]}>
                        {labels[item.analysis.conclusion]}
                      </Badge>
                      <Badge
                        tone={item.status === "applied" ? "green" : "blue"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.company} · {item.location}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{item.salary}</p>
                  </button>
                  <span
                    className={`text-3xl font-bold ${item.analysis.conclusion === "strong_fit" ? "text-emerald-300" : item.analysis.conclusion === "weak_fit" ? "text-red-300" : "text-amber-300"}`}
                  >
                    {item.analysis.score}
                  </span>
                  <button
                    disabled={busy}
                    aria-label={`${archive ? "Restore" : "Archive"} ${item.title}`}
                    onClick={() =>
                      void update(item, archive ? "restore" : "archived")
                    }
                    className="rounded p-3 text-slate-400 hover:bg-slate-800"
                  >
                    {archive ? <RotateCcw size={18} /> : <Archive size={18} />}
                  </button>
                </Card>
              ))}
            {!loading &&
              !items.some(
                (item) =>
                  (item.status === "archived") === archive &&
                  `${item.title} ${item.company}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              ) && (
                <Card className="p-8 text-center text-slate-400">
                  No vacancies in this view.
                </Card>
              )}
          </>
        )}
        {tab === "vacancies" && active && (
          <>
            <button
              className="flex items-center gap-2 text-sm text-cyan-300"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft size={16} />
              Back to vacancies
            </button>
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-cyan-300">{active.company}</p>
                <h1 className="mt-1 text-2xl font-bold">{active.title}</h1>
                <p className="mt-2 text-sm text-slate-400">{active.location}</p>
              </div>
              <label>
                Status
                <select
                  aria-label="Status"
                  disabled={busy}
                  value={active.status}
                  onChange={(e) => void update(active, e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </Card>
            <div
              role="tablist"
              aria-label="Vacancy details"
              className="flex gap-2 border-b border-slate-800 pb-3"
            >
              {(["analysis", "source"] as const).map((value) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={detailTab === value}
                  onClick={() => setDetailTab(value)}
                  className={`rounded px-4 py-2 text-sm ${detailTab === value ? "bg-cyan-400 text-slate-950" : "text-slate-400"}`}
                >
                  {value === "analysis" ? "Vacancy analysis" : "Source vacancy"}
                </button>
              ))}
            </div>
            {detailTab === "analysis" ? (
              <>
                <Card className="p-5">
                  <p className="text-sm text-cyan-300">
                    Saved fit analysis · synthetic example
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <p className="text-4xl font-bold text-cyan-300">
                      {active.analysis.score} / 100
                    </p>
                    <Badge tone={tones[active.analysis.conclusion]}>
                      {labels[active.analysis.conclusion]}
                    </Badge>
                  </div>
                  <h2 className="mt-5 font-semibold">Summary</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {active.analysis.summary}
                  </p>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <FactList
                    title="Top strengths"
                    items={active.analysis.strengths}
                    positive
                  />
                  <FactList title="Main risks" items={active.analysis.risks} />
                </div>
                <FactList
                  title="Not confirmed by your profile"
                  items={active.analysis.unverified}
                />
              </>
            ) : (
              <Card className="p-5">
                <h2 className="font-semibold">Original vacancy</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
                  {active.description}
                </p>
              </Card>
            )}
          </>
        )}
        {tab === "profile" && profile && (
          <>
            <div>
              <p className="text-sm text-cyan-300">
                Candidate profile · invented example
              </p>
              <h1 className="mt-2 text-3xl font-bold">{profile.name}</h1>
              <p className="mt-2 text-slate-400">{profile.role}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FactList
                title="Core skills"
                items={profile.core_skills}
                positive
              />
              <FactList
                title="Secondary skills"
                items={profile.secondary_skills}
                positive
              />
              <FactList title="Languages" items={profile.languages} />
              <Card className="p-5">
                <h2 className="font-semibold">Projects & evidence</h2>
                {profile.projects.map((project) => (
                  <div key={project.title} className="mt-4">
                    <p className="text-cyan-300">{project.title}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {project.detail}
                    </p>
                  </div>
                ))}
              </Card>
            </div>
          </>
        )}
        {tab === "normalizer" && (
          <Card className="p-5">
            <h1 className="text-2xl font-bold">Source text normalizer</h1>
            <p className="mt-2 text-sm text-slate-400">
              A real backend utility extracted from JobRadar. HTML is converted
              to readable text.
            </p>
            <form
              className="mt-5 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                try {
                  const result = await request<{ text: string }>("/normalize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: source }),
                  });
                  setNormalized(result.text);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Source HTML or text
                <textarea
                  maxLength={20000}
                  rows={5}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </label>
              <Button disabled={busy}>Normalize text</Button>
            </form>
            {normalized && (
              <pre className="mt-5 whitespace-pre-wrap rounded bg-slate-800 p-4 text-sm">
                {normalized}
              </pre>
            )}
          </Card>
        )}
        <footer className="mt-4 border-t border-slate-800 pt-5 text-xs leading-6 text-slate-500">
          Portfolio edition. All employers, vacancies, candidate facts and
          assessments are invented. Workflow changes are stored in local SQLite.
          The private product's AI prompts, scoring pipeline and evidence
          selection are not included.
        </footer>
      </main>
    </div>
  );
}
function FactList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li
            key={item}
            className={`text-sm leading-6 ${positive ? "text-emerald-200" : "text-slate-300"}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
