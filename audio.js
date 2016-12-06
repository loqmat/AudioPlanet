//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| main.js                                   |
//|     * functions and data for controlling  |
//|       the managing and playing of audio   |
//+-------------------------------------------+

var responseValue = 0.25;

var audioConstElements = 1024;
var innerSphere = {
    latBands : 32,
    lonBands : 32,
    audioElements : 16,
    vertex : null,
    indices : null,
    audioTotal : 0.0
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
    latBands : 128,
    lonBands : 128,
    audioElements : 256,
    vertex : null,
    indices : null,
    audioTotal : 0.0
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
    sphereDef.audioTotal = 0.0;
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
        
        sphereDef.audioTotal += newWave;
        sphereDef.bufferWave[aud*2+1] = newWave;
        sphereDef.bufferData[aud]     = newData;
    }
    
    for ( var i=0;i<sphereDef.audioElements;i++ ) {
        var xa = sphereDef.bufferBumpRotation[i][0];
        var ya = sphereDef.bufferBumpRotation[i][1];
        var za = sphereDef.bufferBumpRotation[i][2];
        var theta = (sphereDef.bufferImpulse[i] + 0.25) * sphereDef.bufferBumpRotation[i][3];
        
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