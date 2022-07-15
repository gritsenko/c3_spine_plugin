"use strict";
{
    const C3 = self.C3;
    const spineBatcher = globalThis.spineBatcher;

    C3.Plugins.Gritsenko_Spine.Acts = {

        SetSkin(skinName){

            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetSkin, no skeleton.', skinName, this.uid, this.runtime.GetTickCount());
                return;
            }

            this.skinName = skinName;

            this.updateCurrentSkin();
            this.SetRenderOnce(1.0, true, this.uid);
        },

        Flip(isFlipped){
            this.isMirrored = isFlipped;
            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetAnimation(animationName, loop, start, trackIndex){
            this._setAnimation(animationName, loop, start, trackIndex);
        },

        SetAlpha(alpha, trackIndex){
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetAlpha, no state.', alpha, trackIndex, this.uid, this.runtime.GetTickCount());
                return;
            }

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return;
            const track = state.tracks[trackIndex];
            if(!track) return;

            // Clamp alpha to 1-0
            track.alpha = Math.max(0,Math.min(1,alpha));
            this.SetRenderOnce(1.0, true, this.uid);
       },

        DeleteAnimation(trackIndex, mixDuration) {
            this._deleteAnimation(trackIndex, mixDuration);
        },

        Play(){
            this.playAnimation();
            this.SetRenderOnce(1.0, true, this.uid);
        },

        Stop(){
            this.stopAnimation();
            this.SetRenderOnce(0.0, false, this.uid);
        },

        UpdateBounds() {
            this.updateBounds();
        },
        SetAnimationSpeed(speed){
            this._setAnimationSpeed(speed);
        },
        
        SetRegion(slotName, attachmentName, regionName){

            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetRegion, no skeleton.', slotName, attachmentName, regionName, this.uid, this.runtime.GetTickCount());
                return;
            }

            // First get the new region from the atlas.
            const atlas = this.skeletonInfo.atlas;
            const skeleton = this.skeletonInfo.skeleton;

            let region = atlas.findRegion(regionName);
            if (region == null) throw new Error("Region not found in atlas: " + regionName + " " + this.uid);

            // Get the existing attachment, if skin not on skeleton
            // let skin = skeleton.data.findSkin(skinName)
            let slotIndex = skeleton.data.findSlot(slotName).index
            // let existing = skin.getAttachment(slotIndex, 'hairs');

            // Alternatively if the skin is set on the skeleton, you can get it from the skeleton.
            let existing = skeleton.getAttachment(slotIndex, attachmentName);

            // Now do what AtlasAttachmentLoader does:
            // https://github.com/EsotericSoftware/spine-runtimes/blob/3.8/spine-ts/core/src/AtlasAttachmentLoader.ts#L42
            region.renderObject = region;
            existing.setRegion(region);

            // Need to do one last thing, which SkeletonJson/SkeletonBinary do last:
            // https://github.com/EsotericSoftware/spine-runtimes/blob/3.8/spine-ts/core/src/SkeletonJson.ts#L326-L340
            existing.updateOffset();
            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetAttachment(slotName, attachmentName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetAttachment, no skeleton.', slotName, attachmentName, this.uid, this.runtime.GetTickCount());
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;

            skeleton.setAttachment(slotName,attachmentName);
            this.SetRenderOnce(1.0, true, this.uid);
        },

        CreateCustomSkin(skinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] CreateCustomSkin, no skeleton.', skinName, this.uid);
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;
            // If already exists, just clear
            if (this.customSkins[skinName])
            {
                this.customSkins[skinName].clear();
            } else 
            {
                this.customSkins[skinName] = new spine.Skin(skinName);
            }
        },

        AddCustomSkin(skinName,addSkinName)
        {
            this._addCustomSkin(skinName, addSkinName);
        },

        SetCustomSkin(skinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetCustomSkin, no skeleton', skinName, this.uid, this.runtime.GetTickCount());
                return;
            } 

            this.skinName = skinName
            const skeleton = this.skeletonInfo.skeleton;
            skeleton.setSkin(this.customSkins[this.skinName]);
            skeleton.setSlotsToSetupPose();
            
            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetCustomAttachmentColor(skinName, slotName, attachmentName, color)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetCustomAttachmentColor, no skeleton', skinName, slotName, attachmentName, color, this.uid, this.runtime.GetTickCount());
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;
            let skin = this.customSkins[skinName];
            let slotIndex = skeleton.data.findSlot(slotName).index;
            let slot = skeleton.findSlot(slotName);
            let attachment = skin.getAttachment(slotIndex, attachmentName);
            let newAttachment = attachment.copy();

            let tint = new spine.Color(
                spineBatcher.getRValue(color),
                spineBatcher.getGValue(color),
                spineBatcher.getBValue(color),
                spineBatcher.getAValue(color));
            
            newAttachment.color = tint;
            skin.setAttachment(slotIndex, attachmentName, newAttachment);
            skeleton.setSkin(this.customSkins[skinName]);
            skeleton.setSlotsToSetupPose();

            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetSlotColor(slotName, color)
        {
            this.slotColors[slotName] = color;
            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetSlotDarkColor(slotName, darkColor)
        {
            this.slotDarkColors[slotName] = darkColor;
            this.SetRenderOnce(1.0, true, this.uid);
        },

        ApplySlotColors()
        {
            this._applySlotColors()
        },

        ResetSlotColors()
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] ResetSlotColors, no skeleton.', this.uid, this.runtime.GetTickCount());
                return;
            } 

            const skeleton = this.skeletonInfo.skeleton;
            this.slotColors = {};
            this.slotDarkColors = {};
            skeleton.setSlotsToSetupPose();

            this.SetRenderOnce(1.0, true, this.uid);
        },

        SetAnimationTime(units, time, trackIndex)
        {
            this._setAnimationTime(units, time, trackIndex);
        },

        UpdateBBoxes()
        {
            this.skeletonInfo.skeletonBounds.update(this.skeletonInfo.skeleton, true);
        },
        
        SetAnimationMix(fromName, toName, duration)
        {
            this._setAnimationMix(fromName, toName, duration);
        },

        SetObjectRenderRate(renderRate)
        {
            if (!globalThis.spineBatcher)
            {
                if (this.debug) console.warn('[Spine] SetObjectRenderRate, error no spineBatcher.', renderRate, this.uid, this.runtime.GetTickCount());
                return;                
            }

            globalThis.spineBatcher.renderRate = renderRate;
        },

        SetDebug(enable)
        {
            this.debug = enable;
        },

        SetDebugVariable(name,value)
        {
            if (!spineBatcher) {console.warn('[Spine] SetDebugVariable, no spineBatcher',name,value);return}
            spineBatcher.debugVariables[name] = value;
            if (this.debug) console.info('[Spine] SetDebugVariable',name,value,spineBatcher.debugVariables);
        },

        SetBoneControl(bone, propertyIndex, value)
        {
            let properties=['x','y','rotation','scaleX','scaleY'];
            this.spineBoneControl.setBoneControl(bone, properties[propertyIndex], value);

            this.SetRenderOnce(0.017, true, this.uid);
        },

        RemoveBoneControl(bone, propertyIndex)
        {
            let properties=['x','y','rotation','scaleX','scaleY'];
            this.spineBoneControl.removeBoneControl(bone, properties[propertyIndex]);

            this.SetRenderOnce(0.017, true, this.uid);
        },

        RemoveAllBoneControl(bone)
        {
            this.spineBoneControl.removeAllBoneControl(bone);

            this.SetRenderOnce(0.017, true, this.uid);
        },

        SetSkeletondataRenderQuality(renderQuality)
        {
            this.sdkType._skeletonRenderQuality = renderQuality;
            const assetManager = this._sdkType._assetManager;
            const assetTag = this._sdkType._assetTag;
            this._sdkType._skeletonJson.scale = renderQuality;
            // JSON file with one skeleton, no name
            if (this.skeletonName == "")
            {
                // this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(this.assetManager.get(this.DEMO_NAME, this.jsonURI));
                this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this._sdkType._jsonURI));
            } else
            {
                this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this._sdkType._jsonURI) [this.skeletonName] );
            }            
        },

        SetValue(value, pathString)
        {
            let path = pathString.split(".");
            this.SetValuePath(value, path);
        },

        SetNull(pathString)
        {
            let path = pathString.split(".");
            this.SetValuePath(null, path);
        },

        DeleteKey(pathString)
        {
            let path = pathString.split('.');
            let key = path.pop();
            let result = this.GetValuePath(path,false);
            if (typeof result !== 'object' || result === null) return;
            delete result[key];
        },

        SetJSON(jsonString, pathString)
        {
            try
            {
                if (pathString === "")
                {
                    this.data = JSON.parse(jsonString);
                    return;
                } 
                let path = pathString.split('.');
                let key = path.pop();
                let result = this.GetValuePath(path,true);
                if (typeof result === 'object')
                {
                        console.log('parse', JSON.parse(jsonString));
                        result[key] = JSON.parse(jsonString);
                }   
            }
            catch(err)
            {
                console.warn('[Spine] JSON parse error', err, jsonString);
                return false;
            }
        },

        EnablePaletteColor(enable)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] EnablePaletteColor, no skeleton', this.uid, this.runtime.GetTickCount());
                return;
            }

            if (enable === 0)
            {
                this.palette.enable = true;
            } else
            {
                this.palette.enable = false;
            }
        },

        SetSlotPalette(slotName, paletteNumber)
        {
            this.palette.setSlotPalette(slotName, paletteNumber);
        },

        SetSlotPaletteOffset(slotName, paletteOffset)
        {
            this.palette.setSlotPaletteOffset(slotName, paletteOffset);
        },

        SetPaletteDefaultColors(paletteNumber)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetPaletteDefaultColors, no skeleton', this.uid, this.runtime.GetTickCount());
                return;
            }

            this.palette.setDefaultColors(paletteNumber, 1.0, 1.0);

            this.palette.entryUploadNeeded[paletteNumber] = true;
            this.palette.uploadNeeded = true;
        },

        SetPaletteColor(paletteNumber, index, color)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetPaletteColor, no skeleton', this.uid, this.runtime.GetTickCount());
                return;
            }

            this.palette.setColor(paletteNumber, index, color)

            this.palette.entryUploadNeeded[paletteNumber] = true;
            this.palette.uploadNeeded = true;
        },

        SetAllPaletteColors(value)
        {
            let length = value.length;
            if (length/2 > this.palette.palette.length)
            {
                console.warn('[Spine] SetAllPaletteColorsFromString string too long:', length)
            }
            for(let i=0;i<length;i+=2)
            {
                this.palette.palette[i/2] = parseInt(value.substring(i,i+2), 16);
            }

            this.palette.entryUploadNeeded.fill(true);
            this.palette.uploadNeeded = true;
        },

        SetEntryPaletteColors(paletteNumber, value)
        {
            let length = value.length;
            let indexSize = this.palette.indexSize;
            if (length > indexSize*2*4)
            {
                console.warn('[Spine] SetEntryPaletteColorsFromString string too long:', length)
            }
            for(let i=0;i<length;i+=2)
            {
                this.palette.palette[indexSize*paletteNumber*4+i/2] = parseInt(value.substring(i,i+2), 16);
            }
 
            this.palette.entryUploadNeeded[paletteNumber] = true;
            this.palette.uploadNeeded = true;
        },

        // For ProUI scrollview control of object blend mode
        SetEffect(effect) {
            this.GetWorldInfo().SetBlendMode(effect);
            this.runtime.UpdateRender()
        },
        LoadSpineFiles(jsonPath, atlasPath, pngPath) {
            if (this.jsonPath !== "") return
            this.jsonPath = jsonPath;
            this.atlasPath = atlasPath;
            this.pngPath = pngPath;
            this.runtime.UpdateRender()
        }
    }
}