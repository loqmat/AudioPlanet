//+-------------------------------------------+
//| Computer Graphics Final Project           |
//|     Will Brennan                          |
//|     Tahsin Loqman                         |
//|                                           |
//| main.js                                   |
//|     * initialization functions            |
//|     * define main loop                    |
//+-------------------------------------------+

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