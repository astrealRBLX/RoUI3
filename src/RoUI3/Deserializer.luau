--!strict

local Types = require("./Types")

type Array<T> = Types.Array<T>
type ExportValueUDim = Types.ExportValueUDim
type ExportValueUDim2 = Types.ExportValueUDim2
type ExportValueColor3 = Types.ExportValueColor3
type ExportValueVector2 = Types.ExportValueVector2

local function getInstanceId(instance: Instance): string?
	return instance:GetAttribute("_roui3_id") :: string?
end

local function getInstanceExportKeyframes(
	data: Types.RoUI3Output | Types.RoUI3OutputTemplate,
	id: string?
): Array<Types.ExportKeyframe>?
	for instanceId, keyframes in data.tracks :: { [string]: Array<Types.ExportKeyframe> } do
		if instanceId == id then
			return keyframes
		end
	end

	return nil
end

local function deserializeKeyframeValue(value: Types.ExportKeyframeValue): Types.KeyframeValue
	local valueType = type(value)

	if valueType == "string" or valueType == "number" or valueType == "boolean" then
		return value :: string | number | boolean
	end

	if valueType == "table" then
		local complexValue = value :: ExportValueUDim | ExportValueUDim2 | ExportValueColor3 | ExportValueVector2

		if complexValue.type == "UDim" then
			local valueUDim = value :: ExportValueUDim

			return UDim.new(valueUDim.scale, valueUDim.offset)
		elseif complexValue.type == "UDim2" then
			local valueUDim2 = value :: ExportValueUDim2

			return UDim2.new(valueUDim2.x.scale, valueUDim2.x.offset, valueUDim2.y.scale, valueUDim2.y.offset)
		elseif complexValue.type == "Color3" then
			local valueColor3 = value :: ExportValueColor3

			return Color3.new(valueColor3.r, valueColor3.g, valueColor3.b)
		elseif complexValue.type == "Vector2" then
			local valueVector2 = value :: ExportValueVector2

			return Vector2.new(valueVector2.x, valueVector2.y)
		end
	end

	error(`RoUI3 | Cannot deserialize keyframe {value}`)
end

return {
	getInstanceId = getInstanceId,
	getInstanceExportKeyframes = getInstanceExportKeyframes,
	deserializeKeyframeValue = deserializeKeyframeValue,
}
