const SPRITE_SHEET_WIDTH = 4096;
const SPRITE_SHEET_HEIGHT = 4096;
const SPRITE_WIDTH = 256;
const SPRITE_HEIGHT = 256;

class GlCache {
    constructor(isWebGL2, gl) {
        this._oldFrameBuffer = null;
        this._extOESVAO = null;
        this._oldVAO = null;
        this._oldProgram = null;    
        this._oldActive = null;
        this._oldTex = null;
        this._oldBinding = null;
        this._oldElement = null;
        this._oldClearColor = null;
        this._oldViewport = null;
        this._isWebGL2 = isWebGL2;
        this._gl = gl;
    }

    cache() {

        const gl = this._gl;

        if (!this._isWebGL2)
        {
            this._extOESVAO = gl.getExtension("OES_vertex_array_object");
        }

        if (this._isWebGL2)
        {
            this._oldVAO = gl.createVertexArray();
            this._oldVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
        } else
        {
            this._oldVAO = this._extOESVAO.createVertexArrayOES(); 
            this._oldVAO = gl.getParameter(extOESVAO.VERTEX_ARRAY_BINDING_OES);
        }

        // Save C3 wegl parameters to restore
        this._oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);        
        this._oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);            
        this._oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);        
        this._oldBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        this._oldElement = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        this._oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        this._oldViewport = gl.getParameter(gl.VIEWPORT);
    }

    restore() {
        const gl = this._gl;

        // Change back to C3 FB last used
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._oldFrameBuffer);

        // Restore C3 webgl state
        gl.useProgram(this._oldProgram);
        if (this._isWebGL2)
        {
            gl.bindVertexArray(this._oldVAO);
        } else
        {
            this._extOESVAO.bindVertexArrayOES(this._oldVAO); 
        }                    
        gl.activeTexture(this._oldActive);                
        gl.bindTexture(gl.TEXTURE_2D, this._oldTex);        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._oldBinding);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._oldElement);
        gl.clearColor(this._oldClearColor[0],this._oldClearColor[1],this._oldClearColor[2],this._oldClearColor[3])
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(this._oldViewport[0],this._oldViewport[1],this._oldViewport[2],this._oldViewport[3]);        
    }

        // Save C3 webgl context, may be able to reduce some
        // Save VAO to restore
    
}

class SpriteSheet {
    constructor() {
        this._width = SPRITE_SHEET_WIDTH;
        this._height = SPRITE_SHEET_HEIGHT;
        this._spriteWidth = SPRITE_WIDTH;
        this._spriteHeight = SPRITE_HEIGHT;
        this._sprites = [];
        this._texture = null;
        this._spineFB = null;

        for (let x = 0; x < Math.floor(this._width/this._spriteWidth); x++)
        {
            for (let y = 0; y < Math.floor(this._height/this._spriteHeight); y++)
            {
                let sprite =
                    {
                        index: this._sprites.length,
                        x: x,
                        y: y,
                        available : true,
                        left : (x*this._spriteWidth)/this._width,
                        top : ((y+1)*this._spriteHeight)/this._height,
                        right : ((x+1)*this._spriteWidth)/this._width,
                        bottom : ((y)*this._spriteHeight)/this._height,
                        viewX : x*this._spriteWidth,
                        viewY : y*this._spriteHeight,
                        viewWidth : this._spriteWidth,
                        viewHeight : this._spriteHeight,
                        uid : -1
                    };
                this._sprites.push(sprite);                
            }            
        }
        console.log('[Spine] this._sprites', this._sprites);

    }

    get width() {return this._width};
    get height() {return this._height};
    get sprites() {return this._sprites};
    get spriteWidth() {return this._spriteWidth};
    get spriteHeight() {return this._spriteHeight};
    get texture() {return this._texture};
    get spineFB() {return this._spineFB};  

    // Create dynamic texture for full sprite sheet
    createTexture(runtime)
    {
        const c3Renderer = runtime.GetWebGLRenderer();
        const gl = c3Renderer._gl;
        const sampling = runtime.GetSampling();
        const options =  { mipMap: false, sampling: sampling }
        console.log('[Spine] SpriteSheet CreateDynamicTexture x,y:', this._width, this._height);
        this._texture = c3Renderer.CreateDynamicTexture(this._width, this._height, options);

        let oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        // Create FB and bind texture to spineFB
        this._spineFB = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._spineFB);
        // attach the texture as the first color attachment
        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._texture._texture, 0);
        // Restore render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFrameBuffer);

    }

    getSprite(uid)
    {
        const length = this._sprites.length;
        for (let index=0;index<length;index++)
        {
            if (this._sprites[index].available)
            {
                this._sprites[index].available = false;
                this._sprites[index].uid = uid;
                return this._sprites[index];
            }
        }

        // There is no sprite available
        return false;
    }

    releaseSprite(index, debug)
    {
        let length = this._sprites.length;
        if (index < 0 || index >= length) return;
        this._sprites[index].available = true;
        this._sprites[index].uid = -1;
        if (debug) console.log('[Spine] sprite released', index);
    }

}

class SpineBatch {    
    constructor() {
        // Skeleton instances to render
        this._initialized = false
        this._skeletonInstances = {}
        // SpineDraw rendered yet this frame
        this._rendered = false
        this._tickCount = -1
        this._renderRate = 1;
        this._spriteSheet = new SpriteSheet();
        this._glCached = false;
    }

    get rendered() {return this._rendered;}
    get initialized() {return this._initialized;}
    get tickCount() {return this._tickCount;}
    set tickCount(tick) {this._tickCount = tick;}
    get renderRate() {return this._renderRate;}
    set renderRate(renderRate) {this._renderRate = renderRate;}
    get spriteSheet() {return this._spriteSheet;}

    init(canvas, runtime)
    {    
        const spine = globalThis.spine;
    
        if (this._initialized) return 
        this.runtime = runtime;
        this.canvas = canvas;

        // Get C3 canvas gl context
        // Context already exists and we want to use (for render to texture)
        let config = {}
        this.gl = this.canvas.getContext("webgl2", config) || this.canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
        const gl = this.gl

        if (!gl) {
            alert('WebGL is unavailable.');
            return;
        }

        let version = 0;
        this.isWebGL2 = false;
        let glVersion = gl.getParameter( gl.VERSION );
    
        if ( glVersion.indexOf( 'WebGL' ) !== - 1 )
        {
           version = parseFloat( /^WebGL\ ([0-9])/.exec( glVersion )[ 1 ] );
           this.isWebGL2 = ( version >= 2.0 );
        } else if ( glVersion.indexOf( 'OpenGL ES' ) !== - 1 )
        {
    
           version = parseFloat( /^OpenGL\ ES\ ([0-9])/.exec( glVersion )[ 1 ] );
           this.isWebGL2 = ( version >= 3.0 );
        }

        if (this.isWebGL2)
        {
            this.myVAO = gl.createVertexArray();
        } else
        {
            let extOESVAO = gl.getExtension("OES_vertex_array_object");
            if (!extOESVAO)
            {
                alert("Spine plugin error: webGL1 with no OES_vertex_array_object support");  // tell user they don't have the required extension or work around it
                return;
            }
            this.myVAO = extOESVAO.createVertexArrayOES();
        }

        this.mvp = new spine.webgl.Matrix4();
        this.shader = spine.webgl.Shader.newTwoColoredTextured(gl);
        this.batcher = new spine.webgl.PolygonBatcher(gl);
        this.renderer = new spine.webgl.SkeletonRenderer(gl);
        this.shapes = new spine.webgl.ShapeRenderer(gl);

        this._spriteSheet.createTexture(runtime);
        console.log('Spine] this._spriteSheet._spineFB',this._spriteSheet._spineFB);

        this._glCache = new GlCache(this.isWebGL2, this.gl);

        this._initialized = true;
    }

    addInstance(instance, skeletonScale, uid)
    {
        this._skeletonInstances[uid] = {}
        this._skeletonInstances[uid].skeletonInfo = instance
        this._skeletonInstances[uid].initialized = false
        this._skeletonInstances[uid].skeletonScale = skeletonScale
        this._skeletonInstances[uid].onScreen = true
        this._skeletonInstances[uid].tracksComplete = false
        this._skeletonInstances[uid].renderOnce = true
    }

    removeInstance(uid)
    {
        if (!this._skeletonInstances[uid]) return
        delete this._skeletonInstances[uid]
    }

    setInstanceInitialized(uid)
    {
        if (!this._skeletonInstances[uid]) return
        this._skeletonInstances[uid].initialized = true
    }

    setInstanceFB(spineFB, uid)
    {
        if (!this._skeletonInstances[uid]) return
        this._skeletonInstances[uid].spineFB = spineFB
    }

    setInstanceOnScreen(onScreen, uid)
    {
        if (!this._skeletonInstances[uid]) return
        this._skeletonInstances[uid].onScreen = onScreen;
    }

    setInstanceTracksComplete(tracksComplete, uid)
    {
        if (!this._skeletonInstances[uid]) return
        // If transitioning to tracksComplete, render one more time
        if (!this._skeletonInstances[uid].tracksComplete && tracksComplete)
        {
            this._skeletonInstances[uid].renderOnce = true
        }
        this._skeletonInstances[uid].tracksComplete = tracksComplete;
    }

    setInstanceRenderOnce(renderOnce, uid)
    {
        if (!this._skeletonInstances[uid]) return

        this._skeletonInstances[uid].renderOnce = renderOnce;
    }

    resize(bounds, skeletonScale) {
        // magic
        var centerX = bounds.offset.x + (bounds.size.x) / 2;
        var centerY = bounds.offset.y + (bounds.size.y) / 2;
        var scaleX = bounds.size.x / (bounds.size.x);
        var scaleY = bounds.size.y / (bounds.size.y);
        var scale = Math.max(scaleX, scaleY) * (1/skeletonScale);
        if (scale < 1) scale = 1;
        var width = (bounds.size.x) * scale;
        var height = (bounds.size.y) * scale;

        this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
    }

    drawBatch() {
        const spine = globalThis.spine;

        const gl = this.gl;
        const skeletonInstances = this._skeletonInstances;

        // End C3 Batch
        // this.c3wgl.EndBatch();

        if (!this._glCached)
        {
            this._glCache.cache();
            // this._glCached = true;
        }


        //var oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        // Save C3 webgl context, may be able to reduce some
        // Save VAO to restore

        if (!this.isWebGL2)
        {
            var extOESVAO = gl.getExtension("OES_vertex_array_object");
        }

        //if (this.isWebGL2)
        //{
        //    var oldVAO = gl.createVertexArray();
        //    oldVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
        //} else
        //{
        //    var oldVAO = extOESVAO.createVertexArrayOES(); 
        //    oldVAO = gl.getParameter(extOESVAO.VERTEX_ARRAY_BINDING_OES);
        //}

        // Save C3 wegl parameters to restore
        //var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);        
        //var oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);            
        //var oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);        
        //var oldBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        //var oldElement = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        //var oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        //var oldViewport = gl.getParameter(gl.VIEWPORT);

        // Bind to private VAO so Spine use does not impact C3 VAO
        if (this.isWebGL2)
        {
            gl.bindVertexArray(this.myVAO);
        } else
        {
            extOESVAO.bindVertexArrayOES(this.myVAO); 
        }

        let tickCount = this.runtime.GetTickCount();

        // Per instance render
        let index = 0;
        let count = 0;

        // Initialize SkeletonRenderer
        const skeletonInstance = skeletonInstances[Object.keys(skeletonInstances)[0]];
        const bounds = skeletonInstance.skeletonInfo.bounds;
        const premultipliedAlpha = skeletonInstance.skeletonInfo.premultipliedAlpha;

        // Render to our targetTexture by binding the framebuffer to the SpineFB texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._spriteSheet.spineFB);

        // Set viewport
        gl.viewport(0, 0, this._spriteSheet.width, this._spriteSheet.height);
        // gl.viewport(0, 0, 256, 256);

        // Set proper webgl blend for Spine render
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.bindTexture(gl.TEXTURE_2D, null);        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // Bind the shader and set the texture and model-view-projection matrix.
        this.shader.bind();
        this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);

        // Common mvp for all sprites
        this.resize(bounds, skeletonInstance.skeletonScale);
        this.mvp.ortho2d(0, 0, this._spriteSheet.width, this._spriteSheet.height);
        this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);

        // No vertex effect used
        this.renderer.vertexEffect = null;

        // Clear spriteSheet FB
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.renderer.premultipliedAlpha = premultipliedAlpha;

        this.batcher.begin(this.shader);

        let spriteWidth = spineBatcher.spriteSheet.spriteWidth;
        let spriteHeight = spineBatcher.spriteSheet.spriteHeight;

        for (const uid in skeletonInstances)
        {
            const skeletonInstance = skeletonInstances[uid];
            if (skeletonInstance.initialized 
                && (!skeletonInstance.tracksComplete
                    || skeletonInstance.renderOnce
                    || skeletonInstance.onScreen)
                && (tickCount%this._renderRate == index%this._renderRate))
            {
                // console.log('[Spine] render, uid', skeletonInstance.renderOnce, uid)
                // For one off render (e.g. end of track or set slot), now set based on animateOnce
                // skeletonInstance.renderOnce = false;

                // this.batcher.begin(this.shader);

                count++;
                // const bounds = skeletonInstance.skeletonInfo.bounds;
                // const premultipliedAlpha = skeletonInstance.skeletonInfo.premultipliedAlpha;

                // Render to our targetTexture by binding the framebuffer to the SpineFB texture
                // gl.bindFramebuffer(gl.FRAMEBUFFER, skeletonInstance.spineFB);

                // Set viewport
                // gl.viewport(0, 0, bounds.size.x, bounds.size.y);
                // gl.viewport(skeletonInstance.skeletonInfo.sprite.viewX,
                //            skeletonInstance.skeletonInfo.sprite.viewY,
                //            skeletonInstance.skeletonInfo.sprite.viewWidth,
                //            skeletonInstance.skeletonInfo.sprite.viewHeight);
                /*
                console.log('[Spine] viewport',skeletonInstance.skeletonInfo.sprite.viewX,
                    skeletonInstance.skeletonInfo.sprite.viewY,
                    skeletonInstance.skeletonInfo.sprite.viewWidth,
                    skeletonInstance.skeletonInfo.sprite.viewHeight);
                */

                // Set proper webgl blend for Spine render
                // gl.enable(gl.BLEND);
                // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

                // gl.bindTexture(gl.TEXTURE_2D, null);        
                // gl.bindBuffer(gl.ARRAY_BUFFER, null);
                // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

                // Bind the shader and set the texture and model-view-projection matrix.
                // this.shader.bind();
                // this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
                // Resize 
                // this.resize(bounds, skeletonInstance.skeletonScale);
                // this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
                
                // Start the batch and tell the SkeletonRenderer to render the active skeleton.
                // this.batcher.begin(this.shader);
                
                // Apply vertex effect
                // this.renderer.vertexEffect = null;

                // gl.clearColor(0, 0, 0, 0);
                // gl.clear(gl.COLOR_BUFFER_BIT);
                let spriteX = skeletonInstance.skeletonInfo.sprite.x;      
                let spriteY = skeletonInstance.skeletonInfo.sprite.y;      
                skeletonInstance.skeletonInfo.skeleton.x = spriteX*spriteWidth + spriteWidth/2;
                skeletonInstance.skeletonInfo.skeleton.y = spriteY*spriteHeight + spriteHeight/2;
                // Render
                // this.renderer.premultipliedAlpha = premultipliedAlpha;
                this.renderer.draw(this.batcher, skeletonInstance.skeletonInfo.skeleton);
                // this.batcher.end();
                // this.shader.unbind();
            }
            index++;
        }

        this.batcher.end();
        this.shader.unbind();

        this._rendered = true;
        this._glCache.restore();

        /*
        // Change back to C3 FB last used
        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFrameBuffer);

        // Restore C3 webgl state
        gl.useProgram(oldProgram);
        if (this.isWebGL2)
        {
            gl.bindVertexArray(oldVAO);
        } else
        {
            extOESVAO.bindVertexArrayOES(oldVAO); 
        }                    
        gl.activeTexture(oldActive);                
        gl.bindTexture(gl.TEXTURE_2D, oldTex);        
        gl.bindBuffer(gl.ARRAY_BUFFER, oldBinding);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oldElement);
        gl.clearColor(oldClearColor[0],oldClearColor[1],oldClearColor[2],oldClearColor[3])
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(oldViewport[0],oldViewport[1],oldViewport[2],oldViewport[3]);
        */
    }

    getRValue(rgb)
    {
        const ALPHAEX_SHIFT = 1024;
        const ALPHAEX_MAX = 1023;
        const RGBEX_SHIFT = 16384;
        const RGBEX_MAX = 8191;
        const RGBEX_MIN = -8192;
        if (rgb >= 0) return (rgb & 255) / 255;
        else {
            let v = Math.floor(-rgb / (RGBEX_SHIFT * RGBEX_SHIFT * ALPHAEX_SHIFT));
            if (v > RGBEX_MAX) v -= RGBEX_SHIFT;
            return v / 1024;
        }
    };

    getGValue(rgb)
    {
        const ALPHAEX_SHIFT = 1024;
        const ALPHAEX_MAX = 1023;
        const RGBEX_SHIFT = 16384;
        const RGBEX_MAX = 8191;
        const RGBEX_MIN = -8192;
        if (rgb >= 0) return ((rgb & 65280) >> 8) / 255;
        else {
        let v = Math.floor(
            (-rgb % (RGBEX_SHIFT * RGBEX_SHIFT * ALPHAEX_SHIFT)) /
            (RGBEX_SHIFT * ALPHAEX_SHIFT)
        );
        if (v > RGBEX_MAX) v -= RGBEX_SHIFT;
        return v / 1024;
        }
    };

    getBValue(rgb)
    {
        const ALPHAEX_SHIFT = 1024;
        const ALPHAEX_MAX = 1023;
        const RGBEX_SHIFT = 16384;
        const RGBEX_MAX = 8191;
        const RGBEX_MIN = -8192;
        if (rgb >= 0) return ((rgb & 16711680) >> 16) / 255;
        else {
        let v = Math.floor(
            (-rgb % (RGBEX_SHIFT * ALPHAEX_SHIFT)) / ALPHAEX_SHIFT
        );
        if (v > RGBEX_MAX) v -= RGBEX_SHIFT;
        return v / 1024;
        }
    };

    getAValue(rgb)
    {
        const ALPHAEX_SHIFT = 1024;
        const ALPHAEX_MAX = 1023;
        const RGBEX_SHIFT = 16384;
        const RGBEX_MAX = 8191;
        const RGBEX_MIN = -8192;
        if (rgb === 0 && 1 / rgb < 0) return 0;
        else if (rgb >= 0) return 1;
        else {
            const v = Math.floor(-rgb % ALPHAEX_SHIFT);
            return v / ALPHAEX_MAX;
        }
    };

  }

if (!globalThis.spineBatcher)
{
    console.log('[Spine] SpineBatcher init');
    globalThis.spineBatcher = new SpineBatch();
}