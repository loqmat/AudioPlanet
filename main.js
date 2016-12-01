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

var getFiles;

var responseValue = 0.25;

var latBands = 128;
var lonBands = 128;

var audioElements = 128;
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
var songNames = [];

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
    getFiles = document.getElementById( "loadFile" );
    canvas = document.getElementById( "GLCanvas" );
    textCanvas = document.getElementById( "TextCanvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }
    resizeCanvas();
    
    modifySphereVertexShader("sphere-vshader", audioElements);
    
    var mouseDown = false;
    canvas.onmousedown = function(e) {
        if ( e.which == 1 )
            mouseDown = true;
    }
    canvas.onmouseup = function(e) {
        if ( e.which == 1 )
            mouseDown = false;
    }
    canvas.onmousemove = function(e) {
        if ( mouseDown ) {
            var dx = scaleValue(e.movementX, 18.0, 18.0);
            var dy = scaleValue(e.movementY, 18.0, 18.0);
            
            var qx = rotate(rad2deg(dx), vec3(0.0, 1.0, 0.0));
            var qy = rotate(rad2deg(dy), vec3(1.0, 0.0, 0.0));
            var qr = mult( qx, qy );
            
            rotation = mult( rotation, qr );
        }
    }
    canvas.onwheel = function(e) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        distance = Math.max( 1.5, Math.min(10, distance - delta / 10.0));
    }
    
    initGL();
    initAudio();

    document.addEventListener('mousedown', function(event) {
        console.log(event);
        for (var i = 0; i < boxes.length; i++) {

            var pointx = Math.abs(event.x - (boxes[i][0] + (boxes[i][2]/2.0)) );        
            var pointy = Math.abs(event.y - (boxes[i][1] + (boxes[i][3]/2.0)) );

            if ( !(pointx > (boxes[i][2]/2.0) || pointy > (boxes[i][3]/2.0)) ||
            ((boxes[i][3]/2.0) * (boxes[i][2]/2.0) - (boxes[i][3]/2.0) * pointx - (boxes[i][2]/2.0) * pointy >= 0) )
            {
                boxes[i][4]( i );
                console.log ("box:", i);
            }
        }
    })
    
    document.addEventListener('keydown', function(event) {
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
    setupGLParams();
    setupBoxProgram();
    setupWaveProgram();
    setupSphereProgram();
    
    boxes.push( [15, 15, 200, 180, boxClick, null] );

    function runProgram() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        drawWave();
        drawSphere();
        drawBox();
        
        window.requestAnimationFrame(runProgram);
    }
    
    runProgram();
}
function setupGLParams() {
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    //gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");
}
function setupBoxProgram() {
    // Load shaders and initialize attribute buffers
    boxProgram = initShaders ( gl, "box-vshader", "box-fshader" );
    gl.useProgram( boxProgram );
    var box = [
        vec2( 0.25, 0 ),
        vec2( 0, 0.5 ),
        vec2( 0.25, 1 ),
        vec2(  0.75,  1 ),
        vec2(  1, 0.5 ),
        vec2( 0.75, 0)
    ];

    var moo = [
        vec2( 0, 0 ),
        vec2( 0.1, 0 ),
        vec2( 0.1, 0.1 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 ),
        vec2( 0, 0 )
    ];

    progressBarBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, progressBarBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(moo), gl.STATIC_DRAW );
    
    // Load the data into the GPU
    boxBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(box), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer  
    bp_position = gl.getAttribLocation( boxProgram, "vPosition" );
    bp_color = gl.getUniformLocation( boxProgram, "uColor");
    bp_projection = gl.getUniformLocation( boxProgram, "uProjection");
    bp_model_view = gl.getUniformLocation( boxProgram, "uModelView");
    gl.uniform4f( bp_color,1,1,1,0.2 );
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
    gl.uniform3fv(sp_nrm_gradient_colors, flatten(normalColors[0]));
    gl.uniform3fv(sp_imp_gradient_colors, flatten(impulseColors[0]));
}

function drawBox() {
    gl.depthMask(false);
    gl.useProgram( boxProgram );    

    gl.bindBuffer( gl.ARRAY_BUFFER, progressBarBuffer );
    gl.vertexAttribPointer( bp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( bp_position );
    for (var i=0; i<boxes.length; i++) {
        if (boxes[i][5]) {
            var x = boxes[i][0];
            var y = boxes[i][1];
            var w = boxes[i][2];
            var h = boxes[i][3];

            var boxProjection = ortho (0, canvas.width, canvas.height, 0, 0, 1);
            gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
            var boxModelView = translate(0,0,0);
            gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 
            
            var progressBarArray = progressBar ( i );
            if ( progressBarArray ) {
                gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(progressBarArray) );
                gl.drawArrays( gl.TRIANGLE_STRIP, 0, flatten(progressBarArray).length/2);
            }
        }
    }
    
    gl.bindBuffer( gl.ARRAY_BUFFER, boxBuffer );
    gl.vertexAttribPointer( bp_position, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( bp_position );

    for (var i=0; i<boxes.length; i++) {
        var x = boxes[i][0];
        var y = boxes[i][1];
        var w = boxes[i][2];
        var h = boxes[i][3];

        var boxProjection = ortho (0, canvas.width, canvas.height, 0, 0, 1);
        gl.uniformMatrix4fv ( bp_projection, false, flatten(boxProjection) ); 
        var boxModelView = mult( translate( x,y,0 ), scalem(w,h,1) );
        gl.uniformMatrix4fv ( bp_model_view, false, flatten(boxModelView) ); 

        gl.drawArrays( gl.LINE_LOOP, 0, 6 );
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
window.onresize = resizeCanvas;

// Utility Functions

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width  = window.innerWidth;
    textCanvas.height = window.innerHeight;
    for (var i=0; i<songNames.length; i++) {
        drawText ( songNames[i], i );
    }
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
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
            var songName = fopen.files[0].name.substring(0,fopen.files[0].name.length-4);
            songNames.push ( songName );
            gl.uniform3fv(sp_nrm_gradient_colors, flatten(normalColors[num]));
            gl.uniform3fv(sp_imp_gradient_colors, flatten(impulseColors[num]));
            drawText( songName, num );
            if ( boxes.length < 6 ) {
                boxes.push( [15 + 175*((num+1)%2), 15*(num+2) + 90*(num+1), 200, 180, boxClick, null] );
            }
        }
        fopen.click();  
    }   
    else {
        boxes[num][5].makeCurrent();
        gl.uniform3fv(sp_nrm_gradient_colors, flatten(normalColors[num]));
        gl.uniform3fv(sp_imp_gradient_colors, flatten(impulseColors[num]));
    }    
}

function drawText ( name, num ) {
    var ctx = textCanvas.getContext('2d');
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    
    if (name.length > 22)
        ctx.fillText(name.substring(0,20), 30 + 175*((num)%2), 15*(num+2) + 90*(num+1) -10 );
    else
        ctx.fillText(name, 30 + 175*((num)%2), 15*(num+2) + 90*(num+1) -10 );
} 

function progressBar ( num ) {
    var progress = audioNodes[ num ].audioNode.currentTime / audioNodes[ num ].audioNode.duration;

    var x = boxes[ num ][0];
    var y = boxes[ num ][1];
    var w = boxes[ num ][2];
    var h = boxes[ num ][3];

    var ang = Math.atan( (h/2)/(w/4) )

    if ( progress < .0001 || !progress ) {
        return null;
    } else if ( progress <= 0.25 ) { 
        return [ vec2( x + (progress*w), y + (0.5*h-(progress*w*Math.tan(ang))) ), 
        vec2( x , y + 0.5*h ),
        vec2( x + (progress*w), y + 0.5*h ),
        vec2( x + (progress*w), y + (0.5*h+(progress*w*Math.tan(ang))) ) ];

    } else if ( progress > 0.25 && progress <=0.75 ) {
        return [ vec2( x , y + 0.5*h ),
        vec2( x + ( 0.25*w ), y ), 
        vec2( x + ( 0.25*w ), y + h ),
        vec2( x + (progress*w), y ),
        vec2( x + (progress*w), y + h ) ];
    } else {
        return [ vec2( x , y + 0.5*h ),
        vec2( x + ( 0.25*w ), y ), 
        vec2( x + ( 0.25*w ), y + h ),
        vec2( x + (0.75*w), y ),
        vec2( x + (0.75*w), y + h ),
        vec2( x + (progress*w), y + (0.5*h - ((w-progress*w)*Math.tan(ang))) ),
        vec2( x + (progress*w), y + (0.5*h + ((w-progress*w)*Math.tan(ang))) )
         ];
    } 
}