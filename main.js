//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

// Global Variables

var gl;
var canvas;

var displayPoints = true;
var applyPostProcess = true;
var glowPasses = 1;

var distance = 4;
var rotation = translate(0,0,0);

var responseValue = 0.25;

var audioConstElements = 1024;
var innerSphere = {
    latBands : 32,
    lonBands : 32,
    audioElements : 16,
    vertex : null,
    indices : null
};
innerSphere.audioIncrement = audioConstElements / innerSphere.audioElements;
innerSphere.audioBlurSize = innerSphere.audioIncrement;
innerSphere.audioFrequencyData = new Uint8Array(audioConstElements);
innerSphere.bufferWave = new Float32Array(2 * audioConstElements);
innerSphere.bufferData = new Float32Array(audioConstElements);
innerSphere.bufferImpulse = new Float32Array(audioConstElements);
innerSphere.bufferBump = new Float32Array(3 * audioConstElements);
innerSphere.bufferBumpRotation = [];


var outerSphere = {
    latBands : 64,
    lonBands : 64,
    audioElements : 256,
    vertex : null,
    indices : null
};
outerSphere.audioIncrement = audioConstElements / outerSphere.audioElements;
outerSphere.audioBlurSize = outerSphere.audioIncrement;
outerSphere.audioFrequencyData = new Uint8Array(audioConstElements);
outerSphere.bufferWave = new Float32Array(2 * audioConstElements);
outerSphere.bufferData = new Float32Array(audioConstElements);
outerSphere.bufferImpulse = new Float32Array(audioConstElements);
outerSphere.bufferBump = new Float32Array(3 * audioConstElements);
outerSphere.bufferBumpRotation = [];

var audioNodes = [];
var audioCurrentNode = null;

var boxes = [];

var normalColors = [//midnight blue to neon blue
                    [vec3(13.0/256.0, 51.0/256.0, 117.0/256.0),
                    vec3(29.0/256.0, 104.0/256.0, 209.0/256.0),
                    vec3(89.0/256.0, 214.0/256.0, 255.0/256.0),
                    vec3(20.0/256.0, 251.0/256.0, 255.0/256.0)],
                    
                    //oxblood to light red
                    [vec3(148.0/256.0, 4.0/256.0, 4.0/256.0),
                    vec3(201.0/256.0, 14.0/256.0, 55.0/256.0),
                    vec3(255.0/256.0, 20.0/256.0, 71.0/256.0),
                    vec3(255.0/256.0, 82.0/256.0, 84.0/256.0)],
                    
                    //indigo to periwinkle
                    [vec3(161.0/256.0, 140.0/256.0, 245.0/256.0),
                    vec3(122.0/256.0, 53.0/256.0, 232.0/256.0),
                    vec3(141.0/256.0, 81.0/256.0, 237.0/256.0),
                    vec3(161.0/256.0, 140.0/256.0, 245.0/256.0)],

                    //dark jewel purple to light maroon   
                    [vec3(112.0/256.0, 3.0/256.0, 83.0/256.0),
                    vec3(138.0/256.0, 0.0/256.0, 126.0/256.0),
                    vec3(174.0/256.0, 84.0/256.0, 179.0/256.0),
                    vec3(201.0/256.0, 157.0/256.0, 157.0/256.0)],
    
                    //magenta to light pink color
                    [vec3(171.0/256.0, 31.0/256.0, 138.0/256.0),
                    vec3(235.0/256.0, 0.0/256.0, 179.0/256.0),
                    vec3(255.0/256.0, 92.0/256.0, 179.0/256.0),
                    vec3(255.0/256.0, 181.0/256.0, 220.0/256.0)] ,
                    
                    //dark teal to pastel teal
                    [vec3(4.0/256.0, 87.0/256.0, 110.0/256.0),
                    vec3(32.0/256.0, 161.0/256.0, 179.0/256.0),
                    vec3(4.0/256.0, 198.0/256.0, 201.0/256.0),
                    vec3(168.0/256.0, 237.0/256.0, 236.0/256.0)],
                    ];
                    
var impulseColors = [//pastel to forest green
                    [vec3(230.0/256.0, 255.0/256.0, 189.0/256.0),
                    vec3(164.0/256.0, 250.0/256.0, 25.0/256.0),
                    vec3(48.0/256.0, 181.0/256.0, 14.0/256.0),
                    vec3(63.0/256.0, 145.0/256.0, 12.0/256.0)],

                    //neon yellow to orange
                    [vec3(255.0/256.0, 255.0/256.0, 54.0/256.0),
                    vec3(250.0/256.0, 229.0/256.0, 2.0/256.0),
                    vec3(255.0/256.0, 196.0/256.0, 3.0/256.0),
                    vec3(247.0/256.0, 190.0/256.0, 0.0/256.0)],
                    
                    //pink to pomegranate
                    [vec3(255.0/256.0, 166.0/256.0, 201.0/256.0),
                    vec3(250.0/256.0, 112.0/256.0, 167.0/256.0),
                    vec3(227.0/256.0, 25.0/256.0, 126.0/256.0),
                    vec3(201.0/256.0, 32.0/256.0, 75.0/256.0)],

                    //pastel orange to dark amber 
                    [vec3(237.0/256.0, 184.0/256.0, 109.0/256.0),
                    vec3(237.0/256.0, 148.0/256.0, 45.0/256.0),
                    vec3(232.0/256.0, 113.0/256.0, 16.0/256.0),
                    vec3(181.0/256.0, 81.0/256.0, 0.0/256.0)],

                    //light blue to royal blue color
                    [vec3(181.0/256.0, 212.0/256.0, 255.0/256.0),
                    vec3(115.0/256.0, 173.0/256.0, 255.0/256.0),
                    vec3(15.0/256.0, 53.0/256.0, 219.0/256.0),
                    vec3(92.0/256.0, 63.0/256.0, 252.0/256.0)],

                    //pastel yellow to dark gold
                    [vec3(247.0/256.0, 234.0/256.0, 173.0/256.0),
                    vec3(237.0/256.0, 219.0/256.0, 138.0/256.0),
                    vec3(252.0/256.0, 209.0/256.0, 18.0/256.0),
                    vec3(199.0/256.0, 162.0/256.0, 0.0/256.0)]

                    ];

// Global Functions
function initWindow() {
    canvas = document.getElementById( "GLCanvas" );
    textCanvas = document.getElementById( "TextCanvas" );
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
        } else if ( event.keyCode == 80 ) {
            applyPostProcess = !applyPostProcess;
        } else if ( event.key == "ArrowUp" ) {
            glowPasses ++ ;
        } else if ( event.key == "ArrowDown" ) {
            glowPasses = Math.max( 0, glowPasses - 1 );
        } else {
            console.log(event);
        }
    });
}
function initAudio() {
    function renderFrame() {
        window.requestAnimationFrame(renderFrame);
        
        if ( audioCurrentNode != null ) {
            audioCurrentNode.getTimeDomainData(innerSphere.audioFrequencyData);
            audioCurrentNode.getFrequencyData(outerSphere.audioFrequencyData);
        }
        
        processAudio(sphereInnerProgram, sip, innerSphere);
        processAudio(sphereOuterProgram, sop, outerSphere);
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
    
    boxes.push( [15, 15, 300, 50, boxClick, null] );

    function runProgram() {
        
        if ( applyPostProcess ) {
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            drawCall(pp_fbo_main, function() {
                //drawWave();
                drawSphere(sphereInnerProgram, sip, innerSphere, false);
                drawSphere(sphereOuterProgram, sop, outerSphere, true);
            });
            drawCall(pp_fbo_blur_x, function() {
                drawBlurXPass(pp_color_texture);
            });
            drawCall(pp_fbo_blur_y, function() {
                drawBlurYPass(pp_blur_x_texture);
            });
            for ( var i=0;i<glowPasses;i++ ) {
                drawCall(pp_fbo_blur_x, function() {
                    drawBlurXPass(pp_blur_y_texture);
                });
                drawCall(pp_fbo_blur_y, function() {
                    drawBlurYPass(pp_blur_x_texture);
                });
            }
            drawCall(null, function() {
                drawFinalPass(pp_color_texture, pp_blur_y_texture);
                drawBox();
            });
        } else {
            gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
            drawCall(null, function() {
                //drawWave();
                drawSphere(sphereOuterProgram, sop, outerSphere, true);
            });
            /*drawCall(null, function() {
                drawFinalPass(pp_color_texture, pp_color_texture);
                drawBox();
            });*/
        }
        
        window.requestAnimationFrame(runProgram);
    }
    
    runProgram();
}
function setupGLParams() {
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");
}
function setupPostprocess() {
    // Blur Kernel
    var kernel = [];
    for ( var i=-4;i<=4;i++ )
        kernel.push(gaussian(i, 4.0));
    
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
    gl.uniform1f(pp_final_exposure, 1.0);
    
    // Primary color buffer
    pp_fbo_main = gl.createFramebuffer();
    pp_color_texture = gl.createTexture();
    pp_depth_buffer = gl.createRenderbuffer();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_color_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // First pass blur glow
    pp_fbo_blur_x = gl.createFramebuffer();
    pp_blur_x_texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_x_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Second pass blur glow
    pp_fbo_blur_y = gl.createFramebuffer();
    pp_blur_y_texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, pp_blur_y_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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

function setupWaveProgram(sphereDef) {
    //  Load shaders and initialize attribute buffers
    waveProgram = initShaders( gl, "wave-vshader", "wave-fshader" );
    gl.useProgram( waveProgram );
	wp_color = gl.getUniformLocation(waveProgram, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(audioConstElements), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer  
    wp_position = gl.getAttribLocation( waveProgram, "vPosition" );
    
    gl.uniform4f(wp_color, 1.0, 0.65, 0.8, 1);
}
function setupSphere(sphereDef, program, size, h, spd) {
    var obj = new Object();
    
    gl.useProgram(program);
    obj.light_dir = gl.getUniformLocation(program, "uLightDirection");
    
    obj.model_view = gl.getUniformLocation( program, "modelViewMatrix" );
    obj.projection = gl.getUniformLocation( program, "projectionMatrix" );
    obj.normal_projection = gl.getUniformLocation( program, "normalMatrix" );
    
    var sphereData = generatePTSphere(0.1,sphereDef.latBands,sphereDef.lonBands);
    
    sphereDef.vertex = gl.createBuffer();
    sphereDef.indices = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereDef.vertex );
    gl.bufferData( gl.ARRAY_BUFFER, sphereData[0], gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereDef.indices );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, sphereData[1], gl.STATIC_DRAW );
    
    obj.pos = gl.getAttribLocation( program, "vPosition" );
    obj.uv = gl.getAttribLocation( program, "vUV" );
    obj.audio_elements = gl.getUniformLocation( program, "audioElements" );
    obj.audio_data = gl.getUniformLocation( program, "audioData" );
    obj.audio_impulse = gl.getUniformLocation( program, "audioImpulse" );
    obj.audio_bumps = gl.getUniformLocation( program, "audioBumps" );
    obj.base_height = gl.getUniformLocation( program, "baseHeight" );
    obj.base_point_size = gl.getUniformLocation( program, "basePointSize" );
    obj.height0 = gl.getUniformLocation( program, "heightScale0" );
    obj.height1 = gl.getUniformLocation( program, "heightScale1" );
    
    obj.imp_gradient_colors = gl.getUniformLocation( program, "impulseGradientColors" );
    obj.nrm_gradient_colors = gl.getUniformLocation( program, "normalGradientColors" );
    
    gl.uniform1f(obj.audio_elements, sphereDef.audioElements);
    gl.uniform1f(obj.base_height, size);
    gl.uniform1f(obj.base_point_size, 8.0);
    gl.uniform1f(obj.height0, h*h);
    gl.uniform1f(obj.height1, h);
    
    for ( var i=0;i<sphereDef.audioElements;i++ ) {
        var bum = randomVector();
        var rot = randomVector();
        
        sphereDef.bufferWave[i*2+0] = i / sphereDef.audioElements * 1.8 - 0.9;
        sphereDef.bufferWave[i*2+1] = -0.9;
        sphereDef.bufferImpulse[i] = 0.0;
        
        sphereDef.bufferBump[i*3+0] = bum[0];
        sphereDef.bufferBump[i*3+1] = bum[1];
        sphereDef.bufferBump[i*3+2] = bum[2];
        
        sphereDef.bufferBumpRotation.push( [rot[0], rot[1], rot[2], randomValue() / spd] );
    }
    
    gl.uniform3fv(obj.audio_bumps, sphereDef.bufferBump);
    gl.uniform3fv(obj.nrm_gradient_colors, flatten(normalColors[0]));
    gl.uniform3fv(obj.imp_gradient_colors, flatten(impulseColors[0]));
    
    return obj;
}
function setupSphereProgram() {
    sphereInnerProgram = modifySphereVertexShader("sphere-vshader", innerSphere.audioElements);
    sphereOuterProgram = modifySphereVertexShader("sphere-vshader", outerSphere.audioElements);
    
    sip = setupSphere(innerSphere, sphereInnerProgram, 0.25, 2.0,  100.0);
    sop = setupSphere(outerSphere, sphereOuterProgram, 1.0, 10.0, 10.0);
}
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width  = window.innerWidth;
    textCanvas.height = window.innerHeight;
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

function drawSphere(program, unifs, sphereDef, points) {
    //var modelViewMatrix = rotation;
    var modelViewMatrix = mult( translate(0,0,-distance), rotation );
    var projectionMatrix = perspective(70, window.innerWidth / window.innerHeight, 0.1, 100.0);
    var normalViewMatrix = normalMatrix(modelViewMatrix);
    
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(unifs.model_view, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(unifs.projection, false, flatten(projectionMatrix) );
    
    gl.uniformMatrix3fv(unifs.normal_projection, false, flatten(normalViewMatrix) );
        
    gl.uniform3f(unifs.light_dir, 0.0, 0.7071, 0.7071);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereDef.vertex );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereDef.indices );
    
    gl.vertexAttribPointer( unifs.pos, 2, gl.FLOAT, false, 16, 0 );
    gl.enableVertexAttribArray( unifs.pos );
    
    gl.vertexAttribPointer( unifs.uv, 2, gl.FLOAT, false, 16, 8 );
    gl.enableVertexAttribArray( unifs.uv );
    
    if ( points ) {
        gl.drawArrays( gl.POINTS, 0, 2 + sphereDef.latBands * sphereDef.lonBands );
    } else {
        gl.drawElements( gl.TRIANGLES, 6 * sphereDef.latBands * sphereDef.lonBands, gl.UNSIGNED_INT, 0 );
    }
    
    gl.disableVertexAttribArray( unifs.pos );
    gl.disableVertexAttribArray( unifs.uv );
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
    ret.getTimeDomainData = function(data) {
        this.analyser.getByteTimeDomainData(data);
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
function processAudio(program, unifs, sphereDef) {
    for (var i=0, aud=0; i<audioConstElements; i+=sphereDef.audioIncrement, aud++) {
        var counted = 0;
        var unscaled = 0;
        for ( var j=-sphereDef.audioBlurSize;j<=sphereDef.audioBlurSize;j++ ) {
            var ij = i + j;
            if ( ij < 0 || ij >= audioConstElements )
                continue;
            unscaled += sphereDef.audioFrequencyData[ij];
            counted += 1;
        }
        var height = unscaled / counted;
        var scaled_h = responseValue * height / 255.0;
        
        var newWave = scaled_h + sphereDef.bufferWave[aud*2+1] * (1.0-responseValue);
        var newData = scaled_h * 0.25 + sphereDef.bufferData[aud] * (1.0-responseValue);
        
        if ( newData > sphereDef.bufferData[aud] )
            sphereDef.bufferImpulse[aud] = Math.min(1.1 * sphereDef.bufferImpulse[aud] + 0.1, 1.0 );
        else
            sphereDef.bufferImpulse[aud] = 0.9 * sphereDef.bufferImpulse[aud];
        
        sphereDef.bufferWave[aud*2+1] = newWave;
        sphereDef.bufferData[aud]     = newData;
    }
    
    for ( var i=0;i<sphereDef.audioElements;i++ ) {
        var xa = sphereDef.bufferBumpRotation[i][0];
        var ya = sphereDef.bufferBumpRotation[i][1];
        var za = sphereDef.bufferBumpRotation[i][2];
        var theta = sphereDef.bufferBumpRotation[i][3];
        
        var xp = sphereDef.bufferBump[i*3+0];
        var yp = sphereDef.bufferBump[i*3+1];
        var zp = sphereDef.bufferBump[i*3+2];
        
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
        
        sphereDef.bufferBump[i*3+0] = xf / wf;
        sphereDef.bufferBump[i*3+1] = yf / wf;
        sphereDef.bufferBump[i*3+2] = zf / wf;
    }
    
    gl.useProgram(program);
    gl.uniform1fv(unifs.audio_data, sphereDef.bufferData);
    gl.uniform1fv(unifs.audio_impulse, sphereDef.bufferImpulse);
    gl.uniform3fv(unifs.audio_bumps, sphereDef.bufferBump);
}

window.onload = initWindow;

// Utility Functions
function gaussian(x, dev) {
    return 1.0 / Math.sqrt(2*Math.PI*dev) * Math.exp(-x*x/(2*dev*dev));
}
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
    var old = script.innerHTML;
    script.innerHTML = "#define AUDIO_ELEMENTS " + count.toString() + "\r\n" +
                        script.innerHTML;
    var shad = initShaders( gl, "sphere-vshader", "sphere-fshader" );
    script.innerHTML = old;
    return shad;
}

function boxClick( num ) {  //takes in the index of the box that was clicked

    if ( boxes[num][5] == null ) {
        var fopen = document.getElementById("loadFile");
        fopen.onchange = function(event) {
            console.log (URL.createObjectURL(fopen.files[0]));
            var audioNode = createAudioNode( URL.createObjectURL(fopen.files[0]));
            boxes[num][5] = audioNode;
            audioNode.makeCurrent();
            var ctx = document.getElementById('TextCanvas').getContext('2d');
            ctx.font = "18px sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            var songName = fopen.files[0].name.substring(0,fopen.files[0].name.length-4);
            if (songName.length > 32)
                ctx.fillText(songName.substring(0,32), 22, 30 + 15*(num+1) + 50*(num));
            else
                ctx.fillText(songName, 22, 30 + 15*(num+1) + 50*(num) );
            if ( boxes.length < 6 ) {
                boxes.push( [15, 15*(num+2) + 50*(num+1), 300, 50, boxClick, null] );
            }
        }
        fopen.click();  
    }   
    else {
        boxes[num][5].makeCurrent();
    }
    gl.useProgram(sphereInnerProgram);
    gl.uniform3fv(sip.nrm_gradient_colors, flatten(normalColors[num]));
    gl.uniform3fv(sip.imp_gradient_colors, flatten(impulseColors[num]));
    
    gl.useProgram(sphereOuterProgram);
    gl.uniform3fv(sop.nrm_gradient_colors, flatten(normalColors[num]));
    gl.uniform3fv(sop.imp_gradient_colors, flatten(impulseColors[num]));
}