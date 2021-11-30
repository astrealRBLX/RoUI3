# RoUI3 (In Development)

[![Install](https://img.shields.io/badge/install-RoUI3-inactive?style=flat-square)](#)
[![Version](https://img.shields.io/github/package-json/v/astrealRBLX/RoUI3?color=blueviolet&style=flat-square)](#)
[![LastCommit](https://img.shields.io/github/last-commit/astrealRBLX/RoUI3?color=green&style=flat-square)](#)
[![GitHub](https://img.shields.io/github/license/astrealRBLX/RoUI3?style=flat-square)](#)


[![Discord](https://img.shields.io/discord/826998257548132373?label=discord&style=flat-square)](https://discord.gg/adX793grNf)
[![Twitter](https://img.shields.io/twitter/follow/astrealdev?color=blue&style=flat-square)](https://twitter.com/intent/follow?original_referer=https%3A%2F%2Fpublish.twitter.com%2F&ref_src=twsrc%5Etfw%7Ctwcamp%5Ebuttonembed%7Ctwterm%5Efollow%7Ctwgr%5Eastrealdev&region=follow_link&screen_name=astrealdev)

Create beautiful animations for your Roblox GUIs with RoUI3, a user-friendly and feature-rich Roblox Studio plugin.

The successor to RoUI2, this plugin is foundationally the same yet contains a surplus of new features, a reworked codebase, and a completely overhauled look.

## Timeline Overview

RoUI3's primary plugin widget is known as the Timeline. The Timeline allows you to animate your GUIs quickly and exactly the way you want.

![Timeline Overview](assets/TimelineOverview.png)

## Installation

A stable release of RoUI3 is not currently available as it is still in development. However, you may compile RoUI3 yourself using [roblox-ts](https://roblox-ts.com/) for an experimental build.

<!-- You can install the latest stable release of RoUI3 directly from the Roblox marketplace [here](#). Alternatively, you can compile the source yourself using [roblox-ts](https://roblox-ts.com/) for the most recent and experimental version. -->

## Roadmap

This is RoUI3's roadmap for every major and minor release and beyond!

| Icon | Meaning           |
|------|-------------------|
| ✔️  | Completed         |
| 🔜  | In Progress       |
| ❔   | Being Reviewed    |
| ❌  | Incomplete        |


### Release v1.0.0

The initial release of RoUI3! 🥳

- ✔️ Start widget
- 🔜 Timeline widget
  - 🔜 Topbar
    - ✔️ Scrubber time textbox
    - ✔️ Max time textbox
    - ✔️ Add property dropdown menu
    - ❔ Save/export animation button
    - ❌ Selected keyframe options
      - ❌ Current time position textbox
      - ❌ Frequency / damping ratio textboxes for springs
      - ❌ Easing style / direction dropdown menus for tweens
    - ❌ Preview button
    - ❌ Scrubber automatic preview toggle button
  - 🔜 Timeline content
    - 🔜 Property list
      - ✔️ Dynamic rendering based on app state
      - ❔ Delete property with right-click context menu
    - ✔️ Timestamp header
      - ✔️ Dynamic timestamps based on max animation time
      - ✔️ Click to jump scrubber to position
    - 🔜 Scrubber
      - ✔️ Drag to update time
      - ✔️ `SHIFT` toggles snap mode while dragging
        - ✔️ Snap to keyframes
        - ✔️ Snap to timestamps
      - ❌ Preview keyframes based on scrubber time
    - 🔜 Timeline pane
      - ✔️ Dynamic keyframe rendering based on app state
      - ❔ Keyframes
        - ❔ Selection support
        - ❌ Right-click context menu
          - ❌ Delete keyframe
          - ❌ Set keyframe type to spring or tween
        - ❌ `CTRL` click support for selecting multiple keyframes
        - ❌ Long press support for moving a keyframe
- ❌ Exporting
  - ❌ Data serialization
- ❌ Importing
  - ❌ Data deserialization
- ❌ Animation controller module
  - ❌ Play an animation
  - ❌ Support animation options
    - ❌ Speed scale
    - ❌ Reverse
  - ❌ Pause an animation
  - ❌ Skip to end of an animation
  - ❌ Reusable animations
