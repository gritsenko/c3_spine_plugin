"use strict";
{
    const PLUGIN_CLASS = SDK.Plugins.Gritsenko_Spine;

    PLUGIN_CLASS.Type = class SpineType extends SDK.ITypeBase
    {
        constructor(sdkPlugin, iObjectType)
        {
            super(sdkPlugin, iObjectType);
        }
    };
}