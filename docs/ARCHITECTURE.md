# ΤΣΙΑΝΤΗΣ ERP — Αρχιτεκτονική & Τεχνικές Αποφάσεις

Αυτό το έγγραφο καταγράφει τις τεχνικές αποφάσεις (δική μου ευθύνη, όχι του
Φίλιππου — βλ. κανόνα "εγώ αποφασίζω επαγγελματικούς κανόνες, εσύ τεχνικές
αποφάσεις") και το γιατί, ώστε να μη χρειάζεται να ξαναεξηγηθούν.

## Stack

| Επίπεδο | Επιλογή | Γιατί |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19, ως PWA | Ένα codebase για κινητό/tablet/PC, responsive by default, installable PWA χωρίς ξεχωριστό native app, server components μειώνουν το JS που στέλνεται σε κινητό δίκτυο εργοταξίου. |
| Backend | Next.js Route Handlers (API layer) πάνω από ξεχωριστό **service layer** (`src/lib/*`) | Το service layer (business rules, cut engine, price engine, RBAC, audit) είναι ανεξάρτητο του HTTP framework — το ίδιο layer το καλεί και το REST API και το MCP server, καμία διπλή λογική. |
| Database | PostgreSQL, μέσω Prisma ORM | Πραγματικά ACID transactions (πολλαπλοί χρήστες ταυτόχρονα), optimistic locking με `version` column, ώριμο migration tooling, φθηνό managed hosting (Supabase/Neon/Railway — όλα Postgres). |
| Auth | NextAuth (Auth.js) με credentials + πιθανό Google OAuth αργότερα | Δουλεύει native με Next.js, session-based, RBAC στο δικό μας layer (`src/lib/rbac`). |
| AI integration | Anthropic API (Claude) + custom MCP server πάνω από το ίδιο service layer | Ό,τι κάνει το Claude περνάει από το ΙΔΙΟ authorization/validation/audit που περνάει κι ο άνθρωπος χρήστης — καμία "πίσω πόρτα". |
| File storage | S3-συμβατό object storage (π.χ. Cloudflare R2 ή AWS S3) για φωτογραφίες/έγγραφα | Η βάση κρατάει μόνο link, όχι binary — φθηνό, γρήγορο από κινητό εργοταξίου. |
| Hosting/deploy | Vercel (frontend+API) + managed Postgres (Supabase/Neon) | Native fit για Next.js, ενσωματωμένο CI/CD από Git push, preview deployments ανά PR, backward-compatible migrations μέσω Prisma Migrate. |
| CI/CD | GitHub Actions: lint → test → prisma migrate diff check → deploy | Καμία αλλαγή κώδικα δεν φτάνει σε production χωρίς αυτόματα tests να περάσουν. |

## Γιατί όχι κάτι άλλο

- **Όχι Firebase/χωρίς σχεσιακή βάση**: το ERP έχει βαριά σχεσιακά δεδομένα
  (έργο → κουφώματα → κοπές → κοστολόγηση → προσφορά → παραγγελία →
  πληρωμές) με real transactions (π.χ. "καταχώρησε πληρωμή ΚΑΙ ενημέρωσε
  υπόλοιπο" πρέπει να είναι atomic) — το Postgres/Prisma ταιριάζει καλύτερα
  από NoSQL.
- **Όχι ξεχωριστό native app (iOS/Android)**: PWA δίνει "installed app"
  εμπειρία σε Android άμεσα και σε iPhone μέσω Add to Home Screen, χωρίς
  App Store review κύκλους, με ένα codebase.
- **Όχι custom backend framework (Express/Fastify ξεχωριστά)**: Next.js
  Route Handlers καλύπτουν το API χωρίς δεύτερο deployment target —
  λιγότερα κινούμενα κομμάτια για ένα two-person business να συντηρεί.

## Business Rule Engine — σχεδιαστική απόφαση

Ζητήθηκε ρητά να ΜΗΝ hard-codeαριστούν κανόνες στο UI. Η λύση εδώ:

- Κάθε κανόνας είναι ένα `BusinessRule` record (μεταδεδομένα: RULE_ID,
  STATUS, VERSION, SOURCE, κ.λπ. — βλ. `src/lib/rules/types.ts`) που ζει
  στη βάση (`BusinessRule` table) και είναι queryable/editable από UI.
- Ο πραγματικός υπολογισμός είναι μια versioned TypeScript συνάρτηση
  (`src/lib/cutting/*`, `src/lib/pricing/*`) δεμένη στο ίδιο RULE_ID.
- `assertUsable()` ελέγχει STATUS πριν τρέξει ΟΠΟΙΟΣΔΗΠΟΤΕ υπολογισμός —
  αν ένας κανόνας δεν είναι VERIFIED/USER_VERIFIED, το calculation
  ΣΤΑΜΑΤΑΕΙ με σαφές σφάλμα, δεν επινοεί.
- Γιατί όχι πλήρης "generic formula interpreter" (string parsing
  φορμουλών σε runtime): θα πρόσθετε πολυπλοκότητα/κίνδυνο σφαλμάτων χωρίς
  πραγματικό όφελος για ~15-30 κανόνες — μια versioned function ΕΙΝΑΙ ο
  κανόνας, το FORMULA πεδίο είναι για audit/εμφάνιση στον άνθρωπο.

## Concurrency & πολλαπλοί χρήστες + Claude ταυτόχρονα

- Optimistic locking (`version` column) σε κάθε πίνακα που αλλάζει συχνά —
  κάθε update γράφει `WHERE version = X`, αν αποτύχει επιστρέφει 409
  Conflict, το UI/agent ξαναδιαβάζει και ξαναπροσπαθεί.
- `updatedAt` timestamps παντού για "τελευταία αλλαγή από".
- Πολυβηματικές αλλαγές (π.χ. record_payment + ενημέρωση υπολοίπου)
  τυλίγονται σε Prisma `$transaction`.
- Real-time ενημέρωση UI: polling ή Server-Sent Events στην πρώτη έκδοση
  (απλό, αξιόπιστο)· WebSocket/Postgres LISTEN-NOTIFY αν χρειαστεί αργότερα
  πραγματικό real-time push — δεν χρειάζεται από την πρώτη μέρα.

## Data vs Code changes (§7 του αιτήματος)

- **Data** (πελάτες, έργα, προσφορές, ...): γράφονται live μέσω του API
  από ανθρώπους ΚΑΙ από το Claude (MCP tools) — καμία έγκριση κώδικα
  χρειάζεται, μόνο RBAC.
- **Code**: Git repo (αυτό εδώ) → feature branch → automated tests
  (`npm test`) → PR → CI (GitHub Actions) → staging deploy (Vercel preview)
  → Prisma migration diff check → merge → production deploy. Καμία
  απευθείας αλλαγή πάνω σε production.

## Τι ΔΕΝ έχει χτιστεί ακόμα (βλ. STATUS.md)

Το UI (οθόνες), το πραγματικό REST API wiring, το πραγματικό MCP server
process, και οποιαδήποτε πραγματική βάση δεδομένων/hosting — αυτά
χρειάζονται λογαριασμούς/credentials εκτός του sandbox (βλ. STATUS.md
"WHAT NEEDS YOUR INPUT").
