"use strict"; {
    // const DOM_COMPONENT_ID = "gritsenko-spine";
    C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKWorldInstanceBase {
        //C3.Plugins.Gritsenko_Spine.Instance = class SpineInstance extends C3.SDKDOMInstanceBase {

        constructor(inst, properties) {
            super(inst);


            this.DEMO_NAME = "Hero";
            this.canvas = null;
            this.bgColor = null;
            this.isPlaying = true;

            this.assetManager = null;
            this.isSkeletonLoaded = false;
            this.isSkeletonLoading = false;
            this.isSpineInitialized = false;
            this.skeletonInfo = null;
            this.renderer = null;
            this.gl = null;
            // super(inst, DOM_COMPONENT_ID);

            this.atlasPath = "";

            if (properties) {
                this.jsonPath = properties[0];
                this.atlasPath = properties[1];
                this.pngPath = properties[2];
                this.skinName = properties[3];
                this.animationName = properties[4];
                this.skeletonName = properties[5];
                this.skeletonScale = properties[6];
                this.premultipliedAlpha = properties[7];
                this.collisionsEnabled = properties[8];
                this.defaultMix = properties[9];
            }

            this.isMirrored = false;
            this._elementId = "";

            this._elementTexture = null
            this._newElementId = false


            this.pngURI = ""
            this.atlasURI = ""
            this.jsonURI = ""
            this.c3renderer = null
            this.c3wgl = globalThis.c3_runtimeInterface._localRuntime.GetCanvasManager().GetWebGLRenderer()
            this.canvas = globalThis.c3_runtimeInterface.GetCanvas() // C3 canvas 
            this.spineFB = null
            this.initSpineInProgress = false;
            this.completeAnimationName = ""
            this.spineError = null
            this.animationSpeed = 1.0

            const wi = this.GetWorldInfo();
            // Enable collisions based on property, add ACEs if needed
            wi.SetCollisionEnabled(this.collisionsEnabled);

            this._StartTicking();

        }

        // spineDemos.log = true
        // Initialize project files URIs
        async initSpine() {
            this.initSpineInProgress = true;
            var uid = this.GetInstance().GetUID()
            this._elementId = "SpineCanvas_" + uid;
            this.DEMO_NAME = this._elementId;

            // Get C3 canvas gl context
            // Context already exists and we want to use (for render to texture)
            // XXX Can't change existing context attributes (though we may want to for PMA)
            // var config = { alpha: false };
            var config = {}
            this.gl = this.canvas.getContext("webgl2", config) || this.canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
            var gl = this.gl
            if (!gl) {
                alert('WebGL is unavailable.');
                return;
            }

            var version = 0;
            this.isWebGL2 = false;
            var glVersion = gl.getParameter( gl.VERSION );
        
            if ( glVersion.indexOf( 'WebGL' ) !== - 1 )
            {
               version = parseFloat( /^WebGL\ ([0-9])/.exec( glVersion )[ 1 ] );
               this.isWebGL2 = ( version >= 2.0 );
            } else if ( glVersion.indexOf( 'OpenGL ES' ) !== - 1 )
            {
        
               version = parseFloat( /^OpenGL\ ES\ ([0-9])/.exec( glVersion )[ 1 ] );
               this.isWebGL2 = ( version >= 3.0 );
            }

            // Init Spine elements
            // Disable PMA when loading Spine textures
            spine.webgl.GLTexture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = true;
            this.mvp = new spine.webgl.Matrix4();
            this.shader = spine.webgl.Shader.newTwoColoredTextured(gl);
            this.batcher = new spine.webgl.PolygonBatcher(gl);
            this.mvp.ortho2d(0, 0, 0, 0); // XXX Render to texture size unknown until skeleton loaded.
            this.renderer = new spine.webgl.SkeletonRenderer(gl);
            this.shapes = new spine.webgl.ShapeRenderer(gl);
            this.assetManager = new spine.SharedAssetManager();
            this.bgColor = new spine.Color(0.0, 0.0, 0.0, 0.0);

            // console.log(gl)

            this.pngURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.pngPath);
            this.atlasURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.atlasPath);
            this.jsonURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.jsonPath);

            // console.log("LOADING SPINE STUFF");
            
            var textureLoader = function(img) { return new spine.webgl.GLTexture(gl, img); };
            this.assetManager.loadJson(this.DEMO_NAME, this.jsonURI);
            this.assetManager.loadTexture(this.DEMO_NAME, textureLoader, this.pngURI);
            this.assetManager.loadText(this.DEMO_NAME, this.atlasURI);
            this.isSpineInitialized = true;

            // Restore PMA format to C3 state
            // XXX Can not be reset here, causes PMA texture load to be incorrect
            // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 
            // console.log("Spine renderer initialized");
        }

        resize() {
            var bounds = this.skeletonInfo.bounds;

            // magic
            var centerX = bounds.offset.x + (bounds.size.x) / 2;
            var centerY = bounds.offset.y + (bounds.size.y) / 2;
            var scaleX = bounds.size.x / (bounds.size.x);
            var scaleY = bounds.size.y / (bounds.size.y);
            var scale = Math.max(scaleX, scaleY) * (1/this.skeletonScale);
            if (scale < 1) scale = 1;
            var width = (bounds.size.x) * scale;
            var height = (bounds.size.y) * scale;

            this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
            // XXX will resize c3 canvas, if FB bound to C3 canvas 
            // this.gl.viewport(0, 0, bounds.size.x, bounds.size.y);
            // only do in render function where it can be restored
        }

        loadSkeletons() {
            // console.log("Loading skeleton");

            // this.skeletonInfo = this.loadSkeleton("hero_human_female", this.animationName);
            // XXX hack to allow different skeletons loaded by oveloading skinName
            this.skeletonInfo = this.loadSkeleton(this.skeletonName, this.animationName);

            const skins = this.skeletonInfo.skeleton.data.skins;
            this.skinNames = skins.map(x => x.name);

            const animations = this.skeletonInfo.skeleton.data.animations;
            this.animationNames = animations.map(x => x.name);

            this.isSkeletonLoaded = true;
            this.isSkeletonLoading = false;

            // console.log("Skeleton loaded");

            // XXX Do not resize C3 canvas
            // XXX May need to delete and resize texture buffer that is created instead?
            this.resize();
            // console.log(this.skeletonInfo)

            this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnSkeletonLoaded);
        }

        loadSkeleton(name, animationName, sequenceSlots) {
            const assetManager = this.assetManager;

            const self = this;
            const atlasURI = assetManager.get(this.DEMO_NAME, this.atlasURI);

            // console.log("Loading atlas");

            var atlas = new spine.TextureAtlas(atlasURI, function(path) {
                // console.log(`Loading png atlas ${path} replaced with ${self.pngURI}`);
                return assetManager.get(self.DEMO_NAME, self.pngURI);
            });


            var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

            // console.log("Loading json");

            var skeletonJson = new spine.SkeletonJson(atlasLoader);

            // console.log("Reading skeleton data");

            // XXX JSON file with one skeleton, no name? 
            if (this.skeletonName == "")
            {
                var skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI) /*[name]*/ );
            } else
            {
                var skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI) [name] );
            }

            // console.log("creating skeleton");

            var skeleton = new spine.Skeleton(skeletonData);
            //skeleton.setSkinByName(this.skinName);
            let subskin = skeleton.data.findSkin(this.skinName);
            if (subskin === undefined) {
                subskin = skeleton.data.skins[0];
            }

            skeleton.setSkin(subskin);

            if (this.debug) console.log("Loading state");

            let stateData = new spine.AnimationStateData(skeletonData);
            stateData.defaultMix = this.defaultMix;

            var state = new spine.AnimationState(stateData);
            state.setAnimation(0, animationName, true);
            state.apply(skeleton);
            skeleton.updateWorldTransform();
            var offset = new spine.Vector2();
            var size = new spine.Vector2();
            skeleton.getBounds(offset, size, []);

            return {
                atlas: atlas,
                skeleton: skeleton,
                state: state,
                playTime: 0,
                bounds: {
                    offset: offset,
                    size: size
                },
                atlasLoader : atlasLoader
            };
        }

        updateCurrentSkin() {

            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            // console.log(skeleton);
            let skins = [];
            if (this.skinName.indexOf(",") > -1) {
                skins = this.skinName.split(",");
                const newSkin = new spine.Skin("compound-skin")
                skins.forEach(element => {
                    const subskin = skeleton.data.findSkin(element);
                    newSkin.addSkin(subskin);
                });

                skeleton.setSkin(newSkin);

            } else {
                skins.push(this.skinName);
                skeleton.setSkinByName(this.skinName);
            }
            skeleton.setSlotsToSetupPose();
        }

        updateBounds() {
            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            state.apply(skeleton);
            skeleton.updateWorldTransform();
            var offset = new spine.Vector2();
            var size = new spine.Vector2();
            skeleton.getBounds(offset, size, []);

            this.skeletonInfo.bounds = {
                offset: offset,
                size: size
            };
        }

        updateCurrentAnimation(loop) {
            try {
                const state = this.skeletonInfo.state;
                const skeleton = this.skeletonInfo.skeleton;
                state.setAnimation(0, this.animationName, loop);

                state.tracks[0].listener = {
                    complete: (trackEntry, count) => {
                        this.completeAnimationName = this.animationName;
                        this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnimationFinished);
                        this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnAnyAnimationFinished);
                    }
                };

                state.apply(skeleton);
            } catch (ex) {
                console.error(ex);
                alert(ex + "\n\n available animations: \n" + this.animationNames.join("\n"));
                this.spineError = ex + "\n\n available animations: \n" + this.animationNames.join("\n");
                this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnError);
            }
        }

        playAnimation() {
            this.isPlaying = true;
        }

        stopAnimation() {
            this.isPlaying = false;
        }

        IsSpineReady() {
            if (this.isSkeletonLoaded) {
                return true;
            }

            if (this.isSkeletonLoading) {
                return false;
            }

            if (!this.isSpineInitialized) {
                if (!this.initSpineInProgress)
                    {
                        this.initSpine();
                    }
                return false;
            }

            if (!this.isSkeletonLoading && this.assetManager !== undefined && this.assetManager.isLoadingComplete(this._elementId)) {

                this.isSkeletonLoading = true;
                // Init and start render
                this.loadSkeletons();
            }
            return false;
        }

        render() {
            const gl = this.gl;
            const bounds = this.skeletonInfo.bounds;


            // End C3 Batch
            // this.c3wgl.EndBatch(); 

            var oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            // Render to our targetTexture by binding the framebuffer to the SpineFB texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);

            // Save C3 webgl context, may be able to reduce some
            // Create VAO for Spine to use. May need to change this for non-webgl2
            // Handle webgl1 and webgl2
            if (!this.isWebGL2)
            {
                var extOESVAO = gl.getExtension("OES_vertex_array_object");
                if (!extOESVAO)
                {
                    alert("Spine plugin error: webGL1 with no OES_vertex_array_object support");  // tell user they don't have the required extension or work around it
                    return;
                }
    
            }

            // XXX Should move to spine init
            if(!this.myVAO)
            {
                if (this.isWebGL2)
                {
                    this.myVAO = gl.createVertexArray();
                } else
                {
                    this.myVAO = extOESVAO.createVertexArrayOES();
                }

            }

            if (this.isWebGL2)
            {
                var oldVAO = gl.createVertexArray();
                oldVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
            } else
            {
                var oldVAO = extOESVAO.createVertexArrayOES(); 
                oldVAO = gl.getParameter(extOESVAO.VERTEX_ARRAY_BINDING_OES);
            }

            var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);        
            var oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);            
            var oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);        
            var oldBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
            var oldElement = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
            var oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
            var oldViewport = gl.getParameter(gl.VIEWPORT);
            // Bind to private VAO so Spine use does not impact C3 VAO

            if (this.isWebGL2)
            {
                gl.bindVertexArray(this.myVAO);
            } else
            {
                extOESVAO.bindVertexArrayOES(this.myVAO); 
            }

            // Set viewport?
            gl.viewport(0, 0, bounds.size.x, bounds.size.y);

            // Set proper webgl blend for Spine render
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            // Some random appearing alpha / pma issue may be related to blend func
            // XXX gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.bindTexture(gl.TEXTURE_2D, null);        
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            // Bind the shader and set the texture and model-view-projection matrix.
	        this.shader.bind();
	        this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
            this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
            
            // Start the batch and tell the SkeletonRenderer to render the active skeleton.
            this.batcher.begin(this.shader);
            
            // Apply vertex effect
            this.renderer.vertexEffect = null;

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Resize 
            this.resize();
            // Render
            this.renderer.premultipliedAlpha = this.premultipliedAlpha;
            this.renderer.draw(this.batcher, this.skeletonInfo.skeleton);
            this.batcher.end();
            this.shader.unbind();

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
            // XXX seems redundant, but C3 set blendFunc twice with different values (may be at end and start?)
            // gl.blendFunc(gl.ONE, gl.ZERO)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            // XXX incorrect blend, causes first effect to not be drawn (drawn to another FB)
            // gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.viewport(oldViewport[0],oldViewport[1],oldViewport[2],oldViewport[3]);
        }


        Release() {
            super.Release();
        }

        Tick() {
                if (!this.IsSpineReady()) {
                return;
            }
            const delta = this._runtime.GetDt() * this.animationSpeed;
            var active = this.skeletonInfo;
            const state = this.skeletonInfo.state;

            if (this.isPlaying) {

                var animationDuration = state.getCurrent(0).animation.duration;
                active.playTime += delta;
                while (active.playTime >= animationDuration)
                    active.playTime -= animationDuration;
                state.update(delta);
                state.apply(active.skeleton);
                active.skeleton.updateWorldTransform();
                this._runtime.UpdateRender();
            }
        }

        Draw(renderer) {

            // if (!this.loggedRenderer) {
            //     this.loggedRenderer = true;
            //     console.log(renderer);
            // }
            var  gl  =  renderer._gl

            if (this._elementId == "" || !this.isSkeletonLoaded) return; // elementID not set, can't draw the element

            var myCanvas = this.canvas;

            const wi = this.GetWorldInfo();
            const quad = wi.GetBoundingQuad();

            // Create texture if it does not exist (could this be done in constructor?)
            if (this._elementTexture === null || this._newElementId) {

                if (this._elementTexture !== null) {
                    renderer.DeleteTexture(this._elementTexture);
                }
                this.c3renderer = renderer
                // console.log(this.c3renderer)
                // console.log("BatchState:")
                // console.log(renderer._batchState.currentShader._shaderProgram)
                this._newElementId = false;

                var bounds = this.skeletonInfo.bounds;
                this._elementTexture = renderer.CreateDynamicTexture(bounds.size.x, bounds.size.y, { mipMap: false });

                var oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
                // Create FB and bind texture to spineFB
                this.spineFB = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);
                // attach the texture as the first color attachment
                const attachmentPoint = gl.COLOR_ATTACHMENT0;
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._elementTexture._texture, 0);
                // console.log("this.spineFB created:"+this.spineFB)
                // Restore render to the canvas
                gl.bindFramebuffer(gl.FRAMEBUFFER, oldFrameBuffer);
                // console.log("Created dynamic texture for spine:" + this._elementId);
            }

            // Render skeleton
            if (this.isSkeletonLoaded && this._elementTexture !== null) {
                this.render();
            }
            let x0 = 0;
            let x1 = 1;
            if (this.isMirrored) {
                x0 = 1;
                x1 = 0;
            }

            // Flip Y due to render to texture vs fb, Y is flipped
            const rcTex = new C3.Rect(x0, 1, x1, 0); // Possible to get from this._texture instead? Not needed, not spritesheeted?

            renderer.SetTexture(this._elementTexture);
    
            if (this._runtime.IsPixelRoundingEnabled()) {
                const ox = Math.round(wi.GetX()) - wi.GetX();
                const oy = Math.round(wi.GetY()) - wi.GetY();
                tempQuad.copy(quad);
                tempQuad.offset(ox, oy);
                renderer.Quad3(tempQuad, rcTex);
            } else {
                renderer.Quad3(quad, rcTex);
            }

        }

        SaveToJson() {
            return {
                // data to be saved for savegames
            };
        }

        LoadFromJson(o) {
            // load state for savegames
        }

        GetDebuggerProperties() {
            return [{
                title: "Spine",
                properties: [
                    //{name: ".current-animation",	value: this._currentAnimation.GetName(),	onedit: v => this.CallAction(Acts.SetAnim, v, 0) },
                ]
            }];
        }

    };
}