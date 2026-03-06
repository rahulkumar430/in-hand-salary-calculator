const { useState, useMemo } = React;

const NEW_REGIME_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 0.05 },
  { min: 800000, max: 1200000, rate: 0.10 },
  { min: 1200000, max: 1600000, rate: 0.15 },
  { min: 1600000, max: 2000000, rate: 0.20 },
  { min: 2000000, max: 2400000, rate: 0.25 },
  { min: 2400000, max: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION = 75000;
const CESS_RATE = 0.04;

function calculateTax(grossAnnual) {
  const taxable = Math.max(0, grossAnnual - STANDARD_DEDUCTION);
  let tax = 0;
  for (const slab of NEW_REGIME_SLABS) {
    if (taxable <= slab.min) break;
    const taxableInSlab = Math.min(taxable, slab.max) - slab.min;
    tax += taxableInSlab * slab.rate;
  }
  if (taxable <= 1200000) tax = 0;
  const cess = tax * CESS_RATE;
  const totalTax = tax + cess;
  const inHand = grossAnnual - totalTax;
  return { taxable, tax, cess, totalTax, inHand };
}

function findGrossForInHand(targetAnnual) {
  let lo = targetAnnual, hi = targetAnnual * 2.5;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    const { inHand } = calculateTax(mid);
    if (Math.abs(inHand - targetAnnual) < 0.5) return mid;
    if (inHand < targetAnnual) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtL = (n) => "₹" + (n / 100000).toFixed(2) + "L";

const PRESETS = [
  { label: "₹1L", value: 100000 },
  { label: "₹1.5L", value: 150000 },
  { label: "₹1.8L", value: 180000 },
  { label: "₹2L", value: 200000 },
  { label: "₹2.5L", value: 250000 },
  { label: "₹3L", value: 300000 },
];

const slabNames = [
  "Up to ₹4L (0%)",
  "₹4L–₹8L (5%)",
  "₹8L–₹12L (10%)",
  "₹12L–₹16L (15%)",
  "₹16L–₹20L (20%)",
  "₹20L–₹24L (25%)",
  "Above ₹24L (30%)",
];

function TaxCalculator() {
  const [rawInput, setRawInput] = useState("150000");

  const targetMonthly = useMemo(() => {
    const n = parseFloat(rawInput.replace(/,/g, ""));
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [rawInput]);

  const result = useMemo(() => {
    if (!targetMonthly) return null;
    const targetAnnual = targetMonthly * 12;
    const grossAnnual = findGrossForInHand(targetAnnual);
    const { tax, cess, totalTax, taxable } = calculateTax(grossAnnual);
    const effectiveRate = (totalTax / grossAnnual) * 100;

    const slabBreakdown = [];
    let remaining = taxable;
    NEW_REGIME_SLABS.forEach((slab, i) => {
      if (remaining <= 0) return;
      const width = slab.max === Infinity ? remaining : slab.max - slab.min;
      const inSlab = Math.min(remaining, width);
      if (inSlab > 0) {
        slabBreakdown.push({ name: slabNames[i], income: inSlab, tax: inSlab * slab.rate, rate: slab.rate });
      }
      remaining -= inSlab;
    });

    return { targetMonthly, targetAnnual, grossAnnual, grossMonthly: grossAnnual / 12, tax, cess, totalTax, taxable, effectiveRate, slabBreakdown };
  }, [targetMonthly]);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setRawInput(digits);
  };

  const displayValue = rawInput ? Number(rawInput).toLocaleString("en-IN") : "";

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0D0F14", minHeight: "100vh", color: "#E2E8F0", padding: "32px 20px", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .card { background: #161B25; border: 1px solid #1E2535; border-radius: 16px; }
        .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #1E2535; }
        .metric-row:last-child { border-bottom: none; }
        .slab-bar { height: 8px; border-radius: 4px; transition: width 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .preset-btn { border: 1px solid #2A3247; background: #1A1F2E; color: #94A3B8; border-radius: 100px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .preset-btn:hover { border-color: #F59E0B88; color: #F59E0B; background: #1E2535; }
        .preset-btn.active { background: #F59E0B; color: #0D0F14; border-color: #F59E0B; box-shadow: 0 0 18px #F59E0B44; }
        .salary-input { background: transparent; border: none; color: #F1F5F9; font-size: 30px; font-weight: 700; font-family: 'DM Mono', monospace; width: 100%; padding: 0; outline: none; letter-spacing: -0.5px; }
        .salary-input::placeholder { color: #2A3247; }
        .input-wrap { background: #1A1F2E; border: 2px solid #2A3247; border-radius: 12px; display: flex; align-items: center; padding: 14px 20px; gap: 10px; transition: border-color 0.2s, box-shadow 0.2s; }
        .input-wrap:focus-within { border-color: #F59E0B; box-shadow: 0 0 0 4px #F59E0B18; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: "#1A1F2E", border: "1px solid #2A3247", borderRadius: 8, padding: "4px 14px", fontSize: 12, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
          NEW TAX REGIME · FY 2025–26
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.5px" }}>
          In-Hand Salary Calculator
        </h1>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 8 }}>
          Includes ₹75,000 standard deduction + 4% cess
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Input card */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ fontSize: 12, color: "#64748B", letterSpacing: "0.06em", marginBottom: 12 }}>
            ENTER DESIRED MONTHLY IN-HAND (₹)
          </div>
          <div className="input-wrap">
            <span style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B", fontFamily: "'DM Mono', monospace", lineHeight: 1, userSelect: "none" }}>₹</span>
            <input
              className="salary-input"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 1,50,000"
              value={displayValue}
              onChange={handleChange}
            />
          </div>

          {/* Quick presets */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#475569", alignSelf: "center", marginRight: 4 }}>Quick:</span>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                className={`preset-btn${targetMonthly === p.value ? " active" : ""}`}
                onClick={() => setRawInput(String(p.value))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {result && targetMonthly > 0 ? (
          <div key={String(targetMonthly)} className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Hero numbers */}
            <div className="card" style={{ padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderColor: "#F59E0B44" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6, letterSpacing: "0.06em" }}>TARGET MONTHLY IN-HAND</div>
                <div style={{ fontSize: "clamp(24px, 5.5vw, 34px)", fontWeight: 700, color: "#F59E0B", letterSpacing: "-1px", fontFamily: "'DM Mono', monospace" }}>
                  {fmt(result.targetMonthly)}
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 5 }}>
                  {fmtL(result.targetAnnual)} / year
                </div>
              </div>

              <div style={{ borderLeft: "1px solid #1E2535", paddingLeft: 20 }}>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6, letterSpacing: "0.06em" }}>REQUIRED GROSS MONTHLY</div>
                <div style={{ fontSize: "clamp(24px, 5.5vw, 34px)", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-1px", fontFamily: "'DM Mono', monospace" }}>
                  {fmt(result.grossMonthly)}
                </div>
                {/* Annual CTC — larger & bolder */}
                <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, color: "#F59E0B", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.5px" }}>
                    {fmtL(result.grossAnnual)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>annual CTC</span>
                </div>
              </div>
            </div>

            {/* Tax summary */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 12, color: "#64748B", letterSpacing: "0.06em", marginBottom: 16 }}>ANNUAL BREAKDOWN</div>
              {[
                { label: "Gross Annual CTC", val: fmt(result.grossAnnual), color: "#F1F5F9", bold: true },
                { label: "Standard Deduction", val: `−${fmt(STANDARD_DEDUCTION)}`, color: "#10B981" },
                { label: "Taxable Income", val: fmt(result.taxable), color: "#E2E8F0" },
                { label: "Income Tax", val: `−${fmt(result.tax)}`, color: "#F87171" },
                { label: "Health & Education Cess (4%)", val: `−${fmt(result.cess)}`, color: "#F87171" },
              ].map((row, i) => (
                <div className="metric-row" key={i}>
                  <span style={{ color: "#94A3B8" }}>{row.label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: row.bold ? 700 : 500, color: row.color, fontSize: row.bold ? 15 : 14 }}>{row.val}</span>
                </div>
              ))}
              <div className="metric-row" style={{ paddingTop: 14, borderTop: "1px solid #F59E0B44", marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#F1F5F9" }}>Net Annual In-Hand</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#F59E0B", fontSize: 17 }}>{fmt(result.targetAnnual)}</span>
              </div>
            </div>

            {/* Slab breakdown */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 12, color: "#64748B", letterSpacing: "0.06em", marginBottom: 16 }}>SLAB-WISE TAX BREAKDOWN</div>
              {result.slabBreakdown.map((s, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: "#94A3B8" }}>{s.name}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: s.tax > 0 ? "#F87171" : "#64748B", fontSize: 12 }}>
                      {s.tax > 0 ? `Tax: ${fmt(s.tax)}` : "Nil"}
                    </span>
                  </div>
                  <div style={{ background: "#1E2535", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div className="slab-bar" style={{ width: `${Math.min(100, (s.income / result.taxable) * 100)}%`, background: s.tax === 0 ? "#10B981" : `hsl(${210 - s.rate * 400}, 80%, 55%)` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Effective rate + monthly tax */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", background: "#161B25", border: "1px solid #1E2535", borderRadius: 12, flexWrap: "wrap" }}>
              <span style={{ color: "#64748B", fontSize: 14 }}>Effective Tax Rate</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 18, color: "#F59E0B" }}>{result.effectiveRate.toFixed(2)}%</span>
              <span style={{ color: "#2A3247", fontSize: 18, margin: "0 2px" }}>·</span>
              <span style={{ color: "#64748B", fontSize: 14 }}>Monthly Tax</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 18, color: "#F87171" }}>{fmt(result.totalTax / 12)}</span>
            </div>

            <p style={{ fontSize: 12, color: "#475569", textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
              * Assumes only standard deduction (₹75,000). Excludes EPF, professional tax, and other deductions.
              Actual take-home may vary based on salary structure.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#2A3247", fontFamily: "'DM Mono', monospace", fontSize: 15 }}>
            ↑ Enter a monthly salary above to see the breakdown
          </div>
        )}
      </div>
    </div>
  );
}
