--!strict

local TweenService = game:GetService("TweenService")

local Types = require("./Types")
local Deserializer = require("./Deserializer")

--[=[
	@class RoUI3Track
	@private
	
	A RoUI3 animation track.
]=]
local class = {}
local classMetatable = table.freeze({ __index = class })

type Array<T> = Types.Array<T>
type RoUI3Track = Types.RoUI3Track

--[=[
	Creates a new RoUI3 animation track when provided with a property and
	if the track's keyframes should act as a template.

	@private
	@within RoUI3Track
	@param property string
	@param template boolean
	@return RoUI3Track
]=]
local function Track(property: string, template: boolean): RoUI3Track
	return setmetatable({
		_property = property,
		_keyframes = {},
		_tweens = {},
		_values = {},
		_template = template,
	}, classMetatable) :: any
end

--[=[
	Calculates all keyframe values and loads them.

	@private
	@within RoUI3Track
	@method LoadValues
	@param instance Instance
	@param transformer RoUI3KeyframeTransformer
	@return RoUI3Track
]=]
function class.LoadValues(self: RoUI3Track, instance: Instance, transformer: Types.RoUI3KeyframeTransformer)
	local keyframes = self:GetKeyframes()

	for index, keyframe in keyframes do
		if index == 1 then
			continue
		end

		local value = Deserializer.deserializeKeyframeValue(keyframe.value)
		local useDelta = false

		if self._template then
			local lastKeyframe = keyframes[index - 1]
			local lastValue = Deserializer.deserializeKeyframeValue(lastKeyframe.value)

			if typeof(value) == "UDim" or typeof(value) == "UDim2" or typeof(value) == "Vector2" then
				value = (value - lastValue :: any) :: UDim | UDim2 | Vector2
				useDelta = true
			end

			if useDelta then
				if index == 2 then
					self._values[1] = (instance :: any)[self._property]
				end

				self._values[index] = self._values[index - 1] + (value :: any)
			end
		end

		local finalValue = if useDelta then self._values[index] - self._values[index - 1] :: any else value
		local transformedValue = transformer(finalValue, keyframe.property, keyframe.time)

		self._values[index] = if useDelta then self._values[index] + transformedValue :: any else transformedValue
	end
end

--[=[
	Makes the tweens for each keyframe for this track.

	@private
	@within RoUI3Track
	@method MakeTweens
	@param instance Instance
	@param options RoUI3AnimationOptions
]=]
function class.MakeTweens(self: RoUI3Track, instance: Instance, options: Types.RoUI3AnimationOptions)
	local keyframes = self:GetKeyframes()

	for index, keyframe in keyframes do
		if index == 1 then
			continue
		end

		local tweenTime: number
		if #self._tweens == 0 then
			tweenTime = keyframe.time
		else
			local lastKeyframe = keyframes[index - 1]

			tweenTime = keyframe.time - lastKeyframe.time
		end

		local finalValue = self._values[index]

		-- Generate the tween & goal
		local tweenInfo = TweenInfo.new(
			tweenTime / options.PlaybackSpeed,
			Enum.EasingStyle:FromValue(keyframe.easingStyle),
			Enum.EasingDirection:FromValue(keyframe.easingDirection)
		)
		local goal = {
			[self._property] = finalValue,
		}

		-- Track the tween
		table.insert(self._tweens, TweenService:Create(instance, tweenInfo, goal))
	end
end

--[=[
	Adds a keyframe to this track.

	@private
	@within RoUI3Track
	@method AddKeyframe
	@param keyframe ExportKeyframe
]=]
function class.AddKeyframe(self: RoUI3Track, keyframe: Types.ExportKeyframe)
	table.insert(self._keyframes, keyframe)
end

--[=[
	Sorts this track's keyframes by time.

	@private
	@within RoUI3Track
	@method SortKeyframes
]=]
function class.SortKeyframes(self: RoUI3Track)
	table.sort(self._keyframes, function(a, b)
		return a.time < b.time
	end)
end

--[=[
	Gets this track's keyframes.

	@private
	@within RoUI3Track
	@method GetKeyframes
	@return { ExportKeyframe }
]=]
function class.GetKeyframes(self: RoUI3Track)
	return self._keyframes
end

--[=[
	Gets this track's tweens.

	@private
	@within RoUI3Track
	@method GetTweens
	@return { Tween }
]=]
function class.GetTweens(self: RoUI3Track)
	return self._tweens
end

table.freeze(class)

return Track :: Types.RoUI3TrackConstructor
