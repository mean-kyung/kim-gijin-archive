"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import React, { useMemo, useState } from "react";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrOguwmu54RaYHhFSOo0ybgZJ3AgHgNRDdd1dwTvkB1fsDqNHdUewN2Xgl3BtOx1ylyUPzUaJZCnqz/pub?gid=0&single=true&output=csv";

const PANEL_TRANSITION: Transition = {
  type: "tween",
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

const DETAIL_TRANSITION: Transition = {
  type: "tween",
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

const SAMPLE_ROWS: any[] = [];

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
    fetch(`${SHEET_CSV_URL}&cacheBust=${Date.now()}`)
      .then((res) => res.text())
      .then((text) => setRows(parseCsv(text)))
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
  return rows.filter((row) => clean(Object.values(row).join(" ")).includes(q));
}

function tags(value: string) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getPanelWidths(mode: string) {
  if (mode === "life") return { life: "64%", work: "36%" };
  if (mode === "work") return { life: "36%", work: "64%" };
  return { life: "50%", work: "50%" };
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
    <div className="h-screen bg-[#151515] p-3 font-['Noto_Sans_KR','Noto_Sans',Arial,sans-serif] text-[#111]">
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <main className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          <motion.section
            animate={{ width: panelWidths.life }}
            transition={PANEL_TRANSITION}
            className="min-w-0"
          >
            <ArchiveCard
              title="Information"
              heading="작가 생애"
              active={mode === "life"}
              tone="pink"
              onTitleClick={() => setMode(mode === "life" ? "both" : "life")}
            >
              <TimelineList
                type="life"
                years={years}
                lifeRows={filteredLife}
                workRows={workRows}
                mode={mode}
                openWorkId={openWorkId}
                setOpenWorkId={setOpenWorkId}
              />
            </ArchiveCard>
          </motion.section>

          <motion.section
            animate={{ width: panelWidths.work }}
            transition={PANEL_TRANSITION}
            className="min-w-0"
          >
            <ArchiveCard
              title="Select Work"
              heading="작품 연보"
              active={mode === "work"}
              tone="ivory"
              onTitleClick={() => setMode(mode === "work" ? "both" : "work")}
            >
              <TimelineList
                type="work"
                years={years}
                lifeRows={lifeRows}
                workRows={filteredWork}
                mode={mode}
                openWorkId={openWorkId}
                setOpenWorkId={setOpenWorkId}
              />
            </ArchiveCard>
          </motion.section>
        </main>

        <SearchCard query={query} setQuery={setQuery} />
      </div>
    </div>
  );
}

function ArchiveCard({
  title,
  heading,
  active,
  tone,
  onTitleClick,
  children,
}: {
  title: string;
  heading: string;
  active: boolean;
  tone: "pink" | "ivory";
  onTitleClick: () => void;
  children: React.ReactNode;
}) {
  const bg = tone === "pink" ? "bg-[#f4cdcf]" : "bg-[#f5f0ed]";

  return (
    <div className={`relative h-full overflow-hidden rounded-[22px] border-2 border-black ${bg}`}>
      <div className="absolute left-4 top-4 z-30 h-3.5 w-3.5 rounded-full bg-black" />
      <div className="absolute right-4 top-4 z-30 h-3.5 w-3.5 rounded-full bg-black" />

      <button
        onClick={onTitleClick}
        className="sticky top-0 z-20 flex h-12 w-full items-center justify-center border-b border-black/70 bg-inherit text-[15px] outline-none"
      >
        <span className={active ? "font-semibold" : "font-normal"}>{title}</span>
      </button>

      <div className="border-b border-black/70 px-6 py-7 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{heading}</h1>
      </div>

      <div className="h-[calc(100%-121px)] overflow-y-auto px-6 pb-8 pt-5">
        {children}
      </div>
    </div>
  );
}

function SearchCard({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <footer className="grid h-20 shrink-0 grid-cols-[1fr_220px] overflow-hidden rounded-[22px] border-2 border-black bg-[#f5f0ed]">
      <label className="flex items-center gap-4 px-7">
        <span className="h-3.5 w-3.5 rounded-full bg-black" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사건이나 작품 검색"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-black/35"
        />
      </label>

      <div className="flex items-center justify-center border-l border-black text-center text-[17px] font-semibold">
        팔봉 김기진
      </div>
    </footer>
  );
}

function TimelineList({
  type,
  years,
  lifeRows,
  workRows,
  mode,
  openWorkId,
  setOpenWorkId,
}: any) {
  return (
    <div>
      {years.map((year: string) => {
        const life = lifeRows.filter((row: any) => row.year === year);
        const works = workRows.filter((row: any) => row.year === year);

        return (
          <section key={`${type}-${year}`} className="border-b border-black py-5">
            <div className="mb-5 grid grid-cols-[76px_1fr] gap-3">
              <p className="text-[22px] font-semibold tracking-[-0.04em]">
                {year}
              </p>
              <p className="pt-1 text-[13px] leading-5 text-black/55">
                {life[0]?.life_keyword || works[0]?.life_keyword || "기록 없음"}
              </p>
            </div>

            {type === "life" ? (
              <LifeContent lifeRows={life} workRows={works} compact={mode === "work"} />
            ) : (
              <WorkContent
                workRows={works}
                lifeRows={life}
                compact={mode === "life"}
                openWorkId={openWorkId}
                setOpenWorkId={setOpenWorkId}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

function LifeContent({ lifeRows, workRows, compact }: any) {
  if (compact) {
    return (
      <div className="space-y-2 text-[14px] leading-6">
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <p key={row.id}>{row.life_keyword || row.title}</p>
          ))
        ) : (
          <p className="text-black/35">생애 정보 없음</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_180px]">
      <div>
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <article key={row.id} className="mb-6 last:mb-0">
              <p className="mb-2 text-[17px] font-semibold">
                {row.life_keyword || row.title}
              </p>
              <p className="break-keep text-[15px] leading-7">
                {row.description || row.title}
              </p>
              <TagLine row={row} />
            </article>
          ))
        ) : (
          <p className="text-[14px] text-black/35">생애 정보 없음</p>
        )}
      </div>

      <aside className="border-l border-black pl-4">
        <p className="mb-3 text-[12px] font-semibold">같은 해 작품</p>
        {workRows.length ? (
          workRows.map((work: any) => (
            <p key={work.id} className="mb-3 break-keep text-[14px] leading-5">
              {work.work_title || work.title}
            </p>
          ))
        ) : (
          <p className="text-[14px] text-black/35">-</p>
        )}
      </aside>
    </div>
  );
}

function WorkContent({
  workRows,
  lifeRows,
  compact,
  openWorkId,
  setOpenWorkId,
}: any) {
  if (compact) {
    return (
      <div className="space-y-2 text-[14px] leading-6">
        {workRows.length ? (
          workRows.map((row: any) => (
            <p key={row.id}>{row.work_title || row.title}</p>
          ))
        ) : (
          <p className="text-black/35">작품 정보 없음</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {workRows.length ? (
        workRows.map((row: any) => {
          const isOpen = openWorkId === row.id;

          return (
            <article key={row.id} className="border-b border-black py-4 last:border-b-0">
              <button
                onClick={() => setOpenWorkId(isOpen ? null : row.id)}
                className="grid w-full grid-cols-[54px_46px_minmax(0,1fr)_64px_110px] items-start gap-3 text-left text-[14px] outline-none"
              >
                <span>{row.month}</span>
                <span>{row.day}</span>
                <span className="font-semibold">{row.work_title || row.title}</span>
                <span>{row.genre}</span>
                <span>{row.publication || row.source}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && <WorkDetail row={row} lifeRows={lifeRows} />}
              </AnimatePresence>
            </article>
          );
        })
      ) : (
        <p className="text-[14px] text-black/35">작품 정보 없음</p>
      )}
    </div>
  );
}

function WorkDetail({ row, lifeRows }: any) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={DETAIL_TRANSITION}
      className="overflow-hidden"
    >
      <div className="mt-4 grid gap-5 bg-[#f7d6d8] p-5 md:grid-cols-[110px_1fr]">
        <div className="h-40 w-28 overflow-hidden border border-black bg-white">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.work_title || row.title}
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-[12px] text-black/40">
              이미지
              <br />
              없음
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[18px] font-semibold">
            {row.work_title || row.title}
          </p>

          <p className="mb-4 text-[12px] uppercase tracking-[0.12em] text-black/50">
            {[row.genre, row.publication || row.source].filter(Boolean).join(" · ")}
          </p>

          <p className="break-keep text-[14px] leading-7">
            {row.detail || row.description}
          </p>

          <div className="mt-4 space-y-2 text-[13px] text-black/65">
            {lifeRows?.[0]?.life_keyword && (
              <p>
                <span className="mr-2 font-semibold">동시기 생애</span>
                {lifeRows[0].life_keyword}
              </p>
            )}

            {row.related_people && (
              <p>
                <span className="mr-2 font-semibold">관련 인물</span>
                {row.related_people}
              </p>
            )}

            {row.historical_context && (
              <p>
                <span className="mr-2 font-semibold">역사 맥락</span>
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
    <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
      {list.map((tag) => (
        <span
          key={tag}
          className={
            boxed
              ? "rounded-full border border-black px-3 py-1"
              : "text-black/45"
          }
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}