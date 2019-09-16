"use strict";
{
    const DOM_COMPONENT_ID = "gritsenko-spine";
    //C3.Plugins.Gritsenko_Spine = class SpinePlugin extends C3.SDKDOMPluginBase
    C3.Plugins.Gritsenko_Spine = class SpinePlugin extends C3.SDKPluginBase {
        constructor(opts) {
            // super(opts);
            super(opts, DOM_COMPONENT_ID);

        }

        Release() {
            super.Release();
        }
    };
}