--[[

	RoUI3 Animation Module

	This module is used to control animations generated
	by the RoUI3 plugin. For full documentation please
	visit RoUI3's GitHub page.
	
	GitHub: https://github.com/astrealRBLX/RoUI3

]]

local TWEEN_SERVICE = game:GetService('TweenService')
local RUN_SERVICE = game:GetService('RunService')

local RoUI3 = {}
local AnimationControllerClass = {}
local AnimationClass = {}

type Array<T> = {[number]: T}
type Set<T> = {[T]: boolean}
type AnimationOptions = {
  TimeScale: number,
}

--[[
  Private function that generates tweens for an animation
]]
local function generateTweens(animation: AnimationController, target: GuiObject, timeScale: number?)
  local tweens: {[string]: Array<Tween>} = {}

  timeScale = timeScale or 1

  -- Get keyframe groups
  local keyframeGroups: Array<Folder> = {}
  for _, group in animation:GetChildren() do
    keyframeGroups[tonumber(group.Name:sub(11)) + 1] = group
  end

  -- Generate tweens
  for index, group in keyframeGroups do
    for _, keyframe: Keyframe in group:GetChildren() do
      local position: number = keyframe.Time
      local value: any = keyframe:GetAttribute('Value')
      local property: string = keyframe:GetAttribute('Property')
      local easingStyle: string = keyframe:GetAttribute('EasingStyle')
      local easingDirection: string = keyframe:GetAttribute('EasingDirection')

      if not tweens[property] then
        tweens[property] = {}
      end

      local tweenTime: number
      if index == 1 then
        tweenTime = position * timeScale
      else
        local lastGroup: Folder = animation:FindFirstChild('keyframes_' .. index - 2)
        local lastKeyframe: Keyframe = lastGroup:FindFirstChild(keyframe.Name)

        tweenTime = (position - lastKeyframe.Time) * timeScale
      end

      local tweenInfo = TweenInfo.new(tweenTime, Enum.EasingStyle[easingStyle], Enum.EasingDirection[easingDirection])
      local goal = {
        [property] = value
      }

      table.insert(tweens[property], TWEEN_SERVICE:Create(target, tweenInfo, goal))
    end
  end

  return tweens
end

--[[
  Creates a new RoUI3 animation controller
]]
function RoUI3.new()
  local self = setmetatable({}, {
    __index = AnimationControllerClass
  })

  self.Animations = {}

  return self
end

--[[
  Loads an animation into the controller to be used later
]]
function AnimationControllerClass:LoadAnimation(animation: AnimationController, target: GuiObject)
  local this = setmetatable({}, {
    __index = AnimationClass
  })

  this.Animation = animation
  this.Target = target
  this.Tweens = generateTweens(animation, target)
  this.ActiveTweens = {} :: Array<Tween>
  this.Active = false
  this.Paused = Instance.new('BoolValue')
  this.Cancelled = Instance.new('BoolValue')

  self.Animations[animation.Name] = this

  return this
end

--[[
  Plays all animations loaded into this controller
]]
function AnimationControllerClass:PlayAll(options: AnimationOptions?)
  for _, animation in pairs(self.Animations) do
    animation:Play(options)
  end
end

--[[
  Play/resume an animation
]]
function AnimationClass:Play(options: AnimationOptions?)
  if self.Active then
    -- Resume an active animation
    if self.Paused.Value then
      self.Paused.Value = false
    end
    return
  end

  options = options or {}

  local tweens = if options.TimeScale then generateTweens(self.Animation, self.Target, options.TimeScale) else self.Tweens

  self.Active = true

  for _, propertyTweens: Array<Tween> in tweens do
    coroutine.wrap(function()
      for _, tween in propertyTweens do
        if self.Cancelled.Value then
          self.Cancelled.Value = false
          self.Paused.Value = false
          break
        end

        table.insert(self.ActiveTweens, tween);
        tween:Play();

        -- Handle pausing
        local pauseConn = self.Paused.Changed:Connect(function(value)
          if value then
            tween:Pause()
          else
            tween:Play()
          end
        end)

        -- Handle cancelling
        local cancelConn = self.Cancelled.Changed:Connect(function(value)
          if value then
            tween:Cancel()
          end
        end)

        tween.Completed:Wait()

        -- Clean up when the tween concludes
        table.remove(self.ActiveTweens, table.find(self.ActiveTweens, tween))
        tween:Destroy()
        pauseConn:Disconnect()
        cancelConn:Disconnect()

        if #self.ActiveTweens == 0 then
          self.Active = false
        end
      end
    end)()
  end
end

--[[
  Pause an animation
]]
function AnimationClass:Pause()
  self.Paused.Value = true
end

--[[
  Yield the current thread until an animation concludes
]]
function AnimationClass:Wait()
  if not self.Active then
    warn('RoUI3 | Animation \'' .. self.Animation.Name .. '\' is not currently playing and cannot be yielded for')
    return
  end

  repeat
    RUN_SERVICE.RenderStepped:Wait()
  until not self.Active
end

--[[
  Cancel an animation during playback
]]
function AnimationClass:Cancel()
  if not self.Active then
    warn('RoUI3 | Animation \'' .. self.Animation.Name .. '\' is not currently playing and cannot be cancelled')
    return
  end

  self.Cancelled.Value = true
end

--[[
  Skip to the end of an animation
]]
function AnimationClass:Finish()
  self:Cancel()
  
  local propertiesFound: Set<string> = {}
  local propertyValues: {[string]: any} = {}

  for i = #self.Animation:GetChildren() - 1, 0, -1 do
    local keyframeGroup: Folder = self.Animation:FindFirstChild('keyframes_' .. tostring(i))

    for _, keyframe: Keyframe in keyframeGroup:GetChildren() do
      local property = keyframe:GetAttribute('Property')
      if not propertiesFound[property] then
        propertiesFound[property] = true
        propertyValues[property] = keyframe:GetAttribute('Value')
      end
    end
  end

  for property, value in propertyValues do
    self.Target[property] = value
  end
end

return RoUI3