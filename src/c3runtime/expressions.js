"use strict";
{
    C3.Plugins.Gritsenko_Spine.Exps = {
      
        /* Skins */
        Skins() {
            console.log(this);
            return this.skinNames.join("\n");
        },

        CurrentSkin(){
            return this.skinName;
        },

        SkinsCount(){
            return  this.skinNames.length;
        },

        SkinName(index){
            return this.skinNames[index];
        },

        /* ANIMATIONS */
        Animations() {
            console.log(this);
            return this.animationNames.join("\n");
        },

        CurrentAnimation(){
            return this.animationName;
        },

        AnimationsCount(){
            return  this.animationNames.length;
        },


        AnimationName(index){
            return this.animationNames[index];
        },
        
        Error(){
            return this.spineError;
        },
        TextureHeight(){
            return this.textureHeight;
        },
        TextureWidth(){
            return this.textureWidth;
        },
        AnimationStart(){
            if (this.skeletonInfo && this.skeletonInfo.state) return this.skeletonInfo.state.tracks[0].animationStart;
            else return 0;
        },
        AnimationEnd(){
            if (this.skeletonInfo && this.skeletonInfo.state) return this.skeletonInfo.state.tracks[0].animationEnd;
            else return 0;
        },
        AnimationLast(){
            if (this.skeletonInfo && this.skeletonInfo.state) return this.skeletonInfo.state.tracks[0].animationLast;
            else return 0;
        },
        TrackTime(){
            if (this.skeletonInfo && this.skeletonInfo.state) return this.skeletonInfo.state.tracks[0].trackTime;
            else return 0;
        },

    };
}