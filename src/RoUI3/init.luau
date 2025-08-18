--!strict

--[[

	RoUI3 Animation Module

	This module is used to control animations generated
	by the RoUI3 plugin. For full documentation please
	visit RoUI3's GitHub page.
	
	GitHub: https://github.com/astrealRBLX/RoUI3

]]

local Types = require("@self/Types")

local Animation = require("@self/Animation")

--[=[
	@within RoUI3
	@prop __version__ string
	@readonly
]=]
local VERSION = "2.0.0"

type RoUI3 = {
	__version__: string,

	new: Types.RoUI3AnimationConstructor,
}

--[=[
	@class RoUI3

	The RoUI3 animation module.
]=]
return table.freeze({
	__version__ = VERSION,

	new = Animation,
}) :: RoUI3
