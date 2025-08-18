--!strict

export type Array<T> = { [number]: T }

export type RoUI3Output = {
	version: string,
	template: boolean,
	tracks: {
		[string]: Array<ExportKeyframe>,
	},
}

export type RoUI3OutputTemplate = RoUI3Output & {
	template: true,
	tracks: {
		["__template__"]: Array<ExportKeyframe>,
	},
}

--[=[
	@within RoUI3
	@interface RoUI3AnimationOptions
	@field PlaybackSpeed number
	@field ResetOnCompletion boolean
]=]
export type RoUI3AnimationOptions = {
	PlaybackSpeed: number,
	ResetOnCompletion: boolean,
}

--[=[
	@within RoUI3
	@type RoUI3KeyframeTransformer (value: KeyframeValue, property: string, time: number) -> KeyframeValue
]=]
export type RoUI3KeyframeTransformer<T = KeyframeValue> = (value: T, property: string, time: number) -> T

type EventContainer = {
	_connection: RBXScriptConnection,
	_callback: () -> (),
}

export type RoUI3Animation = {
	_data: RoUI3Output | RoUI3OutputTemplate,
	_playing: boolean,
	_activeTweens: Array<Tween>,
	_paused: BoolValue,
	_canceled: BoolValue,
	_tracks: { [string]: { [string]: RoUI3Track } },
	_instances: { [string]: Instance },
	_events: { [string]: Array<EventContainer> },
	_target: Array<Instance>,
	_template: boolean,
	_cachedProperties: { [string]: { [string]: KeyframeValue } },
	_options: RoUI3AnimationOptions,
	_preloaded: boolean,
	_completed: () -> (),
	_transformer: RoUI3KeyframeTransformer,
	_markers: Array<RoUI3Marker>,

	UseKeyframeTransformer: (self: RoUI3Animation, transformer: RoUI3KeyframeTransformer) -> (),
	MakeMarker: (self: RoUI3Animation, id: string, at: number, callback: () -> ()) -> (),
	SetTarget: (self: RoUI3Animation, target: Instance) -> (),
	AddTarget: (self: RoUI3Animation, target: Instance) -> (),
	WithOptions: (self: RoUI3Animation, options: RoUI3AnimationOptions) -> (),
	Completed: (self: RoUI3Animation, callback: () -> ()) -> (),
	BindToEvent: (self: RoUI3Animation, event: string, trigger: Instance) -> (),
	PreloadAnimation: (self: RoUI3Animation) -> (),
	Play: (self: RoUI3Animation) -> (),
	Pause: (self: RoUI3Animation) -> (),
	Resume: (self: RoUI3Animation) -> (),
	IsPaused: (self: RoUI3Animation) -> boolean,
	Wait: (self: RoUI3Animation) -> (),
	Cancel: (self: RoUI3Animation) -> (),
	Finish: (self: RoUI3Animation) -> (),
	Reset: (self: RoUI3Animation) -> (),
	ResetTargets: (self: RoUI3Animation) -> (),
}

export type RoUI3AnimationConstructor = (animation: ModuleScript) -> RoUI3Animation

export type RoUI3Track = {
	_property: string,
	_keyframes: Array<ExportKeyframe>,
	_values: Array<KeyframeValue>,
	_tweens: Array<Tween>,
	_template: boolean,

	AddKeyframe: (self: RoUI3Track, keyframe: ExportKeyframe) -> (),
	SortKeyframes: (self: RoUI3Track) -> (),
	GetKeyframes: (self: RoUI3Track) -> Array<ExportKeyframe>,
	LoadValues: (self: RoUI3Track, instance: Instance, transformer: RoUI3KeyframeTransformer) -> (),
	MakeTweens: (self: RoUI3Track, instance: Instance, options: RoUI3AnimationOptions) -> (),
	GetTweens: (self: RoUI3Track) -> Array<Tween>,
}

export type RoUI3TrackConstructor = (property: string, template: boolean) -> RoUI3Track

export type RoUI3Marker = {
	_id: string,
	_time: number,
	_callback: () -> (),
	_wasCalled: boolean,
}

export type RoUI3MarkerConstructor = (id: string, at: number, callback: () -> ()) -> RoUI3Marker

--[=[
	@within RoUI3
	@type KeyframeValue string | number | boolean | UDim | UDim2 | Color3 | Vector2
]=]
export type KeyframeValue = string | number | boolean | UDim | UDim2 | Color3 | Vector2

export type ExportValueUDim = {
	type: "UDim",
	scale: number,
	offset: number,
}

export type ExportValueUDim2 = {
	type: "UDim2",
	x: {
		scale: number,
		offset: number,
	},
	y: {
		scale: number,
		offset: number,
	},
}

export type ExportValueColor3 = {
	type: "Color3",
	r: number,
	g: number,
	b: number,
}

export type ExportValueVector2 = {
	type: "Vector2",
	x: number,
	y: number,
}

export type ExportKeyframeValue =
	| string
	| number
	| boolean
	| ExportValueUDim
	| ExportValueUDim2
	| ExportValueColor3
	| ExportValueVector2

export type ExportKeyframe = {
	property: string,
	time: number,
	value: ExportKeyframeValue,
	easingStyle: number,
	easingDirection: number,
}

return nil
