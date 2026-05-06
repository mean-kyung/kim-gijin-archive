"use client";

import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrOguwmu54RaYHhFSOo0ybgZJ3AgHgNRDdd1dwTvkB1fsDqNHdUewN2Xgl3BtOx1ylyUPzUaJZCnqz/pubhtml";

const PANEL_TRANSITION = {
  type: "tween" as const,
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

const SAMPLE_ROWS = [
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

function simpleCsvToRows(text: string) {
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map((v) => v.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const item: Record<string, string> = {};

    headers.forEach((header, index) => {
      item[header] = (cells[index] || "").trim();
    });

    return item;
  });
}

function useSheetData() {
const [rows, setRows] = React.useState<any[]>(SAMPLE_ROWS);

  React.useEffect(() => {
    if (!SHEET_CSV_URL) return;

    fetch(SHEET_CSV_URL)
      .then((res) => res.text())
      .then((text) => {
        setRows(simpleCsvToRows(text));
      });
  }, []);

  return rows;
}

function onlyNumber(value: string) {
  return (
    Number(
      String(value)
        .replaceAll("년", "")
        .replaceAll("월", "")
        .replaceAll("일", "")
    ) || 0
  );
}

function sortRows(a: any, b: any) {
  if (onlyNumber(a.year) !== onlyNumber(b.year)) {
    return onlyNumber(a.year) - onlyNumber(b.year);
  }

  return onlyNumber(a.month) - onlyNumber(b.month);
}

function clean(value: string) {
  return String(value).toLowerCase().replaceAll(" ", "");
}

function filterRows(rows: any[], query: string) {
  const q = clean(query);
  if (!q) return rows;

  return rows.filter((row) =>
    clean(Object.values(row).join(" ")).includes(q)
  );
}

function tags(value: string) {
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getPanelWidths(mode: string) {
  if (mode === "life") {
    return {
      life: "calc(100% - 260px)",
      work: "260px",
    };
  }

  if (mode === "work") {
    return {
      life: "260px",
      work: "calc(100% - 260px)",
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
    <div className="min-h-screen bg-white text-black">
      <div className="relative min-h-screen overflow-hidden px-6 pb-28 pt-6">
        <header className="flex border-b border-black">
          <motion.button
            animate={{ width: panelWidths.life }}
            transition={PANEL_TRANSITION}
            onClick={() => setMode(mode === "life" ? "both" : "life")}
            className={`border-r border-black pb-5 text-left text-3xl outline-none hover:font-bold ${
              mode === "life" ? "font-bold" : "font-normal"
            }`}
          >
            작가 생애
          </motion.button>

          <motion.button
            animate={{ width: panelWidths.work }}
            transition={PANEL_TRANSITION}
            onClick={() => setMode(mode === "work" ? "both" : "work")}
            className={`pb-5 pl-8 text-left text-3xl outline-none hover:font-bold ${
              mode === "work" ? "font-bold" : "font-normal"
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

        <footer className="fixed bottom-0 left-0 right-0 grid grid-cols-[1fr_190px] border-t border-black bg-white">
          <label className="flex h-20 items-center gap-4 px-8 text-xl">
            <span>|</span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어 입력"
              className="w-full bg-transparent outline-none"
            />
          </label>

          <div className="flex items-center justify-center border-l border-black text-center text-xl font-bold">
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
    <section className="flex items-stretch border-b border-black">
      <motion.div
        animate={{ width: panelWidths.life }}
        transition={PANEL_TRANSITION}
        className="overflow-hidden border-r border-black will-change-[width]"
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
      <aside className="grid h-full min-h-32 grid-cols-[72px_1fr] items-stretch">
        <div className="h-full border-r border-black px-2 py-6 text-sm">
          {year}
        </div>

        <div className="px-4 py-6 text-sm">
          <p className="mb-2 font-bold">생애</p>

          {lifeRows.length ? (
            lifeRows.map((row: any) => (
              <p key={row.id}>{row.life_keyword || row.title}</p>
            ))
          ) : (
            <p>생애 정보 없음</p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <div className="grid h-full min-h-44 grid-cols-[72px_72px_minmax(0,1fr)_160px] items-stretch">
      <div className="h-full border-r border-black px-2 py-8 text-sm">
        {year}
      </div>

      <div className="h-full border-r border-black px-2 py-8 text-sm">
        {representative.age}
      </div>

      <div className="px-7 py-8">
        {lifeRows.length ? (
          lifeRows.map((row: any) => (
            <article key={row.id} className="mb-8 last:mb-0">
              <p className="mb-3 text-sm font-bold">{row.life_keyword}</p>

              <p className="text-sm leading-7">
                {row.description || row.title}
              </p>

              <TagLine row={row} />
            </article>
          ))
        ) : (
          <p className="text-sm">생애 정보 없음</p>
        )}
      </div>

      <aside className="h-full border-l border-black px-5 py-8">
        <p className="mb-4 text-xs font-bold">같은 해 작품</p>

        {workRows.length ? (
          workRows.map((work: any) => (
            <p key={work.id} className="mb-3 text-sm">
              {work.work_title || work.title}
            </p>
          ))
        ) : (
          <p className="text-sm">작품 정보 없음</p>
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
      <aside className="grid h-full min-h-32 grid-cols-[72px_1fr] items-stretch">
        <div className="h-full border-r border-black px-2 py-6 text-sm">
          {year}
        </div>

        <div className="px-4 py-6 text-sm">
          <p className="mb-2 font-bold">작품</p>

          {workRows.length ? (
            workRows.map((row: any) => (
              <p key={row.id}>{row.work_title || row.title}</p>
            ))
          ) : (
            <p>작품 정보 없음</p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <div className="grid h-full min-h-44 grid-cols-[72px_72px_72px_minmax(0,1fr)_104px_150px] items-stretch">
      <div className="h-full border-r border-black px-2 py-8 text-sm">
        {year}
      </div>

      <div className="h-full border-r border-black px-2 py-8 text-sm">
        {representative.age}
      </div>

      <div className="h-full border-r border-black px-2 py-8 text-sm">
        {keyword}
      </div>

      <div className="h-full px-5 py-8">
        {workRows.length ? (
          workRows.map((row: any) => {
            const isOpen = openWorkId === row.id;

            return (
              <article key={row.id} className="mb-3 last:mb-0">
                <button
                  onClick={() => setOpenWorkId(isOpen ? null : row.id)}
                  className="grid w-full grid-cols-[72px_64px_1fr] text-left text-base outline-none hover:font-bold"
                >
                  <span>{row.month}</span>
                  <span>{row.day}</span>
                  <span>{row.work_title || row.title}</span>
                </button>

                {isOpen && <WorkDetail row={row} />}
              </article>
            );
          })
        ) : (
          <p className="text-sm">작품 정보 없음</p>
        )}
      </div>

      <div className="h-full border-l border-black px-3 py-8 text-center text-sm">
        {workRows.map((row: any) => (
          <p key={`${row.id}-genre`}>{row.genre}</p>
        ))}
      </div>

      <div className="h-full border-l border-black px-4 py-8 text-center text-sm">
        {workRows.map((row: any) => (
          <p key={`${row.id}-pub`}>{row.publication || row.source}</p>
        ))}
      </div>
    </div>
  );
}

function WorkDetail({ row }: any) {
  return (
    <div className="my-3 grid gap-6 bg-gray-100 p-6 md:grid-cols-[140px_1fr]">
      <div className="h-44 w-32 overflow-hidden border border-black bg-white">
        {row.image_url ? (
          <img
            src={row.image_url}
            alt={row.work_title || row.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-sm">
            이미지 없음
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 grid grid-cols-[1fr_80px_140px] gap-4 text-sm">
          <p className="font-bold">{row.work_title || row.title}</p>

          <p>{row.genre}</p>

          <p>{row.publication || row.source}</p>
        </div>

        <p className="text-sm leading-7">{row.detail || row.description}</p>

        <div className="mt-5 space-y-2 text-sm">
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
  );
}

function TagLine({ row, boxed = false }: any) {
  const list = tags(row.tags);

  if (!list.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm">
      {list.map((tag) => (
        <span
          key={tag}
          className={boxed ? "border border-black px-2 py-1" : ""}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}