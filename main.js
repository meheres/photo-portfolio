const track = document.getElementById("image-track");
let isFullscreen = false;

function exitFullscreen() {
  isFullscreen = false;
  document.body.classList.remove("fullscreen-active");
  document.querySelector(".image.fullscreen")?.classList.remove("fullscreen");

  const lastPercentage = parseFloat(track.dataset.prevPercentage || 0);
  track.style.transform = `translate(${lastPercentage}%, -50%)`;

  for(const image of track.getElementsByClassName("image")) {
    image.style.objectPosition = `${100 + lastPercentage}%, -50%`;
  }
}

for (const image of track.getElementsByClassName("image")) {
  image.onclick = (e) => {
    const prevPercentage = track.dataset.percentage || "0";
    track.dataset.prevPercentage = prevPercentage;

    track.style.transform = "";

    track.getAnimations().forEach(anim => anim.cancel());

    isFullscreen = true;
    document.body.classList.add("fullscreen-active");
    e.target.classList.add("fullscreen");
  };
}

window.onmousedown = e => {
  track.dataset.mouseDownAt = e.clientX;
}

window.onmouseup = () => {
  track.dataset.mouseDownAt = "0";
  track.dataset.prevPercentage = track.dataset.percentage;
}

window.onmousemove = e => {
  if(track.dataset.mouseDownAt === "0") return;

  if (isFullscreen) {
    exitFullscreen();fetrack.dataset.mouseDownAt = "0";
    return;
  }

  const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
    maxDelta = window.innerWidth / 2;

  const speed = 0.5;
  const percentage = (mouseDelta / maxDelta) * speed * -100;

  let nextPercentage = parseFloat(track.dataset.prevPercentage) + percentage;
  nextPercentage = Math.min(nextPercentage, 0)
  nextPercentage = Math.max(nextPercentage, -100)

  track.dataset.percentage = nextPercentage;

  track.animate({
    transform: `translate(${nextPercentage}%, -50%)`
  }, { duration: 1200, fill: "forwards"});

  for(const image of track.getElementsByClassName("image")) {
    image.animate({
      objectPosition: `${100 + nextPercentage}% 50%`
    }, { duration: 1200, fill: "forwards"});
  }
}

window.onwheel = e => {
  e.preventDefault();

  if (isFullscreen) {
    exitFullscreen();
    return;
  }

  const scrollConst = 0.05;
  const scrollDelta = e.deltaY * scrollConst + e.deltaX * scrollConst;
  let nextPercentage = parseFloat(track.dataset.prevPercentage) - scrollDelta;

  nextPercentage = Math.max(nextPercentage, -100);
  nextPercentage = Math.min(nextPercentage, 0);

  track.dataset.percentage = nextPercentage;
  track.dataset.prevPercentage = nextPercentage

  track.animate({
    transform: `translate(${nextPercentage}%, -50%)`
  }, { duration: 1200, fill: "forwards" });

  for(const image of track.getElementsByClassName("image")) {
    image.animate({
      objectPosition: `${100 + nextPercentage}% 50%`
    }, { duration: 1200, fill: "forwards" });
  }
}

