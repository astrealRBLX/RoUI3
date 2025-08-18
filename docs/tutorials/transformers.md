# Keyframe Transformers

## Transforming Keyframes
RoUI3's animation module allows you to dynamically map keyframe values at runtime. This is an extremely powerful feature that, when combined with other tools like animation templates, can make your animations super flexible.

Let's look at the grow animation from earlier. We know that it acts as a template and is reusable on other instances and that the animation itself just grows a GuiObject by 5 pixels in both the X and Y offset. If we want to make a hover animation where the object grows when you hover and then shrinks when you leave you would normally have to go back into the RoUI3 plugin and make a whole new animation. This is tedious and annoying but what if we could just use our existing grow animation? With a keyframe transformer that's exactly what you can do.

We're going to create a brand new shrink animation from our existing grow animation module. We set the targets like we normally would but now here is where things change a little.
```lua
local growAnimation = RoUI3.new(growAnimationModule)
local shrinkAnimation = RoUI3.new(growAnimationModule)

growAnimation:SetTarget(screenGui.Frame)
shrinkAnimation:SetTarget(screenGui.Frame)
```

Remember how our grow animation grows a GuiObject by 5 pixels? Our keyframe transfomer here just takes those 5 pixels and makes them negative and returns that newly calculated change. Now our grow animation adds 5 pixels and our shrink animation subtracts 5 pixels. The transformer is called when keyframe values are calculated which is done when the animation is preloaded. 

```lua
shrinkAnimation:UseKeyframeTransformer(function(delta: UDim2)
	return UDim2.new(0, -delta.X.Offset, 0, -delta.Y.Offset)
end)
```

Below we finally just bind our grow and shrink events to create a clean hover growing & shrinking effect.

```lua
shrinkAnimation:PreloadAnimation()

growAnimation:BindToEvent('MouseEnter', screenGui.Frame)
shrinkAnimation:BindToEvent('MouseLeave', screenGui.Frame)
```

If you don't manually call `:PreloadAnimation()` then RoUI3 will call it whenever you attempt to play an animation with `:Play()`. It's worth noting that if you are transforming keyframes in any way with a template animation you should call `:PreloadAnimation()` when the properties of the instance are exactly as you want them to start out as.