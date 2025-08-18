--!strict

local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")

local Types = require("./Types")
local Deserializer = require("./Deserializer")
local Track = require("./Track")
local Marker = require("./Marker")

type Array<T> = Types.Array<T>
type RoUI3Animation = Types.RoUI3Animation

--[=[
	@class RoUI3Animation

	A RoUI3 animation class.
]=]
local class = {}
local classMetatable = table.freeze({ __index = class })

local function getInstancesToAnimate(asTemplate: boolean, target: Array<Instance>): Array<Instance>
	local instances: Array<Instance> = {}

	if asTemplate then
		instances = target
	else
		instances = target[1]:GetDescendants()
	end

	return instances
end

--[=[
	Creates a new RoUI3 animation object from an exported RoUI3 animation module script.

	@within RoUI3
	@function new
	@param module ModuleScript
	@return RoUI3Animation
]=]
local function Animation(module: ModuleScript): RoUI3Animation
	local jsonString = require(module) :: string
	local data = HttpService:JSONDecode(jsonString) :: Types.RoUI3Output

	return setmetatable({
		_data = if data.template then data :: Types.RoUI3OutputTemplate else data,
		_preloaded = false,
		_playing = false,
		_paused = Instance.new("BoolValue"),
		_canceled = Instance.new("BoolValue"),
		_activeTweens = {},
		_cachedProperties = {},
		_tracks = {},
		_instances = {},
		_events = {},
		_target = {},
		_template = data.template,
		_markers = {},
		_completed = function() end,
		_transformer = function(value)
			return value
		end,
		_options = {
			PlaybackSpeed = 1,
			ResetOnCompletion = false,
		},
	}, classMetatable) :: any
end

--[=[
	Sets a keyframe transformer to use that alters keyframe values when they are generated
	via [:PreloadAnimation()](RoUI3Animation#PreloadAnimation). As a result
	you must set the transformer before any preloading is done or the keyframe's values
	will never be properly mapped.

	@within RoUI3Animation
	@method UseKeyframeTransformer
	@param transformer RoUI3KeyframeTransformer
]=]
function class.UseKeyframeTransformer(self: RoUI3Animation, transformer: Types.RoUI3KeyframeTransformer)
	self._transformer = transformer
end

--[=[
	Preloads an animation by internally generating it's tracks, keyframe values, and tweens.

	@within RoUI3Animation
	@method PreloadAnimation
]=]
function class.PreloadAnimation(self: RoUI3Animation)
	if self._preloaded then
		return
	end

	local instances = getInstancesToAnimate(self._template, self._target)

	for _, instance in instances do
		local id = if self._template then "__template__" else Deserializer.getInstanceId(instance)
		local allKeyframes = Deserializer.getInstanceExportKeyframes(self._data, id)

		if id and allKeyframes then
			-- Cache properties
			if not self._cachedProperties[id] then
				self._cachedProperties[id] = {}
			end

			-- Create tracks & add keyframes
			local tracks: { [string]: Types.RoUI3Track } = {}

			for _, keyframe in allKeyframes do
				if not tracks[keyframe.property] then
					tracks[keyframe.property] = Track(keyframe.property, self._template)
				end

				tracks[keyframe.property]:AddKeyframe(keyframe)

				if not self._cachedProperties[id][keyframe.property] then
					self._cachedProperties[id][keyframe.property] = (instance :: any)[keyframe.property]
				end
			end

			-- Make tweens for each track
			for _, track in tracks do
				track:LoadValues(instance, self._transformer)
				track:MakeTweens(instance, self._options)
			end

			self._tracks[id] = tracks
		end
	end

	self._preloaded = true
end

--[=[
	Sets the options to use when the animation is played and returns the updated animation.

	@within RoUI3Animation
	@method WithOptions
	@param options RoUI3AnimationOptions
	@return RoUI3Animation
]=]
function class.WithOptions(self: RoUI3Animation, options: Types.RoUI3AnimationOptions): RoUI3Animation
	options.PlaybackSpeed = options.PlaybackSpeed or 1
	options.ResetOnCompletion = options.ResetOnCompletion or false

	self._options = options

	return self
end

--[=[
	Binds an event of a trigger instance to play an animation. Can pass an optional callback
	to be called when the event is triggered. If you do pass this paremeter you must `:Play()` the
	animation yourself. Returns a function that can be used to clean up the event connection.

	@within RoUI3Animation
	@method BindToEvent
	@param event string
	@param trigger Instance
	@param callback (() -> ())?
	@return () -> ()
]=]
function class.BindToEvent(self: RoUI3Animation, event: string, trigger: Instance, callback: (() -> ())?): () -> ()
	if #self._target == 0 then
		return function() end
	end

	if not self._events[event] then
		self._events[event] = {}
	end

	local handler = callback or function()
		self:Play()
	end

	table.insert(self._events[event], {
		_connection = (trigger :: any)[event]:Connect(handler) :: RBXScriptConnection,
		_callback = callback or function() end,
	})

	local index = #self._events[event]

	return function()
		self._events[event][index]._connection:Disconnect()
		table.remove(self._events[event], index)
	end
end

--[=[
	Sets a callback to be called when the animation completes playing.

	@within RoUI3Animation
	@method Completed
	@param callback () -> ()
]=]
function class.Completed(self: RoUI3Animation, callback: () -> ())
	self._completed = callback
end

--[=[
	Makes a marker that has its callback executed when the given time
	is reached.

	@within RoUI3Animation
	@method MakeMarker
	@param id string
	@param at number
	@param callback () -> ()
]=]
function class.MakeMarker(self: RoUI3Animation, id: string, at: number, callback: () -> ())
	local marker = Marker(id, at, callback)

	table.insert(self._markers, marker)
end

--[=[
	Removes a marker from the given id.

	@within RoUI3Animation
	@method RemoveMarker
	@param id string
]=]
function class.RemoveMarker(self: RoUI3Animation, id: string)
	local indexToDelete: number

	for index, marker in self._markers do
		if marker._id == id then
			indexToDelete = index
			break
		end
	end

	if indexToDelete then
		table.remove(self._markers, indexToDelete)
	end
end

--[=[
	Sets a target that the animation will execute upon when played. For
	standard animations your target should be the ScreenGui you edited
	when creating your animation with the RoUI3 plugin.

	**Warning:** If your animation is a template animation this method will
	replace all other targets.

	@within RoUI3Animation
	@method SetTarget
	@param target Instance
]=]
function class.SetTarget(self: RoUI3Animation, target: Instance)
	self._target = { target }
end

--[=[
	Adds a target that the animation will execute upon when played. Can
	only be used in template animations.

	
	@tag Template Animation Only
	@within RoUI3Animation
	@method AddTarget
	@param target Instance
]=]
function class.AddTarget(self: RoUI3Animation, target: Instance)
	if not self._template then
		return
	end

	table.insert(self._target, target)
end

--[=[
	Plays an animation.

	@within RoUI3Animation
	@method Play
]=]
function class.Play(self: RoUI3Animation)
	if self._playing then
		if self._paused.Value then
			self._paused.Value = false
		end

		return
	end

	if not self._preloaded then
		self:PreloadAnimation()
	end

	local instances = getInstancesToAnimate(self._template, self._target)

	for _, instance in instances do
		local id = if self._template then "__template__" else Deserializer.getInstanceId(instance)

		if id and self._tracks[id] then
			self._instances[id] = instance

			local remainingTweens = 0
			local elapsedAnimationTime = 0
			local whilePlayingConnection: RBXScriptConnection

			for _, track in self._tracks[id] do
				remainingTweens += #track:GetTweens()
			end

			for property, track in self._tracks[id] do
				self._playing = true

				if not whilePlayingConnection then
					whilePlayingConnection = RunService.RenderStepped:Connect(function(dt)
						if not self._playing then
							return
						end

						if self._paused.Value or self._canceled.Value then
							return
						end

						for _, marker in self._markers do
							if marker._wasCalled then
								continue
							end

							if
								marker._time >= (elapsedAnimationTime - 0.01)
								and marker._time <= (elapsedAnimationTime + 0.01)
							then
								marker._callback()
								marker._wasCalled = true
							end
						end

						elapsedAnimationTime += dt
					end)
				end

				-- Spawn a thread for each track played
				task.spawn(function()
					for _, tween in track:GetTweens() do
						table.insert(self._activeTweens, tween)

						-- Make sure we are actually playing the animation and not paused or canceled
						if self._playing and not self._paused.Value and not self._canceled.Value then
							tween:Play()
						end

						-- Handle pausing
						local pauseConn = (self._paused :: BoolValue).Changed:Connect(function(paused)
							if paused then
								tween:Pause()
							else
								tween:Play()
							end
						end)

						-- Handle canceling
						local cancelConn = (self._canceled :: BoolValue).Changed:Connect(function(canceled)
							if canceled then
								tween:Cancel()
							end
						end)

						tween.Completed:Wait()

						-- Clean up when the tween finishes
						table.remove(self._activeTweens, table.find(self._activeTweens, tween))
						tween:Destroy()
						pauseConn:Disconnect()
						cancelConn:Disconnect()

						remainingTweens -= 1

						-- Clean up when all tweens finish
						if self._canceled.Value or remainingTweens == 0 then
							if whilePlayingConnection then
								whilePlayingConnection:Disconnect()
							end

							self._playing = false
							self._paused.Value = false
							self._canceled.Value = false

							table.clear(self._instances)

							for _, marker in self._markers do
								marker._wasCalled = false
							end

							if self._options.ResetOnCompletion then
								self:Reset()
							end

							self._completed()
						end
					end
				end)
			end
		end
	end
end

--[=[
	Pauses an animation.

	@within RoUI3Animation
	@method Pause
]=]
function class.Pause(self: RoUI3Animation)
	self._paused.Value = true
end

--[=[
	Resumes a paused animation.

	@within RoUI3Animation
	@method Resume
]=]
function class.Resume(self: RoUI3Animation)
	self._paused.Value = false
end

--[=[
	Returns if an animation is paused.

	@within RoUI3Animation
	@method IsPaused
	@return boolean
]=]
function class.IsPaused(self: RoUI3Animation)
	return self._paused.Value
end

--[=[
	Yields the current thread until a playing animation concludes.

	@within RoUI3Animation
	@method Wait
	@yields
]=]
function class.Wait(self: RoUI3Animation)
	if not self._playing then
		return
	end

	repeat
		RunService.RenderStepped:Wait()
	until not self._playing
end

--[=[
	Cancels an animation.

	@within RoUI3Animation
	@method Cancel
]=]
function class.Cancel(self: RoUI3Animation)
	if not self._playing then
		return
	end

	self._canceled.Value = true
end

--[=[
	Finishes an animation by jumping to the value of the last keyframe of every track.

	@within RoUI3Animation
	@method Pause
]=]
function class.Finish(self: RoUI3Animation)
	self:Cancel()

	for id, instance in self._instances do
		local tracks = self._tracks[id]

		for property, track in tracks do
			(instance :: any)[property] = track._values[#track._values]
		end
	end
end

--[=[
	Resets all targets to their initial states before the animation played. The
	initial state used is cached whenever [:PreloadAnimation()](RoUI3Animation#PreloadAnimation) is called.

	@within RoUI3Animation
	@method ResetTargets
]=]
function class.ResetTargets(self: RoUI3Animation)
	for _, instance in getInstancesToAnimate(self._template, self._target) do
		local id = if self._template then "__template__" else Deserializer.getInstanceId(instance)

		if id and self._cachedProperties[id] then
			for property, value in self._cachedProperties[id] do
				(instance :: any)[property] = value
			end
		end
	end
end

--[=[
	Resets almost the entire animation's state so it can be reused. The following is preserved
	when this method is called:
	1. Targets
	2. Animation Options
	3. Set Keyframe Transformer
	4. Bound Events
	5. Completed Callback

	@within RoUI3Animation
	@method Reset
]=]
function class.Reset(self: RoUI3Animation)
	if self._playing then
		return
	end

	for id, track in self._tracks do
		for property, track in track do
			for _, tween in track._tweens do
				tween:Destroy()
			end
		end
	end

	self._preloaded = false
	self._canceled.Value = false
	self._paused.Value = false
	self._activeTweens = {}
	self._cachedProperties = {}
	self._instances = {}
	self._tracks = {}
end

--[=[
	Destroys an animation & completely cleans it up.

	@within RoUI3Animation
	@method Destroy
]=]
function class.Destroy(self: RoUI3Animation)
	self:Reset()

	for _, eventArray in self._events do
		for _, eventContainer in eventArray do
			eventContainer._connection:Disconnect()
		end
	end
end

table.freeze(class)

return Animation :: Types.RoUI3AnimationConstructor
