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
    }

    removeBoneControl(bone, property) {
        if (!this.bones[bone] || !this.bones[bone][property]) {console.warn('[Spine] removeBoneConrtol, no control', bone, property);return}
        delete this.bones[bone][property];
    }

    applyBoneControl(skeleton) {
        const bones = this.bones;
        for(let boneName in bones)
        {
            if(!bones[boneName].hasOwnProperty('__boneControlReference'))
            {
                let boneControlReference = skeleton.findBone(boneName);
                if (!boneControlReference) {console.warn('[Spine] applyBoneControl bone not found', boneName);continue;}
                // Cache reference
                bones[boneName].__boneControlReference = boneControlReference;
            }

            for(const property in bones[boneName])
            {
                // Ignore reference to bone
                if (property == '__boneControlReference') continue;

                bones[boneName].__boneControlReference[property] = bones[boneName][property];
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
