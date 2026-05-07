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

    const url = `${SHEET_CSV_URL}&cacheBust=${Date.now()}`;

    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseCsv(text);
        if (parsed.length) setRows(parsed);
      })
      .catch(() => {
        setRows(SAMPLE_ROWS);
      });
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
      life: "calc(100% - 280px)",
      work: "280px",
    };
  }

  if (mode === "work") {
    return {
      life: "280px",
      work: "calc(100% - 280px)",
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
    <div className="min-h-screen bg-[#f7f3ea] text-[#191919]">
      <div className="relative min-h-screen overflow-hidden px-6 pb-28 pt-6">
        <header className="flex border-b border-[#d8d1c3]">
          <motion.button
            animate={{ width: panelWidths.life }}
            transition={PANEL_TRANSITION}
            onClick={() => setMode(mode === "life" ? "both" : "life")}
            className={`border-r border-[#d8d1c3] pb-5 pr-6 text-left font-serif text-4xl tracking-[-0.04em] outline-none transition-colors hover:text-black ${
              mode === "life" ? "font-bold text-black" : "font-normal text-[#777]"
            }`}
          >
            작가 생애
          </motion.button>

          <motion.button
            animate={{ width: panelWidths.work }}
            transition={PANEL_TRANSITION}
            onClick={() => setMode(mode === "work" ? "both" : "work")}
            className={`pb-5 pl-8 text-left font-serif text-4xl tracking-[-0.04em] outline-none transition-colors hover:text-black ${
              mode === "work" ? "font-bold text-black" : "font-normal text-[#777]"
            }`}
          >
            작품 연보
          </motion.button>
        </header>

        <main className="h-[calc(100vh-142px)] overflow-y-auto">
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
        </main>

        <footer className="fixed bottom-0 left-0 right-0 grid grid-cols-[1fr_190px] border-t border-[#d8d1c3] bg-[#f7f3ea]/95 backdrop-blur">
          <label className="flex h-20 items-center gap-4 px-8 text-lg">
            <span className="text-[#999]">|</span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어 입력"
              className="w-full bg-transparent outline-none placeholder:text-[#aaa]"
            />
          </label>

          <div className="flex items-center justify-center border-l border-[#d8d1c3] text-center font-serif text-2xl font-bold leading-7 tracking-[-0.05em]">
            팔봉
            <br />
            김기진
          </div>
        </footer>
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
    <section className="flex items-stretch border-b border-[#d8d1c3]">
      <motion.div
        animate={{ width: panelWidths.life }}
        transition={PANEL_TRANSITION}
        className="overflow-hidden border-r border-[#d8d1c3] will-change-[width]"
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
        className="overflow-hidden will-change-[width]"
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
    </section>
  );
}

function LifePanel({ year, lifeRows, workRows, compact }: any) {
  const representative = lifeRows[0] || workRows[0] || {};

  if (compact) {
    return (
      <aside className="relative grid h-full min-h-32 grid-cols-[78px_1fr] items-stretch">
        <div className="h-full border-r border-[#d8d1c3] px-3 py-6 font-serif text-lg text-[#888]">
          {year}
        </div>

        <div className="px-4 py-6 text-sm">
          <p className="mb-2 font-bold">생애</p>

          {lifeRows.length ? (
            lifeRows.map((row: any) => (
              <p key={row.id} className="leading-6 text-[#555]">
                {row.life_keyword || row.title}
              </p>
            ))
          ) : (
            <p className="text-[#aaa]">생애 정보 없음</p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <div className="relative grid h-full min-h-48 grid-cols-[96px_78px_minmax(0,1fr)_180px] items-stretch">
      <div className="pointer-events-none absolute left-5 top-4 font-serif text-6xl font-bold leading-none tracking-[-0.08em] text-[#e8e0d2]">
        {year}
      </div>

      <div className="relative h-full border-r border-[#d8d1c3] px-3 py-8 font-serif text-lg text-[#777]">
        {year}
      </div>

      <div className="h-full border-r border-[#d8d1c3] px-3 py-8 text-sm text-[#777]">
        {representative.age}
      </div>

      <div className="px-8 py-8">
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <article
              key={row.id}
              className="group mb-8 rounded-xl transition-colors last:mb-0 hover:bg-white/50"
            >
              <p className="mb-3 text-sm font-bold text-[#222]">
                {row.life_keyword}
              </p>

              <p className="text-[15px] leading-8 text-[#333]">
                {row.description || row.title}
              </p>

              <TagLine row={row} />
            </article>
          ))
        ) : (
          <p className="text-sm text-[#aaa]">생애 정보 없음</p>
        )}
      </div>

      <aside className="h-full border-l border-[#d8d1c3] px-5 py-8">
        <p className="mb-4 text-xs font-bold text-[#888]">같은 해 작품</p>

        {workRows.length ? (
          workRows.map((work: any) => (
            <p
              key={work.id}
              className="mb-3 break-keep text-sm leading-6 text-[#555]"
            >
              {work.work_title || work.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#aaa]">작품 정보 없음</p>
        )}
      </aside>
    </div>
  );
}

function WorkPanel({
  year,
  workRows,
  lifeRows,
  compact,
  openWorkId,
  setOpenWorkId,
}: any) {
  const representative = workRows[0] || lifeRows[0] || {};
  const keyword =
    lifeRows.map((row: any) => row.life_keyword || row.title).filter(Boolean)[0] ||
    "";

  if (compact) {
    return (
      <aside className="grid h-full min-h-32 grid-cols-[78px_1fr] items-stretch">
        <div className="h-full border-r border-[#d8d1c3] px-3 py-6 font-serif text-lg text-[#888]">
          {year}
        </div>

        <div className="px-4 py-6 text-sm">
          <p className="mb-2 font-bold">작품</p>

          {workRows.length ? (
            workRows.map((row: any) => (
              <p key={row.id} className="leading-6 text-[#555]">
                {row.work_title || row.title}
              </p>
            ))
          ) : (
            <p className="text-[#aaa]">작품 정보 없음</p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <div className="grid h-full min-h-48 grid-cols-[96px_78px_88px_minmax(0,1fr)_104px_150px] items-stretch">
      <div className="h-full border-r border-[#d8d1c3] px-3 py-8 font-serif text-lg text-[#777]">
        {year}
      </div>

      <div className="h-full border-r border-[#d8d1c3] px-3 py-8 text-sm text-[#777]">
        {representative.age}
      </div>

      <div className="h-full border-r border-[#d8d1c3] px-3 py-8 text-sm leading-6 text-[#777]">
        {keyword}
      </div>

      <div className="h-full px-6 py-8">
        {workRows.length ? (
          workRows.map((row: any) => {
            const isOpen = openWorkId === row.id;

            return (
              <article key={row.id} className="mb-3 last:mb-0">
                <button
                  onClick={() => setOpenWorkId(isOpen ? null : row.id)}
                  className={`grid w-full grid-cols-[72px_64px_minmax(0,1fr)] rounded-lg px-2 py-1 text-left text-[15px] leading-7 outline-none transition-colors hover:bg-white/70 ${
                    isOpen ? "bg-white/70 font-bold" : ""
                  }`}
                >
                  <span className="text-[#777]">{row.month}</span>
                  <span className="text-[#777]">{row.day}</span>
                  <span>{row.work_title || row.title}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && <WorkDetail row={row} />}
                </AnimatePresence>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-[#aaa]">작품 정보 없음</p>
        )}
      </div>

      <div className="h-full border-l border-[#d8d1c3] px-3 py-8 text-center text-sm leading-7 text-[#666]">
        {workRows.map((row: any) => (
          <p key={`${row.id}-genre`}>{row.genre}</p>
        ))}
      </div>

      <div className="h-full border-l border-[#d8d1c3] px-4 py-8 text-center text-sm leading-7 text-[#666]">
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
      initial={{ height: 0, opacity: 0, y: -8 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -8 }}
      transition={DETAIL_TRANSITION}
      className="overflow-hidden"
    >
      <div className="my-4 grid gap-6 rounded-2xl border border-[#d8d1c3] bg-white/75 p-5 shadow-sm md:grid-cols-[130px_1fr]">
        <div className="h-44 w-28 overflow-hidden border border-[#d8d1c3] bg-[#f7f3ea]">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.work_title || row.title}
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-xs text-[#999]">
              이미지
              <br />
              없음
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 grid grid-cols-[1fr_80px_140px] gap-4 border-b border-[#d8d1c3] pb-3 text-sm">
            <p className="font-bold">{row.work_title || row.title}</p>

            <p className="text-[#666]">{row.genre}</p>

            <p className="text-[#666]">{row.publication || row.source}</p>
          </div>

          <p className="text-sm leading-7 text-[#333]">
            {row.detail || row.description}
          </p>

          <div className="mt-5 space-y-2 text-sm text-[#555]">
            {row.related_people && (
              <p>
                <span className="mr-2 font-bold text-[#222]">관련 인물</span>
                {row.related_people}
              </p>
            )}

            {row.historical_context && (
              <p>
                <span className="mr-2 font-bold text-[#222]">역사 맥락</span>
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
              ? "rounded-full border border-[#d8d1c3] bg-[#f7f3ea] px-2 py-1 text-[#555]"
              : "text-[#777]"
          }
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}