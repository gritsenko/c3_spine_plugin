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
        }


    };
}