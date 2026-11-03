# My Golden Brick motion prototype

Route: `/prototype/motion`, also served at `/` by a rewrite in `web/next.config.ts`. Disposable, for visual review. Full landing page integration waits on that review.

## The idea

Gold means someone asked.

The world is a wet brick plain at blue hour, the time of day real estate photographers wait for because lit
windows make a house feel lived in. Everything is clay and dusk except one colour. Gold appears only as the
brand's brick and as a buyer's inquiry, which gives the company's name a literal meaning.

1. A gold brick falls and lands. The plain answers: hills and a lit town rise out of the impact.
2. You type a name. It rises from the ground as lit city blocks, and the headline steps aside for it.
3. The bricks that made your name turn over, one by one, and the agent's site is on their other side.
4. A buyer asks. The inquiry becomes a gold brick, flies across, and lands in the agent's leads.
5. Back overhead at night, each sample you sent is a gold brick set into your name.

Line used: "Build on your name." The brief's "Your business takes shape around your name" is what the page
does, so the headline can stay shorter.

## Concept not chosen

A monumental brick wall facing the viewer, the name in relief. Easiest to read, and simplest to turn into a
website, but flat: closer to a poster than a place, with nothing to explore. The plain has the same legibility
once the camera rises.

## What was studied, live, in Chrome

Observed:
- Igloo: pale ground, tiny scrambling text loader, then a wireframe draws itself and an igloo assembles from
  bricks. Bricks lift as you move. One continuous camera falls through a single-material world. Tiny mono labels,
  a sound toggle. Scroll is taken over: the document is exactly one viewport tall.
- Lusion: black counter loader, then one family of glossy objects in three colours that physically shoves away
  from the pointer, framed inside a calm layout. Scroll also taken over.
- Lando Norris: a personal mark does the work. A signature scrawls across the type, colour grounds flip by section.
- Linear: native scrolling, and each section shows one job through real-looking interface fragments.

Assumed, not confirmed:
- Igloo relies on baked assets. Its network traffic shows Draco geometry, KTX2 textures and an EXR map, but how
  they were authored is a guess. It is why this prototype spends its effort on light and atmosphere instead.

Borrowed as principles:
- From Igloo: one camera through one world, and a world made of one material.
- From Lusion: objects that answer the pointer immediately. A strict palette.
- From Lando Norris: the person's name as the identity.
- From Linear: show the product doing its job, in its real interface.

Deliberately not copied: taking over the scroll, blocking loaders, mono all-caps labels, Igloo's dome and palette.

Supporting patterns: Mobbin's inbox screens (Quo, Plain) informed the flat list with an unread marker. 21st.dev's
search works, but its component code is paid and nothing there beat the app's own components, so none was bought.

## How it is built

- Plain WebGL2 in one lazily loaded chunk (`engine.ts`, about 20 KB gzipped). No 3D library, no new dependencies.
- One draw call of instanced bricks. Heights run on a spring simulation in JavaScript.
- Soft shadows and contact shading are worked out from the height map, so they cost the same however many bricks
  there are.
- The page is an ordinary document with native scrolling. The world only reads the scroll position, so scrolling
  back plays everything in reverse.
- Text, forms and controls are plain HTML. Nothing in the demo touches the database or the network.
- `mosaic.ts` paints each panel's real layout onto a canvas, so the picture on the bricks is the page that replaces them.

## When things go wrong

- Reduced motion: an ordinary page, nothing pinned, a still world that shows the right part of the story.
- No WebGL, lost graphics, or graphics running on the CPU: the still poster, the name as large text, everything
  still works. A frame watchdog does the same on hardware too slow to keep up.
- Pause control in the header.

## Query parameters for testing

- `?intro=rest`: skip the opening. `?intro=hold`: freeze its first frame.
- `?gl=off`: force the graphics fallback. `?software=try`: skip the software-graphics check, so the frame watchdog
  has to catch it.
- `?tier=low` or `?tier=high`: force the lighter or fuller world.

## Assets needing production

- 3D artwork is procedural. A modeller could improve the hero gold brick most, with a real bevel and engraved logo.
  The current one is a shaded box.
- `web/public/prototype/home-dusk.jpg` is an Unsplash sample photo. Replace or license-check before launch.
- The logo is a 128 px PNG. It needs a vector version for large use.
- `web/public/prototype/poster-*.jpg` are captures of the live scene. Re-capture whenever its look changes.

## The block figure

Mike Bjork stands in the world as about 2,500 small blocks (`figure.ts`), lit by the same dusk as the bricks,
with a shadow worked out directly because he is too slim for the height-map shadow to catch. He is drawn from
his portrait, which is reference only: the photo itself is not shipped.

- After the opening he walks to the gold brick, lifts it overhead, puts it back and walks home. This plays once
  by itself, and again whenever someone hovers over him or taps him. Hovering while he holds it keeps it up.
- It doesn't play by itself if the visitor has already typed or scrolled, and never with reduced motion.
- The routine is a plain function of time (`poseAt`), tested for smoothness and for the brick staying in his hands.
