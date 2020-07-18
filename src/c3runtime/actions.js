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
    };
}