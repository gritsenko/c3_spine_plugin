"use strict";
{
    C3.Plugins.Gritsenko_Spine.Exps = {
      
        /* Skins */
        Skins() {
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

        SpineBBoxCenterX(name){
            let bBox = this.skeletonInfo.skeleton.getAttachmentByName(name,name);
            if (!bBox) return 0;

            let points = this.skeletonInfo.skeletonBounds.getPolygon(bBox);
            let centerX = 0;
            for (let i = 0; i < points.length; i+=2)
            {
                centerX+=points[i];
            }
            centerX = centerX/(points.length/2)+this.skeletonInfo.bounds.offset.x+this.skeletonInfo.bounds.size.x;

            let wi = this.GetInstance().GetWorldInfo();
            let x = wi.GetX()-wi.GetWidth()/2+centerX/(this.textureWidth/wi.GetWidth());
            // If not rotated, return x
            if (wi.GetAngle() == 0) return x;

            let centerY = 0;
            for (let i = 1; i < points.length; i+=2)
            {
                centerY+=points[i];
            }
            centerY = this.skeletonInfo.bounds.size.y-centerY/(points.length/2)+this.skeletonInfo.bounds.offset.y;
            let y = wi.GetY()-wi.GetHeight()/2+centerY/(this.textureHeight/wi.GetHeight());
            // If rotated, return rotate centerX by angle around center
            return Math.cos(wi.GetAngle()) * (x-wi.GetX()) - Math.sin(wi.GetAngle()) * (y-wi.GetY()) + wi.GetX();
        },

        SpineBBoxCenterY(slot, name){
            let bBox = this.skeletonInfo.skeleton.getAttachmentByName(slot,name);
            if (!bBox) return 0;

            let points = this.skeletonInfo.skeletonBounds.getPolygon(bBox);
            let centerY = 0;
            for (let i = 1; i < points.length; i+=2)
            {
                centerY+=points[i];
            }
            centerY = this.skeletonInfo.bounds.size.y-centerY/(points.length/2)+this.skeletonInfo.bounds.offset.y;

            let wi = this.GetInstance().GetWorldInfo();
            let y = wi.GetY()-wi.GetHeight()/2+centerY/(this.textureHeight/wi.GetHeight());
            if (wi.GetAngle() == 0) return y;

            let centerX = 0;
            for (let i = 0; i < points.length; i+=2)
            {
                centerX+=points[i];
            }
            centerX = centerX/(points.length/2)+this.skeletonInfo.bounds.offset.x+this.skeletonInfo.bounds.size.x;
            let x = wi.GetX()-wi.GetWidth()/2+centerX/(this.textureWidth/wi.GetWidth());
            // If rotated, return rotate centerX by angle around center
            return Math.sin(wi.GetAngle()) * (x-wi.GetX()) + Math.cos(wi.GetAngle()) * (y-wi.GetY()) + wi.GetY();
        }
    };
}