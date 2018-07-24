const cmutils = {};


// utility function for printing objects using their `toString` methods
cmutils.log = (...any) => console.log(...any.map(String));

// Array ops

cmutils.pickFrom = function(arr) {
    var i = Math.floor(Math.random() * arr.length);
    return arr[i];
}

cmutils.shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
  
    return array;
}

cmutils.makeFromArr = function(arr, len) {
    var elem = "";
    for (var i = 0; i < len; i++) {
        elem += pickFrom(arr);
    }
    return elem;
}

cmutils.removeFromArr = function(arr, elem) {
    let idx = arr.indexOf(elem);
    if (idx > -1){
        arr.splice(idx, 1);
    }
}

cmutils.addToArrUnique = function(arr, elem) {
    let idx = arr.indexOf(elem);
    if (idx === -1){
        arr.push(elem);
    }
}

// Angle conversions

cmutils.degToRad = function(deg) {
    return deg / 180 * Math.PI;
}
cmutils.radToDeg = function(rad) {
    return rad * 180 / Math.PI;
}

cmutils.getVal = function(ctx, x, y) {
    var ext = ctx.getImageData(x, y, 1, 1).data;
    if (ext[3] == 0) {
        return 0;
    } else {
        return (ext[0] + ext[1] + ext[2]) / 3 / 2.56;
    }
}

cmutils.genMat = function(w, h, init, explicit) {
    var mat = [];
    for (var x = 0; x < w; x++) {
        mat.push([]);
        for (var y = 0; y < h; y++) {
            mat[x].push(init || 0);
        }
    }
    if (explicit) {
        console.log("made matrix:", mat);
    }
    return mat;
}

cmutils.logMat = function(mat) {
    for (var y = mat[0].length - 1; y >= 0; y--) {
        var str = ""
        for (var x = 0; x < mat.length; x++) {
            str += (mat[x][y] ? mat[x][y] : "#") + ",";
        }
        console.log(str);
        console.log("");
    }
}


cmutils.randomWithin = function(rMin, rMax, seed) {
    if (seed === undefined) {
        var max = rMax || 1;
        var min = rMin || 0;
        return min + Math.random() * (max - min);
    } else {
        //Seeded random algorithm from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        var max = rMax || 1;
        var min = rMin || 0;
        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280.0;
        return min + rnd * (max - min);
    }
}

cmutils.norm = function(value, min, max) {
    return (value - min) / (max - min);
};

cmutils.lerp = function(norm, min, max) {
    return (max - min) * norm + min;
};

cmutils.map = function(value, sourceMin, sourceMax, destMin, destMax) {
    return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
};

cmutils.clamp = function(value, min, max) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
};

cmutils.distP = function(p0, p1) {
    var dx = p0.x - p1.x,
        dy = p0.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

cmutils.dist = function(x0, y0, x1, y1) {
    var dx = x1 - x0,
        dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
};

cmutils.randomFloat = function(min, max) {
    return min + Math.random() * (max - min);
};

cmutils.randomInt = function(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
};

cmutils.inRange = function(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
};

cmutils.angleQuad = function(angle) {
    if (angle >= 0)
        if (angle <= Math.PI / 2)
            return 1;
        else return 2;
    else return 0;
};

cmutils.circleCollision = function(c0, c1) {
    return utils.distance(c0, c1) <= c0.radius + c1.radius;
};

cmutils.circlePointCollision = function(x, y, circle) {
    return utils.distanceXY(x, y, circle.x, circle.y) < circle.radius;
};

cmutils.pointInRect = function(x, y, rect) {
    return utils.inRange(x, rect.x, rect.x + rect.width) && utils.inRange(y, rect.y, rect.y + rect.height);
};

cmutils.rangeIntersect = function(min0, max0, min1, max1) {
    return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
};
cmutils.boxIntersect = function(r0, r1) {
    return cmutils.rangeIntersect(r0.x, r0.x + r0.w, r1.x, r1.x + r1.w) && rangeIntersect(r0.y, r0.y + r0.h, r1.y, r1.y + r1.h);
};

cmutils.segmentIntersect = function(p0, p1, p2, p3) {
    var A1 = p1.y - p0.y,
        B1 = p0.x - p1.x,
        C1 = A1 * p0.x + B1 * p0.y,
        A2 = p3.y - p2.y,
        B2 = p2.x - p3.x,
        C2 = A2 * p2.x + B2 * p2.y,
        denominator = A1 * B2 - A2 * B1;

    if (denominator === 0) {
        return null;
    }

    var intersectX = (B2 * C1 - B1 * C2) / denominator,
        intersectY = (A1 * C2 - A2 * C1) / denominator,
        rx0 = (intersectX - p0.x) / (p1.x - p0.x),
        ry0 = (intersectY - p0.y) / (p1.y - p0.y),
        rx1 = (intersectX - p2.x) / (p3.x - p2.x),
        ry1 = (intersectY - p2.y) / (p3.y - p2.y);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
        ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
        return {
            x: intersectX,
            y: intersectY
        };
    } else {
        return null;
    }
}

cmutils.segTouching = function(s0, s1) {
    if (s0.x0 == s1.x1 && s0.y0 == s1.y1 ||
        s0.x1 == s1.x0 && s0.y1 == s1.y0 ||
        s0.x0 == s1.x0 && s0.y0 == s1.y0 ||
        s0.x1 == s1.x1 && s0.y1 == s1.y1) {
        return true;
    }
    return false;
}

cmutils.segInters = function(s0, s1, allowTouching) {
    if (!allowTouching && segTouching(s0, s1)) {
        return null;
    }
    var A1 = s0.y1 - s0.y0,
        B1 = s0.x0 - s0.x1,
        C1 = A1 * s0.x0 + B1 * s0.y0,
        A2 = s1.y1 - s1.y0,
        B2 = s1.x0 - s1.x1,
        C2 = A2 * s1.x0 + B2 * s1.y0,
        denominator = A1 * B2 - A2 * B1;

    var A1 = s0.y1 - s0.y0,
        B1 = s0.x0 - s0.x1,
        C1 = A1 * s0.x0 + B1 * s0.y0,
        A2 = s1.y1 - s1.y0,
        B2 = s1.x0 - s1.x1,
        C2 = A2 * s1.x0 + B2 * s1.y0,
        denominator = A1 * B2 - A2 * B1;

    if (denominator === 0) {
        return null;
    }

    var intersectX = (B2 * C1 - B1 * C2) / denominator,
        intersectY = (A1 * C2 - A2 * C1) / denominator,
        rx0 = (intersectX - s0.x0) / (s0.x1 - s0.x0),
        ry0 = (intersectY - s0.y0) / (s0.y1 - s0.y0),
        rx1 = (intersectX - s1.x0) / (s1.x1 - s1.x0),
        ry1 = (intersectY - s1.y0) / (s1.y1 - s1.y0);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
        ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
        return {
            x: intersectX,
            y: intersectY
        };
    } else {
        return null;
    }
}

module.exports = cmutils;