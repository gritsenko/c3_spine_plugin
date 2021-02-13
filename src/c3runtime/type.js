"use strict";
{
    const C3 = self.C3;
    
    C3.Plugins.Gritsenko_Spine.Type = class SpineType extends C3.SDKTypeBase
    {
        constructor(objectClass)
        {
            super(objectClass);
        }

        Release()
        {
            console.warn('[Spine] type.Release', this.GetObjectClass().GetName(), this._runtime.GetTickCount())
            super.Release();
        }

        OnCreate()
        {
            console.info('[Spine] type.OnCreate', this.GetObjectClass().GetName(), this._runtime.GetTickCount())
            this.GetImageInfo().LoadAsset(this._runtime);
            this._skeletonDataInitialized = false;
            this._skeletonDataInitializing = false;
            this._skeletonJson = null;
            // Tag for asset manager for skeletonData assets.
            this._assetTag = null;
            // Skeleton instances to render
            this._skeletonInstances = {};
            this._rendered = false;
            this._tickCount = -1;
            this._assetPaths = {};
        }

        LoadTextures(renderer)
        {
            return this.GetImageInfo().LoadStaticTexture(renderer,
            {
                linearSampling: this._runtime.IsLinearSampling()
            });
        }

        ReleaseTextures()
        {
            this.GetImageInfo().ReleaseTexture();
        }
    };
}