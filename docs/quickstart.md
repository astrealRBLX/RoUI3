---
sidebar_position: 2
---

# Quick Start
Starting with the module is very simple but there are some advanced concepts you can learn to really push the limits of your UI animations. Let's learn the easiest way to play an animation.

## 1. Downloading the module
The RoUI3 plugin comes with a download button directly within the plugin itself that fetches the latest version of the module. This will place it into ReplicatedStorage.

## 2. Creating an animation
```lua
local RoUI3 = require(script.RoUI3) -- This is the RoUI3 animation module
local myAnimationModule = script.myAnimation -- This is the ModuleScript exported by the RoUI3 plugin

local myAnimation = RoUI3.new(myAnimationModule) -- Create a new animation
```

## 3. Setting a target
RoUI3 has no way to know where you want to actually use this animation. This is why we need to directly set a target.
```lua
myAnimation:SetTarget(script.Parent) -- Assuming the parent is the ScreenGui we animated in RoUI3
```

## 4. Playing the animation
With the target set we are ready to play the animation!
```lua
myAnimation:Play()
```
As you can see it's very easy to play RoUI3 animations but there is so much more that can be done.
