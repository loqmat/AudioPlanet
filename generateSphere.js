// Generate a UV Sphere

function generateUVSphere(radius, latitudeBands, longitudeBands) {
    
    var total = 2 + latitudeBands * longitudeBands;
    var vertexData = new Float32Array(total * 11);
    var indexData = new Uint32Array(total * 8);
    
    var pIndex = 0;
    var cIndex = total * 3;
    var uIndex = total * 6;
    var nIndex = total * 8;
    var iIndex = 0;
    
    vertexData[pIndex+0] = 0;
    vertexData[pIndex+1] = 0;
    vertexData[pIndex+2] = radius; 
    pIndex += 3;
    
    vertexData[cIndex+0] = 1;
    vertexData[cIndex+1] = 1;
    vertexData[cIndex+2] = 1; 
    cIndex += 3;
    
    vertexData[uIndex+0] = 1; 
    vertexData[uIndex+1] = 1; 
    uIndex += 2;
    
    vertexData[nIndex+0] = 0; 
    vertexData[nIndex+1] = 0;
    vertexData[nIndex+2] = 1;
    nIndex += 3;
    
    vertexData[pIndex+0] = 0;
    vertexData[pIndex+1] = 0;
    vertexData[pIndex+2] = -radius; 
    pIndex += 3;
    
    vertexData[uIndex+0] = 0; 
    vertexData[uIndex+1] = 0; 
    uIndex += 2;
    
    vertexData[nIndex+0] = 0; 
    vertexData[nIndex+1] = 0;
    vertexData[nIndex+2] = -1;
    nIndex += 3;

    for (var lon = 0; lon < longitudeBands; lon++) {
        var phi = lon * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        
        for (var lat = 1; lat <= latitudeBands; lat++) {
            var theta = lat * Math.PI / (latitudeBands+1);
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (lon / longitudeBands);
            var v = 1 - (lat / latitudeBands);
            
            vertexData[pIndex+0] = radius*x;
            vertexData[pIndex+1] = radius*y;
            vertexData[pIndex+2] = radius*z;
            pIndex += 3;
            
            vertexData[cIndex+0] = 1;
            vertexData[cIndex+1] = 1;
            vertexData[cIndex+2] = 1; 
            cIndex += 3;
            
            vertexData[uIndex+0] = u;
            vertexData[uIndex+1] = v;
            uIndex += 2;
            
            vertexData[nIndex+0] = x;
            vertexData[nIndex+1] = y;
            vertexData[nIndex+2] = z;
            nIndex += 3;
        }
    }
    
    for (var lon = 0; lon < longitudeBands; lon++) {
        var lon0 = 2 + lon*(latitudeBands);
        var lon1 = 2 + ((lon + 1) % longitudeBands)*(latitudeBands);
        var lon2 = lon0 + 1;
        var lon3 = lon1 + 1;
        for (var lat = 0; lat < latitudeBands - 1; lat++) {
            indexData[iIndex+0] = lon0;
            indexData[iIndex+1] = lon1;
            indexData[iIndex+2] = lon3;
            indexData[iIndex+4] = lon3;
            indexData[iIndex+5] = lon2;
            indexData[iIndex+3] = lon0;
            iIndex += 6;
            lon0 ++ ; lon1 ++ ; lon2 ++ ; lon3 ++ ;
        }
    }
    
    return [vertexData, indexData];
}

function generatePTSphere(radius, latitudeBands, longitudeBands) {
    var vertexSize = 4;
    var total = 2 + latitudeBands * longitudeBands;
    var vertexData = new Float32Array(total * vertexSize);
    var indexData = new Uint32Array(total * 8);
    
    var vIndex = 0;
    var iIndex = 0;
    
    vertexData[vIndex+0] = 0;
    vertexData[vIndex+1] = 0;
    vertexData[vIndex+2] = 1;
    vertexData[vIndex+3] = 1;
    vIndex += 4;
    
    vertexData[vIndex+0] = Math.PI;
    vertexData[vIndex+1] = 0;
    vertexData[vIndex+2] = 0;
    vertexData[vIndex+3] = 0;
    vIndex += 4;
    
    for (var lon = 0.0; lon < longitudeBands; lon++) {
        var theta = lon * 2.0 * Math.PI / longitudeBands;
        for (var lat = 1.0; lat <= latitudeBands; lat++) {
            var phi = lat * Math.PI / (latitudeBands+1);
            vertexData[vIndex+0] = phi;
            vertexData[vIndex+1] = theta;
            vertexData[vIndex+2] = 1 - (lon / longitudeBands);
            vertexData[vIndex+3] = 1 - (lat / latitudeBands);
            vIndex += 4;
        }
    }
    
    for (var lon = 0; lon < longitudeBands; lon++) {
        indexData[iIndex+0] = 0;
        indexData[iIndex+1] = 2 + ((lon + 1) % longitudeBands)*(latitudeBands);
        indexData[iIndex+2] = 2 + lon*(latitudeBands);
        iIndex += 3;
        
        indexData[iIndex+0] = 1;
        indexData[iIndex+1] = 2 + (lon)*(latitudeBands) + longitudeBands - 1;
        indexData[iIndex+2] = 2 + ((lon + 1) % longitudeBands)*(latitudeBands) + longitudeBands - 1;
        iIndex += 3;
    }
    for (var lon = 0; lon < longitudeBands; lon++) {
        var lon0 = 2 + lon*(latitudeBands);
        var lon1 = 2 + ((lon + 1) % longitudeBands)*(latitudeBands);
        var lon2 = lon0 + 1;
        var lon3 = lon1 + 1;
        for (var lat = 0; lat < latitudeBands - 1; lat++) {
            indexData[iIndex+0] = lon0;
            indexData[iIndex+1] = lon1;
            indexData[iIndex+2] = lon3;
            indexData[iIndex+4] = lon3;
            indexData[iIndex+5] = lon2;
            indexData[iIndex+3] = lon0;
            iIndex += 6;
            lon0 ++ ; lon1 ++ ; lon2 ++ ; lon3 ++ ;
        }
    }
    
    return [vertexData, indexData];
}