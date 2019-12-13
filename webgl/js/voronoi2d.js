var scene = new THREE.Scene();
// var camera = new THREE.OrthographicCamera();

var frustumSize = 1;
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.ConeGeometry(1, 1, 64);
var material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
var cone = new THREE.Mesh(geometry, material);
cone.position.x = 50;
cone.position.y = 50;
scene.add(cone);
camera.position.z = 10;
console.log(camera.position);
console.log(cone.position);
cone.rotation.x = Math.PI/2;
var rotation = 0;
var animate = function () {
    requestAnimationFrame(animate);
    // cone.rotation.x += 0.01;
    // cone.rotation.y += 0.01;
    // rotation += 0.05;
    // camera.position.x = 0;
    // camera.position.y = Math.sin(rotation) * 500;
    // camera.position.z = Math.cos(rotation) * 500;
    camera.lookAt( scene.position ); // the origin

    renderer.render(scene, camera);
};

document.addEventListener("click", mouseClick);
animate();

function mouseClick(event) {
    var geometry = new THREE.ConeGeometry(1, 1, 64);
    var material = new THREE.MeshBasicMaterial({
        color: getRandomColor()
    });
    var cone = new THREE.Mesh(geometry, material);
    // cone.position.x = (event.clientX/window.innerWidth)*frustumSize*aspect - frustumSize*aspect/2;
    // cone.position.y = (event.clientY/window.innerHeight)*frustumSize + frustumSize/2;
    cone.position.x = -1 * (window.innerWidth/2 - event.clientX)*frustumSize*aspect/window.innerWidth;
    cone.position.y = (window.innerHeight/2 - event.clientY)*frustumSize/window.innerHeight;
    cone.rotation.x = Math.PI/2;
    console.log(window.innerWidth, window.innerHeight)
    console.log(event);
    console.log(cone.position);
    scene.add(cone);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
