//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

// Global Variables

var gl;
var canvas;

var displayPoints = false;

var distance = 4;
var rotation = translate(0,0,0);

var responseValue = 0.25;

var latBands = 256;
var lonBands = 256;

var audioElements = 256;
var audioConstElements = 1024;
var audioIncrement = 1024 / audioElements;
var audioBlurSize = audioIncrement;

var audioNodes = [];
var audioCurrentNode = null;
var audioFrequencyData = new Uint8Array(audioConstElements);

var bufferWave = new Float32Array(2 * audioConstElements);
var bufferData = new Float32Array(audioConstElements);
var bufferImpulse = new Float32Array(audioConstElements);
var bufferBump = new Float32Array(3 * audioConstElements);
var bufferBumpRotation = [];

var boxes = [];

var normalColors = [vec3(0.0, 0.0, 1.0),
                    vec3(1.0, 0.0, 1.0),
                    vec3(1.0, 0.5, 0.8),
                    vec3(1.0, 1.0, 1.0)];
                    
var impulseColors = [vec3(0.0, 1.0, 0.0),
                     vec3(0.4, 1.0, 0.4),
                     vec3(0.8, 1.0, 0.8),
                     vec3(1.0, 1.0, 1.0)];

// Global Functions
function initWindow() {
    canvas = document.getElementById( "GLCanvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }
    
    initGL();
    initAudio();
    initInputs();
}

function initInputs() {
    var mouseDown = false;
    window.onmousedown = function(e) {
        if ( e.which == 1 )
            mouseDown = true;
    }
    window.onmouseup = function(e) {
        if ( e.which == 1 )
            mouseDown = false;
    }
    window.onmousemove = function(e) {
        if ( mouseDown ) {
            var dx = scaleValue(e.movementX, 18.0, 18.0);
            var dy = scaleValue(e.movementY, 18.0, 18.0);
            
            var qx = rotate(rad2deg(dx), vec3(0.0, 1.0, 0.0));
            var qy = rotate(rad2deg(dy), vec3(1.0, 0.0, 0.0));
            var qr = mult( qx, qy );
            
            rotation = mult( rotation, qr );
        }
    }
    window.onwheel = function(e) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        distance = Math.max( 1.5, Math.min(10, distance - delta / 10.0));
    }
    
    window.addEventListener('mousedown', function(event) {
        console.log(event);
        for (var i = 0; i < boxes.length; i++) {
            if ( event.x > (boxes[i][0]) && event.x < (boxes[i][0]+boxes[i][2]) && 
                 event.y > (boxes[i][1]) && event.y < (boxes[i][1]+boxes[i][3]) ) {
                boxes[i][4]( i );
                console.log ("box:", i);
            }
        }
    });
    window.addEventListener('resize', function(e) {
        resizeCanvas();
        resizePostprocess();
    });
    window.addEventListener('keydown', function(event) {
        if ( event.keyCode == 32 ) {
            displayPoints = !displayPoints;
        }
    });
}
function initAudio() {
    function renderFrame() {
        window.requestAnimationFrame(renderFrame);
        if ( audioCurrentNode != null ) {
            audioCurrentNode.getFrequencyData(audioFrequencyData);
        } else {
            for ( var i=0;i<audioConstElements;i++ )
                audioFrequencyData[i] = 0;
        }
        processAudio();
    }
    
    renderFrame();
}

function initGL() {
    //  Configure WebGL
    resizeCanvas();
    setupGLParams();
    setupBoxBuffer();
    setupBoxProgram();
    setupWaveProgram();
    setupSphereProgram();
    setupPostprocess();
    resizePostprocess();
    
    boxes.push( [8, 8, 150, 50, boxClick, null] );

    function runProgram() {
        
        drawCall(pp_fbo_main, function() {
            drawWave();
            drawSphere();
        });
        drawCall(pp_fbo_blur_x, function() {
            drawBlurXPass(pp_color_texture);
        });
        drawCall(pp_fbo_blur_y, function() {
            drawBlurYPass(pp_blur_x_texture);
        });
        drawCall(pp_fbo_blur_x, function() {
            drawBlurXPass(pp_blur_y_texture);
        });
        drawCall(pp_fbo_blur_y, function() {
            drawBlurYPass(pp_blur_x_texture);
        });
        drawCall(null, function() {
            drawFinalPass(pp_color_texture, pp_blur_y_texture);
            drawBox();
        });
        
        window.requestAnimationFrame(runProgram);
    }
    
    runProgram();
}
function setupGLParams() {
    gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");
}
function setupPostprocess() {
    // Blur Kernel
    var kernel = [];
    for ( var i=-4;i<=4;i++ ) {
        kernel.push(1.0 / 9.0);
    }
    
    // Blur X Shader
    ppBlurXProgram = initShaders( gl, "pp-vshader", "ppblurx-fshader" );
    
    gl.useProgram( ppBlurXProgram );
    pp_blurx_image = gl.getUniformLocation(ppBlurXProgram, "uImage");
    pp_blurx_image_size = gl.getUniformLocation(ppBlurXProgram, "uImageSize");
    pp_blurx_kernel = gl.getUniformLocation(ppBlurXProgram, "uKernel");
	pp_blurx_color = gl.getUniformLocation(ppBlurXProgram, "uColor");
    
    pp_blurx_position = gl.getAttribLocation(ppBlurXProgram, "vPosition");
    
    gl.uniform4f(pp_blurx_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_blurx_image, 0);
    gl.uniform1fv(pp_blurx_kernel, kernel);
    
    // Blur Y Shader
    ppBlurYProgram = initShaders( gl, "pp-vshader", "ppblury-fshader" );
    
    gl.useProgram( ppBlurYProgram );
    pp_blury_image = gl.getUniformLocation(ppBlurYProgram, "uImage");
    pp_blury_image_size = gl.getUniformLocation(ppBlurYProgram, "uImageSize");
    pp_blury_kernel = gl.getUniformLocation(ppBlurYProgram, "uKernel");
	pp_blury_color = gl.getUniformLocation(ppBlurYProgram, "uColor");
    
    pp_blury_position = gl.getAttribLocation(ppBlurYProgram, "vPosition");
    
    gl.uniform4f(pp_blury_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_blury_image, 0);
    gl.uniform1fv(pp_blury_kernel, kernel);
    
    // Final shader
    ppFinalProgram = initShaders( gl, "pp-vshader", "ppfinal-fshader" );
    
    gl.useProgram( ppFinalProgram );
    pp_final_image_post = gl.getUniformLocation(ppFinalProgram, "uPost");
    pp_final_image_orig = gl.getUniformLocation(ppFinalProgram, "uOriginal");
	pp_final_color = gl.getUniformLocation(ppFinalProgram, "uColor");
    pp_final_exposure = gl.getUniformLocation(ppFinalProgram, "uExposure");
    pp_final_position = gl.getAttribLocation(ppFinalProgram, "vPosition");
    
    gl.uniform4f(pp_final_color, 1.0, 1.0, 1.0, 1.0);
    gl.uniform1i(pp_final_image_orig, 0);
    gl.uniform1i(pp_final_image_post, 1);
    gl.uniform1f(pp_final_exposure, 1.9);
    
    // Primary color buffer
    pp_fbo_main = gl.createFramebuffer();
    pp_color_texture = gl.createTexture();
    pp_depth_buffer = gl.createRenderbuffer();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_color_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // First pass blur glow
    pp_fbo_blur_x = gl.createFramebuffer();
    pp_blur_x_texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_x_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Second pass blur glow
    pp_fbo_blur_y = gl.createFramebuffer();
    pp_blur_y_texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_y_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function setupBoxBuffer() {
    var box = [
        vec2( 0, 0 ),
        vec2( 0, 1 ),
        vec2( 1, 1 ),
        vec2( 1, 0 )
    ];
    var indices = new Uint32Array(6);
    indices[0] = 0;
    indices[1] = 3;
    indices[2] = 2;
    indices[3] = 2;
    indices[4] = 1;
    indices[5] = 0;
    
    // Load the data into the GPU
    boxBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(box), gl.STATIC_DRAW );
    
    boxIndices = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, boxIndices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW );
}
function setupBoxProgram() {
    // Load shaders and initialize attribute buffers
    boxProgram = initShaders ( gl, "box-vshader", "box-fshader" );
    gl.useProgram( boxProgram );

    // Associate out shader variables with our data buffer  
    bp_position = gl.getAttribLocation( boxProgram, "vPosition" );
    bp_color = gl.getUniformLocation( boxProgram, "uColor");
    bp_projection = gl.getUniformLocation( boxProgram, "uProjection");
    bp_model_view = gl.getUniformLocation( boxProgram, "uModelView");
    gl.uniform4f( bp_color,1,1,1,1 );
}

function setupWaveProgram() {
    //  Load shaders and initialize attribute buffers
    waveProgram = initShaders( gl, "wave-vshader", "wave-fshader" );
    gl.useProgram( waveProgram );
	wp_color = gl.getUniformLocation(waveProgram, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, bufferWave, gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer  
    wp_position = gl.getAttribLocation( waveProgram, "vPosition" );
    
    gl.uniform4f(wp_color, 1.0, 0.65, 0.8, 1);
}
function setupSphereProgram() {
    modifySphereVertexShader("sphere-vshader", audioElements);
    sphereProgram = initShaders( gl, "sphere-vshader", "sphere-fshader" );
    gl.useProgram(sphereProgram);
    sp_light_dir = gl.getUniformLocation(sphereProgram, "uLightDirection");
    
    sp_model_view = gl.getUniformLocation( sphereProgram, "modelViewMatrix" );
    sp_projection = gl.getUniformLocation( sphereProgram, "projectionMatrix" );
    sp_normal_projection = gl.getUniformLocation( sphereProgram, "normalMatrix" );
    
    var sphereData = generatePTSphere(0.1,latBands,lonBands);
    
    sphereVertexBuffer = gl.createBuffer();
    sphereIndexBuffer = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, sphereData[0], gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, sphereData[1], gl.STATIC_DRAW );
    
    sp_pos = gl.getAttribLocation( sphereProgram, "vPosition" );
    sp_uv = gl.getAttribLocation( sphereProgram, "vUV" );
    sp_audio_elements = gl.getUniformLocation( sphereProgram, "audioElements" );
    sp_audio_data = gl.getUniformLocation( sphereProgram, "audioData" );
    sp_audio_impulse = gl.getUniformLocation( sphereProgram, "audioImpulse" );
    sp_audio_bumps = gl.getUniformLocation( sphereProgram, "audioBumps" );
    sp_imp_gradient_colors = gl.getUniformLocation( sphereProgram, "impulseGradientColors" );
    sp_nrm_gradient_colors = gl.getUniformLocation( sphereProgram, "normalGradientColors" );
    
    gl.uniform1f(sp_audio_elements, audioElements);
    
    for ( var i=0;i<audioElements;i++ ) {
        var bum = randomVector();
        var rot = randomVector();
        
        bufferWave[i*2+0] = i / audioElements * 1.8 - 0.9;
        bufferWave[i*2+1] = -0.9;
        bufferImpulse[i] = 0.0;
        
        bufferBump[i*3+0] = bum[0];
        bufferBump[i*3+1] = bum[1];
        bufferBump[i*3+2] = bum[2];
        
        bufferBumpRotation.push( [rot[0], rot[1], rot[2], randomValue() / 10.0] );
    }
    
    gl.uniform3fv(sp_audio_bumps, bufferBump);
    gl.uniform3fv(sp_nrm_gradient_colors, flatten(normalColors));
    gl.uniform3fv(sp_imp_gradient_colors, flatten(impulseColors));
}
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}
function resizePostprocess() {
    var w = canvas.width;
    var h = canvas.height;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_main);
    gl.bindRenderbuffer(gl.RENDERBUFFER, pp_depth_buffer);
    gl.bindTexture(gl.TEXTURE_2D, pp_color_texture);
    
    pp_fbo_main.width = w;
    pp_fbo_main.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_color_texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pp_depth_buffer);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_blur_x);
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_x_texture);
    
    pp_fbo_blur_x.width = w;
    pp_fbo_blur_x.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_blur_x_texture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, pp_fbo_blur_y);
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_y_texture);
    
    pp_fbo_blur_y.width = w;
    pp_fbo_blur_y.height = h;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_blur_y_texture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
function drawCall(fbo,draw_function) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    draw_function();
    
    if ( fbo == null )
        return null;
    else
        return fbo.output;
}
function drawBox() {
    gl.depthMask(false);
    gl.useProgram( boxProgram );
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );

    gl.vertexAttribPointer( bp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( bp_position );

    for (var i=0; i<boxes.length; i++) {
        var x = boxes[i][0]
        var y = boxes[i][1]
        var w = boxes[i][2]
        var h = boxes[i][3]

        var boxProjection = ortho (0, canvas.width, canvas.height, 0, 0, 1);
        gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
        var boxModelView = mult( translate( x,y,0 ), scalem(w,h,1) );
        gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 

        gl.drawArrays( gl.LINE_LOOP, 0, 4 );
    }

    gl.disableVertexAttribArray( bp_position );
    gl.depthMask(true);
}

function drawWave() {
    gl.depthMask(false);
    gl.useProgram( waveProgram );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    
    gl.vertexAttribPointer( wp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( wp_position );

    gl.bufferSubData( gl.ARRAY_BUFFER, 0, bufferWave );
    gl.drawArrays( gl.POINTS, 0, bufferWave.length / 2 );
    
    gl.disableVertexAttribArray( wp_position );
    gl.depthMask(true);
}

function drawSphere() {
    //var modelViewMatrix = rotation;
    var modelViewMatrix = mult( translate(0,0,-distance), rotation );
    var projectionMatrix = perspective(70, window.innerWidth / window.innerHeight, 0.1, 100.0);
    var normalViewMatrix = normalMatrix(modelViewMatrix);
    
    gl.useProgram(sphereProgram);
    
    gl.uniformMatrix4fv(sp_model_view, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(sp_projection, false, flatten(projectionMatrix) );
    
    gl.uniformMatrix3fv(sp_normal_projection, false, flatten(normalViewMatrix) );
        
    gl.uniform3f(sp_light_dir, 0.0, 0.7071, 0.7071);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer );
    
    gl.vertexAttribPointer( sp_pos, 2, gl.FLOAT, false, 16, 0 );
    gl.enableVertexAttribArray( sp_pos );
    
    gl.vertexAttribPointer( sp_uv, 2, gl.FLOAT, false, 16, 8 );
    gl.enableVertexAttribArray( sp_uv );
    
    if ( displayPoints ) {
        gl.drawArrays( gl.POINTS, 0, 2 + latBands * lonBands );
    } else {
        gl.drawElements( gl.TRIANGLES, 6 * latBands * lonBands, gl.UNSIGNED_INT, 0 );
    }
    
    gl.disableVertexAttribArray( sp_pos );
    gl.disableVertexAttribArray( sp_uv );
}
function drawBlurXPass(texture) {
    gl.depthMask(false);
    gl.useProgram( ppBlurXProgram );
    
    gl.uniform2f( pp_blurx_image_size, canvas.width, canvas.height );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, boxIndices );
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.vertexAttribPointer( pp_blurx_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_blurx_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_blurx_position );
    gl.depthMask(true);
}
function drawBlurYPass(texture) {
    gl.depthMask(false);
    gl.useProgram( ppBlurYProgram );
    
    gl.uniform2f( pp_blury_image_size, canvas.width, canvas.height );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, boxIndices );
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.vertexAttribPointer( pp_blury_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_blury_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_blury_position );
    gl.depthMask(true);
}
function drawFinalPass(original, post) {
    gl.depthMask(false);
    gl.useProgram( ppFinalProgram );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, boxIndices );
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, post);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, original);

    gl.vertexAttribPointer( pp_final_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( pp_final_position );
    
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( pp_final_position );
    gl.depthMask(true);
}

function createAudioNode( fname ) {
    var ret = new Object();
    
    ret.audioNode = new Audio( fname );
    ret.context = new AudioContext();
    ret.audioSrc = ret.context.createMediaElementSource(ret.audioNode);
    ret.analyser = ret.context.createAnalyser();
    
    ret.audioSrc.connect(ret.analyser);
    ret.audioSrc.connect(ret.context.destination);  
    
    ret.makeCurrent = function() {
        if ( audioCurrentNode != null ) {
            audioCurrentNode.pause();
        }
        audioCurrentNode = this;
        this.audioNode.play();
    }
    ret.getFrequencyData = function(data) {
        this.analyser.getByteFrequencyData(data);
    };
    ret.play = function() {
        this.audioNode.play();
    };
    ret.pause = function() {
        this.audioNode.pause();
    };
    ret.stop = function() {
        this.audioNode.pause();
        this.audioNode.currentTime = 0;
    };
    ret.toggle = function() {
        if( this.audioNode.paused )
            this.audioNode.play();
        else
            this.audioNode.pause();
    };
    
    audioNodes.push( ret );
    
    return ret;
}
function processAudio() {
    for (var i=0, aud=0; i<audioConstElements; i+=audioIncrement, aud++) {
        var counted = 0;
        var unscaled = 0;
        for ( var j=-audioBlurSize;j<=audioBlurSize;j++ ) {
            var ij = i + j;
            if ( ij < 0 || ij >= audioConstElements )
                continue;
            unscaled += audioFrequencyData[ij];
            counted += 1;
        }
        var height = unscaled / counted;
        var scaled_h = responseValue * height / 255.0;
        
        var newWave = scaled_h + bufferWave[aud*2+1] * (1.0-responseValue);
        var newData = scaled_h * 0.25 + bufferData[aud] * (1.0-responseValue);
        
        if ( newData > bufferData[aud] )
            bufferImpulse[aud] = Math.min(1.1 * bufferImpulse[aud] + 0.1, 1.0 );
        else
            bufferImpulse[aud] = 0.9 * bufferImpulse[aud];
        
        bufferWave[aud*2+1] = newWave;
        bufferData[aud]     = newData;
    }
    
    for ( var i=0;i<audioElements;i++ ) {
        var xa = bufferBumpRotation[i][0];
        var ya = bufferBumpRotation[i][1];
        var za = bufferBumpRotation[i][2];
        var theta = bufferBumpRotation[i][3];
        
        var xp = bufferBump[i*3+0];
        var yp = bufferBump[i*3+1];
        var zp = bufferBump[i*3+2];
        
        var a = vec3(xa,ya,za);
        var p = vec3(xp,yp,zp);
        
        var cos = Math.cos(theta);
        var inv_cos = 1.0 - cos;
        var sin = Math.sin(theta);
        
        var vdot = dot(a, p);
        var vcross = cross(a, p);
        
        var xf = xp * cos + vdot * xa * inv_cos + vcross[0] * sin;
        var yf = yp * cos + vdot * ya * inv_cos + vcross[1] * sin;
        var zf = zp * cos + vdot * za * inv_cos + vcross[2] * sin;
        var wf = Math.sqrt(xf*xf+yf*yf+zf*zf);
        
        bufferBump[i*3+0] = xf / wf;
        bufferBump[i*3+1] = yf / wf;
        bufferBump[i*3+2] = zf / wf;
    }
    
    gl.useProgram(sphereProgram);
    gl.uniform1fv(sp_audio_data, bufferData);
    gl.uniform1fv(sp_audio_impulse, bufferImpulse);
    gl.uniform3fv(sp_audio_bumps, bufferBump);
}

window.onload = initWindow;

// Utility Functions

function scaleValue(x, div0, div1) {
    if ( x == 0 )
        return 0;
    else
        return Math.abs(x)/x * Math.sqrt(Math.abs(x) / div0) / div1;
}
function randomValue() {
    var w = 0;
    while ( w == 0 ) {
        w = Math.random() * Math.random();
    }
    return w;
}
function randomVector() {
    var w = 0;
    while ( w == 0 ) {
        var x = Math.random() * 2.0 - 1.0;
        var y = Math.random() * 2.0 - 1.0;
        var z = Math.random() * 2.0 - 1.0;
        
        w = Math.sqrt(x*x + y*y + z*z);
        
        if ( w != 0 )
            return [x/w,y/w,z/w];
    }
    return [1,0,0];
}

function modifySphereVertexShader(idName, count) {            
    var script = document.getElementById("sphere-vshader");
    script.innerHTML = "#define AUDIO_ELEMENTS " + count.toString() + "\r\n" +
                        script.innerHTML;
}

function boxClick( num ) {  //takes in the index of the box that was clicked

    if ( boxes[num][5] == null ) {
        var fopen = document.getElementById("loadFile");
        fopen.onchange = function(event) {
            console.log (URL.createObjectURL(fopen.files[0]));
            var audioNode = createAudioNode( URL.createObjectURL(fopen.files[0]));
            boxes[num][5] = audioNode;
            audioNode.makeCurrent();
            boxes.push( [8, 8*(num+2) + 50*(num+1), 150, 50, boxClick, null] );
        }
        fopen.click();  
    }   
    else {
        boxes[num][5].makeCurrent();
    }    
}