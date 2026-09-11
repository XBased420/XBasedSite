# XBased terminal redesign — concept directions

Direction A was selected for production. The original three-way comparison remains
available at `public/terminal-lab.html`; the production implementation now lives in
`src/render.mjs`, `public/styles.css`, and `public/site.js`.

## What stays true

- Xavier builds practical websites, booking systems, and small automations.
- The site still needs to show proof, explain starting prices, and collect a
  project request.
- The interface must remain readable on a phone, usable with a keyboard, and
  understandable to someone who has never played a Fallout game.
- The direction borrows the feeling of an old in-world terminal—phosphor,
  constrained displays, system language, and tactile controls—without copying
  Fallout names, art, type, or screen layouts.

## Direction A — Civic systems console (recommended)

The visitor enters a municipal service terminal that Xavier has repurposed. A
persistent directory makes the whole site feel like one machine rather than a
stack of landing-page sections.

**Palette**

- Reactor black `#040704`
- Console glass `#091109`
- Phosphor `#9BE892`
- Dim phosphor `#527B54`
- Housing brown `#322E22`
- Alert amber `#F3B85B`

**Type**

- Cascadia Code / Consolas: every interactive and editorial surface
- Space Grotesk: tiny hardware stamps only

**Layout**

```text
┌ SYSTEM BAR ──────────────────────────────────────────────┐
│ DIRECTORY       │ ACTIVE RECORD                          │
│ > HOME          │ XBASED SERVICE TERMINAL               │
│   WORK          │                                       │
│   SERVICES      │ Plain-language promise + typed prompt │
│   RATES         │                                       │
│   NEW CONTRACT  │ [ OPEN PROJECT REQUEST ]              │
│                 │                                       │
│ machine status  │ latest work / availability            │
└──────────────────────────────────────────────────────────┘
```

Everything is left aligned. The directory is structural navigation, not
decoration. One slow boot sequence is the memorable motion; active use is fast.

## Direction B — Mojave field relay

This version feels like a portable machine assembled for field use. It leads
with evidence: project dossiers, service coordinates, and a prominent current
availability channel.

**Palette**

- Charcoal `#17120C`
- Burnt glass `#241A0E`
- Amber `#F1B95C`
- Dust `#9D7A47`
- Warning red `#D95B45`
- Paper `#E7D0A1`

**Type**

- Cascadia Code / Consolas: display and controls
- Manrope: longer case-study descriptions

**Layout**

```text
┌ RELAY ID / SIGNAL / LOCAL TIME ──────────────────────────┐
│ XBASED.FIELD          │ OPEN DOSSIER                     │
│ websites from the     │ ELIZABETH LOYA                   │
│ problems people have  │ problem / build / status         │
│                       │                                  │
│ [ TRANSMIT A BRIEF ]  ├──────────────────────────────────┤
│                       │ dossier index / starting rates   │
└──────────────────────────────────────────────────────────┘
```

The asymmetry is intentional: the sales message is quiet and the work record is
the dominant visual object.

## Direction C — Contract uplink

The whole site is framed as a short conversation with the machine. It is the
most conversion-focused option: one booking question appears at a time, while
proof and pricing remain available as commands.

**Palette**

- Graphite `#070B0B`
- Cold glass `#0C1716`
- Ice phosphor `#B8F4E8`
- Signal teal `#4DD8C2`
- Inactive `#617A76`
- Error coral `#FF745E`

**Type**

- Cascadia Code / Consolas throughout
- Space Grotesk for the large XBASED identifier

**Layout**

```text
┌ XBASED UPLINK / STEP 01 OF 04 ───────────────────────────┐
│                                                         │
│ What are you trying to put online?                      │
│ > [ cursor                                              │
│                                                         │
│ [ CONTINUE ]                      VIEW WORK / VIEW RATES │
│                                                         │
│ transcript: name → contact → need → budget              │
└─────────────────────────────────────────────────────────┘
```

This is the strongest booking experience but the least traditional portfolio.
It should only become the main direction if reducing the site to a guided intake
feels right for the brand.

## Self-critique and revision

The obvious version of this brief is black, neon green, scanlines, and random
terminal jargon. That would be atmosphere without a point of view. The revised
concepts use terminal conventions to express three different information
architectures. Scanlines are very faint, borders indicate real machine regions,
labels describe actual state, and the writing stays understandable. No fake
glitches, fake security warnings, or game-specific lore are used.
