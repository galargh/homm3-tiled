# Heroes of Might & Magic 3 to Tiled Converter

### Prerequisites

Set `HOMM3_HOME` environmental variable to the path to your Heroes of Might & Magic 3 installtion path.

Example:
```
export HOMM3_HOME="~/Games/Heroes of Might and Magic 3 Complete"
```

### TODO

- [x] extract images, texts, campaigns, maps, `*.def`s, etc. from `*.lod`
- [x] extract images and Tiled compatible `*.json`s from `*.def`
- [x] parse `*.h3m`s to JSON format
- [x] parse `*.json`s describing maps to Tiled compatible `*.json`s
  - [x] include terrain image placements
  - [x] include terrain rotation
  - [x] include object placement
  - [x] include information about passable tiles and their relation to objects
  - [x] include information about active tiles and their relation to objects
  - [ ] ensure correct draw order (Tiled might not support the level of complexity HoMM3 requires; it's OK if some things have to be fixed manually)
- [ ] import a map into Phaser
- [ ] create single player
- [ ] add movement for a single player
- [ ] add object interaction
- [ ] add second player
- [ ] add player interaction
- [ ] create "castle" view from extracted images (?)
- [ ] ...

*NOTE*: Testing is performed on *Manifest Destiny* map only for now.