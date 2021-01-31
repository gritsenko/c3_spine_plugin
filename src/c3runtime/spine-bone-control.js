// @ts-check
"use strict";

class SpineBoneControl {
    constructor(debug) {
        this._bones = {}
        this._debug = debug;
    }

    get bones() {return this._bones;}
    get debug() {return this._debug;}

    setBoneControl(name, property, value) {
        if (!this.bones[name])
        {
            this.bones[name] = {};
            this.bones[name][property] = value;        
        } else
        {
            this.bones[name][property] = value;    
        }
        // XXX debug
        console.log('[Spine] bone control', name, this.bones[name])
    }

    removeBoneControl(name, property) {
        if (!this.bones[name] || !!this.bones[name][property]) {console.warn('[Spine] removeBoneConrtol, no control', name, property);return}
        delete this.bones[name][property];
    }

    applyBoneControl(skeleton) {
        const bones = this.bones;
        for(let boneName in bones)
        {
            let bone = skeleton.findBone(boneName);
            if (!bone) {console.warn('[Spine] applyBoneControl bone not found', bone);}
            for(const property in bones[boneName])
            {
                bone[property] = bones[boneName][property];
            }
        }
    }
    
}

// @ts-ignore
if (!globalThis.SpineBoneControl)
{
    // @ts-ignore
    globalThis.SpineBoneControl = SpineBoneControl;
}
