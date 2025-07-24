// --- SETUP ---
const canvas = document.getElementById("image-canvas");
const ctx = canvas.getContext("2d");

// --- STATE MANAGEMENT ---
// This object holds the current state of our application
const state = {
  images: [],
  imageSources: [
    "https://images.unsplash.com/photo-1610194352361-4c81a6a8967e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
    "https://images.unsplash.com/photo-1524781289445-ddf8f5695861?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    "https://images.unsplash.com/photo-1618202133208-2907bebba9e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    "https://images.unsplash.com/photo-1495805442109-bf1cf975750b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    "https://images.unsplash.com/photo-1548021682-1720ed403a5b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
  ],
  track: {
    // We now use velocity for smooth, eased scrolling
    x: 0,
    targetX: 0,
    startDragX: 0,
    startTrackX: 0,
  },
  mouse: {
    down: false,
    x: 0,
    prevX: 0,
  },
  fullscreen: {
    active: false,
    image: null,
    // Animation progress (0 to 1)
    progress: 0,
    // Target for animation (0 for exiting, 1 for entering)
    targetProgress: 0,
  },
};

// --- IMAGE LOADING ---
// We must wait for all images to load before we can draw them
let imagesLoaded = 0;
state.imageSources.forEach((src, index) => {
  const img = new Image();
  img.src = src;
  state.images[index] = img;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === state.imageSources.length) {
      // All images are loaded, start the application
      setup();
      animate();
    }
  };
});

// --- SETUP FUNCTION ---
// This runs once after the images are loaded
function setup() {
  // Set canvas size to match the window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Center the track initially
  const trackWidth = state.images.reduce((acc, img) => acc + (img.width / img.height * (canvas.height * 0.5)) + 20, 0);
  state.track.x = (canvas.width - trackWidth) / 2;
  state.track.targetX = state.track.x;

  // Add event listeners
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("wheel", onWheel);
  window.addEventListener("resize", onResize);
}

// --- CORE DRAWING & ANIMATION LOOP ---
function animate() {
  // Clear the canvas on each frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- SMOOTH SCROLLING LOGIC ---
  // Move the track's current position towards the target position
  state.track.x += (state.track.targetX - state.track.x) * 0.1;

  // --- DRAW IMAGES ---
  let currentX = state.track.x;
  state.images.forEach((img, index) => {
    const aspectRatio = img.width / img.height;
    const imgHeight = canvas.height * 0.5;
    const imgWidth = imgHeight * aspectRatio;

    // Don't draw the fullscreen image in the track
    if (!state.fullscreen.active || state.fullscreen.image !== img) {
       ctx.drawImage(img, currentX, canvas.height * 0.25, imgWidth, imgHeight);
    }
    currentX += imgWidth + 20; // 20 is the gap
  });

  // --- FULLSCREEN ANIMATION LOGIC ---
  if (state.fullscreen.image) {
    // Smoothly animate the progress towards the target (0 or 1)
    state.fullscreen.progress += (state.fullscreen.targetProgress - state.fullscreen.progress) * 0.1;

    const img = state.fullscreen.image;
    const aspectRatio = img.width / img.height;

    // Calculate start position (in the track)
    let startX = state.track.x;
    for (let i = 0; i < state.images.indexOf(img); i++) {
        startX += (state.images[i].width / state.images[i].height * (canvas.height * 0.5)) + 20;
    }
    const startY = canvas.height * 0.25;
    const startWidth = canvas.height * 0.5 * aspectRatio;
    const startHeight = canvas.height * 0.5;

    // Calculate end position (fullscreen centered)
    const endHeight = canvas.height * 0.9;
    const endWidth = endHeight * aspectRatio;
    const endX = (canvas.width - endWidth) / 2;
    const endY = (canvas.height - endHeight) / 2;

    // Interpolate (lerp) between start and end based on progress
    const currentX = startX + (endX - startX) * state.fullscreen.progress;
    const currentY = startY + (endY - startY) * state.fullscreen.progress;
    const currentWidth = startWidth + (endWidth - startWidth) * state.fullscreen.progress;
    const currentHeight = startHeight + (endHeight - startHeight) * state.fullscreen.progress;

    ctx.drawImage(img, currentX, currentY, currentWidth, currentHeight);

    // If animation is nearly finished, clean up
    if (state.fullscreen.targetProgress === 0 && state.fullscreen.progress < 0.01) {
        state.fullscreen.image = null;
    }
  }

  // Loop the animation
  requestAnimationFrame(animate);
}

// --- EVENT HANDLERS ---
function onMouseDown(e) {
  state.mouse.down = true;
  state.mouse.x = e.clientX;
  state.mouse.prevX = e.clientX;

  // Check for image click to enter fullscreen
  if (!state.fullscreen.active) {
    let currentX = state.track.x;
    state.images.forEach(img => {
      const aspectRatio = img.width / img.height;
      const imgHeight = canvas.height * 0.5;
      const imgWidth = imgHeight * aspectRatio;
      // Check if click is within image bounds
      if (e.clientX > currentX && e.clientX < currentX + imgWidth && e.clientY > canvas.height * 0.25 && e.clientY < canvas.height * 0.75) {
        state.fullscreen.active = true;
        state.fullscreen.image = img;
        state.fullscreen.targetProgress = 1;
      }
      currentX += imgWidth + 20;
    });
  }
}

function onMouseUp() {
  state.mouse.down = false;
}

function onMouseMove(e) {
  if (state.fullscreen.active && state.mouse.down) {
    // Drag to exit fullscreen
    if (Math.abs(e.clientX - state.mouse.prevX) > 5) {
      state.fullscreen.targetProgress = 0;
      state.fullscreen.active = false;
    }
  } else if (state.mouse.down) {
    // Drag to scroll track
    const delta = e.clientX - state.mouse.x;
    state.track.targetX += delta;
    state.mouse.x = e.clientX;
  }
}

function onWheel(e) {
  if (state.fullscreen.active) {
    // Scroll to exit fullscreen
    state.fullscreen.targetProgress = 0;
    state.fullscreen.active = false;
  } else {
    // Scroll to move track
    state.track.targetX -= e.deltaY;
  }
}

function onResize() {
    // Adjust canvas size on window resize
    setup();
}
