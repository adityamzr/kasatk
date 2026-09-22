"use client";
import { formatRupiah } from "@/lib/money";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Banknote,
  LoaderCircle,
  Plus,
} from "lucide-react";
import MoneyInput from "@/components/ui/MoneyInput";
import { useToast } from "@/components/ui/toast";
import { formatDateTimeID } from "@/lib/date";
export default function Savings() {
  const [rows, setRows] = useState<any[]>([]),
    [summary, setSummary] = useState<any>({}),
    [classes, setClasses] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [classId, setClassId] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [meta, setMeta] = useState<any>({}),
    [selected, setSelected] = useState<Record<string, boolean>>({}),
    [bulk, setBulk] = useState(false),
    [tab, setTab] = useState<"list" | "history">("list"),
    [refresh, setRefresh] = useState(0),
    toast = useToast();
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setError("");
      Promise.all([
        fetch(
          `/api/savings?search=${encodeURIComponent(q)}&classRoomId=${classId}&page=${page}&pageSize=25`,
        ),
        fetch("/api/master-data/classes"),
      ])
        .then(async ([a, b]) => {
          const d = await a.json();
          if (!a.ok) throw Error(d.message);
          setRows(d.items || []);
          setMeta(d.pagination || {});
          setSummary(d.summary || {});
          if (b.ok) {
            const c = await b.json();
            setClasses(c.items || c || []);
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q, classId, page, refresh]);
  useEffect(() => {
    const f = () => setRefresh((x) => x + 1);
    window.addEventListener("focus", f);
    return () => window.removeEventListener("focus", f);
  }, []);
  useEffect(() => {
    setPage(1);
    setSelected({});
  }, [q, classId]);
  useEffect(() => setSelected({}), [page]);
  const eligible = rows.filter((s) => s.status === "ACTIVE"),
    chosen = rows.filter((s) => selected[s.id] && s.status === "ACTIVE");
  function selectAll(checked: boolean) {
    setSelected(Object.fromEntries(eligible.map((s) => [s.id, checked])));
  }
  return (
    <div className="section-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">KEUANGAN SEKOLAH</p>
          <h1>Tabungan Siswa</h1>
          <p className="muted">
            Kelola saldo, setoran, dan penarikan tabungan siswa.
          </p>
        </div>
      </div>
      <div className="report-tabs">
        <button
          className={tab === "list" ? "active" : ""}
          onClick={() => setTab("list")}
        >
          Daftar Tabungan
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          Riwayat Transaksi
        </button>
      </div>
      {tab === "list" ? (
        <>
          <div className="filter-row">
            <input
              placeholder="Cari NIS atau nama siswa..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Semua kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="secondary"
              onClick={() => setRefresh((x) => x + 1)}
            >
              Refresh
            </button>
          </div>
          <div className="savings-summary">
            <div className="spp-card">
              <p>Total saldo tabungan</p>
              <b>{formatRupiah(summary.totalBalance || 0)}</b>
            </div>
            <div className="spp-card">
              <p>Setoran bulan ini</p>
              <b>{formatRupiah(summary.depositsThisMonth || 0)}</b>
            </div>
            <div className="spp-card">
              <p>Penarikan bulan ini</p>
              <b>{formatRupiah(summary.withdrawalsThisMonth || 0)}</b>
            </div>
            <div className="spp-card">
              <p>Siswa dengan tabungan</p>
              <b>{summary.studentsWithSavings || 0}</b>
            </div>
          </div>
          {chosen.length > 0 && (
            <div className="bulk-bar">
              <span>{chosen.length} siswa dipilih</span>
              <button
                className="primary"
                onClick={() =>
                  chosen.length <= 50
                    ? setBulk(true)
                    : toast.warning("Maksimal 50 siswa per setoran massal.")
                }
              >
                <ArrowDownToLine size={15} /> Setoran Massal
              </button>
            </div>
          )}
          {error ? (
            <div className="error">{error}</div>
          ) : loading ? (
            <div className="panel empty">Memuat data...</div>
          ) : (
            <section className="panel data-table savings-table">
              {!rows.length ? (
                <div className="empty">
                  <Banknote size={28} aria-hidden="true" />
                  <b>Belum ada data tabungan siswa.</b>
                </div>
              ) : (
                <>
                  <div className="data-row savings-row savings-header">
                    <span className="bulk-check">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua siswa aktif"
                        checked={
                          eligible.length > 0 &&
                          eligible.every((s) => selected[s.id])
                        }
                        onChange={(e) => selectAll(e.target.checked)}
                      />
                    </span>
                    <span>NIS</span>
                    <span>NAMA SISWA</span>
                    <span>KELAS</span>
                    <span>SALDO</span>
                    <span>TRANSAKSI TERAKHIR</span>
                    <span>AKSI</span>
                  </div>
                  {rows.map((s) => (
                    <Link
                      className="data-row savings-row"
                      href={`/admin/savings/${s.id}`}
                      key={s.id}
                    >
                      <span className="bulk-check">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${s.name}`}
                          disabled={s.status !== "ACTIVE"}
                          checked={!!selected[s.id]}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelected((x) => ({
                              ...x,
                              [s.id]: e.target.checked,
                            }));
                          }}
                        />
                      </span>
                      <span>{s.nis}</span>
                      <strong>{s.name}</strong>
                      <span>{s.classRoom?.name || "-"}</span>
                      <b className="savings-balance">
                        {formatRupiah(Number(s.currentBalance))}
                      </b>
                      <span>
                        {s.lastTransactionDate
                          ? new Date(s.lastTransactionDate).toLocaleDateString(
                              "id-ID",
                            )
                          : "Belum ada transaksi"}
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </>
              )}
              <Pagination meta={meta} page={page} setPage={setPage} />
            </section>
          )}
          {bulk && (
            <BulkSavingsModal
              students={chosen}
              close={() => setBulk(false)}
              done={(m) => {
                setBulk(false);
                setSelected({});
                toast.success(m);
                setPage(1);
              }}
            />
          )}
        </>
      ) : (
        <GlobalHistory />
      )}
    </div>
  );
}
function Pagination({
  meta,
  page,
  setPage,
}: {
  meta: any;
  page: number;
  setPage: (n: number) => void;
}) {
  if (!meta.totalPages || meta.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span>
        {(page - 1) * meta.pageSize + 1}–
        {Math.min(page * meta.pageSize, meta.total)} dari {meta.total}
      </span>
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Sebelumnya
      </button>
      <b>
        {page} / {meta.totalPages}
      </b>
      <button
        disabled={page >= meta.totalPages}
        onClick={() => setPage(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  );
}
function BulkSavingsModal({
  students,
  close,
  done,
}: {
  students: any[];
  close: () => void;
  done: (message: string) => void;
}) {
  const [mode, setMode] = useState<"same" | "individual">("same"),
    [shared, setShared] = useState(""),
    [amounts, setAmounts] = useState<Record<string, string>>({}),
    [notes, setNotes] = useState(""),
    [busy, setBusy] = useState(false),
    [issues, setIssues] = useState<Record<string, string>>({}),
    toast = useToast();
  function switchMode(next: "same" | "individual") {
    if (next === "individual")
      setAmounts(Object.fromEntries(students.map((s) => [s.id, shared])));
    setMode(next);
  }
  const values = students.map((s) =>
      mode === "same" ? shared : amounts[s.id] || "",
    ),
    total = values.reduce((n, v) => n + Number(v || 0), 0);
  function validate() {
    const bad: any = {};
    students.forEach((s, i) => {
      if (Number(values[i]) <= 0) bad[s.id] = "Nominal harus lebih dari nol.";
    });
    setIssues(bad);
    return !Object.keys(bad).length;
  }
  async function submit() {
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/savings/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: notes || undefined,
          items: students.map((s, i) => ({
            studentId: s.id,
            amount: values[i],
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.issues)
          setIssues(
            Object.fromEntries(
              d.issues.map((x: any) => [x.studentId, x.reason]),
            ),
          );
        throw Error(d.message || "Setoran massal gagal diproses.");
      }
      done(
        `${d.count} setoran berhasil diproses. Total ${formatRupiah(d.totalAmount)}.`,
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div
        className="modal bulk-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Setoran Massal Tabungan</h2>
          <button onClick={close} disabled={busy}>
            ×
          </button>
        </div>
        <p className="muted">{students.length} siswa dipilih</p>
        <div className="bulk-mode">
          <label>
            <input
              type="radio"
              checked={mode === "same"}
              disabled={busy}
              onChange={() => switchMode("same")}
            />{" "}
            Nominal sama untuk semua
          </label>
          <label>
            <input
              type="radio"
              checked={mode === "individual"}
              disabled={busy}
              onChange={() => switchMode("individual")}
            />{" "}
            Atur nominal per siswa
          </label>
        </div>
        {mode === "same" && (
          <label className="field">
            Nominal setoran
            <MoneyInput
              value={shared}
              disabled={busy}
              onChange={setShared}
              placeholder="50.000"
            />
          </label>
        )}
        <div className="bulk-items">
          {students.map((s, i) => (
            <div className="bulk-item" key={s.id}>
              <div>
                <b>{s.name}</b>
                <small>
                  Saldo saat ini {formatRupiah(Number(s.currentBalance))}
                </small>
              </div>
              {mode === "individual" && (
                <MoneyInput
                  value={amounts[s.id] || ""}
                  disabled={busy}
                  onChange={(v) => setAmounts((x) => ({ ...x, [s.id]: v }))}
                />
              )}{" "}
              {issues[s.id] && (
                <span className="bulk-issue">{issues[s.id]}</span>
              )}
            </div>
          ))}
        </div>
        <div className="pay-breakdown">
          <span>Total setoran</span>
          <b>{formatRupiah(total)}</b>
        </div>
        <label className="field">
          Catatan
          <input
            value={notes}
            disabled={busy}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opsional"
          />
        </label>
        <div className="modal-actions">
          <button className="secondary" onClick={close} disabled={busy}>
            Batal
          </button>
          <button className="primary" onClick={submit} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="loading-spinner" size={16} />{" "}
                Memproses...
              </>
            ) : (
              `Proses ${students.length} Setoran`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobalHistory() {
  const [items, setItems] = useState<any[]>([]),
    [filters, setFilters] = useState({
      search: "",
      type: "",
      from: "",
      to: "",
    }),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0),
    [meta, setMeta] = useState<any>({}),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({
      ...filters,
      page: String(page),
      pageSize: "25",
    });
    for (const k of Object.keys(filters)) if (!q.get(k)) q.delete(k);
    fetch("/api/savings/transactions?" + q)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setMeta(d.pagination || {});
      })
      .finally(() => setLoading(false));
  }, [filters, page, refresh]);
  useEffect(() => setPage(1), [filters]);
  const label: any = {
    DEPOSIT: "Setoran",
    WITHDRAWAL: "Penarikan",
    DEPOSIT_CORRECTION: "Koreksi setoran",
    WITHDRAWAL_CORRECTION: "Koreksi penarikan",
  };
  return (
    <>
      <div className="filter-row">
        <input
          placeholder="Cari NIS, siswa, atau transaksi..."
          value={filters.search}
          onChange={(e) =>
            setFilters((x) => ({ ...x, search: e.target.value }))
          }
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters((x) => ({ ...x, type: e.target.value }))}
        >
          <option value="">Semua jenis</option>
          {Object.entries(label).map(([k, v]) => (
            <option key={k} value={k}>
              {v as string}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((x) => ({ ...x, from: e.target.value }))}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((x) => ({ ...x, to: e.target.value }))}
        />
        <button className="secondary" onClick={() => setRefresh((x) => x + 1)}>
          Refresh
        </button>
      </div>
      <div className="panel report-table report-table-scroll savings-history-global">
        <table>
          <thead>
            <tr>
              <th>NO. TRANSAKSI</th>
              <th>SISWA</th>
              <th>KELAS</th>
              <th>WAKTU</th>
              <th>JENIS</th>
              <th>NOMINAL</th>
              <th>SALDO SETELAH</th>
              <th>STATUS</th>
              <th>DICATAT OLEH</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>{x.transactionNumber}</td>
                <td>
                  <Link href={`/admin/savings/${x.student.id}`}>
                    {x.student.name}
                  </Link>
                </td>
                <td>{x.student.classRoom?.name || "-"}</td>
                <td>{formatDateTimeID(x.transactionDate)}</td>
                <td>{label[x.type] || x.type}</td>
                <td>
                  {["DEPOSIT", "WITHDRAWAL_CORRECTION"].includes(x.type)
                    ? "+"
                    : "-"}
                  {formatRupiah(Number(x.amount))}
                </td>
                <td>{formatRupiah(Number(x.balanceAfter))}</td>
                <td>{x.status === "COMPLETED" ? "Berhasil" : "Dibatalkan"}</td>
                <td>{x.recordedBy?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="empty">Memuat transaksi...</div>}
      </div>
      {meta.totalPages > 1 && (
        <div className="pagination">
          <span>
            {(page - 1) * meta.pageSize + 1}–
            {Math.min(page * meta.pageSize, meta.total)} dari {meta.total}
          </span>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Sebelumnya
          </button>
          <b>
            {page} / {meta.totalPages}
          </b>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
    </>
  );
}
