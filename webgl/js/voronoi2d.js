var VoroGUI = function () {
    this.planeMode = false;
    this.treeMode = false;
}

var Vgui = new VoroGUI();
var gui = new dat.GUI();
var controller = gui.add(Vgui, 'planeMode', false);
var controller2 = gui.add(Vgui, 'treeMode', false);
controller.listen();
controller2.listen();

class Vornoi2D {
    
    constructor() {
        this.scene = new THREE.Scene();

        this.frustumSize = 1;
        this.aspect = window.innerWidth / window.innerHeight;
        
        this.camera = new THREE.OrthographicCamera(this.frustumSize * this.aspect / -2, this.frustumSize * this.aspect / 2, this.frustumSize / 2, this.frustumSize / -2);
        this.camera.position.z = 1000;
        this.camera.lookAt(this.scene.position);

        this.colorHue = 2;
        this.colorPrime = 73;

        this.coneRadius = 0.3;
        this.coneHeight = 1;
        this.coneSegments = 64;

        this.pointRadius = 0.003;
        this.pointSegments = 8;

        this.factor = 1.0;
        this.screenWidth = window.innerWidth * this.factor;
        this.screenHeight = window.innerHeight * this.factor;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.voroSegments = 0;
        this.cones = [];
        // this.circles = [];
        this.lineSegments = [];
        this.lineVertices = new Map(); // Maps vertices to colors

        this.pointsIndices = []; // Points members in this.cones and this.circles
        this.lineIndices = [];  // Line members in this.cones and this.circles

        this.curveProgressFlag = false;
        this.currentCurveColor = this.getHSLColor(70);

        this.lineFirstPoint = null;
        this.lineSecondPoint = null;
        this.lineProgressFlag = false;
        this.lineLevels = 5;

        this.lineSegmentWidth = 5;

        this.planeMode = false;
        this.treeMode = false;

        this.latestMouseCoords = null;

        this.planeMouseCoords = null;

        // var geometry = new THREE.CircleGeometry(this.pointRadius, this.pointSegments);
        // var material = new THREE.MeshBasicMaterial({ color: this.getHSLColor(70)[0] });
        // this.circleInProgress = new THREE.Mesh(geometry, material);

        var geometry = new THREE.PlaneGeometry(10, 10);
        var material = new THREE.MeshBasicMaterial({ color: this.getHSLColor(70)[0] });
        this.plane = new THREE.Mesh(geometry, material);
        this.scene.add(this.plane);

        document.body.appendChild(this.renderer.domElement);

    }

    getCoordsFromEvent(event) {
        var x = -1 * (this.screenWidth/2 - event.clientX) * this.frustumSize * this.aspect / this.screenWidth;
        var y = (this.screenHeight/2 - event.clientY) * this.frustumSize / this.screenHeight;
        return [x, y];
    }

    mouseMoveCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        this.latestMouseCoords = new THREE.Vector2(coords[0], coords[1]);

        if(this.planeMode)
            this.movePlane(this.latestMouseCoords);
        else
            this.lineSecondPoint = this.latestMouseCoords;
    }

    keyboardEventCallback(event) {
        if(event.keyCode == 27){
            this.escCallBack();
        }
        if(event.keyCode == 80){
            this.planekeyCallBack();
        }
        if(event.keyCode == 84){
            this.treekeyCallBack();
        }
    }

    escCallBack() {
        if(this.curveProgressFlag == true) {
            this.deleteLine(this.voroSegments - 1);
            this.curveProgressFlag = false;
            this.lineProgressFlag = false;
            this.currentCurveColor = this.getHSLColor(70);
        }
    }

    planekeyCallBack() {
        this.planeMouseCoords = this.latestMouseCoords;

        this.planeMode = !this.planeMode;

        Vgui.planeMode = this.planeMode;
    }

    treekeyCallBack() {
        this.treeMode = !this.treeMode;
        Vgui.treeMode = this.treeMode;
    }

    deleteLine(lineIndex) {
        this.scene.remove(this.lineSegments[lineIndex]);
        for(var i = 0; i < this.cones[lineIndex].length; i++) {
            this.scene.remove(this.cones[lineIndex][i]);
            // this.scene.remove(this.circles[lineIndex][i]);
        }
    }

    movePlane(coords) {
        this.plane.rotation.y =  coords.x;
        this.plane.rotation.x = -1 * (coords.y);
    }

    addPointClickCallback(event) {
        var coords = this.getCoordsFromEvent(event);
        var x = coords[0];
        var y = coords[1];
        var point = new THREE.Vector2(x, y);


        // this.circleInProgress.position.x = x;
        // this.circleInProgress.position.y = y;
        // this.circleInProgress.position.z = 5;
        
        if(this.lineProgressFlag == false) {
            this.lineFirstPoint = point;
            this.lineProgressFlag = true;
            this.curveProgressFlag = true;

            if(this.treeMode) {
                this.treeMode = false;

                var minDistance = Infinity;
                var firstPoint;
                var color;


                for(let [key, value] of this.lineVertices) {
                    console.log(key);
                    console.log("Distance: " + point.distanceTo(key));
                    if(point.distanceTo(key) < minDistance) {
                        
                        minDistance = point.distanceTo(key);

                        firstPoint = key;
                        color = value;
                        console.log(key);
                    }
                }
            
                console.log("Firstpoint :" + minDistance);
                this.lineFirstPoint = firstPoint;
                this.currentCurveColor = color;
                this.lineSecondPoint = point;

                this.addLine(this.lineFirstPoint, this.lineSecondPoint, this.lineLevels, this.currentCurveColor);
            } else {
                // this.currentCurveColor = new THREE.Color(this.getHSLColor(70));

                this.addLine(this.lineFirstPoint, this.lineFirstPoint + 0.25, this.lineLevels, this.currentCurveColor);

                // this.scene.add(this.circleInProgress)
            }

        }
        else {
            this.lineSecondPoint = point;
            // this.scene.remove(this.circleInProgress);
            console.log("First point: ");
            console.log(this.lineVertices);
            this.lineVertices.set(this.lineFirstPoint, this.currentCurveColor);
            this.lineVertices.set(this.lineSecondPoint, this.currentCurveColor);

            if(this.curveProgressFlag == true) {
                this.lineFirstPoint = this.lineSecondPoint;
                this.addLine(this.lineFirstPoint, this.lineFirstPoint + 0.25, this.lineLevels, this.currentCurveColor);
            }

            // this.lineProgressFlag = false;
            // this.lineFirstPoint = null;
            // this.lineSecondPoint = null;
        }
        // this.addPoint(point, this.getRandomColor());
    }

    render() {
        if(this.lineProgressFlag == true) {
            this.modifyLine(this.voroSegments - 1, this.lineFirstPoint, this.lineSecondPoint, this.lineLevels);
        }
        this.renderer.render(this.scene, this.camera);
    }

    getHSLColor(S) {
        this.colorHue = (this.colorHue + this.colorPrime) % 360;
        console.log(this.colorHue);

        var color1 = new THREE.Color("hsl(" + this.colorHue.toString(10) + ", " + S.toString(10) + "%, 70%)");
        var color2 = new THREE.Color("hsl(" + this.colorHue.toString(10) + ", " + (S - 40).toString(10) + "%, 60%)");

        return [color1, color2];
    }
    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    makeSeed(point, color) {
        // var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        // var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        // this.circle = new THREE.Mesh( geometry, material );
        // this.circle.position.x = point.x;
        // this.circle.position.y = point.y;
        // this.circle.position.z = 5;

        
        var geometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, this.coneSegments);
        var material = new THREE.MeshBasicMaterial({
            color: color
        });
        this.cone = new THREE.Mesh(geometry, material);
        this.cone.position.x = point.x;
        this.cone.position.y = point.y;
        this.cone.rotation.x = Math.PI/2;

        // return {cone: this.cone, circle: this.circle };
        return {cone: this.cone};
    }

    addPoint(point, color) {
        var seed = this.makeSeed(point, color);
        // var circle = seed.circle;
        var cone = seed.cone;
        
        this.cones[this.voroSegments] = [];
        // this.circles[this.voroSegments] = [];
        this.cones[this.voroSegments].push(cone);
        // this.circles[this.voroSegments].push(circle);

        this.pointsIndices.push(this.voroSegments);
        this.voroSegments += 1;

        console.log(this.cones);

        this.scene.add(cone);
        // this.scene.add(circle);
    }

    modifyLine(lineIndex, point1, point2, levels) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);

        // this.lineSegments[lineIndex].v1 = point1;
        // this.lineSegments[lineIndex].v2 = point2;
        
        var points = [];
        points.push( new THREE.Vector3( point1.x, point1.y, 5 ) );
        points.push( new THREE.Vector3( point2.x, point2.y, 5 ) );
        
        this.lineSegments[lineIndex].geometry.setFromPoints(points);

        for(var i = 0; i < this.cones[lineIndex].length; i++) {
            this.cones[lineIndex][i].position.x = line[i].x;
            // this.circles[lineIndex][i].position.x = line[i].x;

            this.cones[lineIndex][i].position.y = line[i].y;
            // this.circles[lineIndex][i].position.y = line[i].y;
        }
    }

    addLine(point1, point2, levels, color) {
        var line = this.makeLine(point1, point2, levels, [point1, point2]);
        console.log(color);

        this.cones[this.voroSegments] = [];
        // this.circles[this.voroSegments] = [];
        

        var material = new THREE.LineBasicMaterial( { color: color[1],
                                                      linewidth: this.lineSegmentWidth } );
        var points = [];
        points.push( new THREE.Vector3( point1.x, point1.y, 5 ) );
        points.push( new THREE.Vector3( point2.x, point2.y, 5 ) );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );

        var lineSegment = new THREE.Line( geometry, material );
        this.scene.add(lineSegment);
        
        this.lineSegments[this.voroSegments] = lineSegment;


        // var color = this.getRandomColor();
        // var color = new THREE.Color(this.getHSLColor(70));

        var seed, cone;
        
        for(var i = 0; i < line.length; i++) {
            seed = this.makeSeed(line[i], color[0]);
            // circle = seed.circle;
            cone = seed.cone;
            
            this.cones[this.voroSegments].push(cone);
            // this.circles[this.voroSegments].push(circle);

            this.scene.add(cone);
            // this.scene.add(circle);
        }

        this.lineIndices.push(this.voroSegments);
        this.voroSegments += 1;
    }

    makeLine(point1, point2, levels, points) {
        if(levels < 0) {
            return -1;
        }
        var midpoint = new THREE.Vector2((point1.x + point2.x)/2, (point1.y + point2.y)/2)
        points.push(midpoint);
        this.makeLine(point1, midpoint, levels - 1, points);
        this.makeLine(midpoint, point2, levels - 1, points);
        return points;
    }

}

class PointVoronoi {
    constructor(x, y, color) {
        this.pointRadius = 0.003;
        this.pointSegments = 32;

        var geometry = new THREE.CircleGeometry( this.pointRadius, this.pointSegments );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        this.circle = new THREE.Mesh( geometry, material );
        this.circle.position.x = point.x;
        this.circle.position.y = point.y;
        this.circle.position.z = 5;

        this.coneRadius = 3;
        this.coneHeight = 1;
        this.coneSegments = 64;
        geometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, this.coneSegments);
        material = new THREE.MeshBasicMaterial({
            color: color
        });
        this.cone = new THREE.Mesh(geometry, material);
        this.cone.position.x = x;
        this.cone.position.y = y;
        this.cone.rotation.x = Math.PI/2;
    }
}

V = new Vornoi2D();

// a = new THREE.Vector2(-0.25, 0.5)
// b = new THREE.Vector2(0.5, 0.5);

// V.addLine(a, b, 5);

// a = new THREE.Vector2(0, 0.4)
// b = new THREE.Vector2(0, -0.4);

// V.addLine(a, b, 5);


// a = new THREE.Vector2(-0.5, -0.5)
// b = new THREE.Vector2(0.25, -0.5);

// V.addLine(a, b, 5);

var animate = function () {
    requestAnimationFrame(animate);
    V.render();
};

document.addEventListener("click", mouseClick);
document.addEventListener("mousemove", mouseMove);
document.body.onkeyup = function(e){
    V.keyboardEventCallback(e)
;}

animate();

function mouseClick(event) {
    if(!V.planeMode) {
        console.log(V.planeMode)
        V.addPointClickCallback(event);
    }
}

function mouseMove(event) {
    V.mouseMoveCallback(event);
}

controller.onChange(function(value) {
    V.planeMode = value;
});

controller2.onChange(function(value) {
    V.treeMode = value;
});



