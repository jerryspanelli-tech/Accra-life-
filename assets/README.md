# Shared game assets

This folder contains shared asset factories and reusable model/material construction APIs.

- accra-assets.js — Babylon.js factory for reusable Accra-style characters, buildings, vehicles and props.

The game page loads this module before systems that consume the global AccraAssets API. Model and media URLs inside the module, if added later, must remain relative to the game page unless explicitly changed.
