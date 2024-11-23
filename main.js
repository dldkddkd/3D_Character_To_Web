// Three.js 기본 설정
let model = null;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 카메라 설정
camera.position.y = 0.75;
camera.position.z = 5;

// 조명 추가
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// GLTFLoader로 모델 로드
const loader = new THREE.GLTFLoader();
let mixer = null; // AnimationMixer
let clock = new THREE.Clock(); // 애니메이션 시간 추적용
let isDragging = false; // 드래그 상태 확인
let previousMousePosition = { x: 0, y: 0 }; // 이전 마우스 위치
let rotationOffset = { x: 0, y: 0 }; // 드래그 회전값 저장

loader.load(
    './CesiumMan.gltf', // 모델 파일 경로
    (gltf) => {
        model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0);

        // 애니메이션 Mixer 설정
        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]); // 첫 번째 애니메이션 사용
            action.play();
        }

        console.log("Model loaded successfully");
    },
    (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    (error) => console.error('An error happened', error)
);

// 애니메이션 루프
function animate() {
    const delta = clock.getDelta();

    // 애니메이션 업데이트
    if (mixer) mixer.update(delta);

    // 드래그 회전값 적용
    if (model) {
        model.rotation.x = rotationOffset.x; // 드래그로 조작된 x축 회전값
        model.rotation.y = rotationOffset.y; // 드래그로 조작된 y축 회전값
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// 마우스 이벤트 추가
window.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mousemove', (event) => {
    if (!isDragging || !model) return;

    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
    };

    // 회전값 업데이트
    rotationOffset.y += deltaMove.x * 0.005; // 수평 이동 -> y축 회전
    rotationOffset.x += deltaMove.y * 0.005; // 수직 이동 -> x축 회전

    // x축 회전 제한
    rotationOffset.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationOffset.x));

    previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// 휠 드래그로 확대/축소 추가
window.addEventListener('wheel', (event) => {
    // 휠 이동에 따른 카메라 z 값 변경 (확대/축소)
    const zoomSpeed = 0.001;  // 확대/축소 속도
    camera.position.z += event.deltaY * zoomSpeed;

    // 카메라 범위 제한 (너무 가까운 거리나 너무 먼 거리 방지)
    camera.position.z = Math.max(1, Math.min(20, camera.position.z));

    event.preventDefault();  // 기본 스크롤 동작 방지
});

// 화살표 키로 카메라 위치 조정 (부드럽게 이동하도록 수정)
let moveDirection = { up: false, down: false, left: false, right: false };
let moveSpeed = 0.01; // 카메라 이동 속도

window.addEventListener('keydown', (event) => {
    // 키가 눌리면 이동 방향 상태를 true로 설정
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            moveDirection.up = true;
            break;
        case 'ArrowDown':
        case 's':
            moveDirection.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
            moveDirection.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            moveDirection.right = true;
            break;
        default:
            break;
    }
});

window.addEventListener('keyup', (event) => {
    // 키를 떼면 이동 방향 상태를 false로 설정
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            moveDirection.up = false;
            break;
        case 'ArrowDown':
        case 's':
            moveDirection.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
            moveDirection.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            moveDirection.right = false;
            break;
        default:
            break;
    }
});

// 부드럽게 이동하는 함수 (requestAnimationFrame 사용)
function smoothMoveCamera() {
    // 방향에 따라 카메라 이동
    if (moveDirection.up) {
        camera.position.y += moveSpeed;
    }
    if (moveDirection.down) {
        camera.position.y -= moveSpeed;
    }
    if (moveDirection.left) {
        camera.position.x -= moveSpeed;
    }
    if (moveDirection.right) {
        camera.position.x += moveSpeed;
    }

    // 카메라 범위 제한
    camera.position.z = Math.max(1, Math.min(20, camera.position.z));

    // 애니메이션 프레임 요청 (부드럽게 계속 이동하도록)
    requestAnimationFrame(smoothMoveCamera);
}

// 처음 smoothMoveCamera를 호출하여 이동 시작
smoothMoveCamera();