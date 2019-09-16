"use strict";
{
    const PLUGIN_CLASS = SDK.Plugins.Gritsenko_Spine;

    PLUGIN_CLASS.Instance = class SpineInstance extends SDK.IWorldInstanceBase
    {
        constructor(sdkType, inst)
        {
            super(sdkType, inst);
        }

        Release()
        {}

        OnCreate()
        {
            console.log("SPine plugin loaded");
            
            console.log(this);
        }

        async LoadSpineFile(){
            //const uri = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.jsonPath);
            console.log(globalThis.c3_runtimeInterface);
        }

        OnPlacedInLayout()
        {
            // Initialise to size of image
            this.OnMakeOriginalSize();
        }

        Draw(iRenderer, iDrawParams)
        {
            const texture = this.GetTexture();

            if (texture)
            {
                this._inst.ApplyBlendMode(iRenderer);
                iRenderer.SetTexture(texture);
                iRenderer.SetColor(this._inst.GetColor());
                iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
            }
            else
            {
                // render placeholder
                iRenderer.SetAlphaBlend();
                iRenderer.SetColorFillMode();

                if (this.HadTextureError()) iRenderer.SetColorRgba(0.25, 0, 0, 0.25);
                else iRenderer.SetColorRgba(0, 0, 0.1, 0.1);

                iRenderer.Quad(this._inst.GetQuad());
            }
        }

        GetTexture()
        {
            const image = this.GetObjectType().GetImage();
            return super.GetTexture(image);
        }

        IsOriginalSizeKnown()
        {
            return true;
        }

        GetOriginalWidth()
        {
            return this.GetObjectType().GetImage().GetWidth();
        }

        GetOriginalHeight()
        {
            return this.GetObjectType().GetImage().GetHeight();
        }

        OnMakeOriginalSize()
        {
            const image = this.GetObjectType().GetImage();
            this._inst.SetSize(image.GetWidth(), image.GetHeight());
        }

        HasDoubleTapHandler()
        {
            return true;
        }

        OnDoubleTap()
        {
            this.GetObjectType().EditImage();
        }

        OnPropertyChanged(id, value)
        {
            this.LoadSpineFile();
        }

        LoadC2Property(name, valueString)
        {
            return false; // not handled
        }
    };
}