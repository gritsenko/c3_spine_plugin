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
            if (!this.isLoaded) return false;
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
        },

        IsBoneControlPropertyActive(bone, propertyIndex) {
            let properties=['x','y','rotation','scaleX','scaleY'];
            let property = properties[propertyIndex];

            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return false;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty(property)) return false;

            return true;
        }
    };
}