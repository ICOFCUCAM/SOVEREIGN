# The console — fifty refinements (C1–C50)

Owner brief: "fifty autonomous premiumization, upgrade and polishing commits of the console; push after every 25".
The console keeps its own navy ink and emerald (owner: "this was better", against a graphite trial that was
dropped before any push). Every change below works inside that identity; the homepage command board is untouched.

## Navigation and orientation
- **C1** A new page opens at its top (the workspace kept the last page's scroll on revisits).
- **C2** Every page names its browser tab ("Check Readiness · ExitOS"); the site's title returns on sign-out.
- **C3** Command palette, ⌘K / Ctrl+K, over every page the role can reach; **C34** recent pages first; **C39** actions (terms, page tips, sign out).
- **C13** The menu fades at its scrolling edges; **C38** it keeps the current page in sight.
- **C29** The market ribbon and layer sub-navigation fade where they run past the edge.
- **C47** The ExitOS mark leads to the role's home.
- **C49** The command layers list only what the role can open (buyers were offered founder desks that bounced them home).

## Correctness
- **C4** Amber 100/200 were used but never defined, so six notices and states rendered in the inherited colour.
- **C16** Full-width bars (`Bar width="w-full"`) resolved to 0 px: ten readiness bars, three on Exit Overview and one on Recommended Actions drew nothing.
- **C26** The Inbox re-matches buyer mandates when the company's figures change (and the repository's last lint warning is gone).
- **C15** The note explaining the disabled 'List on the exchange' sits beneath its button.
- **C45** The acquirer-mix chart's "Private Equity" label was clipped; **C14**, **C46** dates, prices, sources and score parts no longer break mid-figure.

## Words, not codes
- **C17** Engine function names as eyebrows ('RUNDUEDILIGENCE', 'MATCHBUYERSTOLISTING').
- **C18** The Bid Room's stage ('loi' → 'LOI').
- **C19–C23** A `lib/labels` helper: visibility, readiness bands, buyer types ('PE', not 'Pe'), sectors (one name each), outreach routes, NDA shapes, appetite, document kinds; **C20** Exit Overview's company line.
- **C42** The generated CIM ('a logistics business operating in…', 'modular monolith').
- **C44** Counts agree with their nouns ('1 consistency flag').

## Feel
- **C8** One drawn lock instead of the 🔒 emoji; **C25** one drawn close mark (and a name for the composer's close).
- **C9** Toasts are announced and rise in; **C10** dialogs settle in and keep their scrolling; **C11** buttons answer a press.
- **C27, C28** A shared empty state that says what will fill the panel (Inbox, Activity, Buyers, the registry).
- **C35** Drop a file on a Data Room package to upload it.
- **C36** The Bid Room's lines show their thousands.
- **C37** Emerald selection and a quiet workspace scrollbar; **C41** the account's initials; **C43** the Document Generator's actions in one size.

## Access and devices
- **C5** Skip link past the sidebar and header bars; **C6** the phone menu behaves as a dialog.
- **C7** Sign-in autofill hints, focus and a password reveal; **C31** a way back to the site and a titled tab.
- **C12** Still status dots under reduced motion; **C33** one focus mark across the console.
- **C24** Small shared labels raised to AA contrast (6.1–6.2:1); **C48** page loading is announced.
- **C30** Page tips read as a line on phones; **C32** the phone browser bar takes the console's ink.
- **C40** An expired session says why on the sign-in screen.

## Not done
- A console print stylesheet was tried and dropped: the wide workstations clip on paper, and every desk already offers its own report PDF.

## Checks (C50)
tsc and the console's tests at every commit (261 at the end, from 252); the engines' tests 178/178 after C42;
eslint with no errors or warnings; build; the homepage board and ribbon identical; all 40 console routes swept at
390 and 1440 px with no overflow and no page errors; the palette, layers, drawer, skip link, expiry and drop
upload exercised in Chromium.
