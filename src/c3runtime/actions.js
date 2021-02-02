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
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] SetAnimation, no skeleton.', animationName, loop, start, trackIndex, this.uid, this.runtime.GetTickCount());
                return;
            }

            this.animationName = animationName;

            this.updateCurrentAnimation(loop, start, trackIndex, animationName);
            this.SetRenderOnce(1.0, true, this.uid);
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
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] DeleteAnimation, no skelton.', trackIndex, mixDuration, this.uid, this.runtime.GetTickCount());
                return;
            }

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return;
            const track = state.tracks[trackIndex];
            if(!track) return;

            state.setEmptyAnimation(trackIndex, mixDuration);
            this.SetRenderOnce(1.0, true, this.uid);
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
            this.animationSpeed = speed;
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
            
            this.customSkins[skinName] = new spine.Skin(skinName);
        },

        AddCustomSkin(skinName,addSkinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] AddCustomSkin, skeleton is not available',skinName,addSkinName, this.uid, this.runtime.GetTickCount());
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;

            if (this.customSkins[skinName])
            {
                let addSkin = skeleton.data.findSkin(addSkinName);
                if (addSkin)
                {
                    this.customSkins[skinName].addSkin(skeleton.data.findSkin(addSkinName));
                } else
                {
                    if (this.debug) console.warn('[Spine] AddCustomSkin, add skin does not exist',skinName,addSkinName, this.uid, this.runtime.GetTickCount());
                }
            } else
            {
                if (this.debug) console.warn('[Spine] AddCustomSkin, custom skin does not exist',skinName,addSkinName, this.uid, this.runtime.GetTickCount());
            }
            this.SetRenderOnce(1.0, true, this.uid);
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
            this.customSkins[this.skinName]
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
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] ApplySlotColors, no skeleton.', this.uid, this.runtime.GetTickCount());
                return;
            } 

            const skeleton = this.skeletonInfo.skeleton;
            // Set regular colors to slots
            let slotName;
            for(slotName in this.slotColors)
            {
                let slot = skeleton.findSlot(slotName);
                let color = this.slotColors[slotName];
                slot.color.set(
                    spineBatcher.getRValue(color),
                    spineBatcher.getGValue(color),
                    spineBatcher.getBValue(color),
                    spineBatcher.getAValue(color));               
            }

            // Set dark colors to slots
            for(slotName in this.slotDarkColors)
            {
                let slot = skeleton.findSlot(slotName);
                // Set only if dark Color is available, (Tint Black must be applied to the slot in the project.)
                if (slot.darkColor)
                {
                    let color = this.slotDarkColors[slotName];
                    slot.darkColor.set(
                        spineBatcher.getRValue(color),
                        spineBatcher.getGValue(color),
                        spineBatcher.getBValue(color),
                        spineBatcher.getAValue(color));
                }                
            }

            this.SetRenderOnce(1.0, true, this.uid);
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
            if (!this.skeletonInfo || !this.skeletonInfo.state)
            {
                if (this.debug) console.warn('[Spine] SetAninationTime, no state.',units, time, trackIndex, this.uid, this.runtime.GetTickCount());
                return;
            } 

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return;

            const track = state.tracks[trackIndex];
            if(!track) return; 

            if (units == 0)
            // time in ms
            {
                if (time < track.animationStart || time > track.animationEnd)
                {
                    if (this.debug) console.warn('[Spine] SetAnimationTime time out of bounds:', units, time, trackIndex, this.uid, this.runtime.GetTickCount());
                    return;
                }
                track.trackTime = time;
            } else
            // time in ratio
            {
                if (time < 0 || time > 1)
                {
                    if (this.debug) console.warn('[Spine] SetAnimationTime ratio out of bounds:', units, time, trackIndex, this.uid, this.runtime.GetTickCount());
                    return;
                }
                track.trackTime = time * (track.animationEnd - track.animationStart);
            }

            this.SetRenderOnce(1.0, true, this.uid);
        },

        UpdateBBoxes()
        {
            this.skeletonInfo.skeletonBounds.update(this.skeletonInfo.skeleton, true);
        },
        
        SetAnimationMix(fromName, toName, duration)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.stateData)
            {
                if (this.debug) console.warn('[Spine] SetAnimationMix, no stateData.', fromName, toName, duration, this.uid, this.runtime.GetTickCount());
                return;
            } 

            const stateData = this.skeletonInfo.stateData;
            try
            {
                stateData.setMix(fromName, toName, duration);
            }
            catch (error)
            {
                console.error('[Spine] SetAnimationMix:', error);
            }
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

        SetSkeletondataRenderQuality(renderQuality)
        {
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
                this._sdkType._skeletonData = this._sdkType._skeletonJson.readSkeletonData(assetManager.get(assetTag, this._sdkType._jsonURI) [name] );
            }            
        }

    };
}