--!strict

local Types = require("./Types")

--[=[
	@class RoUI3Marker
	@private
	
	A RoUI3 track marker.
]=]
local class = {}
local classMetatable = table.freeze({ __index = class })

type Array<T> = Types.Array<T>
type RoUI3Marker = Types.RoUI3Marker

--[=[
	Creates a new RoUI3 animation marker.

	@private
	@within RoUI3Marker
	@param id string
	@param at number
	@param callback () -> ()
	@return RoUI3Marker
]=]
local function Marker(id: string, at: number, callback: () -> ()): RoUI3Marker
	return setmetatable({
		_id = id,
		_time = at,
		_callback = callback,
		_wasCalled = false,
	}, classMetatable) :: any
end

table.freeze(class)

return Marker :: Types.RoUI3MarkerConstructor
