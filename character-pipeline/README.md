# Character asset build inputs

The two JSON files in this folder are the reproducible Ara 3D Gen parameter sets for the male and female Accra Life player base models. The workflow builds low-detail GLBs with the 65-bone game rig and only the Idle, Walk and Run clips. It is pinned to a specific upstream generator commit so model exports remain reproducible.

## Additional wardrobe export presets

The following parameter sets use garment, hair and shoe IDs confirmed in the pinned Ara 3D Gen source. They are complete-character GLB exports (not yet separate interchangeable garment meshes):

- `accra-player-male-northern-tunic.params.json`: long tunic + trousers + sandals, with Kente fabric treatment. This is a Northern-inspired tunic direction, **not yet a purpose-built Fugu/Batakari smock**.
- `accra-player-male-streetwear-braids.params.json`: oversized tee + baggy jeans + sneakers + procedural box braids.
- `accra-player-female-streetwear-braids.params.json`: same streetwear combination fitted to the female body + procedural box braids.
- `accra-player-female-ankara-peplum.params.json`: Ankara peplum + pencil skirt + long hair.
- `accra-player-female-aso-ebi.params.json`: lace top + maxi skirt + gele + cornrows.

### Build the GLBs

Run the GitHub Actions workflow **Build Accra Life character GLB assets** manually from the Actions tab. It checks out Ara 3D Gen at pinned commit `a4947ffdd14acf2ff018cb3568c941595f86d86e`, installs its dependencies, downloads the CC0 MakeHuman source pack, exports the five presets as GLB, and uploads them as the artifact `accra-life-character-glb-assets`.

The export workflow is separate from production. It does not replace the six existing GLBs, load anything into the live game, or merge PR #40. The resulting files must still be downloaded, inspected, checked for animation clips and file size, then added to the test crowd before production integration.

**Known gap:** Ara's current confirmed procedural hair choices include buzz, mohawk, cornrows and box braids, alongside its MakeHuman hair library. The broader 32-style Accra Life hairstyle catalogue remains a target list; not every listed style has a generated mesh yet. A dedicated Fugu/Batakari garment, Crocs-style clogs and Ghana-specific police uniform also remain to be modelled and exported.

