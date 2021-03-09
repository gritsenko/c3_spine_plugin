// @ts-check
"use strict";

class SpinePalette {
    constructor(size) {
        // 4 elements, RGBA
        this._palette = new Array(size*4);
        this._enable = false;

        this._palette.fill(1.0);
    }

    get palette() { return this._palette;}
    get enable() { return this._enable;}
    set enable(value) {this._enable = value;}

    setColor(index, r, g, b, a)
    {
        if (index <0 || index*4 > this._palette.length-4) return;
        this._palette[index*4] = r;
        this._palette[index*4+1] = g;
        this._palette[index*4+2] = b;
        this._palette[index*4+3] = a;
    }

    setDefaultColors()
    {
        let defaultPalette = [];
        if(this._palette.length/4 == 8)
        {
            // DB8 https://github.com/geoffb/dawnbringer-palettes/blob/master/DB8/db8.txt
            defaultPalette = ['FF000000','FF55415F','FF646964','FFD77355','FF508CD7','FF64B964','FFE6C86E','FFDCF5FF'];
        } else if(this._palette.length/4 == 16)
        {
            // DB16 https://github.com/geoffb/dawnbringer-palettes/blob/master/DB16/db16.txt
            defaultPalette = [  'FF140C1C','FF442434','FF30346D','FF4E4A4F','FF854C30','FF346524','FFD04648','FF757161',
                                'FF597DCE','FFD27D2C','FF8595A1','FF6DAA2C','FFD2AA99','FF6DC2CA','FFDAD45E','FFDEEED6'];
        }

        for(let i = 0; i<defaultPalette.length;i++)
        {
            let color = this.convertHexToDecimal(defaultPalette[i]); 
            this._palette[i*4+0] = color.r;
            this._palette[i*4+1] = color.g;
            this._palette[i*4+2] = color.b;
            this._palette[i*4+3] = color.a;
        }

    }

    convertHexToDecimal(hex){
        let a = parseInt(hex.substring(0,2), 16)/255;
        let r = parseInt(hex.substring(2,4), 16)/255;
        let g = parseInt(hex.substring(4,6), 16)/255;
        let b = parseInt(hex.substring(6,8), 16)/255;
    
        return {r:r,g:g,b:b,a:a};
    }

    applyToShader(shader)
    {
        if (this._enable)
        {
            for (let i=0;i<this._palette.length/4;i++)
            {
                let uniformName = 'color'+i;
                shader.setUniform4f(uniformName, this._palette[i*4+0], this._palette[i*4+1], this._palette[i*4+2], this._palette[i*4+3],);
            }
            shader.setUniform4f('paletteEnable', 1.0);
        } else
        {
            shader.setUniform4f('paletteEnable', 0.0);
        }
    }
    
}

// @ts-ignore
if (!globalThis.SpinePalette)
{
    // @ts-ignore
    globalThis.SpinePalette = SpinePalette;
}
