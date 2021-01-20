"use strict";
{
    const C3 = self.C3;
    const spineBatcher = globalThis.spineBatcher;

    C3.Plugins.Gritsenko_Spine.Acts = {

        SetSkin(skinName){

            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetSkin, no skeleton.', skinName, this.uid);
                return;
            }

            this.skinName = skinName;

            this.updateCurrentSkin();
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        Flip(isFlipped){
            this.isMirrored = isFlipped;
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetAnimation(animationName, loop, start, trackIndex){
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetAnimation, no skeleton.',  animation, this.uid);
                return;
            }

            this.animationName = animationName;

            this.updateCurrentAnimation(loop, start, trackIndex, animationName);
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetAlpha(alpha, trackIndex){
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetAlpha, no state.', alpha, trackIndex, this.uid);
                return;
            }

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return;
            const track = state.tracks[trackIndex];
            if(!track) return;

            // Clamp alpha to 1-0
            track.alpha = Math.max(0,Math.min(1,alpha));
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
       },

        DeleteAnimation(trackIndex, mixDuration) {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], DeleteAnimation, no state.', trackIndex, this.uid);
                return;
            }

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return;
            const track = state.tracks[trackIndex];
            if(!track) return;

            state.setEmptyAnimation(trackIndex, mixDuration);
        },

        Play(){
            this.playAnimation();
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        Stop(){
            this.stopAnimation();
            spineBatcher.setInstanceRenderOnce(false, this.uid);
            this.animateOnce = 0.0;
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
                if (this.debug) console.warn('[Spine], SetRegion, no skeleton.', slotName, attachmentName, regionName, this.uid);
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
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetAttachment(slotName, attachmentName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetAttachment, no skeleton.', slotName, attachmentName, this.uid);
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;

            skeleton.setAttachment(slotName,attachmentName);
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        CreateCustomSkin(skinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], CreateCustomSkin, no skeleton.', skinName, this.uid);
                return;
            }

            const skeleton = this.skeletonInfo.skeleton;
            
            this.customSkins[skinName] = new spine.Skin(skinName);
        },

        AddCustomSkin(skinName,addSkinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine] AddCustomSkin, skeleton is not available',skinName,addSkinName,this.uid);
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
                    if (this.debug) console.warn('[Spine] AddCustomSkin, add skin does not exist',skinName,addSkinName,this.uid);
                }
            } else
            {
                if (this.debug) console.warn('[Spine] AddCustomSkin, custom skin does not exist',skinName,addSkinName,this.uid);
            }
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetCustomSkin(skinName)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetCustomSkin, no skeleton', skinName, this.uid);
                return;
            } 

            this.skinName = skinName
            const skeleton = this.skeletonInfo.skeleton;
            this.customSkins[this.skinName]
            skeleton.setSkin(this.customSkins[this.skinName]);
            skeleton.setSlotsToSetupPose();
            
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetCustomAttachmentColor(skinName, slotName, attachmentName, color)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], SetCustomAttachmentColor, no skeleton', skinNameskinName, slotName, attachmentName, color, this.uid);
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
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetSlotColor(slotName, color)
        {
            this.slotColors[slotName] = color;
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetSlotDarkColor(slotName, darkColor)
        {
            this.slotDarkColors[slotName] = darkColor;
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        ApplySlotColors()
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], ApplySlotColors, no skeleton.', this.uid);
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
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        ResetSlotColors()
        {
            if (!this.skeletonInfo || !this.skeletonInfo.skeleton)
            {
                if (this.debug) console.warn('[Spine], ResetSlotColors, no skeleton.', this.uid);
                return;
            } 

            const skeleton = this.skeletonInfo.skeleton;
            this.slotColors = {};
            this.slotDarkColors = {};
            skeleton.setSlotsToSetupPose();
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        SetAnimationTime(units, time, trackIndex)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.state)
            {
                if (this.debug) console.warn('[Spine], SetAninationTime, no state.',units, time, trackIndex,this.uid);
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
                    if (this.debug) console.warn('[Spine] SetAnimationTime time out of bounds:', units, time, trackIndex,this.uid);
                    return;
                }
                track.trackTime = time;
            } else
            // time in ratio
            {
                if (time < 0 || time > 1)
                {
                    if (this.debug) console.warn('[Spine] SetAnimationTime ratio out of bounds:', units, time, trackIndex, this.uid);
                    return;
                }
                track.trackTime = time * (track.animationEnd - track.animationStart);
            }
            spineBatcher.setInstanceRenderOnce(true, this.uid);
            this.animateOnce = 1.0;
        },

        UpdateBBoxes()
        {
            this.skeletonInfo.skeletonBounds.update(this.skeletonInfo.skeleton, true);
        },
        
        SetAnimationMix(fromName, toName, duration)
        {
            if (!this.skeletonInfo || !this.skeletonInfo.stateData)
            {
                if (this.debug) console.warn('[Spine], SetAnimationMix, no stateData.', fromName, toName, duration, this.uid);
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
                if (this.debug) console.warn('[Spine], SetObjectRenderRate, error no spineBatcher.', renderRate, this.uid);
                return;                
            }

            globalThis.spineBatcher.renderRate = renderRate;
        },

        SetDebug(enable)
        {
            this.debug = enable;
        }

    };
}