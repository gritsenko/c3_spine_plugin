// @ts-check
"use strict";

class SpinePalette {
    constructor(indexSize, paletteNumber) {
        // 4 elements, RGBA
        this._palette = new Uint8Array(paletteNumber*indexSize*4);
        this._enable = false;
        this._indexSize = indexSize;
        this._paletteNumber = paletteNumber;
        this._slotPalette = {};
        this._paletteTexture = null;
        this._c3PaletteTexture = null;

        this._palette.fill(255);
    }

    get palette() { return this._palette;}
    get enable() { return this._enable;}
    get indexSize() { return this._indexSize;}
    get paletteNumber() { return this._paletteNumber;}
    set enable(value) { this._enable = value;}
    get slotPalette() { return this._slotPalette;}
    get paletteTexture() { return this._paletteTexture;}

    createPaletteTexture(renderer)
    {
        let options =  { mipMap: false, sampling: 'nearest', pixelFormat:'rgba8' }
        this._c3PaletteTexture = renderer.CreateDynamicTexture(this.indexSize, this.paletteNumber, options);
        this._paletteTexture = this._c3PaletteTexture._texture;      
    }

    setSlotPalette(slotName, paletteNumber)
    {
        if (paletteNumber < 0 || paletteNumber >= this.paletteNumber) paletteNumber = 0;
        this._slotPalette[slotName] = Math.floor(paletteNumber);
    }

    getSlotPalette(slotName)
    {
        if (this.slotPalette.hasOwnProperty(slotName))
        {
            return this._slotPalette[slotName];
        }
        // Default to palette 0
        return 0; 
    }

    setColor(paletteNumber, index, color)
    {
        if (index < 0 || index > this.indexSize-1) return;

        const spineBatcher = globalThis.spineBatcher;
        this._palette[paletteNumber*this.indexSize+index*4+0] = spineBatcher.getRValue(color)*255;
        this._palette[paletteNumber*this.indexSize+index*4+1] = spineBatcher.getGValue(color)*255;
        this._palette[paletteNumber*this.indexSize+index*4+2] = spineBatcher.getBValue(color)*255;
        this._palette[paletteNumber*this.indexSize+index*4+3] = spineBatcher.getAValue(color)*255;
    }

    setDefaultColors(paletteNumber, colorScale, alphaScale)
    {
        let defaultPalette = [];
        if(this.indexSize == 8)
        {
            // DB8 https://github.com/geoffb/dawnbringer-palettes/blob/master/DB8/db8.txt
            defaultPalette = [  'FF000000','FF55415F','FF646964','FFD77355','FF508CD7','FF64B964','FFE6C86E','FFDCF5FF'];
        } else if(this.indexSize == 16)
        {
            // DB16 https://github.com/geoffb/dawnbringer-palettes/blob/master/DB16/db16.txt
            defaultPalette = [  'FF140C1C','FF442434','FF30346D','FF4E4A4F','FF854C30','FF346524','FFD04648','FF757161',
                                'FF597DCE','FFD27D2C','FF8595A1','FF6DAA2C','FFD2AA99','FF6DC2CA','FFDAD45E','FFDEEED6'];
        } else if(this.indexSize == 32)
        {
            // DB32 https://github.com/geoffb/dawnbringer-palettes/blob/master/DB32/db32.txt
            defaultPalette = [  'FF000000','FF222034','FF45283C','FF663931','FF8F563B','FFDF7126','FFD9A066','FFEEC39A',
                                'FFFBF236','FF99E550','FF6ABE30','FF37946E','FF4B692F','FF524B24','FF323C39','FF3F3F74',
                                'FF306082','FF5B6EE1','FF639BFF','FF5FCDE4','FFCBDBFC','FFFFFFFF','FF9BADB7','FF847E87',
                                'FF696A6A','FF595652','FF76428A','FFAC3232','FFD95763','FFD77BBA','FF8F974A','FF8A6F30'];
        }

        for(let i = 0; i<defaultPalette.length;i++)
        {
            let color = this.convertHexToDecimal(defaultPalette[i]); 
            this._palette[paletteNumber*this.indexSize*4+i*4+0] = color.r * colorScale;
            this._palette[paletteNumber*this.indexSize*4+i*4+1] = color.g * colorScale;
            this._palette[paletteNumber*this.indexSize*4+i*4+2] = color.b * colorScale;
            this._palette[paletteNumber*this.indexSize*4+i*4+3] = color.a * alphaScale;
        }

    }

    convertHexToDecimal(hex){
        let a = parseInt(hex.substring(0,2), 16);
        let r = parseInt(hex.substring(2,4), 16);
        let g = parseInt(hex.substring(4,6), 16);
        let b = parseInt(hex.substring(6,8), 16);
    
        return {r:r,g:g,b:b,a:a};
    }

    setShaderEnable(shader)
    {
        if (this.enable)
        {
            shader.setUniformf('paletteEnable', 1.0);
        } else
        {
            shader.setUniformf('paletteEnable', 0.0);
        }
    }

    upload(textureUnit, gl)
    {
        let oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);            
        let oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);  
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this._paletteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.indexSize, this.paletteNumber, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._palette);
        gl.activeTexture(oldActive);
        gl.bindTexture(gl.TEXTURE_2D, oldTex);
    }
    
}

// @ts-ignore
if (!globalThis.SpinePalette)
{
    // @ts-ignore
    globalThis.SpinePalette = SpinePalette;
}
