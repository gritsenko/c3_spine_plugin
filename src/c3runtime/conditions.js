"use strict";
{
    C3.Plugins.Gritsenko_Spine.Cnds = {

        OnSkeletonLoaded() {
            return true;
        },

        OnAnimationFinished(animationName) {
            return this.completeAnimationName == animationName;
        },

        OnAnyAnimationFinished() {
            return true;
        },

        IsAnimationPlaying(animationName) {
            return this.animationName == animationName;
        },
        OnError() {
            return true;
        },
        OnEvent(eventName) {
            return this.completeEventName == eventName;
        }
    };
}