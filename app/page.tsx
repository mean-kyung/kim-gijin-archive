"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import React, { useMemo, useState } from "react";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrOguwmu54RaYHhFSOo0ybgZJ3AgHgNRDdd1dwTvkB1fsDqNHdUewN2Xgl3BtOx1ylyUPzUaJZCnqz/pub?gid=0&single=true&output=csv";

const PANEL_TRANSITION: Transition = {
  type: "tween",
  duration: 0.5,
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
    return { life: "68%", work: "32%" };
  }

  if (mode === "work") {
    return { life: "32%", work: "68%" };
  }

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
    <div className="min-h-screen bg-[#141414] p-2 text-[#111]">
      <main className="grid h-[calc(100vh-16px)] grid-cols-[1fr_1fr] grid-rows-[1fr_136px] gap-2 overflow-hidden">
        <motion.section
          animate={{ width: panelWidths.life }}
          transition={PANEL_TRANSITION}
          className="col-start-1 row-start-1 row-span-1 min-w-0"
        >
          <CardShell
            title="Writer Life"
            active={mode === "life"}
            onClick={() => setMode(mode === "life" ? "both" : "life")}
            className="h-full bg-[#f6cfd2]"
          >
            <LifeHero compact={mode === "work"} />
            <TimelineList
              type="life"
              years={years}
              lifeRows={filteredLife}
              workRows={workRows}
              mode={mode}
              openWorkId={openWorkId}
              setOpenWorkId={setOpenWorkId}
            />
          </CardShell>
        </motion.section>

        <motion.section
          animate={{ width: panelWidths.work }}
          transition={PANEL_TRANSITION}
          className="col-start-2 row-start-1 row-span-2 min-w-0"
        >
          <CardShell
            title="Select Work"
            active={mode === "work"}
            onClick={() => setMode(mode === "work" ? "both" : "work")}
            className="h-full bg-[#f3eeee]"
          >
            <WorkHero compact={mode === "life"} />
            <TimelineList
              type="work"
              years={years}
              lifeRows={lifeRows}
              workRows={filteredWork}
              mode={mode}
              openWorkId={openWorkId}
              setOpenWorkId={setOpenWorkId}
            />
          </CardShell>
        </motion.section>

        <section className="col-start-1 row-start-2 grid grid-cols-[190px_1fr] gap-2">
          <div className="relative overflow-hidden rounded-[18px] border-2 border-black bg-[#f6cfd2]">
            <div className="absolute left-4 top-4 h-4 w-4 rounded-full bg-black" />
            <div className="absolute right-4 top-4 h-4 w-4 rounded-full bg-black" />
            <div className="flex h-full items-center justify-center font-serif text-[8rem] font-black leading-none tracking-[-0.18em]">
              ㄱ
            </div>
          </div>

          <div className="relative rounded-[18px] border-2 border-black bg-[#f6cfd2] px-6 py-5">
            <div className="absolute left-4 top-4 h-4 w-4 rounded-full bg-black" />
            <div className="absolute right-4 top-4 h-4 w-4 rounded-full bg-black" />
            <p className="mb-4 text-center text-sm">Search Archive</p>
            <label className="flex items-center gap-3 rounded-full border border-black px-5 py-3">
              <span className="text-sm">●</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="사건이나 작품 검색"
                className="w-full bg-transparent text-sm outline-none placeholder:text-black/40"
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}

function CardShell({
  title,
  active,
  onClick,
  className,
  children,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border-2 border-black ${className}`}
    >
      <button
        onClick={onClick}
        className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-center text-sm outline-none"
      >
        <span className={active ? "font-bold" : "font-normal"}>{title}</span>
      </button>

      <div className="absolute left-4 top-4 z-30 h-4 w-4 rounded-full bg-black" />
      <div className="absolute right-4 top-4 z-30 h-4 w-4 rounded-full bg-black" />

      <div className="h-full overflow-y-auto px-6 pb-8 pt-16">{children}</div>
    </div>
  );
}

function LifeHero({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="mb-8 pt-6 text-center">
        <p className="font-serif text-4xl font-black tracking-[-0.1em]">
          Life
        </p>
      </div>
    );
  }

  return (
    <section className="flex min-h-[42vh] items-center justify-center text-center">
      <div>
        <p className="mb-5 text-sm">Information</p>
        <h1 className="font-serif text-[5.4vw] font-black leading-[0.92] tracking-[-0.12em]">
          Palbong
          <br />
          Kim Gijin
          <br />
          Chronicle
        </h1>
        <p className="mx-auto mt-8 max-w-md text-base leading-7">
          작가 김기진의 생애 사건을 작품 발표 연보와 나란히 배치하여
          문학적 이동과 시대적 조건을 함께 읽는다.
        </p>
      </div>
    </section>
  );
}

function WorkHero({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="mb-8 pt-6 text-center">
        <p className="font-serif text-4xl font-black tracking-[-0.1em]">
          Works
        </p>
      </div>
    );
  }

  return (
    <section className="mb-12 mt-28">
      <p className="mb-5 max-w-xl text-2xl leading-7">
        작품을 선택하면 발표 매체, 장르, 관련 인물과 문학사적 맥락을
        함께 확인할 수 있습니다.
      </p>
      <div className="border-t border-black" />
    </section>
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
    <div className="space-y-8">
      {years.map((year: string) => {
        const life = lifeRows.filter((row: any) => row.year === year);
        const works = workRows.filter((row: any) => row.year === year);

        return (
          <section key={`${type}-${year}`} className="border-t border-black pt-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <p className="font-serif text-5xl font-black tracking-[-0.12em]">
                {year}
              </p>
              <p className="max-w-[160px] text-right text-xs leading-5 text-black/55">
                {life[0]?.life_keyword || works[0]?.life_keyword || "Archive"}
              </p>
            </div>

            {type === "life" ? (
              <LifeContent
                lifeRows={life}
                workRows={works}
                compact={mode === "work"}
              />
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
      <div className="space-y-2 text-sm leading-6">
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
    <div className="grid gap-7 md:grid-cols-[1fr_190px]">
      <div>
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <article key={row.id} className="mb-6 last:mb-0">
              <p className="mb-3 font-serif text-3xl font-black tracking-[-0.08em]">
                {row.life_keyword || row.title}
              </p>
              <p className="break-keep text-base leading-8">
                {row.description || row.title}
              </p>
              <TagLine row={row} />
            </article>
          ))
        ) : (
          <p className="text-black/35">생애 정보 없음</p>
        )}
      </div>

      <aside className="border-l border-black pl-5">
        <p className="mb-3 text-xs uppercase tracking-[0.18em]">Works</p>
        {workRows.length ? (
          workRows.map((work: any) => (
            <p
              key={work.id}
              className="mb-3 font-serif text-xl font-black leading-6 tracking-[-0.06em]"
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

function WorkContent({
  workRows,
  lifeRows,
  compact,
  openWorkId,
  setOpenWorkId,
}: any) {
  if (compact) {
    return (
      <div className="space-y-2 text-sm leading-6">
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
            <article key={row.id} className="border-b border-black py-5">
              <button
                onClick={() => setOpenWorkId(isOpen ? null : row.id)}
                className="grid w-full grid-cols-[80px_60px_minmax(0,1fr)_80px_130px] items-start gap-4 text-left outline-none"
              >
                <span className="text-sm">{row.month}</span>
                <span className="text-sm">{row.day}</span>
                <span className="font-serif text-3xl font-black leading-7 tracking-[-0.08em]">
                  {row.work_title || row.title}
                </span>
                <span className="text-sm">{row.genre}</span>
                <span className="text-sm">{row.publication || row.source}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && <WorkDetail row={row} lifeRows={lifeRows} />}
              </AnimatePresence>
            </article>
          );
        })
      ) : (
        <p className="text-black/35">작품 정보 없음</p>
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
      <div className="mt-6 grid gap-6 bg-[#f7d6d8] p-5 md:grid-cols-[130px_1fr]">
        <div className="h-44 w-28 overflow-hidden border border-black bg-white">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.work_title || row.title}
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-xs text-black/40">
              이미지
              <br />
              없음
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-serif text-4xl font-black tracking-[-0.1em]">
            {row.work_title || row.title}
          </p>

          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-black/55">
            {[row.genre, row.publication || row.source].filter(Boolean).join(" · ")}
          </p>

          <p className="break-keep text-sm leading-8">
            {row.detail || row.description}
          </p>

          <div className="mt-5 space-y-2 text-sm text-black/70">
            {lifeRows?.[0]?.life_keyword && (
              <p>
                <span className="mr-2 font-bold">동시기 생애</span>
                {lifeRows[0].life_keyword}
              </p>
            )}

            {row.related_people && (
              <p>
                <span className="mr-2 font-bold">관련 인물</span>
                {row.related_people}
              </p>
            )}

            {row.historical_context && (
              <p>
                <span className="mr-2 font-bold">역사 맥락</span>
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
              ? "rounded-full border border-black px-3 py-1"
              : "text-black/40"
          }
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}