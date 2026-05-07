"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import React, { useMemo, useState } from "react";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrOguwmu54RaYHhFSOo0ybgZJ3AgHgNRDdd1dwTvkB1fsDqNHdUewN2Xgl3BtOx1ylyUPzUaJZCnqz/pub?gid=0&single=true&output=csv";

const PANEL_TRANSITION: Transition = {
  type: "tween",
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const DETAIL_TRANSITION: Transition = {
  type: "tween",
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

const SAMPLE_ROWS: any[] = [
  {
    id: "life-1903-01",
    category: "life",
    year: "1903",
    month: "",
    day: "",
    age: "01세",
    life_keyword: "출생",
    title: "충청북도 청원군 남이면 팔봉리에서 출생",
    description:
      "음력 6월 29일 낮, 충청북도 청원군 남이면 팔봉리에서 안동 김씨 집안의 둘째아들로 태어남.",
    work_title: "",
    genre: "",
    publication: "",
    source: "",
    image_url: "",
    detail: "김기진의 초기 생애 정보.",
    tags: "출생,생애",
    related_people: "",
    historical_context: "",
  },
  {
    id: "work-1920-01",
    category: "work",
    year: "1920",
    month: "4월",
    day: "2일",
    age: "18세",
    life_keyword: "대학 진학",
    title: "가련아",
    description: "시 「가련아」 발표.",
    work_title: "가련아",
    genre: "시",
    publication: "동아일보",
    source: "동아일보",
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Kim_Gijin.jpg/220px-Kim_Gijin.jpg",
    detail:
      "초기 시 발표 이력으로 정리할 수 있다. 작품 발표 시점의 생애 조건과 함께 읽으면 초기 문학 활동의 출발점을 확인할 수 있다.",
    tags: "시,초기작",
    related_people: "",
    historical_context: "1920년대 초기 문단",
  },
];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
      if (char === "\r" && next === "\n") i += 1;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows[0]?.map((v) => v.trim()) || [];

  return rows
    .slice(1)
    .map((cells) => {
      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        item[header] = (cells[index] || "").trim();
      });
      return item;
    })
    .filter((item) => item.id || item.title || item.work_title);
}

function useSheetData() {
  const [rows, setRows] = React.useState<any[]>(SAMPLE_ROWS);

  React.useEffect(() => {
    if (!SHEET_CSV_URL) return;

    fetch(`${SHEET_CSV_URL}&cacheBust=${Date.now()}`)
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseCsv(text);
        if (parsed.length) setRows(parsed);
      })
      .catch(() => setRows(SAMPLE_ROWS));
  }, []);

  return rows;
}

function onlyNumber(value: string) {
  return (
    Number(
      String(value || "")
        .replaceAll("년", "")
        .replaceAll("월", "")
        .replaceAll("일", "")
        .replace(/[^0-9]/g, "")
    ) || 0
  );
}

function sortRows(a: any, b: any) {
  if (onlyNumber(a.year) !== onlyNumber(b.year)) {
    return onlyNumber(a.year) - onlyNumber(b.year);
  }

  if (onlyNumber(a.month) !== onlyNumber(b.month)) {
    return onlyNumber(a.month) - onlyNumber(b.month);
  }

  return onlyNumber(a.day) - onlyNumber(b.day);
}

function clean(value: string) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function filterRows(rows: any[], query: string) {
  const q = clean(query);
  if (!q) return rows;

  return rows.filter((row) =>
    clean(Object.values(row).join(" ")).includes(q)
  );
}

function tags(value: string) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getPanelWidths(mode: string) {
  if (mode === "life") {
    return {
      life: "calc(100% - 300px)",
      work: "300px",
    };
  }

  if (mode === "work") {
    return {
      life: "300px",
      work: "calc(100% - 300px)",
    };
  }

  return {
    life: "50%",
    work: "50%",
  };
}

export default function Page() {
  const rows = useSheetData();

  const [mode, setMode] = useState("both");
  const [query, setQuery] = useState("");
  const [openWorkId, setOpenWorkId] = useState<string | null>(null);

  const lifeRows = useMemo(
    () => rows.filter((row: any) => row.category === "life").sort(sortRows),
    [rows]
  );

  const workRows = useMemo(
    () => rows.filter((row: any) => row.category === "work").sort(sortRows),
    [rows]
  );

  const filteredLife = useMemo(
    () => filterRows(lifeRows, query),
    [lifeRows, query]
  );

  const filteredWork = useMemo(
    () => filterRows(workRows, query),
    [workRows, query]
  );

  const years = useMemo(() => {
    const source =
      mode === "life"
        ? filteredLife
        : mode === "work"
        ? filteredWork
        : [...filteredLife, ...filteredWork];

    return Array.from(
      new Set(source.map((row: any) => row.year).filter(Boolean))
    ).sort((a: any, b: any) => onlyNumber(a) - onlyNumber(b));
  }, [mode, filteredLife, filteredWork]);

  const panelWidths = getPanelWidths(mode);

  return (
    <div className="min-h-screen bg-[#e9e6d8] text-[#191919]">
      <div className="grid min-h-screen grid-cols-[38%_62%]">
        <aside className="relative overflow-hidden bg-[#aeb9aa] px-8 py-8">
          <div className="absolute left-8 top-8 font-serif text-[10vw] font-black leading-[0.72] tracking-[-0.12em]">
            Kim
            <br />
            Gi
            <br />
            Jin
          </div>

          <div className="absolute right-8 top-12 max-w-36 text-right font-serif text-xl leading-5 tracking-[-0.06em]">
            Part of
            <br />
            Korean
            <br />
            Modern
            <br />
            Literature
          </div>

          <div className="absolute bottom-10 left-8 right-8">
            <p className="mb-4 max-w-md rotate-[-8deg] bg-[#f3efe1] px-5 py-4 text-sm leading-6 shadow-md">
              팔봉 김기진의 생애와 작품 발표 이력을 교차해 읽는 작가론 연보.
            </p>

            <div className="mt-16 font-serif text-[8vw] font-black leading-[0.75] tracking-[-0.14em]">
              팔봉
              <br />
              김기진
            </div>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-col overflow-hidden bg-[#f4f1e5]">
          <header className="flex items-start justify-between px-10 pb-7 pt-9">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-black/40">
                Chronicle / Archive
              </p>
              <div className="flex gap-8">
                <motion.button
                  animate={{ width: panelWidths.life }}
                  transition={PANEL_TRANSITION}
                  onClick={() => setMode(mode === "life" ? "both" : "life")}
                  className={`max-w-[430px] text-left font-serif text-5xl font-black leading-[0.9] tracking-[-0.09em] outline-none transition-colors ${
                    mode === "life"
                      ? "text-black"
                      : "text-black/30 hover:text-black/70"
                  }`}
                >
                  작가 생애
                </motion.button>

                <motion.button
                  animate={{ width: panelWidths.work }}
                  transition={PANEL_TRANSITION}
                  onClick={() => setMode(mode === "work" ? "both" : "work")}
                  className={`max-w-[430px] text-left font-serif text-5xl font-black leading-[0.9] tracking-[-0.09em] outline-none transition-colors ${
                    mode === "work"
                      ? "text-black"
                      : "text-black/30 hover:text-black/70"
                  }`}
                >
                  작품 연보
                </motion.button>
              </div>
            </div>

            <div className="max-w-xs text-right text-sm leading-5">
              김기진의 생애 사건과 작품 발표를 같은 시간대 위에서 병치하여,
              작가의 위치와 문학적 이동을 함께 읽는다.
            </div>
          </header>

          <main className="relative h-[calc(100vh-170px)] overflow-y-auto px-10 pb-28">
            <div className="absolute left-12 top-0 h-full border-l border-[#c779ad]/55" />
            <div className="absolute right-12 top-0 h-full border-l border-[#c779ad]/55" />

            <div className="space-y-10">
              {years.map((year: any) => (
                <YearRow
                  key={year}
                  year={year}
                  mode={mode}
                  panelWidths={panelWidths}
                  lifeRows={filteredLife.filter((row: any) => row.year === year)}
                  workRows={filteredWork.filter((row: any) => row.year === year)}
                  allLifeRows={lifeRows.filter((row: any) => row.year === year)}
                  allWorkRows={workRows.filter((row: any) => row.year === year)}
                  openWorkId={openWorkId}
                  setOpenWorkId={setOpenWorkId}
                />
              ))}
            </div>
          </main>

          <footer className="absolute bottom-0 left-0 right-0 grid grid-cols-[1fr_190px] border-t border-black/10 bg-[#f4f1e5]/90 backdrop-blur">
            <label className="flex h-20 items-center gap-4 px-10">
              <span className="text-[#c779ad]">●</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색어 입력"
                className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
              />
            </label>

            <div className="flex items-center justify-center border-l border-black/10 text-center font-serif text-2xl font-black leading-6 tracking-[-0.08em]">
              팔봉
              <br />
              김기진
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function YearRow({
  year,
  mode,
  panelWidths,
  lifeRows,
  workRows,
  allLifeRows,
  allWorkRows,
  openWorkId,
  setOpenWorkId,
}: any) {
  return (
    <section className="relative">
      <div className="mb-3 flex items-center gap-4">
        <span className="h-2 w-2 rounded-full bg-[#c779ad]" />
        <p className="font-serif text-4xl font-black tracking-[-0.08em]">
          {year}
        </p>
      </div>

      <div className="flex items-stretch gap-0 border-y border-black/10">
        <motion.div
          animate={{ width: panelWidths.life }}
          transition={PANEL_TRANSITION}
          className="overflow-hidden border-r border-black/10"
        >
          <LifePanel
            year={year}
            lifeRows={lifeRows}
            workRows={allWorkRows}
            compact={mode === "work"}
          />
        </motion.div>

        <motion.div
          animate={{ width: panelWidths.work }}
          transition={PANEL_TRANSITION}
          className="overflow-hidden"
        >
          <WorkPanel
            year={year}
            workRows={workRows}
            lifeRows={allLifeRows}
            compact={mode === "life"}
            openWorkId={openWorkId}
            setOpenWorkId={setOpenWorkId}
          />
        </motion.div>
      </div>
    </section>
  );
}

function LifePanel({ lifeRows, workRows, compact }: any) {
  if (compact) {
    return (
      <aside className="min-h-36 px-5 py-6">
        <p className="mb-3 font-serif text-xl font-black tracking-[-0.06em]">
          Life
        </p>
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <p key={row.id} className="break-keep text-sm leading-6">
              {row.life_keyword || row.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-black/35">생애 정보 없음</p>
        )}
      </aside>
    );
  }

  return (
    <div className="grid min-h-56 grid-cols-[80px_minmax(0,1fr)_160px]">
      <div className="border-r border-black/10 px-4 py-7 text-sm text-black/45">
        {lifeRows[0]?.age || workRows[0]?.age}
      </div>

      <div className="px-7 py-7">
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <article key={row.id} className="mb-7 last:mb-0">
              <p className="mb-3 font-serif text-2xl font-black tracking-[-0.07em]">
                {row.life_keyword || row.title}
              </p>
              <p className="break-keep text-[15px] leading-8">
                {row.description || row.title}
              </p>
              <TagLine row={row} />
            </article>
          ))
        ) : (
          <p className="text-sm text-black/35">생애 정보 없음</p>
        )}
      </div>

      <aside className="border-l border-black/10 px-5 py-7">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-black/35">
          Works
        </p>
        {workRows.length ? (
          workRows.map((work: any) => (
            <p
              key={work.id}
              className="mb-3 break-keep font-serif text-lg leading-6 tracking-[-0.05em]"
            >
              {work.work_title || work.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-black/35">작품 정보 없음</p>
        )}
      </aside>
    </div>
  );
}

function WorkPanel({
  workRows,
  lifeRows,
  compact,
  openWorkId,
  setOpenWorkId,
}: any) {
  if (compact) {
    return (
      <aside className="min-h-36 px-5 py-6">
        <p className="mb-3 font-serif text-xl font-black tracking-[-0.06em]">
          Works
        </p>
        {workRows.length ? (
          workRows.map((row: any) => (
            <p key={row.id} className="break-keep text-sm leading-6">
              {row.work_title || row.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-black/35">작품 정보 없음</p>
        )}
      </aside>
    );
  }

  const keyword =
    lifeRows.map((row: any) => row.life_keyword || row.title).filter(Boolean)[0] ||
    "";

  return (
    <div className="grid min-h-56 grid-cols-[80px_92px_minmax(0,1fr)_92px_130px]">
      <div className="border-r border-black/10 px-4 py-7 text-sm text-black/45">
        {workRows[0]?.age || lifeRows[0]?.age}
      </div>

      <div className="border-r border-black/10 px-4 py-7 text-sm leading-6 text-black/45">
        {keyword}
      </div>

      <div className="px-7 py-7">
        {workRows.length ? (
          workRows.map((row: any) => {
            const isOpen = openWorkId === row.id;

            return (
              <article key={row.id} className="mb-3 last:mb-0">
                <button
                  onClick={() => setOpenWorkId(isOpen ? null : row.id)}
                  className="grid w-full grid-cols-[70px_56px_minmax(0,1fr)] text-left text-[15px] leading-7 outline-none transition hover:translate-x-1"
                >
                  <span className="text-black/45">{row.month}</span>
                  <span className="text-black/45">{row.day}</span>
                  <span className="font-serif text-xl font-black tracking-[-0.06em]">
                    {row.work_title || row.title}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && <WorkDetail row={row} />}
                </AnimatePresence>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-black/35">작품 정보 없음</p>
        )}
      </div>

      <div className="border-l border-black/10 px-3 py-7 text-center text-sm leading-7">
        {workRows.map((row: any) => (
          <p key={`${row.id}-genre`}>{row.genre}</p>
        ))}
      </div>

      <div className="border-l border-black/10 px-4 py-7 text-center text-sm leading-7">
        {workRows.map((row: any) => (
          <p key={`${row.id}-pub`}>{row.publication || row.source}</p>
        ))}
      </div>
    </div>
  );
}

function WorkDetail({ row }: any) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={DETAIL_TRANSITION}
      className="overflow-hidden"
    >
      <div className="my-5 grid gap-6 border-l-2 border-[#c779ad] bg-[#efe9dc] p-5 md:grid-cols-[120px_1fr]">
        <div className="h-44 w-28 overflow-hidden bg-white">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.work_title || row.title}
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-xs text-black/35">
              이미지
              <br />
              없음
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-serif text-3xl font-black tracking-[-0.08em]">
            {row.work_title || row.title}
          </p>

          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-black/40">
            {[row.genre, row.publication || row.source].filter(Boolean).join(" · ")}
          </p>

          <p className="break-keep text-sm leading-8">
            {row.detail || row.description}
          </p>

          <div className="mt-5 space-y-2 text-sm text-black/60">
            {row.related_people && (
              <p>
                <span className="mr-2 font-bold text-black">관련 인물</span>
                {row.related_people}
              </p>
            )}

            {row.historical_context && (
              <p>
                <span className="mr-2 font-bold text-black">역사 맥락</span>
                {row.historical_context}
              </p>
            )}
          </div>

          <TagLine row={row} boxed />
        </div>
      </div>
    </motion.div>
  );
}

function TagLine({ row, boxed = false }: any) {
  const list = tags(row.tags);

  if (!list.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      {list.map((tag) => (
        <span
          key={tag}
          className={
            boxed
              ? "border border-black/15 bg-[#f4f1e5] px-2 py-1"
              : "text-black/35"
          }
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}