"use strict";
{
    C3.Plugins.Gritsenko_Spine.Cnds = {

        OnSkeletonLoaded() {
            return true;
        },

        OnAnimationFinished(animationName) {
            return this.animationName == animationName;
        },

        OnAnyAnimationFinished() {
            return true;
        },

        IsAnimationPlaying(animationName) {
            return this.animationName == animationName;
        }

    };
}