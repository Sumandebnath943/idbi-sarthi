# IDBI SARTHI — Product Explainer Video: Full Production Details

> A complete brief to produce the explainer video: strategy, script, scene-by-scene storyboard, screen-capture shot list, exact demo click-paths, branding, and production specs. Two cuts are specified: a **90-second hero** and a **3-minute deep-dive**.

---

## 1. At a glance

| Field | Value |
|---|---|
| Working title | **"Meet IDBI SARTHI — Your AI Relationship Manager Copilot"** |
| Primary cut | 90 seconds (hero / social / pitch) |
| Secondary cut | ~3 minutes (product deep-dive / demo) |
| Audience | Bank leadership & innovation teams; hackathon judges; RMs |
| Tone | Confident, modern, trustworthy, human-first (not gimmicky "AI hype") |
| Aspect ratios | 16:9 master; export 1:1 and 9:16 crops for social |
| Resolution | 1920×1080 (record UI at 2560×1440 or 1080p @ 2× DPR for crisp text) |
| Voice | Warm, clear, mid-paced Indian-English VO (or high-quality TTS) |
| Music | Uplifting corporate-tech, subtle; ducked under VO |
| Branding | IDBI teal `#00674D`, orange `#FF7A00`, mint `#E6F7F0`; clean sans-serif |

---

## 2. Core message & positioning

**One-liner:** *IDBI SARTHI turns a Relationship Manager's scattered data and dense policy into fast, explainable, trustworthy decisions.*

**Three pillars (repeat visually and verbally):**
1. **See everything** — Customer 360, health, risk — explained, not black-box.
2. **Decide with confidence** — loan/scheme recommendations + Next Best Action, each with a reason.
3. **Ask & verify instantly** — grounded policy answers (real RAG) and KYC document checks (real OCR + validation).

**Proof points to surface on screen:** "Grounded answers with policy citations," "Aadhaar Verhoeff checksum," "matches the customer on file," "12 modules," "explainable scores."

**What to avoid:** overclaiming autonomy; implying it makes lending decisions unassisted. Frame it as a **copilot** that assists the human RM.

---

## 3. The 90-second hero cut — full script + storyboard

> VO = voiceover. OST = on-screen text. SFX = sound. Timecodes are targets.

| Time | Visual (shot) | VO | OST / motion |
|---|---|---|---|
| 0:00–0:05 | Cold open: a cluttered "before" montage — spreadsheets, PDFs, sticky notes — dissolving into the clean IDBI SARTHI dashboard. | "Every relationship manager knows the problem: too much data, too little time." | Logo resolves; teal→orange gradient wipe. SFX: soft whoosh. |
| 0:05–0:12 | Full app on screen; cursor glides across the sidebar (Customer / Decisioning / Assistant / Operations). | "Meet IDBI SARTHI — an AI copilot that brings it all into one place." | OST: **"IDBI SARTHI — AI Relationship Manager Copilot"** |
| 0:12–0:22 | Customer 360 loads a profile; then Financial Health Score radar + 0–900 gauge animates. | "See any customer at a glance — a full 360 view, and a financial health score you can actually explain." | Callout: **"6-factor breakdown"** highlights. |
| 0:22–0:32 | Risk Prediction gauge + driver bars; cut to Loan Recommendation showing top match + EMI. | "Spot risk early, and recommend the right product — with the rate, the EMI, and the reason." | Callout: **"Explainable"** stamp on drivers. |
| 0:32–0:45 | **RAG hero moment:** type "What CIBIL score and documents are needed for a home loan?" → a grounded answer appears with `[POL-001]` citation chips. | "Ask a policy question in plain English — and get a grounded answer, with citations, straight from the bank's own policies." | Highlight the citation chips; underline **"cited"**. |
| 0:45–0:58 | **Document Intelligence hero moment:** drag a salary slip in → fields extract → green "Match" verdict vs the customer; Aadhaar shows masked. | "Upload a document — SARTHI reads it, validates the KYC, and checks it against the customer on file. In seconds." | Callouts: **"Aadhaar validated"**, **"Matches on file"**. |
| 0:58–1:10 | Next Best Action list; priority chips P0–P3 with channels. | "Then it tells you the next best action for every customer — prioritized, with the expected impact." | Callout: **"Prioritized • Explainable"**. |
| 1:10–1:20 | Quick montage: Analytics dashboard, Scheme Matcher, Chat — fast cuts. | "Twelve modules. One copilot. Built on real AI — real retrieval, real document intelligence." | OST: **"12 modules • Real RAG • Real OCR"** |
| 1:20–1:30 | Return to hero shot; logo lockup + tagline. | "IDBI SARTHI. Smarter relationships, built on trust." | OST + CTA: **"Smart AI Relationship & Trust Hub Intelligence"**; end card. |

---

## 4. The 3-minute deep-dive — segment outline & script beats

Use the same footage, expanded. Structure:

**A. Hook & problem (0:00–0:25)** — the RM's day; data overload; policy is dense; documents are manual. VO ends on: "SARTHI changes that."

**B. Customer intelligence (0:25–0:55)** — Customer 360 → Financial Health Score. Emphasize the **6-factor explainable** breakdown (savings ratio, credit utilization, EMI burden, stability, digital engagement, diversification). VO: "Every score comes with its reasons — nothing is a black box."

**C. Decisioning (0:55–1:30)** — Risk Prediction (12-month PD, SMA staging, drivers) → Loan Recommendation (match score, rate, EMI, eligibility reasons) → Explainable AI (feature contributions). VO: "Decisions you can defend to a customer — and an auditor."

**D. The AI assistant — RAG (1:30–2:05)** — the flagship. Show the pipeline conceptually with a simple animated diagram: **question → hybrid search (semantic + keyword) → grounded answer with [POL] citations**. Then the live demo. VO: "This isn't keyword search. SARTHI embeds every policy, retrieves the right passages, and writes an answer grounded in them — and cites its sources, so you can trust it."

**E. Document Intelligence (2:05–2:35)** — upload → OCR → extract → **validate (Aadhaar Verhoeff checksum, PAN format)** → **cross-check against Customer 360** → verdict + compliance flags. VO: "It reads the document, checks the numbers are real, and confirms it's actually your customer."

**F. Operate & scale (2:35–2:55)** — Next Best Action, Scheme Matcher, Analytics. Mention the honest, modern stack briefly (on-screen only): "Groq · Gemini · Supabase · Next.js." VO: "From a single customer to the whole portfolio."

**G. Close (2:55–3:00)** — logo + tagline + CTA.

---

## 5. Exact demo click-paths (for screen recording)

Record at 1080p, clean browser (no bookmarks bar), cursor smoothing on. Pre-seed the app so answers are fast.

**Recording 1 — RAG:**
1. Open the app → sidebar → **RAG**.
2. Click the suggested chip **"What CIBIL score is needed for a home loan?"** (or type the home-loan question).
3. Wait for the **grounded answer** to render; let the **citation chips** (`POL-001`, etc.) land.
4. Scroll to show one **source passage** with the `semantic #1` / `keyword #1` badges.
5. (Optional) Click **"Add policy (PDF/TXT)"** to show upload.

**Recording 2 — Document Intelligence:**
1. Sidebar → **Documents**.
2. In **"Verify against customer"**, pick a customer (e.g., the first in the list).
3. Load the **salary-slip sample** (or drag an image). Ensure the sample's name/income matches the chosen customer for a clean **"Match"**.
4. Click **Analyze Document**.
5. Capture: **Document Type + confidence**, **Customer Verification = Match** with the field table, **KYC Validation** (PAN valid, Aadhaar checksum), **Compliance Flags**.

**Recording 3 — Customer & decisioning:** Customer 360 → Health Score (let radar/gauge animate) → Risk Prediction → Loan Recommendation → Next Best Action.

**Recording 4 — Ambient B-roll:** slow cursor drift across the sidebar; Analytics charts animating; Chat typing a short question and receiving a reply.

> Tip: run the app in full AI mode (Groq + Gemini + Supabase configured) so RAG answers are grounded and fast. The status chip should read **"LLM: Groq · Retrieval: Hybrid · Store: Supabase."**

---

## 6. On-screen callouts (motion-graphic labels)

Reusable lower-thirds / chips to animate in at the right beats:
- "Customer 360 — everything in one view"
- "0–900 Health Score • 6 factors • explainable"
- "12-month default probability • SMA staging"
- "Grounded answer • cited from policy [POL-001]"
- "Hybrid retrieval: semantic + keyword"
- "Aadhaar validated (Verhoeff checksum)"
- "Matches the customer on file ✓"
- "Next Best Action • prioritized P0–P3"
- "12 modules • Real RAG • Real OCR"

Keep them short, teal/orange, with a subtle fade+rise. Never cover the data being demonstrated.

---

## 7. Motion-graphic: the RAG explainer (optional 6–8s insert)

A simple animated diagram for the deep-dive cut:
```
[ RM's question ]
        │
        ▼
[ Hybrid Retrieval ]  ──► semantic (embeddings)  +  keyword
        │                       fused by RRF
        ▼
[ Top policy passages ]  ──► [ LLM writes a grounded answer ]
        │
        ▼
[ Answer + [POL-xxx] citations ]
```
Animate each node lighting up in sequence, teal connectors. This visually earns the word "grounded."

---

## 8. Branding, type, sound

- **Logo/lockup:** "IDBI SARTHI" wordmark with a teal→orange gradient badge; tagline "Smart AI Relationship & Trust Hub Intelligence." No real IDBI logo.
- **Type:** clean geometric sans (e.g., Inter/Poppins) for OST; match the app's UI font feel.
- **Color:** teal `#00674D` primary, orange `#FF7A00` accent, mint `#E6F7F0` backgrounds, dark-teal `#0F2A22` text.
- **Music:** licensed uplifting corporate-tech bed, ~90–110 BPM; duck −12 dB under VO; small "confirm" SFX on the RAG citation and the "Match" verdict.
- **Captions:** burn-in subtitles (accessibility + muted social autoplay). Provide an `.srt`.

---

## 9. Production checklist & deliverables

**Pre-production**
- [ ] App running in full AI mode; Supabase seeded; status chip shows Groq/Hybrid/Supabase.
- [ ] Sample salary slip prepared with a name+income matching a real seeded customer (clean "Match").
- [ ] Script locked; VO recorded (or TTS rendered); music licensed.

**Capture**
- [ ] Recordings 1–4 (§5) at 1080p, clean browser, smooth cursor.
- [ ] Extra takes of the RAG answer landing and the "Match" verdict (hero moments).

**Edit**
- [ ] Assemble to the 90s script (§3); build the 3-min cut (§4) from the same assets.
- [ ] Add lower-thirds (§6) and the RAG diagram (§7).
- [ ] Color: keep UI true-to-brand; light vignette only.
- [ ] Mix: VO forward, music ducked, SFX on hero beats.

**Deliverables**
- [ ] `SARTHI_hero_90s_16x9.mp4` (H.264, 1080p, ~10–16 Mbps)
- [ ] `SARTHI_deepdive_3min_16x9.mp4`
- [ ] `9x16` and `1x1` social crops of the hero
- [ ] Burned-in captions + separate `.srt`
- [ ] Thumbnail/end card PNGs (teal/orange, tagline)

---

## 10. Copy bank (VO/OST variants)

**Taglines:** "Smarter relationships, built on trust." · "Your AI copilot for every customer." · "See more. Decide faster. Verify instantly."

**One-sentence pitch:** "IDBI SARTHI is an AI copilot that gives relationship managers a 360° view, explainable scores, grounded policy answers, and instant document verification — twelve modules in one place."

**CTA options:** "Ready to give your RMs a copilot? Let's talk." · "IDBI SARTHI — request a demo."

---

*Everything demonstrated in this brief is real and working in the product (RAG grounding, citations, Aadhaar validation, customer cross-check). Keep the demo honest — it's more impressive because it's true.*
