// Write something in the lower left corner
bub = {
    ctx: null,
    log: function(text) {
        console.log(text + " has been ctx-logged");
        this.ctx.fillText(text, 20, 20);
    },
    ///// Basics
    mark: function(x, y, colour, r) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.strokeStyle = colour;
        this.ctx.arc(x, y, r || 3, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    },
    markP: function(p, colour, r) {
        this.mark(p.x, p.y, colour, r);
    },
    card: function(size) {
        this.ctx.save();
        //red arrow
        this.ctx.strokeStyle = "red";
        this.line(0, 0, size, 0);
        this.line(size, 0, size * 3 / 4, size * 1 / 4);
        this.line(size, 0, size * 3 / 4, -size * 1 / 4);
        //blue arrow
        this.ctx.strokeStyle = "blue";
        this.line(0, 0, 0, size);
        this.line(0, size, -size * 1 / 4, size * 3 / 4);
        this.line(0, size, size * 1 / 4, size * 3 / 4);
        this.ctx.restore();
    },
    line: function(x0, y0, x1, y1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    },
    lineP: function(p0, p1) {
        this.ctx.beginPath();
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
    },
    circle: function(x, y, r) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
    },
    diamond: function(x, y, d) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - d);
        this.ctx.lineTo(x + d, y);
        this.ctx.lineTo(x, y + d);
        this.ctx.lineTo(x - d, y);
        this.ctx.lineTo(x, y - d);
        this.ctx.stroke();
    },
    rect: function(x0, y0, w, h) {
        this.ctx.beginPath();
        this.ctx.rect(x0, y0, w, h);
        this.ctx.stroke();
    },
    rotate: function(angle) {
        this.ctx.rotate(angle);
    },
    //// Advanced drawing
    polygon: function(x, y, d, sides) {
        u = 2 * Math.PI / sides;
        for (var i = 0; i < sides; i++) {
            this.line(x + Math.cos(u * i) * d,
                y + Math.sin(u * i) * d,
                x + Math.cos(u * (i + 1)) * d,
                y + Math.sin(u * (i + 1)) * d);
        }
    },
    square: function(x, y, d) {
        this.rect(x - d, y - d, x + d, y + d);
    },
};

module.exports = bub;