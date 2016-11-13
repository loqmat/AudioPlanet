//-------------------------------------------
// Computer Graphics Final Project
//-------------------------------------------
//  -- Will Brennan
//  -- Tahsin Loqman

var gl;
var canvas;

var distance = 4;
var rotation = translate(0,0,0);

var getFiles;

var responseValue = 0.25;

var latBands = 128;
var lonBands = 128;

var bufferLen = latBands * 3;
var bufferIndex = 0;
var bufferIncrement = bufferLen / latBands;
var spherePosBuffer = new Float32Array(bufferLen);
var sphereColBuffer = new Float32Array(bufferLen);

var newVel = 0.0;
var oldVel = 0.0;
var accel = 0.0;
var manip = 0;

var bufferA = new Float32Array(2048);
var bufferB = new Float32Array(2048);
var bufferC = new Float32Array(1024);
var blurSize = bufferIncrement;

function getMusicFile() {
    
}
function processAudio(unif, data) {
    oldVel = newVel;
    var accum = 0.0;
    for (var i=0;i<Math.min(data.length, 1024);i++) {
        var counted = 0;
        var unscaled = 0;
        for ( var j=-blurSize;j<=blurSize;j++ ) {
            var ij = i + j;
            if ( ij < 0 || ij >= 1024 )
                continue;
            unscaled += data[ij];
            counted += 1;
        }
        var height = unscaled / counted;
        
        var newA = data[i] / 255.0 * responseValue + bufferA[i*2+1] * (1.0-responseValue);
        var newB = height / 255.0 * responseValue + bufferB[i*2+1] * (1.0-responseValue);
        var newC = height / 255.0;
        
        accum += bufferA[i*2+1] - newA;
        
        bufferA[i*2+1] = newA;
        bufferB[i*2+1] = newB;
        bufferC[i]     = newC;
    }
    
    newVel = 0.75 * oldVel + 0.25 * accum;
    accel = Math.abs(newVel);//(newVel - oldVel) / 2.0;
    console.log(accel);
    
    var phi = bufferIndex * 2 * Math.PI / lonBands;
    var sinPhi = Math.sin(phi);
    var cosPhi = Math.cos(phi);

    for (var i=0;i<latBands;i++ ) {
        var theta = (i+1) * Math.PI / (latBands+1);
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        var h = bufferC[i*bufferIncrement];
        spherePosBuffer[i*3+0] = h * cosPhi * sinTheta;
        spherePosBuffer[i*3+1] = h * cosTheta;
        spherePosBuffer[i*3+2] = h * sinPhi * sinTheta;
        
        sphereColBuffer[i*3+0] = h;
        sphereColBuffer[i*3+1] = 1.0 - 2.0 * Math.abs(h - 0.5);
        sphereColBuffer[i*3+2] = 1.0 - h;
        
    }
    bufferIndex = (bufferIndex+1) % lonBands;
}
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );
}
function initWindow() {
    for (var i=0;i<1024;i++) {
        bufferA[i*2+0] = i / 1024.0 * 1.8 - 0.9;
        bufferA[i*2+1] = -0.9;
        bufferB[i*2+0] = i / 1024.0 * 1.8 - 0.9;
        bufferB[i*2+1] = -0.9;
    }
    getFiles = document.getElementById( "loadFile" );
    canvas = document.getElementById( "GLCanvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }
    resizeCanvas();
    
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
            var dx = scaleValue(e.movementX);
            var dy = scaleValue(e.movementY);
            
            var qx = rotate(rad2deg(dx), vec3(0.0, 1.0, 0.0));
            var qy = rotate(rad2deg(dy), vec3(1.0, 0.0, 0.0));
            var qr = mult( qx, qy );
            
            rotation = mult( rotation, qr );
        }
    }
    canvas.onwheel = function(e) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        console.log(delta);
        distance = Math.max( 1.5, Math.min(10, distance - delta));
    }
    
    initAudio(initGL());
    
    document.addEventListener('keydown', function(event) {
        if(event.keyCode == 37) {
            alert('Left was pressed');
        }
        else if(event.keyCode == 39) {
            alert('Right was pressed');
        }
    });
}
function initAudio(GLData) {
    var audio = new Audio("./audio/Haunting.m4a");
    var ctx = new AudioContext();
    var audioSrc = ctx.createMediaElementSource(audio);
    var analyser = ctx.createAnalyser();
    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);  
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    function renderFrame(data) {
        window.requestAnimationFrame(function(){
            renderFrame(data);
        });
        analyser.getByteFrequencyData(frequencyData);
        processAudio(data, frequencyData);
    }
    renderFrame(GLData);
    audio.play();
}
function initGL() {
    vertices = flatten([
        -0.5, -0.5, 0,
        -0.5,  0.5, 1,
         0.5,  0.5, 2,
         0.5, -0.5, 3,
    ]);

    //  Configure WebGL
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_SUBTRACT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    ElementIndexUint = gl.getExtension("OES_element_index_uint");
    VertexArrayObjects = gl.getExtension("OES_vertex_array_object");

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	u_color = gl.getUniformLocation(program, "uColor");
    
    // Load the data into the GPU
    waveBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, bufferA, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer  
    vPosition = gl.getAttribLocation( program, "vPosition" );
    
    sphereProgram = initShaders( gl, "sphere-vshader", "sphere-fshader" );
    gl.useProgram(sphereProgram);
    sp_light_dir = gl.getUniformLocation(sphereProgram, "uLightDirection");
    
    modelViewMatrixLoc = gl.getUniformLocation( sphereProgram, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( sphereProgram, "projectionMatrix" );
    nMatrixLoc = gl.getUniformLocation( sphereProgram, "normalMatrix" );
    
    var sphereData = generateUVSphere(0.1,latBands,lonBands);
    
    sphereVertex = gl.createBuffer();
    sphereIndex = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertex );
    gl.bufferData( gl.ARRAY_BUFFER, sphereData[0], gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndex );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, sphereData[1], gl.STATIC_DRAW );
    
    sp_pos = gl.getAttribLocation( sphereProgram, "vPosition" );
    sp_color = gl.getAttribLocation( sphereProgram, "vColor" );
    sp_uv = gl.getAttribLocation( sphereProgram, "vUV" );
    sp_norm = gl.getAttribLocation( sphereProgram, "vNormal" );
    
    function runProgram() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        drawWave();
        
        drawSphere();
        
        window.requestAnimationFrame(runProgram);
    }
    
    window.requestAnimationFrame(runProgram);
    return gl.getUniformLocation( program, "audioData" );
}

function drawWave() {
    gl.useProgram( program );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ARRAY_BUFFER, waveBuffer );
    
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    /*
    gl.uniform4f(u_color, 0.9, 0, 0, 1);
    var buf = new Float32Array(2);
    buf[0] = (manip / 1024) * 1.8 - 0.9;
    buf[1] = accel / 10.0 - 0.9;
    gl.bufferSubData( gl.ARRAY_BUFFER, manip*8, buf );
    manip = (manip+1)%1024;
    gl.drawArrays( gl.LINE_STRIP, 0, 1024 );
    */
    
    ///*
    gl.uniform4f(u_color, 0, 0.9, 0, 1);
    gl.bufferSubData( gl.ARRAY_BUFFER, 0, bufferB );
    gl.drawArrays( gl.POINTS, 0, bufferA.length / 2 );
    //*/
    
    gl.disableVertexAttribArray( vPosition );
}

function drawSphere() {
    modelViewMatrix = mult( translate(0,0,-distance), rotation );
    projectionMatrix = perspective(70, window.innerWidth / window.innerHeight, 0.1, 100.0);
    normalViewMatrix = normalMatrix(modelViewMatrix);
    
    gl.useProgram(sphereProgram);
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalViewMatrix) );
        
    gl.uniform3f(sp_light_dir, 0.0, 0.7071, 0.7071);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertex );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, sphereIndex );
    
    var indexPos = 24 + ((bufferIndex+latBands-1)%latBands) * lonBands * 12;
    var indexCol = 24 + ((bufferIndex+latBands-1)%latBands) * lonBands * 12 + (2+latBands*lonBands)*12;
    
    gl.bufferSubData( gl.ARRAY_BUFFER, indexPos, spherePosBuffer );
    gl.bufferSubData( gl.ARRAY_BUFFER, indexCol, sphereColBuffer );
    
    gl.vertexAttribPointer( sp_pos, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( sp_pos );
    
    gl.vertexAttribPointer( sp_color, 3, gl.FLOAT, false, 0, (2+latBands*lonBands)*12 );
    gl.enableVertexAttribArray( sp_color );
    
    gl.vertexAttribPointer( sp_uv, 2, gl.FLOAT, false, 0, (2+latBands*lonBands)*24 );
    gl.enableVertexAttribArray( sp_uv );
    
    gl.vertexAttribPointer( sp_norm, 3, gl.FLOAT, false, 0, (2+latBands*lonBands)*32 );
    gl.enableVertexAttribArray( sp_norm );
    
    gl.drawElements( gl.TRIANGLES, 6 * latBands * lonBands, gl.UNSIGNED_INT, 0 );
    
    gl.disableVertexAttribArray( sp_pos );
    gl.disableVertexAttribArray( sp_color );
    gl.disableVertexAttribArray( sp_uv );
    gl.disableVertexAttribArray( sp_norm );
}

window.onload = initWindow;
window.onresize = resizeCanvas;


// Utility Functions

function scaleValue(x) {
    if ( x == 0 )
        return 0;
    else
        return Math.abs(x)/x * Math.sqrt(Math.abs(x) / 18.0) / 18.0;
}