"use strict";
{
    C3.Plugins.Gritsenko_Spine.Acts = {

        SetSkin(skinName){
            this.skinName = skinName;

            this.updateCurrentSkin();
        },

        Flip(isFlipped){
            this.isMirrored = isFlipped;
        },

        SetAnimation(animationName, loop){
            this.animationName = animationName;

            this.updateCurrentAnimation(loop);
        },

        Play(){
            this.playAnimation();
        },

        Stop(){
            this.stopAnimation();
        },

        UpdateBounds() {
            this.updateBounds();
        },
        SetAnimationSpeed(speed){
            this.animationSpeed = speed;
        },
        
        SetRegion(slotName, attachmentName, regionName){

            // First get the new region from the atlas.
            const atlas = this.skeletonInfo.atlas;
            const skeleton = this.skeletonInfo.skeleton;

            let region = atlas.findRegion(regionName);
            if (region == null) throw new Error("Region not found in atlas: " + regionName);

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
        },

        SetAttachment(slotName, attachmentName)
        {
            const skeleton = this.skeletonInfo.skeleton;

            skeleton.setAttachment(slotName,attachmentName);
        },

        CreateCustomSkin(skinName)
        {
            const skeleton = this.skeletonInfo.skeleton;
            
            this.customSkins[skinName] = new spine.Skin(skinName);
        },

        AddCustomSkin(skinName,addSkinName)
        {
            const skeleton = this.skeletonInfo.skeleton;
            
            if (this.customSkins[skinName])
            {
                this.customSkins[skinName].addSkin(skeleton.data.findSkin(addSkinName));
            } else
            {
                console.log('[Spine] AddCustomSkin, error - custom skin does not exist',skinName);
            }
        },

        SetCustomSkin(skinName)
        {
            this.skinName = skinName
            const skeleton = this.skeletonInfo.skeleton;
            this.customSkins[this.skinName]
            skeleton.setSkin(this.customSkins[this.skinName]);
            skeleton.setSlotsToSetupPose();
        }
    };
}