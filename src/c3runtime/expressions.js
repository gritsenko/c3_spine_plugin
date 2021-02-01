"use strict";
{
    const C3 = self.C3;
    
    C3.Plugins.Gritsenko_Spine.Exps = {
      
        /* Skins */
        Skins() {

            if (!this.isLoaded) return "";

            return this.skinNames.join("\n");
        },

        CurrentSkin(){

            if (!this.isLoaded) return "";

            return this.skinName;
        },

        SkinsCount(){

            if (!this.isLoaded) return 0;

            return  this.skinNames.length;
        },

        SkinName(index){

            if (!this.isLoaded) return "";
            if (index >= this.skinNames.length || index < 0) return "";

            return this.skinNames[index];
        },

        /* ANIMATIONS */
        Animations() {

            if (!this.isLoaded) return "";

            return this.animationNames.join("\n");
        },

        CurrentAnimation(trackIndex){

            if (!this.isLoaded) return "";

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return "";
            const track = state.tracks[trackIndex];
            if(!track) return "";

            return track.animation.name;
        },

        AnimationsCount(){

            if (!this.isLoaded) return 0;

            return  this.animationNames.length;
        },


        AnimationName(index){

            if (!this.isLoaded) return "";
            if (index >= this.animationNames.length || index < 0) return "";

            return this.animationNames[index];
        },
        
        Error(){
            return this.spineError;
        },
        TextureHeight(){

            if (!this.isLoaded) return 0;

            return this.textureHeight;
        },
        TextureWidth(){

            if (!this.isLoaded) return 0;

            return this.textureWidth;
        },
        AnimationStart(trackIndex){

            if (!this.isLoaded) return 0;

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return 0;
            const track = state.tracks[trackIndex];
            if(!track) return 0;

            return track.animationStart;
        },
        AnimationEnd(trackIndex){

            if (!this.isLoaded) return 0;

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return 0;
            const track = state.tracks[trackIndex];
            if(!track) return 0;

            return track.animationEnd;
        },
        AnimationLast(trackIndex){

            if (!this.isLoaded) return 0;

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return 0;
            const track = state.tracks[trackIndex];
            if(!track) return 0;

            return track.animationLast;
        },
        TrackTime(trackIndex){

            if (!this.isLoaded) return 0;

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return 0;
            const track = state.tracks[trackIndex];
            if(!track) return 0;

            return track.trackTime;
        },
        Alpha(trackIndex){

            if (!this.isLoaded) return 0;

            const state = this.skeletonInfo.state;
            if(!state || !state.tracks) return 0;
            const track = state.tracks[trackIndex];
            if(!track) return 0;

            return track.alpha;
        },
        SpineBBoxCenterX(name){

            if (!this.isLoaded) return 0;

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

            if (!this.isLoaded) return 0;

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
        },

        SpineBBoxGetPoly(slot,name)
        {

            if (!this.isLoaded) return JSON.stringify({});

            let bBox = this.skeletonInfo.skeleton.getAttachmentByName(slot,name);
            if (!bBox) return JSON.stringify({});
            
            let wi = this.GetInstance().GetWorldInfo();
            let x = wi.GetX();
            let y = wi.GetY();
            let halfHeight = wi.GetHeight()/2;
            let halfWidth = wi.GetWidth()/2;
            let angle = wi.GetAngle();
            let yScale = this.textureHeight/wi.GetHeight();
            let xScale = this.textureWidth/wi.GetWidth();
            let sizeY = this.skeletonInfo.bounds.size.y;
            let offsetY = this.skeletonInfo.bounds.offset.y;
            let sizeX = this.skeletonInfo.bounds.size.x;
            let offsetX = this.skeletonInfo.bounds.offset.x;
            let cosT = 0;
            let sinT = 0;
            // If rotated pre calculate cos and sin
            if (angle != 0)
            {
                cosT = Math.cos(angle);
                sinT = Math.sin(angle);    
            }

            const points = Array.from(this.skeletonInfo.skeletonBounds.getPolygon(bBox));
            for(let i=0;i<points.length;i+=2)
            {
                // X unroated
                points[i] = points[i]+offsetX+sizeX;
                points[i] = x-halfWidth+points[i]/(xScale);
                // Y unroated
                points[i+1] = sizeY-points[i+1]+offsetY;
                points[i+1] = y-halfHeight+points[i+1]/(yScale);
                // If rotated, rotate points around wi x,y
                if (angle != 0)
                {
                    let rotX = cosT * (points[i]-x) - sinT * (points[i+1]-y) + x;
                    let rotY = sinT * (points[i]-x) + cosT * (points[i+1]-y) + y;
                    points[i] = rotX;
                    points[i+1] = rotY;
                }
            }
            return JSON.stringify(points);
        },

        BoneX(bone){
            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return 0;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty('x')) return 0;

            return this.spineBoneControl.bones[bone].x;
        },
        BoneY(bone){
            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return 0;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty('y')) return 0;

            return this.spineBoneControl.bones[bone].y;
        },
        BoneRotation(bone){
            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return 0;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty('rotation')) return 0;

            return this.spineBoneControl.bones[bone].rotation;
        },
        BoneScaleX(bone){
            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return 0;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty('scaleX')) return 0;

            return this.spineBoneControl.bones[bone].scaleX;
        },
        BoneScaleY(bone){
            if (!this.spineBoneControl.bones.hasOwnProperty(bone)) return 0;
            if (!this.spineBoneControl.bones[bone].hasOwnProperty('scaleY')) return 0;

            return this.spineBoneControl.bones[bone].scaleY;
        },
    };
}