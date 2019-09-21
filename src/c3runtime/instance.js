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
            }

            this.isMirrored = false;
            this._elementId = "";

            this._elementTexture = null
            this._newElementId = false


            this.pngURI = ""
            this.atlasURI = ""
            this.jsonURI = ""
            this.toggleFPS = 0
            this.c3renderer = null
            this.c3gl = globalThis.c3_runtimeInterface._localRuntime.GetCanvasManager().GetWebGLRenderer()._gl
            this.c3wgl = globalThis.c3_runtimeInterface._localRuntime.GetCanvasManager().GetWebGLRenderer()
            console.log(this.c3wgl)
            this.spineFB = null
            // Control render frame rate 0 = full rate, 1 = 1/2 rate, etc.
            var countFPS = 0;

            //this.canvas = this.CreateElement();
            this._StartTicking();

            console.log(this);

        }

        // spineDemos.log = true
        // Initialize project files URIs
        async initSpine() {
            var uid = this.GetInstance().GetUID()
            this._elementId = "SpineCanvas_" + uid;
            this.DEMO_NAME = this._elementId;

            this.assetManager = new spine.SharedAssetManager();
            this.hackAssetManager();

            this.bgColor = new spine.Color(0.0, 0.0, 0.0, 0.0);
            this.mvp = new spine.webgl.Matrix4();

            // XXX Redundant, remove? (C3 canvas dimension is used to create texture size for now, should change this)
            const canvas = this.CreateCanvas(this._elementId);
            this.canvas = canvas;

            // Get C3 canvas and add Spine
            this.canvas = globalThis.c3_runtimeInterface.GetCanvas() // Change to C3 canvas
            this.canvas.ctx = new spine.webgl.ManagedWebGLRenderingContext(this.canvas, { alpha: true });
            console.log(this.canvas.ctx)
            console.log(this._runtime);

            this.pngURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.pngPath);
            this.atlasURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.atlasPath);
            this.jsonURI = await globalThis.c3_runtimeInterface._localRuntime._assetManager.GetProjectFileUrl(this.jsonPath);

            // Use C3 canvas gl instead of a new canvas
            const gl = this.canvas.ctx.gl;
            this.gl = gl;

            console.log("LOADING SPINE STUFF");
            var textureLoader = function(img) { return new spine.webgl.GLTexture(gl, img); };
            this.assetManager.loadJson(this.DEMO_NAME, this.jsonURI);
            this.assetManager.loadTexture(this.DEMO_NAME, textureLoader, this.pngURI);
            this.assetManager.loadText(this.DEMO_NAME, this.atlasURI);
            this.renderer = new spine.webgl.SceneRenderer(this.canvas, gl);
            this.isSpineInitialized = true;
            console.log("Spine renderer initialized");
        }

        hackAssetManager() {
            spine.SharedAssetManager.prototype.loadText = function(clientId, path) {
                var _this = this;
                path = this.pathPrefix + path;
                if (!this.queueAsset(clientId, null, path))
                    return;

                fetch(path)
                    .then(function(response) {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        return response.text();
                    })
                    .then(function(rawText) {
                        console.log("Text asset loaded");
                        _this.rawAssets[path] = rawText;
                    })
                    .catch(function(error) {
                        console.log('Looks like there was a problem: \n', error);
                    });
            };

            spine.SharedAssetManager.prototype.loadJson = function(clientId, path) {
                var _this = this;
                path = this.pathPrefix + path;
                if (!this.queueAsset(clientId, null, path))
                    return;

                fetch(path)
                    .then(function(response) {
                        if (!response.ok) {
                            throw Error(response.statusText);
                        }
                        return response.json();
                    })
                    .then(function(responseAsJson) {
                        console.log("Spin json loaded");
                        _this.rawAssets[path] = responseAsJson;
                    })
                    .catch(function(error) {
                        console.log('Looks like there was a problem: \n', error);
                    });
            };
        }

        resize() {
            var bounds = this.skeletonInfo.bounds;

            // magic
            var centerX = bounds.offset.x + (bounds.size.x) / 2;
            var centerY = bounds.offset.y + (bounds.size.y) / 2;
            var scaleX = bounds.size.x / (bounds.size.x);
            var scaleY = bounds.size.y / (bounds.size.y);
            var scale = Math.max(scaleX, scaleY) * 1.2;
            if (scale < 1) scale = 1;
            var width = (bounds.size.x) * scale;
            var height = (bounds.size.y) * scale;

            this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
            // XXX will resize c3 canvas 
            // this.gl.viewport(0, 0, bounds.size.x, bounds.size.y);
            // What do we need to do here? what issues does this cause?
        }

        CreateCanvas(elementId) {
            // XXX no longer using this canvas for render, remove?
            // XXX const scale = this._runtime.GetDisplayScale() * 2;
            const scale = 1;

            var wi = this.GetWorldInfo();
            // Create test canvas with transparency for Spine render to, add more canvases for more animations
            var canvasNew = document.createElement('canvas');
            canvasNew.id = elementId;
            canvasNew.width = wi.GetWidth() * scale;
            canvasNew.height = wi.GetHeight() * scale;
            canvasNew.style.zIndex = -9990;
            canvasNew.style.position = "absolute";
            canvasNew.style.border = "0px solid";
            canvasNew.style.top = 0;
            canvasNew.style.left = 0;
            canvasNew.background = "Green";
            canvasNew.style.opacity = 99.0;
            // XXX no longer using canvas do not add spine context
            // canvasNew.ctx = new spine.webgl.ManagedWebGLRenderingContext(canvasNew, { alpha: true });

            var body = document.getElementsByTagName("body")[0];
            body.appendChild(canvasNew);

            return canvasNew;
        }

        loadSkeletons() {
            console.log("Loading skeleton");

            this.skeletonInfo = this.loadSkeleton("hero_human_female", this.animationName);
            // XXX hack to allow different skeletons loaded by oveloading skinName
            // debugger
            this.skeletonInfo = this.loadSkeleton(this.skinName, this.animationName);

            const skins = this.skeletonInfo.skeleton.data.skins;
            this.skinNames = skins.map(x => x.name);

            const animations = this.skeletonInfo.skeleton.data.animations;
            this.animationNames = animations.map(x => x.name);

            this.isSkeletonLoaded = true;
            this.isSkeletonLoading = false;

            console.log("Skeleton loaded");

            // XXX Do not resize C3 canvas
            // XXX May need to delete and resize texture buffer that is created instead?
            this.resize();

            this.Trigger(C3.Plugins.Gritsenko_Spine.Cnds.OnSkeletonLoaded);
        }

        loadSkeleton(name, animationName, sequenceSlots) {
            const assetManager = this.assetManager;

            const self = this;
            const atlasURI = assetManager.get(this.DEMO_NAME, this.atlasURI);

            console.log("Loading atlas");

            var atlas = new spine.TextureAtlas(atlasURI, function(path) {
                console.log(`Loading png atlas ${path} replaced with ${self.pngURI}`);
                return assetManager.get(self.DEMO_NAME, self.pngURI);
            });


            var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

            console.log("Loading json");

            var skeletonJson = new spine.SkeletonJson(atlasLoader);

            console.log("Reading skeleton data");

            var skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI) /*[name]*/ );
            // XXX for general case
            // var skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.DEMO_NAME, this.jsonURI) [name] );

            console.log("creating skeleton");

            var skeleton = new spine.Skeleton(skeletonData);
            //skeleton.setSkinByName(this.skinName);
            let subskin = skeleton.data.findSkin(this.skinName);
            if (subskin === undefined) {
                subskin = skeleton.data.skins[0];
            }

            skeleton.setSkin(subskin);

            console.log("Loading state");

            var state = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
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
                }
            };
        }

        updateCurrentSkin() {

            const state = this.skeletonInfo.state;
            const skeleton = this.skeletonInfo.skeleton;
            console.log(skeleton);
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
                state.apply(skeleton);
            } catch (ex) {
                console.error(ex);
                alert(ex + "\n\n available animations: \n" + this.animationNames.join("\n"));
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
                this.initSpine();
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
            this.c3wgl.EndBatch(); 
            const gl = this.gl;
            // render to our targetTexture by binding the framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);

            // Save C3 webgl context, may be able to reduce some
            // Create VAO for Spine to use. May need to change this for non-webgl2
            if(!this.myVAO)
            {
                this.myVAO = gl.createVertexArray();
            }
            var oldVAO = gl.createVertexArray();
            oldVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
            // Bind to private VAO so Spine use does not impact C3 VAO
            gl.bindVertexArray(this.myVAO);
            var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);        
            var oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);            
            var oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);        
            var oldBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
            var oldElement = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
            var oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
            var oldViewport = gl.getParameter(gl.VIEWPORT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            // Some random appearing alpha / pma issue may be related to blend func
            // XXX gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.bindTexture(gl.TEXTURE_2D, null);        
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


            const renderer = this.renderer;

            var active = this.skeletonInfo;
            var skeleton = active.skeleton;
            var offset = active.bounds.offset;
            var size = active.bounds.size;

            renderer.camera.position.x = offset.x + size.x / 2;
            renderer.camera.position.y = offset.y + size.y / 2 + 20;
            renderer.camera.viewportWidth = size.x * 1.5;
            renderer.camera.viewportHeight = size.y * 1.5;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Resize in Spine-TS has been change to use texture size instead
            renderer.resize(spine.webgl.ResizeMode.Fit);
            renderer.begin();
            renderer.drawSkeleton(skeleton, true);
            renderer.end();

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // Restore C3 webgl state
            gl.useProgram(oldProgram);                    
            gl.activeTexture(oldActive);                
            gl.bindTexture(gl.TEXTURE_2D, oldTex);        
            gl.bindBuffer(gl.ARRAY_BUFFER, oldBinding);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oldElement);
            gl.clearColor(oldClearColor[0],oldClearColor[1],oldClearColor[2],oldClearColor[3])
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.bindVertexArray(oldVAO);
            gl.viewport(oldViewport[0],oldViewport[1],oldViewport[2],oldViewport[3]);
        }


        Release() {
            super.Release();
        }

        Tick() {
                if (!this.IsSpineReady()) {
                return;
            }
            const delta = this._runtime.GetDt();
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
                console.log(this.c3renderer)
                console.log("BatchState:")
                console.log(renderer._batchState.currentShader._shaderProgram)
                this._newElementId = false;

                var bounds = this.skeletonInfo.bounds;
                this._elementTexture = renderer.CreateDynamicTexture(bounds.size.x, bounds.size.y, { mipMap: false });
                this.canvas.ctx.c3TextureX = bounds.size.x
                this.canvas.ctx.c3TextureY = bounds.size.y

                // Create FB and bind texture to spineFB
                this.spineFB = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.spineFB);
                // attach the texture as the first color attachment
                const attachmentPoint = gl.COLOR_ATTACHMENT0;
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._elementTexture._texture, 0);
                console.log("this.spineFB created:"+this.spineFB)
                // Restore render to the canvas
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                console.log("Created dynamic texture for spine:" + this._elementId);
            }

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