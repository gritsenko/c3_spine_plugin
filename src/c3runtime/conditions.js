"use strict";
{
    const C3 = self.C3;
    
    C3.Plugins.Gritsenko_Spine.Cnds = {

        OnSkeletonLoaded() {
            return true;
        },

        IsSkeletonLoaded() {
            return this.isLoaded;
        },

        OnAnimationFinished(animationName, trackIndex) {
            return (this.completeAnimationName == animationName) && (this.completeTrackIndex == trackIndex);
        },

        OnAnyAnimationFinished() {
            return true;
        },

        IsAnimationPlaying(animationName, trackIndex) {
            if (!this.skeletonInfo) return false;
            if (!this.skeletonInfo.skeleton) return false;

            const track = this.skeletonInfo.state.tracks[trackIndex];
            if (!track) return false;

            return (track.animation.name === animationName) && (track.trackIndex === trackIndex);
        },
        OnError() {
            return true;
        },
        OnEvent(eventName, trackIndex) {
            return (this.completeEventName === eventName) && (this.completeEventTrackIndex === trackIndex);
        }
    };
}