# hero-video

Custom **hero** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

Full-screen home hero: desktop Scene7 video (row 1), mobile Scene7 video (row 2), and text paragraphs (row 3). Videos autoplay muted, loop and play inline; the poster image in each media row shows until the video plays. The block swaps to the mobile video below 900px.

| Row | Cells |
| --- | --- |
| 1 | Desktop video: Scene7 link TIB-Reel-Home-tardor-2026-Master-0x720-3000k (poster TIB-Reel-Home-tardor-2026-Master-AVS) |
| 2 | Mobile video: TIB-Reel-Home-tardor-2026-mobile (poster TIB-Reel-Home-tardor-2026-mobile-AVS) |
| 3 | Paragraph 'It's mushroom season.' + paragraph 'Or autumn, as some people call it.' |

Base hero is media row + content row; the variant adds a second media row for the mobile source. No heading: the lines are paragraphs.

## When to use

Use for a full-bleed video hero with no heading. For an image or single-video banner with a title and CTA, use hero-banner.
