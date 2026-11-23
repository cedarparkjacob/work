# eSchoolPLUS Toolkit

A unified launcher for the four bookmarklet tools in this folder.

## Install the bookmarklet

1. Create a browser bookmark.
2. Name it **eSchoolPLUS Toolkit**.
3. Set its URL to the complete one-line code in [bookmarklet.txt](./bookmarklet.txt).
4. Open eSchoolPLUS TAC and click the bookmark.

The launcher opens a menu with Seating Chart, One Pager, Rosters, and Flashcards. Choose a tool to load its existing `main.js` source. The four modules remain separate so they can be maintained independently.

Click the bookmarklet again to reopen the menu. The menu's × closes it.

## Source layout

- `SeatingChart/main.js`
- `OnePager/main.js`
- `Rosters/main.js`
- `Flashcards/main.js`

The launcher loads module files from this repository's `main` branch. Updates are picked up on the next launch (cache-busted).

## Notes

- Run this on the eSchoolPLUS TAC page where the tools' expected roster/student elements are available.
- The launcher does not replace or rewrite the existing tool code.
- Each module runs in its own function scope to prevent top-level variable-name collisions.
